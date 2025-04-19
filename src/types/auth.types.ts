export interface RegisterDTO {
    email: string;
    password: string;
    name?: string;
    username?: string;
}

export interface LoginDTO {
    username: string;
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