"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const db_1 = require("./config/db");
const routes_1 = __importDefault(require("./routes"));
const error_middleware_1 = require("./middlewares/error.middleware");
const screening_worker_1 = __importDefault(require("./modules/recruitment/queue/screening.worker"));
require("./modules/recruitment/queue/interview.worker");
const app = (0, express_1.default)();
// Middlewares
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://bluhire-ai.vercel.app']
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
    credentials: true,
}));
// Route Definitions
app.use('/api/v1', routes_1.default);
// Base route
app.get('/', (req, res) => {
    res.send("BluHire-AI API is running");
});
// Error handling middleware
app.use(error_middleware_1.errorHandler);
// Start server
const startServer = async () => {
    await (0, db_1.connectDB)();
    screening_worker_1.default.start();
    app.listen(env_1.env.PORT, () => {
        console.log(`Server is running on port ${env_1.env.PORT} in ${env_1.env.NODE_ENV} mode.`);
    });
};
startServer();
