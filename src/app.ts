import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import eventRoutes from './routes/eventRoutes';
import friendRoutes from './routes/friendRoutes';
import reportRoutes from './routes/reportRoutes';
import newsRoutes from './routes/newsRoutes';
import adminRoutes from './routes/adminRoutes';
import announcementRoutes from './routes/announcementRoutes';
import superAdminRoutes from './routes/superAdminRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import { authenticate, isAdmin } from './middlewares/authMiddleware';
import timeoutMiddleware from './middlewares/timeoutMiddleware';

// Haber çekme zamanlayıcısını import et
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_SCRAPER === 'true') {
  console.log('Haber çekme zamanlayıcısı yükleniyor...');
  import('./scripts/scheduledScraper')
    .then(() => console.log('Haber çekme zamanlayıcısı başarıyla başlatıldı'))
    .catch(err => console.error('Haber çekme zamanlayıcısı başlatılamadı:', err));
}

// Çevre değişkenlerini yükle
dotenv.config();

// Express uygulamasını oluştur
const app = express();

// Temel Middleware
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "https://api.example.com"]
    }
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// Sıkıştırma - büyük API yanıtları için önemli
app.use(compression({
  level: 6, // 0 (en hızlı, en az sıkıştırma) - 9 (en yavaş, en fazla sıkıştırma)
  threshold: 1024, // sadece 1KB'dan büyük yanıtları sıkıştır
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    // text/*, application/json, application/javascript vb içerik türlerini sıkıştır
    return compression.filter(req, res);
  }
}));

// JSON ayrıştırma - büyük boyut limitli
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// İstek zaman aşımı kontrolü - varsayılan olarak 29 saniye
app.use(timeoutMiddleware(29000));

// API Rate limiting - ana limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  limit: 300, // IP başına genel istek limiti
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Çok fazla istek gönderdiniz, lütfen daha sonra tekrar deneyin.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

// Auth rotaları için daha sıkı rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  limit: 40, // IP başına auth istek limiti
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Çok fazla oturum isteği gönderdiniz, lütfen daha sonra tekrar deneyin.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  }
});

// Ana API rate limiting
app.use('/api/', apiLimiter);

// Ana rota
app.get('/', (_: Request, res: Response) => {
  res.json({
    success: true,
    message: 'SportLink API çalışıyor!',
    version: '1.0.0'
  });
});

// Auth rotaları - herkes erişebilir ama daha sıkı rate limit ile
app.use('/api/auth', authLimiter, authRoutes);

// Bundan sonraki tüm API rotaları sadece admin ve superadmin erişimi için
// Admin kontrolü middleware - tüm API rotalarını koruyoruz
const adminRouteProtection = [authenticate, isAdmin];

// Korumalı API rotalarını bağla
app.use('/api/users', adminRouteProtection, userRoutes);
app.use('/api/events', adminRouteProtection, eventRoutes);
app.use('/api/friends', adminRouteProtection, friendRoutes);
app.use('/api/reports', adminRouteProtection, reportRoutes);
app.use('/api/news', adminRouteProtection, newsRoutes);
app.use('/api/admin', adminRouteProtection, adminRoutes);
app.use('/api/announcements', adminRouteProtection, announcementRoutes);
app.use('/api/superadmin', adminRouteProtection, superAdminRoutes);
app.use('/api/dashboard', adminRouteProtection, dashboardRoutes);

// 404 handler
app.use((_: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint bulunamadı',
    code: 'NOT_FOUND'
  });
});

// Hata işleyici
app.use((err: any, _: Request, res: Response, __: NextFunction) => {
  console.error('Sunucu hatası:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Sunucu hatası oluştu',
    code: err.code || 'SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT} adresinde çalışıyor`);
});

export default app;
