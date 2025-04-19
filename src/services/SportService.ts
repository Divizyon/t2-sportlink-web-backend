import { PrismaClient } from '@prisma/client';
import { Sport, CreateSportDTO, UpdateSportDTO } from '../models/Sport';

// Prisma istemcisi oluştur
const prisma = new PrismaClient();

export class SportService {
    /**
     * Create a new sport
     */
    async createSport(data: CreateSportDTO) {
        try {
            console.log('Creating sport with data:', JSON.stringify(data, null, 2));
            
            // Set timestamps
            const now = new Date();

            // Prisma ile spor türü oluştur
            const sport = await prisma.sports.create({
                data: {
                    name: data.name,
                    description: data.description,
                    icon: data.icon
                }
            });

            console.log('Sport created successfully:', JSON.stringify(sport, null, 2));

            // BigInt'leri string'e dönüştür
            const formattedSport = {
                ...sport,
                id: sport.id.toString()
            };

            return { data: formattedSport, error: null };
        } catch (error: any) {
            console.error('Error in createSport service:', error);
            return { error: error.message || 'Failed to create sport', data: null };
        }
    }

    /**
     * Get all sports
     */
    async getAllSports() {
        try {
            // Tüm spor türlerini getir
            const sports = await prisma.sports.findMany();

            // BigInt'leri string'e dönüştür
            const formattedSports = sports.map((sport: any) => ({
                ...sport,
                id: sport.id.toString()
            }));

            return { data: formattedSports, error: null };
        } catch (error: any) {
            console.error('Error in getAllSports service:', error);
            return { error: error.message || 'Failed to get sports', data: null };
        }
    }

    /**
     * Get sport by ID
     */
    async getSportById(id: string) {
        try {
            // ID'ye göre spor türünü getir
            const sport = await prisma.sports.findUnique({
                where: {
                    id: BigInt(id)
                }
            });

            if (!sport) {
                return { error: 'Sport not found', data: null };
            }

            // BigInt'leri string'e dönüştür
            const formattedSport = {
                ...sport,
                id: sport.id.toString()
            };

            return { data: formattedSport, error: null };
        } catch (error: any) {
            console.error('Error in getSportById service:', error);
            return { error: error.message || 'Failed to get sport', data: null };
        }
    }

    /**
     * Update sport
     */
    async updateSport(id: string, data: UpdateSportDTO) {
        try {
            // ID'ye göre spor türünü güncelle
            const sport = await prisma.sports.update({
                where: {
                    id: BigInt(id)
                },
                data
            });

            // BigInt'leri string'e dönüştür
            const formattedSport = {
                ...sport,
                id: sport.id.toString()
            };

            return { data: formattedSport, error: null };
        } catch (error: any) {
            console.error('Error in updateSport service:', error);
            return { error: error.message || 'Failed to update sport', data: null };
        }
    }

    /**
     * Delete sport
     */
    async deleteSport(id: string) {
        try {
            // Önce bu spora bağlı etkinlikleri kontrol et
            const relatedEvents = await prisma.events.findMany({
                where: {
                    sport_id: BigInt(id)
                }
            });

            if (relatedEvents.length > 0) {
                return { 
                    success: false, 
                    error: 'Cannot delete sport that has related events' 
                };
            }

            // ID'ye göre spor türünü sil
            await prisma.sports.delete({
                where: {
                    id: BigInt(id)
                }
            });

            return { success: true, error: null };
        } catch (error: any) {
            console.error('Error in deleteSport service:', error);
            return { success: false, error: error.message || 'Failed to delete sport' };
        }
    }
} 