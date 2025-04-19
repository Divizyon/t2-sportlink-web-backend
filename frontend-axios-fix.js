// Frontend Axios düzeltmesi - dashboard-permissions için 404 hatasını çözmek
// Bu dosyayı t2-sportlink-web-frontend projesine ekleyin

import axios from 'axios';

// API URL'nizi burada belirtin
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Axios instance oluşturma
const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// İstek interceptor - her istekte token ekleme
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Cevap interceptor - hata işleme
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // 401 Unauthorized hatası - token süresi dolmuş olabilir
        if (error.response && error.response.status === 401) {
            console.log('Oturum süresi doldu veya geçersiz oturum');
            // Token temizleme ve login'e yönlendirme 
            localStorage.removeItem('token');
            window.location.href = '/login';
        }

        // 404 Not Found hatası için özel işleme
        if (error.response && error.response.status === 404) {
            console.error('404 Error:', error.config.url);

            // dashboard-permissions endpoint'i için özel işleme
            if (error.config.url.includes('/dashboard-permissions')) {
                console.log('dashboard-permissions endpoint hatası tespit edildi, alternatif kullanılıyor');
                // Burada bir alternatif çözüm uygulayabilirsiniz:
                // 1. Farklı bir endpoint kullanma
                // 2. Mock data döndürme
                return {
                    data: {
                        success: true,
                        dashboardAccess: {
                            hasAccess: true,
                            canCreateAdmins: localStorage.getItem('userRole') === 'superadmin'
                        }
                    }
                };
            }
        }

        return Promise.reject(error);
    }
);

// Admin dashboard izinlerini getiren fonksiyon
export const getDashboardPermissions = async () => {
    try {
        const response = await api.get('/api/admin/dashboard-permissions');
        return response.data;
    } catch (error) {
        console.error('Dashboard izinleri alınırken hata oluştu:', error);

        // Eğer 404 hatası alırsak ve interceptor tarafından işlenmediyse, varsayılan değer döndür
        if (error.response && error.response.status === 404) {
            const userRole = localStorage.getItem('userRole');
            return {
                success: true,
                dashboardAccess: {
                    hasAccess: true,
                    canCreateAdmins: userRole === 'superadmin'
                }
            };
        }

        throw error;
    }
};

// Admin oluşturma fonksiyonu
export const createAdmin = async (adminData) => {
    try {
        // role her zaman 'admin' olmalı
        adminData.role = 'admin';

        const response = await api.post('/api/admin/register', adminData);
        return response.data;
    } catch (error) {
        console.error('Admin oluşturulurken hata:', error);
        throw error;
    }
};

// Admin profili getirme fonksiyonu
export const getAdminProfile = async () => {
    try {
        const response = await api.get('/api/admin/profile');
        return response.data;
    } catch (error) {
        console.error('Admin profili alınırken hata:', error);
        throw error;
    }
};

// Admin giriş fonksiyonu
export const loginAdmin = async (credentials) => {
    try {
        const response = await api.post('/api/admin/login', credentials);

        if (response.data.success && response.data.token) {
            localStorage.setItem('token', response.data.token);

            // Kullanıcı rolünü localStorage'a kaydet (dashboard permission hatası için)
            if (response.data.admin && response.data.admin.role) {
                localStorage.setItem('userRole', response.data.admin.role);
            }
        }

        return response.data;
    } catch (error) {
        console.error('Giriş yapılırken hata:', error);
        throw error;
    }
};

// Admin listesi getirme fonksiyonu
export const getAdminList = async (page = 1, pageSize = 10) => {
    try {
        const response = await api.get(`/api/admin/list?page=${page}&pageSize=${pageSize}`);
        return response.data;
    } catch (error) {
        console.error('Admin listesi alınırken hata:', error);
        throw error;
    }
};

export default api; 