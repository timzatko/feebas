import { Observable } from 'rxjs';
import { Screenshots } from './screenshots';
import { App } from './app';
import { StatusResult } from 'simple-git/typings/response';

export namespace Integrations {
    export namespace actions {
        export namespace pull {
            export interface Params<T = Integration> {
                integration: T;
                env: App.Env;
                commitId: string;
            }
            export type Function<T> = (params: Params<T>) => Observable<{ path: string }>;
        }

        export namespace push {
            export interface Params<T = Integration> {
                integration: T;
                env: App.Env;
                commitId: string;
                screenshots: Screenshots.Screenshot[];
            }
            export type Function<T> = (params: Params<T>) => Observable<{ screenshots: Screenshots.Screenshot[] }>;
        }

        export namespace gitStatus {
            export interface Params<T = Integration> {
                integration: T;
                env: App.Env;
            }
            export type Function<T> = (params: Params<T>) => Observable<{ commitId: string; status: StatusResult }>;
        }
    }

    export interface Resolver<T = Integration> {
        pull: actions.pull.Function<T>;
        push?: actions.push.Function<T>;
        gitStatus?: actions.gitStatus.Function<T>;
    }

    export type Integration = GitLab.Interface | FsLocal.Interface;

    export namespace GitLab {
        export interface AuthenticationAccessToken {
            type: 'access_token';
            token: string;
        }

        export type AuthenticationType = AuthenticationAccessToken;

        export interface Job {
            name: string;
            path: string;
        }

        export interface Interface {
            type: 'gitlab';
            filter: Screenshots.Filter;
            project_id: number;
            url: string;
            authentication: AuthenticationType;
            jobs: Job[];
            strategy: 'merge' | 'default';
        }
    }

    export namespace FsLocal {
        export interface Interface {
            type: 'fs-local';
            filter: Screenshots.Filter;
            path: string;
        }
    }
}
