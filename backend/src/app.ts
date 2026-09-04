import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' }, message: 'Backend is healthy' });
});

// Centralized error handler will go here later

export default app;
