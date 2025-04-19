// Frontend Login Sorunu Çözümü - t2-sportlink-web-frontend
import axios from 'axios';

// Önceki API yapılandırmasını içe aktarın (frontend-axios-fix.js dosyasından)
import api from './frontend-axios-fix';

/**
 * Geliştirilmiş admin giriş fonksiyonu - superadmin için çift giriş sorununu çözer
 * 
 * @param {Object} credentials - Kullanıcı giriş bilgileri
 * @param {string} credentials.username - Kullanıcı adı
 * @param {string} credentials.password - Şifre
 * @returns {Promise<Object>} Giriş sonucu
 */
export const enhancedLoginAdmin = async (credentials) => {
    try {
        // İlk giriş denemesi
        const response = await api.post('/api/admin/login', credentials);

        // Token ve kullanıcı rolünü kaydet
        if (response.data.success && response.data.token) {
            localStorage.setItem('token', response.data.token);

            // Kullanıcı rolünü token içinden çıkart ve kaydet
            if (response.data.admin && response.data.admin.role) {
                const userRole = response.data.admin.role;
                localStorage.setItem('userRole', userRole);

                // Eğer superadmin ise, oturum durumunu "verified" olarak işaretle
                // Bu sayede superadmin ikinci giriş ekranını görmeyecek
                if (userRole === 'superadmin') {
                    localStorage.setItem('sessionState', 'verified');
                }
            }

            // İlk girişte session durumunu "initial" olarak tanımla
            if (!localStorage.getItem('sessionState')) {
                localStorage.setItem('sessionState', 'initial');
            }
        }

        return response.data;
    } catch (error) {
        console.error('Giriş yapılırken hata:', error);
        throw error;
    }
};

/**
 * Oturum durumunu kontrol eder
 * 
 * @returns {Object} Oturum durumu
 */
export const checkSessionState = () => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const sessionState = localStorage.getItem('sessionState') || 'initial';

    return {
        isLoggedIn: !!token,
        userRole: userRole,
        sessionState: sessionState,
        isSuperAdmin: userRole === 'superadmin',
        requiresSecondAuth: userRole === 'superadmin' && sessionState === 'initial'
    };
};

/**
 * İkinci doğrulama aşamasını tamamlar
 * 
 * @param {Object} credentials - Kullanıcı giriş bilgileri (ikinci kontrol için)
 * @returns {Promise<Object>} Doğrulama sonucu
 */
export const completeSecondAuth = async (credentials) => {
    try {
        // Önceki kimlik bilgileriyle karşılaştırmak için yeniden giriş yap
        const response = await api.post('/api/admin/login', credentials);

        if (response.data.success) {
            // İkinci doğrulama başarılı, oturum durumunu "verified" olarak güncelle
            localStorage.setItem('sessionState', 'verified');

            return {
                success: true,
                message: 'İkinci doğrulama başarılı'
            };
        }

        return response.data;
    } catch (error) {
        console.error('İkinci doğrulama hatası:', error);
        throw error;
    }
};

/**
 * Uygulama başlatıldığında oturum durumunu sıfırlar
 * Sayfa yenilendiğinde çalıştırılmalıdır
 */
export const resetSessionStateOnReload = () => {
    const userRole = localStorage.getItem('userRole');

    // Sayfa yenilendiğinde, superadmin için ve oturum "verified" değilse
    // oturum durumunu sıfırla (bu ikinci giriş ekranını engeller)
    if (userRole === 'superadmin' && localStorage.getItem('sessionState') !== 'verified') {
        localStorage.setItem('sessionState', 'verified');
    }
};

// Uygulamanın başlangıcında bu fonksiyonu çağırın
resetSessionStateOnReload(); 