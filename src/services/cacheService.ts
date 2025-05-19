import redis from '../config/redis';
import localCache from '../config/cache';

/**
 * Önbellek servisi - hem Redis (eğer varsa) hem de local cache kullanır
 * Redis varsa tercih edilir, yoksa local cache kullanılır
 */
class CacheService {
    private isRedisConnected: boolean = false;

    constructor() {
        // Redis bağlantı durumunu kontrol et
        this.checkRedisConnection();
    }

    /**
     * Redis bağlantı durumunu kontrol eder
     */
    private async checkRedisConnection(): Promise<void> {
        try {
            // Redis isClient'ının çalışan durumda olup olmadığını kontrol et
            this.isRedisConnected = redis.status === 'ready';
        } catch (error) {
            this.isRedisConnected = false;
            console.error('Redis bağlantı kontrolü sırasında hata:', error);
        }
    }

    /**
     * Önbellekten veri getirir
     * @param key Önbellek anahtarı
     * @returns Veri veya null
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            if (this.isRedisConnected) {
                const data = await redis.get(key);
                if (!data) return null;
                return JSON.parse(data) as T;
            } else {
                return localCache.get<T>(key) || null;
            }
        } catch (error) {
            console.error(`Önbellek okuma hatası (${key}):`, error);
            return null;
        }
    }

    /**
     * Önbelleğe veri kaydeder
     * @param key Önbellek anahtarı
     * @param value Kaydedilecek veri
     * @param ttl Önbellek süresi (saniye), varsayılan: 600 (10 dakika)
     */
    async set<T>(key: string, value: T, ttl: number = 600): Promise<void> {
        try {
            if (this.isRedisConnected) {
                await redis.set(key, JSON.stringify(value), 'EX', ttl);
            } else {
                localCache.set(key, value, ttl);
            }
        } catch (error) {
            console.error(`Önbellek yazma hatası (${key}):`, error);
        }
    }

    /**
     * Önbellekten veri siler
     * @param key Önbellek anahtarı
     */
    async del(key: string): Promise<void> {
        try {
            if (this.isRedisConnected) {
                await redis.del(key);
            } else {
                localCache.del(key);
            }
        } catch (error) {
            console.error(`Önbellek silme hatası (${key}):`, error);
        }
    }

    /**
     * Belirli bir pattern ile eşleşen tüm anahtarları siler
     * @param pattern Anahtar pattern'ı (ör: "user:*")
     */
    async delByPattern(pattern: string): Promise<void> {
        try {
            if (this.isRedisConnected) {
                const keys = await redis.keys(pattern);
                if (keys.length > 0) {
                    await redis.del(...keys);
                }
            } else {
                // Local cache için pattern silme
                const localKeys = localCache.keys();
                const regex = new RegExp(pattern.replace('*', '.*'));

                localKeys.forEach(key => {
                    if (regex.test(key)) {
                        localCache.del(key);
                    }
                });
            }
        } catch (error) {
            console.error(`Önbellek pattern silme hatası (${pattern}):`, error);
        }
    }
}

export default new CacheService(); 