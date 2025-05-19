import { Request, Response, NextFunction } from 'express';

/**
 * İstek zaman aşımı middleware'i
 * Belirli bir süreyi aşan istekleri otomatik olarak sonlandırır
 * 
 * @param {number} timeout - Zaman aşımı süresi (milisaniye)
 * @returns {Function} Express middleware fonksiyonu
 */
export default function timeoutMiddleware(timeout: number = 29000) {
    return (req: Request, res: Response, next: NextFunction) => {
        // Zaman aşımı kontrolü için ID
        let timeoutId: NodeJS.Timeout;

        // İstek tamamlandığında zamanlayıcıyı temizle
        const cleanup = () => {
            if (timeoutId) clearTimeout(timeoutId);
        };

        // İstek tamamlandığında temizleme
        res.on('finish', cleanup);
        res.on('close', cleanup);

        // Zaman aşımı sonrası işlem
        timeoutId = setTimeout(() => {
            // Eğer yanıt zaten gönderilmişse işlem yapma
            if (res.headersSent) return;

            // İşlemi durdur ve hata yanıtı gönder
            const err: any = new Error('İstek zaman aşımına uğradı');
            err.status = 503;
            err.code = 'REQUEST_TIMEOUT';

            // Event listener'ları temizle
            res.removeListener('finish', cleanup);
            res.removeListener('close', cleanup);

            // Hata yanıtı
            res.status(503).json({
                success: false,
                message: 'İstek zaman aşımına uğradı, lütfen daha sonra tekrar deneyin',
                code: 'REQUEST_TIMEOUT'
            });
        }, timeout);

        next();
    };
} 