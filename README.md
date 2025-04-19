# Sportlink Web Backend

Bu proje, Sportlink web uygulamasının backend kısmıdır. TypeScript ve Supabase kullanılarak geliştirilmiştir.

## Teknolojiler

- Node.js
- Express.js
- TypeScript
- Supabase (PostgreSQL)
- Prisma ORM
- Jest (Test)

## Kurulum

1. Projeyi klonlayın:
```bash
git clone https://github.com/your-username/sportlink-web-backend.git
cd sportlink-web-backend
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. `.env` dosyasını oluşturun ve gerekli değişkenleri ayarlayın:
```
PORT=3000
NODE_ENV=development
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
```

4. Prisma istemcisini oluşturun:
```bash
npm run prisma:generate
```

5. Geliştirme modunda çalıştırın:
```bash
npm run dev
```

## Klasör Yapısı

```
src/
├── config/         # Yapılandırma dosyaları
├── controllers/    # İstek işleyicileri
├── middleware/     # Ara yazılımlar
├── models/         # Veri modelleri
├── routes/         # API rotaları
├── services/       # İş mantığı
├── utils/          # Yardımcı fonksiyonlar
└── index.ts        # Uygulama giriş noktası
```

## API Rotaları

### Kimlik Doğrulama
- `POST /api/auth/register` - Yeni kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/logout` - Kullanıcı çıkışı
- `GET /api/auth/me` - Mevcut kullanıcı bilgilerini getir
- `POST /api/auth/reset-password` - Şifre sıfırlama

### Kullanıcılar
- `GET /api/users` - Tüm kullanıcıları getir (sadece admin)
- `GET /api/users/:id` - Belirli bir kullanıcıyı getir

### Profil
- `GET /api/profile` - Kullanıcı profilini getir
- `PUT /api/profile` - Kullanıcı profilini güncelle

## Geliştirme Standartları

Bu proje, `.cursorrules` dosyasında belirtilen Sportlink Development Standards (SCDS) kurallarına uygun olarak geliştirilmiştir.

## Veritabanı Migrasyonları

Bu projede veritabanı şemasını yönetmek için Prisma kullanılmaktadır.

### Mevcut Veritabanını Çekme

Supabase'de mevcut bir veritabanınız varsa, şema dosyasını oluşturmak için:

```bash
npx prisma db pull
```

### Migrasyon Oluşturma

Şemada değişiklik yaptıktan sonra yeni bir migrasyon oluşturmak için:

```bash
npm run prisma:migrate:dev -- --name migration_ismi
```

### Migrasyonları Uygulama

Üretim ortamında migrasyonları uygulamak için:

```bash
npm run prisma:migrate:deploy
```

### Seed Verileri

Veritabanınıza örnek veriler eklemek için:

```bash
npm run prisma:seed
```

## Supabase ve Prisma Entegrasyonu

Bu projedeki Supabase PostgreSQL veritabanı, Prisma ORM aracılığıyla yönetilmektedir:

1. **Prisma Schema**: `prisma/schema.prisma` dosyası veritabanı modellerini tanımlar.
2. **Prisma Client**: Uygulama içinde veritabanı işlemlerini gerçekleştirmek için kullanılır.
3. **Migrations**: Şema değişikliklerini güvenli bir şekilde takip etmek ve uygulamak için kullanılır.

### Prisma Studio

Veritabanınızı görsel bir arayüzle incelemek ve düzenlemek için:

```bash
npm run prisma:studio
```

## API Dokümantasyonu

API dokümantasyonu Swagger ile sunulmaktadır. Uygulamayı çalıştırdıktan sonra aşağıdaki adresten erişilebilir:

```
http://localhost:3000/api-docs
```