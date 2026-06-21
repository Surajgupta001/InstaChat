import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import 'dotenv/config';
import { validateEnv } from './config/env.js';
import connectDB from './config/database.js';
import { clerkMiddleware } from '@clerk/express'
import userRouter from './routes/user.routes.js';
import messageRouter from './routes/message.routes.js';
import errorHandler from './middlewares/errorHandler.js';
import storyRouter from './routes/story.routes.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import { initSocketServer } from './socket/socketManager.js';
import http from 'http';

// Validate environment variables before anything else
const env = validateEnv();

const app = express();
const port = env.PORT;

// Security headers
app.use(helmet());

// Prevent HTTP parameter pollution
app.use(hpp());

// CORS configuration
const allowedOrigins = env.CORS_ORIGIN
    ? env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:8000', 'http://localhost:19006'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // Preflight cache for 24h
}));

// Body parsers with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Clerk middleware (parses session, does not verify yet)
app.use(clerkMiddleware());

// Global rate limiter
app.use(apiLimiter);

// Connect to Database
await connectDB();

// Health check endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'API is healthy',
        timestamp: new Date().toISOString(),
    });
});

// Default Route
app.get('/', (_req, res) => {
    res.send('API Working');
});

// Routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/messages', messageRouter);
app.use('/api/v1/stories', storyRouter);

// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

// Error Handler (must be last)
app.use(errorHandler);

// HTTP server and attach websocket server
const server = http.createServer(app);
initSocketServer(server);

// Graceful shutdown
const shutdown = async () => {
    console.log('\n🛑 Shutting down gracefully...');
    server.close(() => {
        console.log(' HTTP server closed');
        process.exit(0);
    });

    // Force close after 10s
    setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start Server
server.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
    console.log(`📋 Environment: ${env.NODE_ENV}`);
});
