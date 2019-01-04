import { Integrations } from './integrations';

export interface Project {
    name: string;
    screenshots: {
        truth: Integrations.Integration;
        current: Integrations.Integration;
    };
}
