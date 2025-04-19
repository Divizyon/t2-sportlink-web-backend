import { PrismaClient } from '../src/generated/prisma';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Veritabanı hazırlanıyor...');

    // Örnek haber kategorileri
    const categories = [
        { name: 'Spor', slug: 'spor', description: 'Spor ile ilgili haberler' },
        { name: 'Duyurular', slug: 'duyurular', description: 'Önemli duyurular' },
        { name: 'Etkinlikler', slug: 'etkinlikler', description: 'Gelecek etkinlikler' },
        { name: 'Eğitim', slug: 'egitim', description: 'Eğitim ile ilgili haberler' }
    ];

    // Kategorileri oluştur
    for (const category of categories) {
        const existingCategory = await prisma.newsCategory.findUnique({
            where: { slug: category.slug }
        });

        if (!existingCategory) {
            await prisma.newsCategory.create({
                data: category
            });
            console.log(`Kategori oluşturuldu: ${category.name}`);
        } else {
            console.log(`Kategori zaten mevcut: ${category.name}`);
        }
    }

    // Admin kullanıcılar için şifre oluştur
    const superadminPasswordHash = await bcrypt.hash('superadmin123', 10);
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const editorPasswordHash = await bcrypt.hash('editor123', 10);

    // Admin kullanıcıları oluştur
    const superadminUsername = 'superadmin';
    const adminUsername = 'admin';
    const editorUsername = 'editor';

    // Artık migrasyon yapıldığı için username alanı Admin modelinde olmalı
    const existingSuperadmin = await prisma.admin.findFirst({
        where: { username: superadminUsername }
    });

    const existingAdmin = await prisma.admin.findFirst({
        where: { username: adminUsername }
    });

    const existingEditor = await prisma.admin.findFirst({
        where: { username: editorUsername }
    });

    // Superadmin kullanıcısı
    let superadmin;
    if (!existingSuperadmin) {
        superadmin = await prisma.admin.create({
            data: {
                username: superadminUsername,
                email: 'superadmin@example.com',
                passwordHash: superadminPasswordHash,
                role: 'superadmin',
                profile: {
                    create: {
                        firstName: 'Super',
                        lastName: 'Admin',
                        bio: 'Sistem yöneticisi'
                    }
                }
            }
        });
        console.log(`Superadmin kullanıcısı oluşturuldu: ${superadmin.username}`);
    } else {
        superadmin = existingSuperadmin;
        console.log('Superadmin kullanıcısı zaten mevcut');
    }

    // Admin kullanıcısı
    let admin;
    if (!existingAdmin) {
        admin = await prisma.admin.create({
            data: {
                username: adminUsername,
                email: 'admin@example.com',
                passwordHash: adminPasswordHash,
                role: 'admin',
                profile: {
                    create: {
                        firstName: 'Admin',
                        lastName: 'User',
                        bio: 'Site yöneticisi'
                    }
                }
            }
        });
        console.log(`Admin kullanıcısı oluşturuldu: ${admin.username}`);
    } else {
        admin = existingAdmin;
        console.log('Admin kullanıcısı zaten mevcut');
    }

    // Editor kullanıcısı
    let editor;
    if (!existingEditor) {
        editor = await prisma.admin.create({
            data: {
                username: editorUsername,
                email: 'editor@example.com',
                passwordHash: editorPasswordHash,
                role: 'editor',
                profile: {
                    create: {
                        firstName: 'Editor',
                        lastName: 'User',
                        bio: 'İçerik editörü'
                    }
                }
            }
        });
        console.log(`Editör kullanıcısı oluşturuldu: ${editor.username}`);
    } else {
        editor = existingEditor;
        console.log('Editör kullanıcısı zaten mevcut');
    }

    // Örnek haberler
    const newsItems = [
        {
            title: 'Yeni sezon başlıyor',
            slug: 'yeni-sezon-basliyor',
            content: 'Bu yıl basketbol sezonu 1 Ekim\'de başlayacak. Tüm takımlara başarılar dileriz.',
            summary: 'Basketbol sezonu 1 Ekim\'de başlıyor',
            imageUrl: 'https://example.com/images/basketball-season.jpg',
            isPublished: true,
            publishedAt: new Date(),
            authorId: admin.id,
            categories: {
                connect: [{ name: 'Spor' }]
            }
        },
        {
            title: 'Yeni tesisler açılıyor',
            slug: 'yeni-tesisler-aciliyor',
            content: 'Belediyemiz yeni spor tesislerini gelecek ay hizmete açıyor. Detaylar için takipte kalın.',
            summary: 'Yeni spor tesisleri gelecek ay açılıyor',
            imageUrl: 'https://example.com/images/new-facilities.jpg',
            isPublished: true,
            publishedAt: new Date(),
            authorId: editor.id,
            categories: {
                connect: [{ name: 'Duyurular' }, { name: 'Spor' }]
            }
        }
    ];

    // Haberleri oluştur
    for (const news of newsItems) {
        const existingNews = await prisma.news.findUnique({
            where: { slug: news.slug }
        });

        if (!existingNews) {
            await prisma.news.create({
                data: news
            });
            console.log(`Haber oluşturuldu: ${news.title}`);
        } else {
            console.log(`Haber zaten mevcut: ${news.title}`);
        }
    }

    // Örnek duyurular
    const announcements = [
        {
            title: 'Sistem bakımı',
            content: 'Sistemimiz 15 Mayıs günü 02:00-05:00 saatleri arasında bakımda olacaktır.',
            isImportant: true,
            isPublished: true,
            publishedAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün sonra
            authorId: admin.id
        },
        {
            title: 'Yeni özellikler eklendi',
            content: 'Platformumuza yeni özellikler eklenmiştir. Detaylar için duyuru panelini takip edin.',
            isImportant: false,
            isPublished: true,
            publishedAt: new Date(),
            authorId: editor.id
        }
    ];

    // Duyuruları oluştur
    for (const announcement of announcements) {
        await prisma.announcement.create({
            data: announcement
        });
        console.log(`Duyuru oluşturuldu: ${announcement.title}`);
    }

    console.log('Seed işlemi tamamlandı!');
}

main()
    .catch((error) => {
        console.error('Seed işlemi sırasında hata oluştu:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 