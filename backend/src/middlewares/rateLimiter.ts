import rateLimit from "express-rate-limit";

// General API rate limiter: 100 requests per minute per IP
export const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests, please try again later.",
    },
});

// Strict limiter for sensitive operations: 10 requests per minute
export const strictLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many attempts, please try again later.",
    },
});

// Message send limiter: 30 messages per minute per IP
export const messageLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Message rate limit exceeded, please slow down.",
    },
});

// Upload limiter: 10 uploads per minute
export const uploadLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Upload rate limit exceeded, please try again later.",
    },
});
