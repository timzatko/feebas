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

        export namespace gitCheckout {
            export interface Params<T = Integration> {
                integration: T;
                env: App.Env;
                commitId: string;
            }
            export type Function<T> = (params: Params<T>) => Observable<void>;
        }

        export namespace gitStatus {
            export interface Params<T = Integration> {
                integration: T;
                env: App.Env;
            }
            export interface Interface {
                commitId: string;
                status: StatusResult;
                rootDir: string;
            }
            export type Function<T> = (params: Params<T>) => Observable<Interface>;
        }
    }

    export interface Resolver<T = Integration> {
        pull: actions.pull.Function<T>;
        push?: actions.push.Function<T>;
        gitStatus?: actions.gitStatus.Function<T>;
        gitCheckout?: actions.gitCheckout.Function<T>;
    }

    export type Integration = GitLab.Interface | FsLocal.Interface;

    export namespace GitLab {
        export interface AuthenticationAccessToken {
            type: 'access_token';
            token: string;
        }

        export type AuthenticationType = AuthenticationAccessToken;

        export interface Job {
            name: string | string[];
            path: string;
            directory?: string;
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
