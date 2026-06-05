import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { connectDB } from './config/db';
import apiRouter from './routes';
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

// Route Definitions
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
