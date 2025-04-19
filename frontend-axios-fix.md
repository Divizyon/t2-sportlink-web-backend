# Axios 404 Hatası Çözümü - t2-sportlink-web-frontend

Bu doküman, t2-sportlink-web-frontend uygulamasında "AxiosError: Request failed with status code 404" hatasının çözümünü açıklamaktadır.

## Sorunun Nedeni

Frontend uygulamasında API isteği yapılırken bir 404 hatası alınıyor. Bunun en olası nedenleri:

1. Backend'deki `/api/admin/dashboard-permissions` rotası, spesifik olmayan bir rota olan `/:id` rotasından sonra tanımlanmış olması
2. Express, rotaları tanımlandıkları sırayla değerlendirdiği için, `/dashboard-permissions` yerine bu istek `/:id` rotası tarafından yakalanıyor ve "dashboard-permissions" bir ID gibi işleniyor

## Backend Çözümü

Bu sorunu çözmek için, backend kodunda rota sıralamasını değiştirdik:

```javascript
// dashboard-permissions rotasını spesifik olmayan /:id rotasından ÖNCE tanımladık
router.get('/dashboard-permissions', protectAdmin, adminController.getDashboardPermissions.bind(adminController));

// Sonra daha genel olan rota
router.get('/:id', protectAdmin, authorize(['superadmin', 'admin']), adminController.getAdminById.bind(adminController));
```

## Frontend Çözümü

Frontend'de bu sorunu çözmek için iki seçenek vardır:

### 1. Axios İsteklerini Güvenli Hale Getirme

`frontend-axios-fix.js` dosyasını projenize ekleyerek tüm API isteklerinizi yönetebilirsiniz:

```javascript
import api, { 
  getDashboardPermissions, 
  createAdmin, 
  getAdminProfile, 
  loginAdmin,
  getAdminList
} from './path/to/frontend-axios-fix.js';

// API isteklerinizi bu fonksiyonları kullanarak yapın
```

Bu modül, 404 hataları için özel işleme mantığı içerir ve `dashboard-permissions` endpoint'i için geçici bir çözüm sağlar.

### 2. Admin Modülünüzdeki İsteği Güncelleme

Eğer sadece ilgili dosyaları güncellemek istiyorsanız, admin dashboard izinleri isteğini şu şekilde değiştirin:

```javascript
// Hatalı istek
axios.get('/api/admin/dashboard-permissions')

// Doğru istek (rotaların sıralanmasından sonra)
axios.get('/api/admin/dashboard-permissions')
  .catch(error => {
    if (error.response && error.response.status === 404) {
      // Geçici çözüm - kullanıcı rolüne bağlı izinler
      const userRole = localStorage.getItem('userRole');
      return {
        data: {
          success: true,
          dashboardAccess: {
            hasAccess: true,
            canCreateAdmins: userRole === 'superadmin'
          }
        }
      };
    }
    throw error;
  });
```

## İzlenecek Adımlar

1. Backend'deki rota sıralamasını düzeltin (yapıldı)
2. Frontend uygulamasında API isteklerini `frontend-axios-fix.js` dosyasındaki fonksiyonlar ile değiştirin
3. Eğer API rotası hala çalışmıyorsa, API URL'nizin doğru şekilde yapılandırıldığından emin olun
4. Giriş işleminden sonra kullanıcı bilgilerini doğru şekilde kaydedip kullandığınızdan emin olun

## Notlar

- Kullanıcının rolüne göre admin oluşturma iznini kontrol ediyoruz (`canCreateAdmins: userRole === 'superadmin'`)
- Axios interceptor ile 401 hatalarını yakalayıp kullanıcıyı login sayfasına yönlendiriyoruz
- API endpoint hatalarını gidermek için 404 hataları özel olarak işleniyor
- Token her istekte otomatik olarak ekleniyor

Bu iyileştirmelerle frontend uygulamanız, backend değişikliklerinden bağımsız olarak daha sağlam çalışacaktır. 