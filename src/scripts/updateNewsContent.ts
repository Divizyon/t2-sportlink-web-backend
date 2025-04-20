import { NewsService } from '../services/NewsService';
import * as cheerio from 'cheerio';
import axios from 'axios';
import dotenv from 'dotenv';

// .env dosyasını yükle
dotenv.config();

const newsService = new NewsService();

// İçerik seçicileri (farklı site yapıları için)
const contentSelectors = [
  '.icerik', // Konhaber
  '.news-single', // Konyaspor resmi site (alternatif)
  '.news-detail .news-content, .article-content', // Sporx
  '.haber-detay-icerik, .news-content', // Diğer siteler
  'article .content, .content-main' // Genel
];

// Spot içerik seçicisi
const spotSelector = '.spot';

/**
 * Veritabanındaki haberlerin içeriğini güncelleyen fonksiyon
 */
async function updateNewsContent() {
  try {
    console.log('Haber içeriklerini güncelleme işlemi başlıyor...');
    
    // Tüm haberleri al (sayfalama ile)
    const page = 1;
    const limit = 100; // Her sayfada 100 haber
    
    const result = await newsService.listNews(page, limit);
    
    if (result.error || !result.data) {
      console.error('Haberler alınırken hata:', result.error);
      return;
    }
    
    console.log(`Toplam ${result.count} haber bulundu, şu anda ${result.data.length} tanesi işlenecek.`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const news of result.data) {
      try {
        // İçerik uzunluğunu kontrol et
        // Eğer içerik kısaysa veya başlıkla aynıysa, detay sayfasına git
        const shouldUpdate = !news.content || 
                            news.content.length < 100 || 
                            news.content === news.title ||
                            (news.content && news.content.includes('<div class="row">')) ||
                            (news.content && news.content.includes('<span class="col-md-12')) ||
                            (news.content && news.content.includes('<div class="news-single"'));
        
        if (shouldUpdate && news.source_url) {
          console.log(`Haber güncelleniyor: ${news.title} (ID: ${news.id})`);
          console.log(`Kaynak URL: ${news.source_url}`);
          
          try {
            // Detay sayfasını al
            const response = await axios.get(news.source_url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
              },
              timeout: 30000
            });
            
            const $ = cheerio.load(response.data);
            
            // Farklı seçicileri dene
            let content = '';
            
            // Konyaspor resmi sitesi için özel işlem
            if (news.source_url.includes('konyaspor.org.tr')) {
              // Önce .detail-text sınıfını kontrol et (paragrafları içeren ana bölüm)
              const detailText = $('.detail-text');
              
              if (detailText.length > 0) {
                // Tüm p elementlerindeki metinleri topla
                const paragraphs: string[] = [];
                detailText.find('p').each(function(this: cheerio.Element) {
                  const paragraphText = $(this).text().trim();
                  if (paragraphText) {
                    paragraphs.push(paragraphText);
                  }
                });
                
                // Paragrafları birleştir
                content = paragraphs.join('\n\n');
                
                if (content) {
                  console.log('Konyaspor resmi sitesinden metin içeriği alındı.');
                }
              }
              
              // Eğer içerik yoksa news-single sınıfını deneyelim (tüm haber alanı)
              if (!content) {
                const newsElement = $('.news-single');
                if (newsElement.length > 0) {
                  // .detail-text içindeki tüm metinleri al
                  const textElement = newsElement.find('.detail-text');
                  if (textElement.length > 0) {
                    const paragraphs: string[] = [];
                    textElement.find('p').each(function(this: cheerio.Element) {
                      const paragraphText = $(this).text().trim();
                      if (paragraphText) {
                        paragraphs.push(paragraphText);
                      }
                    });
                    
                    content = paragraphs.join('\n\n');
                    console.log('Konyaspor resmi sitesinden .news-single > .detail-text içeriği alındı.');
                  } else {
                    // .detail-text yoksa, sadece metin içeriğini al
                    content = newsElement.text().trim()
                      .replace(/\s+/g, ' ')  // Çoklu boşlukları tek boşluğa indir
                      .replace(/GALERİ/g, '') // Galeri yazısını kaldır
                      .replace(/Facebook"ta Paylaş/g, '') // Paylaşım linklerini kaldır
                      .replace(/Twitterda Paylaş/g, '')
                      .replace(/Yazdır/g, '');
                      
                    // Gereksiz tarih, sosyal medya ve diğer içerikleri kaldır
                    content = content.replace(/\d+\.\d+\.\d+\s+\d+:\d+/g, ''); // Tarih ve saat formatlarını kaldır
                    
                    console.log('Konyaspor resmi sitesinden sadece metin içeriği alındı.');
                  }
                }
              }
            } else {
              // Diğer siteler için genel seçicileri dene
              for (const selector of contentSelectors) {
                const contentElement = $(selector);
                if (contentElement.length > 0) {
                  content = contentElement.html() || '';
                  break;
                }
              }
            }
            
            // İçerik bulunamadıysa, devam et
            if (!content) {
              console.log(`${news.id} için içerik bulunamadı.`);
              continue;
            }
            
            // Konhaber sitesi için spot içeriğini kontrol et
            if (news.source_url.includes('konhaber.com')) {
              const spotElement = $(spotSelector);
              if (spotElement.length > 0) {
                const spotHtml = spotElement.html() || '';
                console.log('Spot içeriği bulundu, ana içeriğin başına ekleniyor...');
                // Spot içeriğini ana içeriğin başına ekle
                content = `<div class="spot">${spotHtml}</div><div class="main-content">${content}</div>`;
              }
            }
            
            // İçeriği temizle (Konyaspor için zaten temizliyoruz)
            if (!news.source_url.includes('konyaspor.org.tr')) {
              content = content.replace(/\s+/g, ' ').trim();
            }
            
            // Haberi güncelle
            const updateResult = await newsService.updateNews(news.id.toString(), {
              content,
              updated_at: new Date().toISOString()
            });
            
            if (updateResult.error) {
              console.error(`Haber güncellenirken hata (ID: ${news.id}):`, updateResult.error);
              errorCount++;
            } else {
              console.log(`Haber başarıyla güncellendi! ID: ${news.id}`);
              updatedCount++;
            }
          } catch (requestError: any) {
            console.error(`${news.source_url} adresinden içerik alınamadı:`, requestError.message);
            errorCount++;
          }
          
          // Rate limiting için bekleme
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          console.log(`Haber içeriği yeterli, güncelleme gerekmiyor: ${news.title} (ID: ${news.id})`);
        }
      } catch (newsError: any) {
        console.error(`Haber işlenirken hata (ID: ${news.id}):`, newsError.message);
        errorCount++;
      }
    }
    
    console.log(`İşlem tamamlandı: ${updatedCount} haber güncellendi, ${errorCount} hata oluştu.`);
    
  } catch (error: any) {
    console.error('Genel hata:', error.message);
  }
}

