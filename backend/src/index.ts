import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { connectDB } from './config/db';
import apiRouter from './routes';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import analyticsRoutes from './routes/analytics.routes';
import { errorHandler } from './middlewares/error.middleware';
import screeningWorker from './modules/recruitment/queue/screening.worker';

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://bluhire-ai.vercel.app'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));

import path from 'path';

// Route Definitions
import interviewRoutes from './routes/interview.routes';

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/interviews', interviewRoutes);
app.use('/api/v1', apiRouter);

// Base route
app.get('/', (req, res) => {
  res.send("BluHire-AI API is running");
});

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  await connectDB();
  screeningWorker.start();
  app.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT} in ${env.NODE_ENV} mode.`);
  });
};

startServer();
