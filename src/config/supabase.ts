import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Ortam değişkenlerini yükle
dotenv.config();

// Supabase anahtarlarını doğrudan değişkenlerden al
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('HATA: Supabase URL veya API anahtarları eksik veya yanlış. Lütfen .env dosyasını kontrol edin.');
    process.exit(1);
}

// Değişkenleri SupabaseClient tipi ile tanımla
let supabase: SupabaseClient;
let supabaseAdmin: SupabaseClient;

try {
    // Service_role anahtarı Supabase'in tüm güvenlik kontrollerini atlar ve tam erişim sağlar
    supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);


    // Bağlantıyı test et
    supabase.auth.getSession().then(({ data, error }) => {
        if (error) {
            console.error('Supabase bağlantı hatası:', error.message);
        } else {
            console.log('Supabase bağlantısı başarılı!');
        }
    });
} catch (error: any) {
    console.error('Supabase istemcisi oluşturma hatası:', error.message);
    process.exit(1);
}

export { supabase, supabaseAdmin }; 