import prisma from '../config/prisma';
import { PrismaClient, News } from '../generated/prisma';
import slugify from 'slugify';

// News tipi için tip tanımlaması
type NewsWithRelations = NonNullable<Awaited<ReturnType<PrismaClient['news']['findUnique']>> & {
    author: Awaited<ReturnType<PrismaClient['admin']['findUnique']>>;
    categories: Awaited<ReturnType<PrismaClient['newsCategory']['findMany']>>;
}>;

export interface CreateNewsData {
    title: string;
    content: string;
    summary?: string;
    imageUrl?: string;
    isPublished?: boolean;
    authorId: string;
    publishedAt?: Date;
    categoryIds?: string[];
}

export interface UpdateNewsData {
    title?: string;
    content?: string;
    summary?: string;
    imageUrl?: string;
    isPublished?: boolean;
    publishedAt?: Date;
    categoryIds?: string[];
}

export class NewsService {
    /**
     * Yeni haber oluştur
     */
    async createNews(data: CreateNewsData): Promise<News> {
        try {
            // Slug oluştur
            const slug = slugify(data.title, { lower: true, strict: true });

            // Eğer slug zaten varsa, sonuna rastgele bir string ekle
            const existingNewsWithSlug = await prisma.news.findUnique({
                where: { slug }
            });

            const finalSlug = existingNewsWithSlug
                ? `${slug}-${Date.now().toString().slice(-6)}`
                : slug;

            return await prisma.news.create({
                data: {
                    title: data.title,
                    slug: finalSlug,
                    content: data.content,
                    summary: data.summary,
                    imageUrl: data.imageUrl,
                    isPublished: data.isPublished || false,
                    authorId: data.authorId,
                    publishedAt: data.isPublished ? data.publishedAt || new Date() : null,
                    categories: data.categoryIds ? {
                        connect: data.categoryIds.map(id => ({ id }))
                    } : undefined
                },
                include: {
                    author: true,
                    categories: true
                }
            });
        } catch (error) {
            console.error('Haber oluşturma hatası:', error);
            throw error;
        }
    }

    /**
     * ID ile haber bul
     */
    async findNewsById(id: string): Promise<NewsWithRelations | null> {
        try {
            return await prisma.news.findUnique({
                where: { id },
                include: {
                    author: true,
                    categories: true
                }
            }) as NewsWithRelations | null;
        } catch (error) {
            console.error('Haber bulma hatası:', error);
            throw error;
        }
    }

    /**
     * Slug ile haber bul ve görüntüleme sayısını artır
     */
    async findNewsBySlug(slug: string, incrementViewCount = true): Promise<NewsWithRelations | null> {
        try {
            const news = await prisma.news.findUnique({
                where: { slug },
                include: {
                    author: true,
                    categories: true
                }
            }) as NewsWithRelations | null;

            if (news && incrementViewCount) {
                await prisma.news.update({
                    where: { id: news.id },
                    data: {
                        viewCount: {
                            increment: 1
                        }
                    }
                });
            }

            return news;
        } catch (error) {
            console.error('Haber bulma hatası:', error);
            throw error;
        }
    }

    /**
     * Haber güncelle
     */
    async updateNews(id: string, data: UpdateNewsData): Promise<News> {
        try {
            // Mevcut haberi al
            const existingNews = await prisma.news.findUnique({
                where: { id },
                include: { categories: true }
            });

            if (!existingNews) {
                throw new Error('Haber bulunamadı');
            }

            // Eğer başlık değiştiyse, yeni slug oluştur
            let slug;
            if (data.title) {
                slug = slugify(data.title, { lower: true, strict: true });

                // Eğer oluşturulan slug başka bir haberde varsa ve bu haber değilse
                const existingNewsWithSlug = await prisma.news.findFirst({
                    where: {
                        slug,
                        id: { not: id }
                    }
                });

                if (existingNewsWithSlug) {
                    slug = `${slug}-${Date.now().toString().slice(-6)}`;
                }
            }

            // Yayınlanma durumu değiştiyse ve yayınlanıyorsa, tarih ekle
            let publishedAt = data.publishedAt;
            if (data.isPublished === true && !existingNews.isPublished) {
                publishedAt = publishedAt || new Date();
            }

            // Kategori ilişkilerini hazırla
            const categoryOperations: any = {};

            if (data.categoryIds) {
                // Mevcut kategorileri çıkar
                if (existingNews.categories.length > 0) {
                    categoryOperations.disconnect = existingNews.categories.map(category => ({ id: category.id }));
                }

                // Yeni kategorileri ekle
                categoryOperations.connect = data.categoryIds.map(id => ({ id }));
            }

            return await prisma.news.update({
                where: { id },
                data: {
                    title: data.title,
                    ...(slug ? { slug } : {}),
                    content: data.content,
                    summary: data.summary,
                    imageUrl: data.imageUrl,
                    isPublished: data.isPublished,
                    publishedAt,
                    categories: Object.keys(categoryOperations).length > 0 ? categoryOperations : undefined
                },
                include: {
                    author: true,
                    categories: true
                }
            });
        } catch (error) {
            console.error('Haber güncelleme hatası:', error);
            throw error;
        }
    }

