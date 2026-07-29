/* ============================================================
   PRIMO EURO — configurazione servizi esterni
   L'accesso (link magico via email + Google) usa Supabase:
   1. crea un progetto gratuito su https://supabase.com
   2. copia qui URL e anon key (Settings → API)
   3. per Google: abilita il provider in Authentication → Providers
   Finché questi campi sono vuoti il sito funziona lo stesso:
   il piano resta salvato sul dispositivo (localStorage).
   ============================================================ */

const AUTH_CONFIG = {
  supabaseUrl: "",      // es. "https://xxxx.supabase.co"
  supabaseAnonKey: "",  // la "anon public" key
};
