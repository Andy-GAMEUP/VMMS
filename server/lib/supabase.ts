import { createClient } from '@supabase/supabase-js';

console.log('[BOOT] ENV keys available:', Object.keys(process.env).filter(k => k.startsWith('SUPA') || k.startsWith('JWT') || k.startsWith('XZY') || k === 'PORT' || k === 'NODE_ENV').join(', '));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[FATAL] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  console.error('[DEBUG] SUPABASE_URL exists:', !!supabaseUrl, '| SUPABASE_SERVICE_KEY exists:', !!supabaseKey);
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey);
