import type { Request, Response, NextFunction } from "express";

const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Error]', err.message);

    // In production, don't expose internal error details
    const isProduction = process.env.NODE_ENV === 'production';

    const statusCode = err.statusCode || err.status || 500;
    const message = isProduction
        ? (statusCode === 500 ? 'Internal server error' : err.message)
        : err.message || 'Something went wrong!';

    res.status(statusCode).json({
        success: false,
        message,
    });
};

export default errorHandler;
