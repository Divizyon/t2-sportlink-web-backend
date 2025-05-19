import pLimit from 'p-limit';

/**
 * Eşzamanlı işlemleri sınırlamak için kullanılan yardımcı fonksiyonlar
 */

/**
 * Veritabanı yazma operasyonları için eşzamanlılık sınırlayıcısı
 * Bu, veritabanına aynı anda çok fazla yazma işlemi yapılmasını engeller
 */
export const dbWriteLimit = pLimit(10); // Aynı anda en fazla 10 yazma işlemi

/**
 * Veritabanı okuma operasyonları için eşzamanlılık sınırlayıcısı
 * Yazma işlemlerine göre daha yüksek limitle çalışabilir
 */
export const dbReadLimit = pLimit(50); // Aynı anda en fazla 50 okuma işlemi

/**
 * Harici API çağrıları için eşzamanlılık sınırlayıcısı
 * Bu, 3. parti servislere aynı anda çok fazla istek yapılmasını engeller
 */
export const externalApiLimit = pLimit(5); // Aynı anda en fazla 5 harici API isteği

/**
 * Yüksek CPU kullanımı gerektiren işlemler için eşzamanlılık sınırlayıcısı
 * Bu, sunucunun aşırı yüklenmesini önlemek için kullanılır
 */
export const cpuIntensiveLimit = pLimit(2); // Aynı anda en fazla 2 CPU yoğun işlem

/**
 * Batch işlemleri gerçekleştirmek için yardımcı fonksiyon
 * Büyük veri setlerini daha küçük parçalara bölerek işlemeyi sağlar
 * 
 * @param items İşlenecek öğeler dizisi
 * @param batchSize Her grupta işlenecek öğe sayısı
 * @param processFn Her bir grup için çalıştırılacak async fonksiyon
 */
export async function processBatch<T, R>(
    items: T[],
    batchSize: number,
    processFn: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
    const results: R[] = [];

    // Boş dizi kontrolü
    if (!items.length) return results;

    // Veriyi batchSize boyutunda parçalara böl
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await processFn(batch);
        results.push(...batchResults);
    }

    return results;
} 