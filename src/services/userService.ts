import prisma from '../config/prisma';
import { CreateUserDTO, UpdateUserDTO } from '../models/User';
import bcrypt from 'bcrypt';

export const findUserById = async (id: bigint) => {
  return prisma.users.findUnique({
    where: { id }
  });
};

export const findUserByEmail = async (email: string) => {
  return prisma.users.findFirst({
    where: { email }
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
  return prisma.users.findMany({
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
      updated_at: true
    }
  });
}; 