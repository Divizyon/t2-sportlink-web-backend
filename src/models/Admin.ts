export interface Admin {
  id: bigint;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  profile_picture: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Admin profil güncellemesi için kullanılacak DTO
 * role alanı olmadığına dikkat edin, admin kendi rolünü değiştiremez
 */
export interface UpdateAdminProfileDTO {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  profile_picture?: string;
} 