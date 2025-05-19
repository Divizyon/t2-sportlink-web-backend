import NodeCache from 'node-cache';

/**
 * Uygulama genelinde kullanılan önbellek sistemi
 * Bu, veritabanı yükünü azaltmak ve sunucu performansını arttırmak için kullanılır
 * 
 * - stdTTL: Varsayılan önbellek süresi (saniye)
 * - checkperiod: Süresi dolan önbellek öğelerini temizleme kontrolü periyodu (saniye)
 * - useClones: false ile performans biraz artar ama referans değişikliklerine dikkat edilmeli
 */
const cache = new NodeCache({
    stdTTL: 600, // 10 dakika
    checkperiod: 120, // 2 dakika
    useClones: false,
    maxKeys: 1000 // maksimum cache anahtarı sayısı
});

export default cache; 