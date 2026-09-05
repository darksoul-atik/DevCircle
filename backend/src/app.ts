import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './modules/auth/auth.routes';
import postsRoutes from './modules/posts/posts.routes';
import reactionsRoutes from './modules/reactions/reactions.routes';
import profileRoutes from './modules/profile/profile.routes';
import communitiesRoutes from './routes/communities';
import searchRoutes from './routes/search';
import favoritesRoutes from './routes/favorites';
import { errorHandler } from './middleware/errorHandler';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './utils/swagger';
import path from 'path';

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
app.use('/communities', communitiesRoutes);
app.use('/search', searchRoutes);
app.use('/favorites', favoritesRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(errorHandler);

export default app;
