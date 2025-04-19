import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Ortam değişkenlerini yükle
dotenv.config();

// Supabase anahtarlarını doğrudan değişkenlerden al
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Anahtar değerlerini kontrol amaçlı logla (güvenlik için sadece ilk karakterleri)
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Anahtarı (ilk 10 karakter):', supabaseAnonKey?.substring(0, 10) + '...');
console.log('Supabase Servis Rolü Anahtarı (ilk 10 karakter):', supabaseServiceRoleKey?.substring(0, 10) + '...');

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

    console.log('Supabase istemcisi service_role anahtarı ile oluşturuldu, bağlantı test ediliyor...');

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