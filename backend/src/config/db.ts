import mongoose from 'mongoose';
import { env } from './env';

export const connectDB = async (): Promise<void> => {
    try {
        await mongoose.connect(env.MONGO_URI);
        console.log('MongoDB connected successfully');
    } catch (error: any) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
};
