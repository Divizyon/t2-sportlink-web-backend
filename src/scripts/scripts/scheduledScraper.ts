import cron from 'node-cron';
import { spawn } from 'child_process';
import path from 'path';
import { scrapeNews } from './newsScraper';

console.log('Haber çekme zamanlayıcısı başlatılıyor...');

// Her gün saat 08:00'de çalışacak cron görevi
cron.schedule('0 8 * * *', async () => {
  console.log(`Zamanlanmış haber scraping başlıyor - ${new Date().toLocaleString()}`);
  
  try {
    // Scraper'ı doğrudan çağır
    await scrapeNews();
  } catch (error) {
    console.error('Zamanlanmış scraper çalışırken hata:', error);
  }
});

// Test için hemen bir kez çalıştır (development amaçlı - isterseniz kaldırabilirsiniz)
if (process.env.NODE_ENV === 'development') {
  console.log('Development modunda - test çalıştırması başlatılıyor...');
  setTimeout(async () => {
    try {
      await scrapeNews();
    } catch (error) {
      console.error('Test çalıştırması sırasında hata:', error);
    }
  }, 3000); // 3 saniye sonra başlat
}

console.log('Scheduler başlatıldı. Her gün saat 08:00\'de çalışacak.'); 