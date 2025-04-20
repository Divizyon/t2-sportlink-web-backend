export type UserRole = 'user' | 'admin' | 'superadmin';

export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone: string;
  profile_picture?: string;
  default_location_latitude: number;
  default_location_longitude: number;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
} 