import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import exampleRoutes from './routes/exampleRoutes';
import eventRoutes from './routes/eventRoutes';
import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import announcementRoutes from './routes/announcementRoutes';
import newsRoutes from './routes/newsRoutes';
// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;





// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());


// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/news', newsRoutes);
app.use('/api', eventRoutes);
app.use('/api', exampleRoutes); 

// Ana sayfa
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'Sportlink API çalışıyor',
        version: '1.0.0',
        env: process.env.NODE_ENV
    });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint bulunamadı'
    });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Sunucu hatası',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Bilinmeyen hata'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
});

export default app;