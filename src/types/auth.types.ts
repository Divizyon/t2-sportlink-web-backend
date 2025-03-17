export interface RegisterDTO {
    email: string;
    password: string;
    name?: string;
}

export interface LoginDTO {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: any;
    session: any;
    error?: string;
}

export interface ResetPasswordDTO {
    email: string;
} 