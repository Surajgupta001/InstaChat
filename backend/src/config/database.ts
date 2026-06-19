import mongoose from "mongoose";

const connectDB = async () => {
    try {
        mongoose.connection.on("connected", () => {
            console.log('🚀 MongoDB Connected Successfully: ' + mongoose.connection.host + ':' + mongoose.connection.port);
        });

        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in the environment variables');
        }
        
        await mongoose.connect(process.env.MONGODB_URI);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
};

export default connectDB;