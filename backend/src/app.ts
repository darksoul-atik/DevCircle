import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './modules/auth/auth.routes';
import postsRoutes from './modules/posts/posts.routes';
import reactionsRoutes from './modules/reactions/reactions.routes';
import profileRoutes from './modules/profile/profile.routes';
import { errorHandler } from './middleware/errorHandler';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './utils/swagger';

const app = express();

app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' }, message: 'Backend is healthy' });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/auth', authRoutes);
app.use('/posts', postsRoutes);
app.use('/reactions', reactionsRoutes);
app.use('/profile', profileRoutes);

app.use(errorHandler);

export default app;