/**
 * Haberin daha önce eklenip eklenmediğini kontrol eder
 */
async function checkIfNewsExists(title: string, sourceUrl: string): Promise<boolean> {
  try {
    // Önce kaynak URL'i kontrol et
    const sourceResult = await newsService.listNews(1, 100);
    if (!sourceResult.error && sourceResult.data) {
      const exists = sourceResult.data.some(news => news.source_url === sourceUrl);
      if (exists) {
        return true;
      }
    }
    
    // Hiçbir sonuç bulunamazsa veya URL eşleşmezse, başlıkla kontrol et
    // Başlıktaki özel karakterleri temizle
    const searchTerm = title
                      .substring(0, 20)
                      .replace(/%/g, '')
                      .replace(/:/g, '')
                      .trim();
    
    if (searchTerm.length < 3) {
      // Çok kısa terimlerle arama yapmak yerine, başlığın tamamını kontrol et
      return sourceResult.data ? sourceResult.data.some(news => 
        news.title.toLowerCase() === title.toLowerCase() ||
        title.toLowerCase().includes(news.title.toLowerCase()) ||
        news.title.toLowerCase().includes(title.toLowerCase())
      ) : false;
    }
    
    // Başlık ile haberi ara
    const searchResult = await newsService.searchNews(searchTerm);
    
    if (searchResult.error || !searchResult.data) {
      return false;
    }
    
    // Aynı başlık ile eşleşen haberi bul
    return searchResult.data.some(news => 
      news.title.toLowerCase().includes(title.toLowerCase()) || 
      title.toLowerCase().includes(news.title.toLowerCase())
    );
  } catch (error) {
    console.error('Haber kontrolü sırasında hata:', error);
    return false;
  }
}

// Script çalıştığında işlemi başlat
if (require.main === module) {
  updateNewsContent().then(() => {
    console.log('Haber içeriklerini güncelleme işlemi tamamlandı.');
    process.exit(0);
  }).catch(error => {
    console.error('Script çalışırken hata:', error);
    process.exit(1);
  });
} 