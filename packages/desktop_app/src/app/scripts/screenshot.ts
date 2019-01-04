import { Screenshots } from '../models/screenshots';

export const getScreenshotClass = function(status: Screenshots.Status) {
    return {
        success: status === Screenshots.Status.match,
        warning: status === Screenshots.Status.truth_does_not_exist || status === Screenshots.Status.truth_was_not_tested,
        error: status === Screenshots.Status.do_not_match,
    };
};
