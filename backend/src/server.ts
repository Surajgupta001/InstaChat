import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/database.js';

const app = express();
const port = process.env.PORT || 5000;

// Connect to Database
await connectDB();

// Middleware
app.use(cors());
app.use(express.json());


// Default Route
app.get('/', (req, res) => {
    res.send('API Working 🚀');
});

// Start Server
app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});