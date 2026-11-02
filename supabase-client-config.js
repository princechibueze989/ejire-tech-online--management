window.EJIRE_SUPABASE_CONFIG = {
  url: "",
  anonKey: "",
};

window.EJIRE_SUPABASE_CLIENT = null;

if (
  window.supabase?.createClient &&
  window.EJIRE_SUPABASE_CONFIG.url &&
  window.EJIRE_SUPABASE_CONFIG.anonKey
) {
  window.EJIRE_SUPABASE_CLIENT = window.supabase.createClient(
    window.EJIRE_SUPABASE_CONFIG.url,
    window.EJIRE_SUPABASE_CONFIG.anonKey,
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
  );
}
