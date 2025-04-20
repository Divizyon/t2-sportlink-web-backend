import prisma from '../config/prisma';
import { CreateUserDTO, UpdateUserDTO } from '../models/User';
import bcrypt from 'bcrypt';

export const findUserById = async (id: bigint) => {
  return prisma.users.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      first_name: true,
      last_name: true,
      role: true,
      phone: true,
      profile_picture: true,
      default_location_latitude: true,
      default_location_longitude: true,
      created_at: true,
      updated_at: true
    }
  });
};

export const findUserByEmail = async (email: string) => {
  return prisma.users.findFirst({
    where: { email },
    select: {
      id: true,
      username: true,
      email: true,
      first_name: true,
      last_name: true,
      role: true,
      phone: true,
      profile_picture: true,
      default_location_latitude: true,
      default_location_longitude: true,
      created_at: true,
      updated_at: true
    }
  });
};

export const createUser = async (userData: CreateUserDTO) => {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  
  return prisma.users.create({
    data: {
      ...userData,
      password: hashedPassword,
      profile_picture: userData.profile_picture || '',
      role: 'user'
    }
  });
};

export const updateUser = async (id: bigint, userData: UpdateUserDTO) => {
  return prisma.users.update({
    where: { id },
    data: userData
  });
};

export const deleteUser = async (id: bigint) => {
  return prisma.users.delete({
    where: { id }
  });
};

export const getAllUsers = async (skip = 0, take = 10) => {
  // Tüm kullanıcıları getir ve katıldıkları/oluşturdukları etkinlikleri include et
  const users = await prisma.users.findMany({
    skip,
    take,
    select: {
      id: true,
      username: true,
      email: true,
      first_name: true,
      last_name: true,
      role: true,
      profile_picture: true,
      phone: true,
      default_location_latitude: true,
      default_location_longitude: true,
      created_at: true,
      updated_at: true,
      // İlişkiler
      createdEvents: {
        select: {
          id: true,
          title: true,
          description: true,
          event_date: true,
          location_name: true,
          status: true,
          sport: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      eventParticipants: {
        select: {
          event: {
            select: {
              id: true,
              title: true,
              description: true,
              event_date: true,
              location_name: true,
              status: true,
              sport: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          role: true,
          joined_at: true
        }
      }
    }
  });

  // BigInt ID'leri string'e çevir ve ilişkileri formatlı hale getir
  return users.map(user => {
    const formattedUser = {
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      profile_picture: user.profile_picture,
      phone: user.phone,
      default_location_latitude: user.default_location_latitude,
      default_location_longitude: user.default_location_longitude,
      created_at: user.created_at,
      updated_at: user.updated_at,
      
      // Kullanıcının oluşturduğu etkinlikler
      created_events: user.createdEvents.map(event => ({
        id: event.id.toString(),
        title: event.title,
        description: event.description,
        event_date: event.event_date,
        location_name: event.location_name,
        status: event.status,
        sport: {
          id: event.sport.id.toString(),
          name: event.sport.name
        }
      })),
      
      // Kullanıcının katıldığı etkinlikler
      participated_events: user.eventParticipants.map(participation => ({
        role: participation.role,
        joined_at: participation.joined_at,
        event: {
          id: participation.event.id.toString(),
          title: participation.event.title,
          description: participation.event.description,
          event_date: participation.event.event_date,
          location_name: participation.event.location_name,
          status: participation.event.status,
          sport: {
            id: participation.event.sport.id.toString(),
            name: participation.event.sport.name
          }
        }
      }))
    };
    
    return formattedUser;
  });
};

export const countUsers = async () => {
  return prisma.users.count();
}; 