    /**
     * Haber sil
     */
    async deleteNews(id: string): Promise<News> {
        try {
            return await prisma.news.delete({
                where: { id },
                include: {
                    author: true,
                    categories: true
                }
            });
        } catch (error) {
            console.error('Haber silme hatası:', error);
            throw error;
        }
    }

    /**
     * Haberleri listele (sayfalama, filtreleme ve sıralama ile)
     */
    async listNews({
        page = 1,
        pageSize = 10,
        categoryId,
        authorId,
        isPublished,
        searchQuery,
        orderBy = 'createdAt',
        orderDirection = 'desc'
    }: {
        page?: number;
        pageSize?: number;
        categoryId?: string;
        authorId?: string;
        isPublished?: boolean;
        searchQuery?: string;
        orderBy?: string;
        orderDirection?: 'asc' | 'desc';
    }): Promise<{ news: NewsWithRelations[]; total: number }> {
        try {
            const skip = (page - 1) * pageSize;

            // Filtre koşullarını oluştur
            const where: any = {};

            if (categoryId) {
                where.categories = {
                    some: {
                        id: categoryId
                    }
                };
            }

            if (authorId) {
                where.authorId = authorId;
            }

            if (isPublished !== undefined) {
                where.isPublished = isPublished;
            }

            if (searchQuery) {
                where.OR = [
                    { title: { contains: searchQuery, mode: 'insensitive' } },
                    { content: { contains: searchQuery, mode: 'insensitive' } },
                    { summary: { contains: searchQuery, mode: 'insensitive' } }
                ];
            }

            // Sıralama seçeneklerini oluştur
            const sortOptions: any = {};
            sortOptions[orderBy] = orderDirection;

            const [news, total] = await Promise.all([
                prisma.news.findMany({
                    skip,
                    take: pageSize,
                    where,
                    include: {
                        author: true,
                        categories: true
                    },
                    orderBy: sortOptions
                }) as Promise<NewsWithRelations[]>,
                prisma.news.count({ where })
            ]);

            return { news, total };
        } catch (error) {
            console.error('Haber listeleme hatası:', error);
            throw error;
        }
    }

    /**
     * Kategoriye göre haberleri getir
     */
    async getNewsByCategory(categoryId: string, limit = 5): Promise<NewsWithRelations[]> {
        try {
            return await prisma.news.findMany({
                where: {
                    categories: {
                        some: {
                            id: categoryId
                        }
                    },
                    isPublished: true
                },
                include: {
                    author: true,
                    categories: true
                },
                orderBy: {
                    publishedAt: 'desc'
                },
                take: limit
            }) as NewsWithRelations[];
        } catch (error) {
            console.error('Kategori haberlerini getirme hatası:', error);
            throw error;
        }
    }

    /**
     * En çok okunan haberleri getir
     */
    async getMostViewedNews(limit = 5): Promise<NewsWithRelations[]> {
        try {
            return await prisma.news.findMany({
                where: {
                    isPublished: true
                },
                include: {
                    author: true,
                    categories: true
                },
                orderBy: {
                    viewCount: 'desc'
                },
                take: limit
            }) as NewsWithRelations[];
        } catch (error) {
            console.error('En çok okunan haberleri getirme hatası:', error);
            throw error;
        }
    }
} 