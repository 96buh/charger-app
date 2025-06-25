// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// ⚠️ 替換成你自己 Supabase 的 URL 和 anon 公鑰
const supabaseUrl = 'https://qgvlgguqbzlavodkhqur.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFndmxnZ3VxYnpsYXZvZGtocXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NTI4OTIsImV4cCI6MjA2NTAyODg5Mn0.FdJJ7y6IIzwVsSSd_I_zLtOsV5WPTlRebG5dRPRK5Ro';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
