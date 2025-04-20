import { NewsService } from '../services/NewsService';
import * as cheerio from 'cheerio';
import axios from 'axios';
import dotenv from 'dotenv';
import { scrapeSporx } from './sporxScraper';
import { scrapeKonyasporNews } from './konyasporScraper';

// .env dosyasından ortam değişkenlerini yükle
dotenv.config();

const newsService = new NewsService();

// Scraping yapılacak sitelerin URL'leri ve spor ID'leri
// Bu örnekler, değiştirilmelidir
const sourceSites = [
  {
    name: 'NTVSpor',
    url: 'https://www.ntvspor.net/',
    sportId: '1', // Futbol ID (Spor tablosundaki gerçek ID)
    selectors: {
      articles: '.category-news article, .news-item, .list-item', // Haberleri içeren ana eleman
      title: 'h2, .news-title, .title',   // Başlık elemanı
      content: '.spot, .summary, .excerpt', // İçerik elemanı (özet)
      link: 'a',     // Kaynak linki elemanı
      image: 'img',   // Resim elemanı
      date: '.date, .time, .news-date, time'      // Tarih elemanı
    }
  },
  {
    name: 'Fanatik',
    url: 'https://www.fanatik.com.tr/futbol',
    sportId: '1', // Futbol ID (Spor tablosundaki gerçek ID)
    selectors: {
      articles: '.card, .news-card, .news-list-item',
      title: 'h3, .card-title, .title',
      content: '.card-text, .summary, .excerpt',
      link: 'a',
      image: 'img, .card-img-top',
      date: '.date, .time, .publish-date'
    }
  },
  {
    name: 'TRTSpor Basketbol',
    url: 'https://www.trtspor.com.tr/haber/basketbol/',
    sportId: '2', // Basketbol ID (Spor tablosundaki gerçek ID)
    selectors: {
      articles: '.news-list-item, .card, article',
      title: 'h2, h3, .title',
      content: '.summary, .excerpt, .description',
      link: 'a',
      image: 'img',
      date: '.date, time'
    }
  }
];

/**
 * Web sayfalarından haberleri çeker
 */
async function scrapeGenericNews() {
  try {
    console.log('Genel haber scraping işlemi başlıyor...');
    
    for (const site of sourceSites) {
      console.log(`${site.name} (${site.url}) adresinden haberler çekiliyor...`);
      
      try {
        // Web sayfasını çek
        const response = await axios.get(site.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
          },
          timeout: 10000 // 10 saniye zaman aşımı
        });
        
        const $ = cheerio.load(response.data);
        let newsCount = 0;
        
        // Site yapısına göre haberleri çıkar
        $(site.selectors.articles).each(async (_, element) => {
          const title = $(element).find(site.selectors.title).text().trim();
          const content = $(element).find(site.selectors.content).text().trim();
          const sourceUrl = $(element).find(site.selectors.link).attr('href') || site.url;
          const imageUrl = $(element).find(site.selectors.image).attr('src') || '';
          
          // Tarih alanını çek ve işle
          let publishedDate;
          const dateText = $(element).find(site.selectors.date).text().trim();
          if (dateText) {
            try {
              publishedDate = new Date(dateText);
            } catch (e) {
              publishedDate = new Date(); // Geçerli tarih kullan
            }
          } else {
            publishedDate = new Date(); // Tarih bulunamazsa şu anki zamanı kullan
          }
          
          // Yeterli veri varsa kaydet
          if (title && content) {
            newsCount++;
            
            // Haber verisini oluştur
            const newsData = {
              title,
              content: content.substring(0, 5000), // İçeriği makul bir uzunlukta sınırla
              source_url: formatUrl(sourceUrl, site.url),
              image_url: formatUrl(imageUrl, site.url),
              published_date: publishedDate,
              sport_id: site.sportId
            };
            
            // Haberin daha önce eklenip eklenmediğini kontrol et
            const exists = await checkIfNewsExists(title, newsData.source_url);
            
            if (!exists) {
              console.log(`Yeni haber ekleniyor: ${title}`);
              const result = await newsService.createNews(newsData);
              
              if (result.error) {
                console.error(`Haber eklenirken hata: ${result.error}`);
              } else {
                console.log(`Haber başarıyla eklendi! ID: ${result.data.id}`);
              }
            } else {
              console.log(`Haber zaten mevcut: ${title}`);
            }
          }
        });
        
        console.log(`${site.name} sitesinden ${newsCount} haber işlendi.`);
      } catch (siteError: any) {
        console.error(`${site.name} sitesinden haber çekerken hata: ${siteError.message}`);
      }
    }
    
    console.log('Genel haber scraping işlemi tamamlandı!');
  } catch (error) {
    console.error('Scraping sırasında genel hata:', error);
  }
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

/**
 * Tüm scraperları çalıştırır
 */
export async function scrapeNews() {
  console.log('Tüm scraperlar çalıştırılıyor...');
  
  try {
    // Konyaspor haberlerini çek
    console.log('Konyaspor haberleri çekiliyor...');
    await scrapeKonyasporNews();
    
    // Sporx.com'dan haber çek
    console.log('Sporx haberleri çekiliyor...');
    await scrapeSporx();
    
    // Genel haber sitelerinden çek
    console.log('Genel spor haberleri çekiliyor...');
    await scrapeGenericNews();
    
    console.log('Tüm scraping işlemleri tamamlandı!');
  } catch (error) {
    console.error('Scraping işlemi sırasında hata:', error);
  }
}

// Script doğrudan çalıştırıldığında scraping işlemini başlat
if (require.main === module) {
  scrapeNews().catch(error => {
    console.error('Scraper çalıştırılırken hata:', error);
    process.exit(1);
  });
} 