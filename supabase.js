
import { createClient } from
'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Адрес проекта Supabase
const SUPABASE_URL = 'https://yurvoufuhijqupqbuqfi.supabase.co';

// Публичный ключ Supabase
const SUPABASE_ANON_KEY = 'sb_publishable_jaGw_bk-12fZ2Emy3d91dQ_q2Wk-07w';

// Создание подключения
export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);
