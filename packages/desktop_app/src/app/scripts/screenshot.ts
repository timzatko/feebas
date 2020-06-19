import { Screenshots } from '../models/screenshots';

export const getScreenshotClass = function(status: Screenshots.Status) {
    const obj: Record<string, boolean> = {};
    obj['screenshot-status-' + Screenshots.Status[status].toString().replace(/_/g, '-')] = true;
    return obj;
};
