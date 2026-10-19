export declare const CORRELATION_ID_HEADER = "X-Request-Id";
export declare function generateCorrelationId(): string;
export declare function formatDate(date: Date): string;
export declare function slugify(text: string): string;
export declare function sanitizeLogData(obj: unknown): unknown;
export interface StructuredLogPayload {
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    correlationId?: string;
    context?: string;
    [key: string]: unknown;
}
export declare function formatStructuredLog(payload: StructuredLogPayload): string;
