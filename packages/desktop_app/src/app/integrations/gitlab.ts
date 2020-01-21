import { forkJoin, from, Observable, of, throwError } from 'rxjs';
import { flatMap, tap } from 'rxjs/operators';
import { LoaderService } from '../services/loader.service';

import * as request from 'request-promise-native';
import * as unzip from 'unzipper';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as log from 'electron-log';

import { Integrations } from '../models/integrations';

import getIntegrationTempDir from '../scripts/get-integration-temp-dir';

const getOutPath = (commitId: string) => getIntegrationTempDir('gitlab', path.join('commits', commitId.toString()));

const callGitlabApi = function(_url: string, config: { json?: string } = {}) {
    const { url, project_id, authentication } = this.integration;
    const fullUrl = new URL(url + '/api/v4/projects/' + project_id + _url);
    fullUrl.searchParams.set('private_token', authentication.token);
    log.info('calling gitlab api on ' + fullUrl);
    return request({ url: fullUrl.href, ...config });
};

const callGitlabApiJson = function(_url: string) {
    return callGitlabApi.bind(this)(_url, { json: true });
};

const filterJobs = function(jobs) {
    // filter jobs by name
    const filteredJobs = jobs
        .filter(gitlabJob => ['failed', 'success'].indexOf(gitlabJob.status) !== -1)
        .filter(gitlabJob => this.integration.jobs.find(job => isJobMatch(gitlabJob, job)));

    return Object.values(
        filteredJobs.reduce((obj, job) => {
            // filter out duplicates
            if (!obj[job.name]) {
                obj[job.name] = job;
            }

            // take newer jobs from the duplicates (jobs from reruns)
            if (obj[job.name].id < job.id) {
                obj[job.name] = job;
            }
            return obj;
        }, {}),
    );
};

const downloadArtifacts = function(job) {
    log.info(`[gitlab] downloading artifacts for ${job.name} (${job.id.toString()})`);

    const outPath = getOutPath(this.commitId);
    // path where will be temporarily stored unzipped artifacts
    const jobOutPath = getIntegrationTempDir('gitlab', path.join('jobs', job.id.toString()));
    const callApi = callGitlabApi.bind(this);

    const req = callApi('/jobs/' + job.id + '/artifacts');

    return new Observable(observer => {
        req.on('response', res => {
            if (res.statusCode !== 200) {
                const logMessage = `unable to download artifacts for ${job.name} (${job.id.toString()})`;
                log.error(logMessage);
                observer.error(new Error(logMessage));
                observer.complete();
                return;
            }

            const out = res.pipe(unzip.Extract({ path: jobOutPath }));
            out.on('finish', () => {
                // move unzipped artifacts
                const jobConfig = this.integration.jobs.find(integrationJob => isJobMatch(job, integrationJob));

                const newOutPath =
                    typeof jobConfig.directory !== 'undefined' ? path.join(outPath, jobConfig.directory) : outPath;
                const dstPath = this.integration.strategy === 'default' ? path.join(newOutPath, job.name) : newOutPath;
                const jobSubPath = path.join(jobOutPath, jobConfig.path);
                // dstPath should exists
                fs.ensureDirSync(dstPath);

                // if subdirectory in job artifacts exists, move it
                if (fs.pathExistsSync(jobSubPath)) {
                    log.info(`[gitlab] moving artifacts from ${jobSubPath} to ${dstPath}...`);
                    fs.moveSync(jobSubPath, dstPath);
                }
                // remove remaining job artifacts
                log.info(`[gitlab] removing remaining job artifacts in ${jobOutPath}`);
                fs.removeSync(jobOutPath);

                observer.next();
                observer.complete();
            });
        });
    });
};

const pull: Integrations.actions.pull.Function<Integrations.GitLab.Interface> = (
    { integration, commitId, env },
    loaderService: LoaderService,
) => {
    const authToken = integration.authentication.token;
    if (!authToken) {
        if (env.variables.hasOwnProperty('FEEBAS_GITLAB_TOKEN')) {
            integration.authentication.token = env.variables.FEEBAS_GITLAB_TOKEN;
        } else {
            log.error('auth token is not defined!');
            return throwError(
                new Error(
                    'Authentication token is not defined! Define it in configuration file or in environmental variable FEEBAS_GITLAB_TOKEN.',
                ),
            );
        }
    }

    const callApi = callGitlabApiJson.bind({ integration });

    // read commit information
    return from(callApi('/repository/commits/' + commitId))
        .pipe(
            flatMap(({ last_pipeline }) => {
                if (!last_pipeline) {
                    return throwError(new Error(`[gitlab] Pipeline for this commit does not exist!`));
                }

                const { status, id } = last_pipeline;

                if (status !== 'success' && status !== 'failed') {
                    return throwError(new Error(`[gitlab] Pipeline is still running!`));
                }

                loaderService.message = 'fetching the last pipeline information...';

                // get jobs for the last pipeline of the commit
                return from(callApi('/pipelines/' + id + '/jobs?per_page=100'));
            }),
        )
        .pipe(
            flatMap(jobs => {
                const targetJobs = filterJobs.call({ integration }, jobs);

                if (!integration.jobs.every(job => targetJobs.find(targetJob => isJobMatch(targetJob, job)))) {
                    return throwError(new Error('[gitlab] Some of the jobs did not run in the pipeline!'));
                }

                let downloadedArtifactsCount = 0;
                loaderService.message = `downloading job artifacts... (0/${targetJobs.length})`;

                // download all artifacts
                return forkJoin(
                    targetJobs.map(job => {
                        return downloadArtifacts.call({ integration, commitId }, job).pipe(tap(() => {
                            downloadedArtifactsCount++;
                            loaderService.message = `downloading job artifacts... (${downloadedArtifactsCount}/${targetJobs.length})`;
                        }));
                    }),
                );
            }),
        )
        .pipe(
            flatMap(() => {
                return of({ path: getOutPath(commitId) });
            }),
        );
};

const integrationResolver: Integrations.Resolver<Integrations.GitLab.Interface> = {
    pull,
};

export default integrationResolver;

function isJobMatch(jobA: { name: string }, jobB: Integrations.GitLab.Job): boolean {
    if (typeof jobB.name === 'string') {
        return jobA.name === jobB.name;
    } else if (Array.isArray(jobB.name)) {
        return jobB.name.indexOf(jobA.name) !== -1;
    }
}
