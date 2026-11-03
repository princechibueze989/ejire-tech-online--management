(() => {
  const config = window.EJIRE_SUPABASE_CONFIG || {
    url: "https://dlpjukqduaueyjwuffjm.supabase.co",
    anonKey: "sb_publishable_QW09x8qhh1xX8BDmk-yUQg_zNC7UX7n"
  };

  if (!window.supabase?.createClient) {
    console.error("Supabase JS did not load.");
    return;
  }

  if (!config.url || !config.anonKey) {
    console.error("Configure the existing Supabase URL and anon key in supabase-client.js.");
    return;
  }

  window.ejireSupabase = window.supabase.createClient(config.url, config.anonKey);
})();