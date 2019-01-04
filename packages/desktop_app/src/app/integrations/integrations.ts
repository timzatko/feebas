import { Integrations } from '../models/integrations';

import fsLocal from './fs-local';
import gitlab from './gitlab';
import { throwError } from 'rxjs';

const integrations: { [key: string]: Integrations.Resolver } = {
    'fs-local': fsLocal,
    gitlab: gitlab,
};

const resolver: Integrations.Resolver = {
    pull(params: Integrations.actions.pull.Params) {
        return integrations[params.integration.type].pull(params);
    },
    push(params: Integrations.actions.push.Params) {
        if (typeof integrations[params.integration.type].push !== 'function') {
            return throwError(
                new Error(`Integration ${params.integration.type} does not allow approving screenshots!`),
            );
        }
        return integrations[params.integration.type].push(params);
    },
    gitStatus(params: Integrations.actions.gitStatus.Params) {
        if (typeof integrations[params.integration.type].gitStatus !== 'function') {
            return throwError(
                new Error(`Integration ${params.integration.type} cannot be used as truth screenshots directory!`),
            );
        }
        return integrations[params.integration.type].gitStatus(params);
    },
};

export default resolver;
