/* ============================================================
   PRIMO EURO — accesso e sincronizzazione del piano
   - Link magico via email (niente password) e Google, con Supabase
   - Il piano (localStorage) viene salvato nei metadata dell'utente
     e ritrovato su qualsiasi dispositivo dopo l'accesso
   - Senza configurazione (js/config.js) il sito resta usabile:
     tutto è salvato sul dispositivo
   ============================================================ */

(function () {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const STORAGE = "primo-state-v1";
  const configured = AUTH_CONFIG.supabaseUrl && AUTH_CONFIG.supabaseAnonKey;

  const modal = $("#authModal");
  const btnAuth = $("#btnAuth");
  const form = $("#authForm");
  const emailInput = $("#authEmail");
  const msg = $("#authMsg");
  const userBox = $("#authUser");

  let sb = null;
  let currentUser = null;

  /* ---------- UI ---------- */

  btnAuth.addEventListener("click", () => { modal.hidden = false; emailInput.focus(); });
  $("#authClose").addEventListener("click", () => (modal.hidden = true));
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.hidden = true; });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") modal.hidden = true; });

  function say(text, ok) {
    msg.hidden = false;
    msg.innerHTML = text;
    msg.classList.toggle("ok", !!ok);
  }

  function renderUser() {
    if (currentUser) {
      btnAuth.textContent = "👤 " + (currentUser.email || "account").split("@")[0];
      userBox.hidden = false;
      $("#authUserEmail").textContent = currentUser.email;
      form.hidden = true;
      $("#authAlt").hidden = true;
    } else {
      btnAuth.textContent = "Accedi";
      userBox.hidden = true;
      form.hidden = false;
      $("#authAlt").hidden = false;
    }
  }

  /* ---------- senza backend: spiegazione onesta ---------- */

  if (!configured) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      say("🔌 L'invio delle email non è ancora attivo su questa copia del sito: va collegato il servizio gratuito indicato nel README (10 minuti). <b>Tranquillo: il tuo piano è già salvato su questo dispositivo</b> e lo ritrovi a ogni visita.");
    });
    $("#authGoogle").addEventListener("click", () => {
      say("🔌 Anche l'accesso con Google si attiva collegando il servizio nel README. Il piano intanto resta salvato qui sul dispositivo.");
    });
    return;
  }

  /* ---------- con Supabase ---------- */

  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
  script.onload = init;
  document.head.appendChild(script);

  async function init() {
    sb = window.supabase.createClient(AUTH_CONFIG.supabaseUrl, AUTH_CONFIG.supabaseAnonKey);

    const { data: { session } } = await sb.auth.getSession();
    if (session) onLogin(session.user, false);

    sb.auth.onAuthStateChange((event, session2) => {
      if (event === "SIGNED_IN" && session2) onLogin(session2.user, true);
      if (event === "SIGNED_OUT") { currentUser = null; renderUser(); }
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      if (!email.includes("@")) { say("Scrivi una email vera 🙂"); return; }
      say("Invio in corso…");
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: location.origin + location.pathname },
      });
      if (error) say("Ops: " + error.message);
      else say(`✉️ Fatto! Controlla <b>${email}</b>: c'è un link che vale come chiave. Aprilo da questo dispositivo o da un altro, e ritrovi il tuo piano.`, true);
    });

    $("#authGoogle").addEventListener("click", async () => {
      const { error } = await sb.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: location.origin + location.pathname },
      });
      if (error) say("Ops: " + error.message);
    });

    $("#authLogout").addEventListener("click", async () => {
      await sb.auth.signOut();
      say("Sei uscito. Il piano resta salvato su questo dispositivo.", true);
    });
  }

  function onLogin(user, fresh) {
    currentUser = user;
    renderUser();

    /* sincronizza: il piano remoto vince se qui non c'è nulla,
       altrimenti il locale viene spinto sull'account */
    const local = localStorage.getItem(STORAGE);
    const remote = user.user_metadata && user.user_metadata.primoPlan;
    if (!local && remote) {
      localStorage.setItem(STORAGE, remote);
      location.reload();
    } else if (local) {
      pushPlan();
    }
    if (fresh) say("✅ Sei dentro! Da ora il piano ti segue su ogni dispositivo.", true);
  }

  let pushTimer = null;
  function pushPlan() {
    if (!sb || !currentUser) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(async () => {
      const local = localStorage.getItem(STORAGE);
      if (local) await sb.auth.updateUser({ data: { primoPlan: local } });
    }, 1500);
  }

  /* ogni salvataggio locale viene replicato sull'account */
  window.addEventListener("primo:save", pushPlan);
})();
