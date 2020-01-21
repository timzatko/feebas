import { Integrations } from '../models/integrations';
import { LoaderService } from '../services/loader.service';
import { of, throwError } from 'rxjs';

import fsLocal from './fs-local';
import gitlab from './gitlab';

const integrations: { [key: string]: Integrations.Resolver } = {
    'fs-local': fsLocal,
    gitlab: gitlab,
};

const resolver: Integrations.Resolver = {
    pull(params: Integrations.actions.pull.Params, loaderService: LoaderService) {
        return integrations[params.integration.type].pull(params, loaderService);
    },
    push(params: Integrations.actions.push.Params) {
        if (typeof integrations[params.integration.type].push !== 'function') {
            return throwError(
                new Error(`Integration ${params.integration.type} does not allow approving screenshots!`),
            );
        }
        return integrations[params.integration.type].push(params);
    },
    gitCheckout(params: Integrations.actions.gitCheckout.Params) {
        if (typeof integrations[params.integration.type].gitCheckout !== 'function') {
            return throwError(
                new Error(`Integration ${params.integration.type} cannot be used as truth screenshots directory!`),
            );
        }
        // if commitId is not defined do not checkout
        if (!params.commitId) {
            return of(null);
        }
        return integrations[params.integration.type].gitCheckout(params);
    },
    gitStatus(params: Integrations.actions.gitStatus.Params) {
        return integrations[params.integration.type].gitStatus(params);
    },
};

export default resolver;
