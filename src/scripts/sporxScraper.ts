import { NewsService } from '../services/NewsService';
import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

// .env dosyasını yükle
dotenv.config();

const newsService = new NewsService();

// Sporx.com kategori URL'leri
const categories = [
  { url: 'https://www.sporx.com/futbol/', sportId: '1' }, // Futbol ID (Spor tablosundaki gerçek ID)
  { url: 'https://www.sporx.com/basketbol/', sportId: '2' }, // Basketbol ID (Spor tablosundaki gerçek ID)
  { url: 'https://www.sporx.com/voleybol/', sportId: '3' }, // Voleybol ID (Spor tablosundaki gerçek ID)
  // Diğer kategoriler buraya eklenebilir
];

/**
 * Sporx sitesinden haberler çeker
 */
export async function scrapeSporx() {
  try {
    console.log('Sporx.com\'dan haber çekme işlemi başlıyor...');
    let totalProcessed = 0;
    let totalAdded = 0;

    for (const category of categories) {
      console.log(`${category.url} adresinden haberler çekiliyor...`);
      
      try {
        // Kategori sayfasını çek
        const response = await axios.get(category.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          },
          timeout: 15000
        });
        
        const $ = cheerio.load(response.data);
        let processedInCategory = 0;
        
        // Haber linklerini topla (Sporx sitesine özel CSS seçicileri - güncellemeniz gerekebilir)
        const newsLinks: string[] = [];
        $('.news-list-item a, .news-item a, .card-news a, article a, .headline a').each((_, element) => {
          const href = $(element).attr('href');
          if (href && !newsLinks.includes(href)) {
            newsLinks.push(href);
          }
        });
        
        console.log(`${newsLinks.length} haber linki bulundu.`);
        
        // Her haberi işle (en fazla 10 haber)
        for (let i = 0; i < Math.min(newsLinks.length, 10); i++) {
          const newsUrl = formatUrl(newsLinks[i], category.url);
          
          try {
            // Haber için URL'ler zaten işlendi mi kontrol et
            const title = $(newsLinks[i]).text().trim();
            const existingNews = await checkIfNewsExists(title, newsUrl);
            if (existingNews) {
              console.log(`Haber zaten mevcut: ${newsUrl}`);
              continue;
            }
            
            // Haber detay sayfasını çek
            const newsResponse = await axios.get(newsUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              },
              timeout: 10000
            });
            
            const newsPage = cheerio.load(newsResponse.data);
            
            // Haber verilerini çıkar (Sporx sitesine özel CSS seçicileri - güncellemeniz gerekebilir)
            const detailTitle = newsPage('.news-detail h1, .article-title h1, .story-title, .content-title, h1.title').text().trim();
            const content = newsPage('.news-detail .news-content, .article-body, .story-content, .content-text, .article-text').text().trim();
            const imageUrl = newsPage('.news-detail .news-img img, .article-img img, .story-image img, .content-image img, article figure img').attr('src') || '';
            
            // Tarih çıkar
            let publishedDate = new Date();
            const dateText = newsPage('.news-detail .news-date').text().trim();
            if (dateText) {
              try {
                // Türkçe tarih formatını işle (örnek: "10 Haziran 2023, 14:30")
                const dateParts = dateText.split(/[,\s]+/);
                
                if (dateParts.length >= 3) {
                  const day = parseInt(dateParts[0]);
                  const month = parseMonthNameTR(dateParts[1]);
                  const year = parseInt(dateParts[2]);
                  
                  if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                    publishedDate = new Date(year, month, day);
                    
                    // Saat varsa ekle
                    if (dateParts.length >= 4 && dateParts[3].includes(':')) {
                      const [hour, minute] = dateParts[3].split(':').map(Number);
                      publishedDate.setHours(hour, minute);
                    }
                  }
                }
              } catch (e) {
                console.error('Tarih ayrıştırma hatası:', e);
                // Hata durumunda şu anki tarihi kullan
              }
            }
            
            // Yeterli veri varsa haberi kaydet
            if (detailTitle && content) {
              const newsData = {
                title: detailTitle,
                content: content.substring(0, 5000),
                source_url: newsUrl,
                image_url: formatUrl(imageUrl, category.url),
                published_date: publishedDate,
                sport_id: category.sportId
              };
              
              console.log(`Haber ekleniyor: ${detailTitle}`);
              const result = await newsService.createNews(newsData);
              
              if (result.error) {
                console.error(`Haber eklenirken hata: ${result.error}`);
              } else {
                console.log(`Haber başarıyla eklendi! ID: ${result.data.id}`);
                totalAdded++;
              }
            }
            
            processedInCategory++;
            totalProcessed++;
            
            // İki istek arasında bekleme süresi (rate limiting önlemi)
            await new Promise(resolve => setTimeout(resolve, 1500));
            
          } catch (newsError: any) {
            console.error(`Haber detayı alınırken hata (${newsUrl}): ${newsError.message}`);
          }
        }
        
        console.log(`${category.url} kategorisinde ${processedInCategory} haber işlendi.`);
        
      } catch (categoryError: any) {
        console.error(`${category.url} kategorisi işlenirken hata: ${categoryError.message}`);
      }
    }
    
    console.log(`Sporx.com işlemi tamamlandı. Toplam ${totalProcessed} haber işlendi, ${totalAdded} haber eklendi.`);
    return { processed: totalProcessed, added: totalAdded };
    
  } catch (error: any) {
    console.error('Sporx scraper genel hatası:', error.message);
    throw error;
  }
}

