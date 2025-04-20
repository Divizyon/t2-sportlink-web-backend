# Sportlink API - Postman Test Koleksiyonu

Bu klasör, Sportlink API'yi test etmek için oluşturulmuş Postman koleksiyonunu ve environment dosyasını içerir.

## Dosyalar

- `sportlink_api_collection.json`: API endpointleri için test isteklerini içeren Postman koleksiyonu
- `sportlink_environment.json`: API testleri için gerekli environment değişkenleri

## Kurulum

1. Postman uygulamasını açın.
2. Sol üstteki **Import** butonuna tıklayın.
3. Açılan pencerede `sportlink_api_collection.json` ve `sportlink_environment.json` dosyalarını seçin ve içe aktarın.
4. Sağ üst köşeden **Sportlink API Environment** environment'ını seçin.

## Environment Değişkenleri

Environment dosyası aşağıdaki değişkenleri içerir:

- `base_url`: API'nin çalıştığı temel URL (varsayılan: http://localhost:3001)
- `token`: Auth işlemleri sonrası otomatik olarak doldurulacak JWT token
- `admin_email`: Admin hesabının e-posta adresi (gerektiğinde değiştirin)
- `admin_password`: Admin hesabının şifresi (gerektiğinde değiştirin)

## Kullanım

1. API sunucusunun çalıştığından emin olun.
2. Öncelikle **Auth/Login** isteğini göndererek token alın. Doğru admin kimlik bilgilerini sağlamanız gerekir.
3. Login işlemi başarılı olursa, token otomatik olarak environment'a kaydedilecek ve diğer isteklerde kullanılacaktır.
4. Diğer endpointleri test etmeye başlayabilirsiniz.

## Koleksiyon İçeriği

Koleksiyon aşağıdaki ana bölümleri içerir:

### Auth

- **Login**: Admin girişi yapma ve token alma
- **Register**: Yeni kullanıcı kaydı
- **Logout**: Oturumu kapatma

### Sports

- **Get All Sports**: Tüm spor kategorilerini görüntüleme
- **Get Sport by ID**: ID'ye göre spor kategorisi görüntüleme
- **Create Sport**: Yeni spor kategorisi oluşturma (admin yetkisi gerekli)
- **Update Sport**: Spor kategorisi güncelleme (admin yetkisi gerekli)
- **Delete Sport**: Spor kategorisi silme (admin yetkisi gerekli)
- **Search Sports by Name**: İsme göre spor kategorilerini arama
- **Get All Sports - Sort by Name Desc**: Spor kategorilerini isme göre azalan sırada görüntüleme

## Test Senaryoları

Koleksiyon içerisindeki istek gruplarını aşağıdaki sırayla test edebilirsiniz:

1. **Auth**
   - Önce bir admin hesabı ile Login
   - Token'ın doğru şekilde alındığını kontrol edin

2. **Sports**
   - Get All Sports ile mevcut kategorileri görüntüleyin
   - Create Sport ile yeni bir kategori oluşturun
   - Get Sport by ID ile oluşturduğunuz kategoriyi kontrol edin
   - Update Sport ile kategoriyi güncelleyin
   - Search ve sort işlemlerini test edin
   - Delete Sport ile kategoriyi silmeyi deneyin (bağlı etkinlikler varsa silinmeyecektir)

## Notlar

- Admin yetkisi gerektiren işlemlerde geçerli bir token gereklidir.
- Spor kategorisi silme işleminde, kategoriye bağlı etkinlikler varsa silme işlemi gerçekleşmez ve hata döner. 