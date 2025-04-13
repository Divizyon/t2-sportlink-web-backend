import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase URL or API Key');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Service role client for admin operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey || ''); 