/**
 * Türkçe ay adını sayıya çevirir
 */
function parseMonthNameTR(monthName: string): number {
  const months: Record<string, number> = {
    'ocak': 0, 'şubat': 1, 'mart': 2, 'nisan': 3, 'mayıs': 4, 'haziran': 5,
    'temmuz': 6, 'ağustos': 7, 'eylül': 8, 'ekim': 9, 'kasım': 10, 'aralık': 11
  };
  
  return months[monthName.toLowerCase()] || 0;
}

/**
 * URL'i mutlak URL'e çevirir
 */
function formatUrl(url: string, baseUrl: string): string {
  if (!url) return '';
  
  try {
    // URL mutlak ise olduğu gibi döndür
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Göreceli URL'i mutlak URL'e çevir
    const base = new URL(baseUrl);
    if (url.startsWith('/')) {
      return `${base.protocol}//${base.host}${url}`;
    } else {
      return `${base.protocol}//${base.host}/${url}`;
    }
  } catch (e) {
    console.error(`URL işlenirken hata:`, e);
    return url;
  }
}

/**
 * Haberin daha önce eklenip eklenmediğini kontrol eder
 */
async function checkIfNewsExists(title: string, sourceUrl: string): Promise<boolean> {
  try {
    console.log(`Haber kontrolü yapılıyor: "${title.substring(0, 30)}..." URL: ${sourceUrl}`);
    
    if (!sourceUrl) {
      console.log('Kaynak URL boş, sadece başlığa göre kontrol yapılacak');
      // URL yoksa başlığa göre ara
      const searchResult = await newsService.searchNews(title.substring(0, 20));
      
      if (searchResult.error || !searchResult.data) {
        return false;
      }
      
      return searchResult.data.some(news => 
        news.title.toLowerCase() === title.toLowerCase()
      );
    }
    
    // Doğrudan source_url'e göre sorgula - bu çok daha hızlı ve kesindir
    console.log('Kaynak URL ile doğrudan kontrol ediliyor');
    const result = await newsService.findBySourceUrl(sourceUrl);
    
    if (result.data) {
      console.log(`URL ile eşleşen haber bulundu: ${sourceUrl} (ID: ${result.data.id})`);
      return true;
    }
    
    // URL ile bulunamazsa, başlığa göre ara
    console.log('URL ile eşleşme bulunamadı, başlık kontrolü yapılıyor');
    const searchResult = await newsService.searchNews(title.substring(0, 20));
    
    if (searchResult.error || !searchResult.data) {
      return false;
    }
    
    // Başlık eşleşmesi var mı kontrol et
    const existsByTitle = searchResult.data.some(news => 
      news.title.toLowerCase() === title.toLowerCase()
    );
    
    if (existsByTitle) {
      console.log(`Başlık ile eşleşen haber bulundu: "${title.substring(0, 30)}..."`);
    }
    
    return existsByTitle;
  } catch (error) {
    console.error('Haber kontrolü sırasında hata:', error);
    return false;
  }
}

// Script doğrudan çalıştırıldığında scraping işlemini başlat
if (require.main === module) {
  scrapeSporx().catch(error => {
    console.error('Sporx scraper çalıştırılırken hata:', error);
    process.exit(1);
  });
} 