import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Redis bağlantı parametreleri
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Redis istemcisi oluştur
const redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
    connectTimeout: 10000,
    lazyConnect: true
});

// Bağlantı olayları
redis.on('connect', () => {
    console.log('Redis bağlantısı kuruldu');
});

redis.on('error', (err) => {
    console.error('Redis bağlantı hatası:', err);
});

// Bağlantıyı başlat
(async () => {
    try {
        await redis.connect();
    } catch (error) {
        console.error('Redis bağlantısı başlatılamadı:', error);
        console.log('Redis olmadan devam ediliyor - önbellek yerel NodeCache ile çalışacak');
    }
})();

export default redis; 