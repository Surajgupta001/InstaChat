import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/database.js';
import { clerkMiddleware } from '@clerk/express'
import userRouter from './routes/user.routes.js';
import messageRouter from './routes/message.routes.js';
import errorHandler from './middlewares/errorHandler.js';
import storyRouter from './routes/story.routes.js';
import { initSocketServer } from './socket/socketManager.js';
import http from 'http';

const app = express();
const port = process.env.PORT || 5000;

// Connect to Database
await connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware())


// Default Route
app.get('/', (req, res) => {
    res.send('API Working 🚀');
});

// Routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/messages', messageRouter);
app.use('/api/v1/stories', storyRouter);

// Error Handler
app.use(errorHandler);

// HTTP server and attach websocket server
const server = http.createServer(app);
initSocketServer(server);

// Start Server — use server.listen (not app.listen) so WS and HTTP share the same port
server.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});