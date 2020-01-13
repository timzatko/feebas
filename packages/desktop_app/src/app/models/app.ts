import { Project } from './project';

export namespace App {
    export enum ConfigStatus {
        OK,
        CONFIG_FILE_NOT_DEFINED,
        CONFIG_FILE_NOT_EXISTS,
        INCORRECT_JSON,
    }

    export interface Config {
        projects: Project[];
    }

    export interface Env {
        variables?: { [key: string]: any };
        cwd?: string;
        configPath?: string;
        defaultProject?: string;
    }
}
