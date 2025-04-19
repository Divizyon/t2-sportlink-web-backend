import { User } from '../models/User';

export interface RegisterDTO {
    email: string;
    password: string;
    username: string;
    first_name: string;
    last_name: string;
    phone: string;
    profile_picture?: string;
    default_location_latitude: number;
    default_location_longitude: number;
    role?: 'admin' | 'user' | 'coach';
    name?: string;
}

export interface LoginDTO {
    email?: string;
    password: string;
    username?: string;
}

export interface AuthResponse {
    user: Partial<User>;
    token: string;
    message: string;
    error?: string;
    session?: any;
}

export interface ResetPasswordDTO {
    email: string;
} 