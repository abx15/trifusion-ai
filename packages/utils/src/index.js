"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CORRELATION_ID_HEADER = void 0;
exports.generateCorrelationId = generateCorrelationId;
exports.formatDate = formatDate;
exports.slugify = slugify;
exports.sanitizeLogData = sanitizeLogData;
exports.formatStructuredLog = formatStructuredLog;
exports.CORRELATION_ID_HEADER = 'X-Request-Id';
function generateCorrelationId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'req_' + Math.random().toString(36).substring(2, 15);
}
function formatDate(date) {
    return date.toISOString();
}
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
}
const SENSITIVE_KEYS = [
    'password',
    'passwordhash',
    'token',
    'refreshtoken',
    'accesstoken',
    'secret',
    'authorization',
    'cookie',
    'apikey',
    'privatekey',
];
function sanitizeLogData(obj) {
    if (obj === null || obj === undefined)
        return obj;
    if (typeof obj !== 'object')
        return obj;
    if (Array.isArray(obj)) {
        return obj.map((item) => sanitizeLogData(item));
    }
    const sanitized = {};
    for (const [key, val] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (SENSITIVE_KEYS.some((sk) => lowerKey.includes(sk))) {
            sanitized[key] = '[REDACTED]';
        }
        else if (typeof val === 'object' && val !== null) {
            sanitized[key] = sanitizeLogData(val);
        }
        else {
            sanitized[key] = val;
        }
    }
    return sanitized;
}
function formatStructuredLog(payload) {
    return JSON.stringify(sanitizeLogData(payload));
}
//# sourceMappingURL=index.js.map