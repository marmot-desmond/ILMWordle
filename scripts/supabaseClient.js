import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://yfujkwiqjlverofmqgrr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_HuM5CtDyqJh9O6RCNbKnsw_sUy-5gBS";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);