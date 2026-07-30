/* PRIMO EURO® — il sito, senza dipendenze.
   Il prototipo di partenza usava GSAP, ScrollTrigger, Three.js e Lenis presi
   da CDN esterni: quattro librerie per fare rivelazioni allo scroll, contatori
   e aloni. Qui la stessa cosa la fanno IntersectionObserver e le transizioni
   CSS, in poche righe e senza chiedere niente a nessun server. */

(() => {
  "use strict";

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.prototype.slice.call(r.querySelectorAll(s));
  const ridotto = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- le frasi dei maestri ----------
     una sola fonte per la banda che scorre e per le due giostre */

  const PRINCIPI = [
    ["1€ al mese", "è meglio di 0€"],
    ["regola 70/30", "Jim Rohn"],
    ["regola 50/30/20", "Elizabeth Warren"],
    ["paga prima te stesso", "George Clason"],
    ["fondo emergenza", "Dave Ramsey"],
    ["spesa consapevole", "Ramit Sethi"],
    ["le abitudini battono la matematica", "Morgan Housel"],
    ["semplice > complicato", "John Bogle"],
  ];

  const MAESTRI = [
    ["Non mettere da parte ciò che avanza dopo aver speso: spendi ciò che avanza dopo aver risparmiato.", "Warren Buffett"],
    ["Ogni acquisto costa ore della tua vita. Chiediti: le vale davvero?", "Vicki Robin"],
    ["Taglia senza pietà quello che non ami. Spendi senza sensi di colpa in quello che ami.", "Ramit Sethi"],
    ["Andare bene coi soldi c'entra poco con l'intelligenza e molto con le abitudini.", "Morgan Housel"],
    ["Quanto metti da parte conta più di quanto guadagni. Anche l'1% è un inizio.", "JL Collins"],
  ];

  const MAESTRI_2 = [
    ["Una parte di tutto ciò che guadagni è tua: mettila via prima di toccare il resto.", "George Clason"],
    ["Automatico, a basso costo, noioso: è così che si costruisce un patrimonio.", "John Bogle"],
    ["Prima di tutto un cuscino: parti da poco, punta a 3 mesi di spese.", "Dave Ramsey"],
    ["Metà per i bisogni, un terzo per i desideri, il resto per il te del futuro.", "Elizabeth Warren"],
    ["Non lavorare solo per i soldi: col tempo, insegna ai soldi a lavorare per te.", "Robert Kiyosaki"],
  ];

  const scappa = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  /* la banda: il testo va duplicato, perché l'animazione trasla del 50% e
     il secondo giro deve trovare già pronto l'inizio del primo */
  function riempiBanda() {
    const banda = $("#banda");
    if (!banda) return;
    const uno = PRINCIPI
      .map(([a, b]) => `<b>${scappa(a)}</b> · ${scappa(b)}`)
      .join('<span class="stella" aria-hidden="true">✦</span>');
    banda.innerHTML = `<div class="giro">${uno}<span class="stella" aria-hidden="true">✦</span>${uno}<span class="stella" aria-hidden="true">✦</span></div>`;
  }

  function riempiGiostre() {
    const dove = $("#giostre");
    if (!dove) return;
    const mazzo = (elenco) => `<div class="mazzo">` + elenco.map(([t, a]) =>
      `<div class="scheda"><blockquote class="citazione">${scappa(t)}<b>${scappa(a)}</b></blockquote></div>`
    ).join("") + `</div>`;
    /* ogni giostra porta il suo mazzo due volte: il secondo è decorativo */
    dove.innerHTML =
      `<div class="giostra avanti">${mazzo(MAESTRI)}${mazzo(MAESTRI).replace('<div class="mazzo">', '<div class="mazzo" aria-hidden="true">')}</div>` +
      `<div class="giostra indietro">${mazzo(MAESTRI_2)}${mazzo(MAESTRI_2).replace('<div class="mazzo">', '<div class="mazzo" aria-hidden="true">')}</div>`;
  }

  /* ---------- le rivelazioni allo scroll ----------
     una classe che arriva quando l'elemento entra in scena. Se il browser
     non ha IntersectionObserver, tutto resta visibile: il contenuto non
     dipende mai da un'animazione per esistere. */

  function rivelazioni() {
    const cose = $$(".appare");
    if (ridotto || !("IntersectionObserver" in window)) {
      cose.forEach((el) => el.classList.add("dentro-vista"));
      return;
    }
    const oss = new IntersectionObserver((voci) => {
      voci.forEach((v) => {
        if (!v.isIntersecting) return;
        v.target.classList.add("dentro-vista");
        oss.unobserve(v.target);
      });
    }, { rootMargin: "0px 0px -12% 0px" });

    /* Quello che è già in scena al caricamento si mostra subito: il margine
       negativo qui sopra serve a far entrare le cose un attimo dopo che le
       hai raggiunte scorrendo, ma nella prima schermata taglierebbe fuori
       proprio i bottoni — e un bottone invisibile è un sito rotto. */
    cose.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) el.classList.add("dentro-vista");
      else oss.observe(el);
    });
  }

  /* le barre dei mesi si riempiono quando le guardi */
  function barre() {
    const tutte = $$("[data-barra-quota]");
    const riempi = (el) => {
      const q = parseFloat(el.getAttribute("data-barra-quota")) || 0;
      const dentro = $(".riempi", el);
      if (dentro) dentro.style.width = q + "%";
    };
    if (ridotto || !("IntersectionObserver" in window)) { tutte.forEach(riempi); return; }
    const oss = new IntersectionObserver((voci) => {
      voci.forEach((v) => { if (v.isIntersecting) { riempi(v.target); oss.unobserve(v.target); } });
    }, { threshold: .3 });
    tutte.forEach((el) => oss.observe(el));
  }

  /* ---------- la classifica dei paesi ----------
     le barre crescono e i numeri salgono, una riga alla volta */

  function conta(el, fino, durata) {
    if (ridotto) { el.textContent = fino; return; }
    const inizio = performance.now();
    const passo = (ora) => {
      const t = Math.min(1, (ora - inizio) / durata);
      /* la stessa curva del design system: parte veloce, arriva piano */
      const e = 1 - Math.pow(1 - t, 4);
      el.textContent = Math.round(fino * e);
      if (t < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  }

  function classifica() {
    const righe = $$(".paese");
    const accendi = (riga) => {
      const quota = parseFloat(riga.getAttribute("data-quota")) || 0;
      const cifra = parseFloat(riga.getAttribute("data-cifra")) || 0;
      const barra = $(".pista i", riga);
      const num = $(".conta", riga);
      if (barra) barra.style.width = quota + "%";
      if (num) conta(num, cifra, 1400);
    };
    if (ridotto || !("IntersectionObserver" in window)) { righe.forEach(accendi); return; }
    righe.forEach((r) => { const n = $(".conta", r); if (n) n.textContent = "0"; });
    const oss = new IntersectionObserver((voci) => {
      voci.forEach((v) => { if (v.isIntersecting) { accendi(v.target); oss.unobserve(v.target); } });
    }, { threshold: .6 });
    righe.forEach((r) => oss.observe(r));
  }

  /* ---------- la riga del sogno ----------
     un dizionario piccolo, per far capire il gesto: il vero dizionario
     (181 sogni) sta nell'app, in app/js/sogni.js */

  const SOGNI = [
    { k: ["tokyo", "giappone", "asia"], emoji: "🗾", costo: 2600 },
    { k: ["vespa", "scooter", "moto"], emoji: "🛵", costo: 3200 },
    { k: ["chiosco", "spiaggia", "bar", "locale"], emoji: "🏖️", costo: 14000 },
    { k: ["sabbatico", "anno", "mondo"], emoji: "🌍", costo: 11000 },
    { k: ["patente", "guida", "auto", "macchina"], emoji: "🚗", costo: 1100 },
    { k: ["studio", "atelier", "laboratorio", "arte"], emoji: "🎨", costo: 4800 },
    { k: ["casa", "affitto", "caparra", "trasloco"], emoji: "🏠", costo: 5400 },
    { k: ["cuscino", "emergenza", "fondo"], emoji: "🌱", costo: 4200 },
    { k: ["chitarra", "strumento", "musica", "corso"], emoji: "🎸", costo: 900 },
  ];
  const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
                "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];

  function trova(testo) {
    const t = (testo || "").toLowerCase().trim();
    if (!t) return null;
    for (const s of SOGNI) {
      for (const k of s.k) if (t.indexOf(k) >= 0) return { emoji: s.emoji, nome: t, costo: s.costo, noto: true };
    }
    /* nessun sogno viene rifiutato: se non lo conosco, stimo e lo dico */
    return { emoji: "✨", nome: t, costo: Math.max(600, Math.min(20000, 900 + t.length * 180)), noto: false };
  }

  function rigaSogno() {
    const input = $("#sognoInput");
    if (!input) return;
    const gio = $("#sognoGiorni"), nome = $("#sognoNome"), emo = $("#sognoEmoji");
    const mese = $("#sognoMese"), data = $("#sognoData"), nota = $("#sognoNota");
    let correnti = 362;

    const aggiorna = (testo) => {
      const s = trova(testo);
      if (!s) return;
      const mensile = 225;
      const giorni = Math.max(7, Math.round(Math.max(1, s.costo / mensile) * 30.44));

      if (nome) nome.textContent = s.nome;
      if (emo) emo.textContent = s.emoji;
      if (mese) mese.textContent = mensile + " €";
      if (data) {
        const d = new Date();
        d.setDate(d.getDate() + giorni);
        data.textContent = MESI[d.getMonth()] + " " + d.getFullYear();
      }
      if (nota) {
        nota.textContent = s.noto
          ? "Ho messo delle stime per partire, ma sono mie, non tue: ogni cifra resta correggibile a mano."
          : "Questo non è ancora nel dizionario — ma non si rifiuta nessun sogno. La cifra è una mia stima: correggila tu.";
      }
      if (gio) {
        if (ridotto) { gio.textContent = giorni; correnti = giorni; return; }
        const da = correnti, verso = giorni, inizio = performance.now();
        correnti = giorni;
        const passo = (ora) => {
          const t = Math.min(1, (ora - inizio) / 900);
          const e = 1 - Math.pow(1 - t, 4);
          gio.textContent = Math.round(da + (verso - da) * e);
          if (t < 1 && correnti === verso) requestAnimationFrame(passo);
        };
        requestAnimationFrame(passo);
      }
    };

    input.addEventListener("input", (e) => aggiorna(e.target.value));
    $$("[data-esempio]").forEach((b) => {
      b.addEventListener("click", () => {
        input.value = b.getAttribute("data-esempio");
        aggiorna(input.value);
      });
    });
  }

  /* ---------- il binario delle schermate ----------
     Il nastro resta nativo: il dito (o la rotella) comanda, qui si ascolta
     soltanto. Dall'ascolto nascono le due parallassi: quella orizzontale
     mentre sfogli — la schermata al centro piena e a fuoco, le vicine più
     piccole, in ombra e un filo in ritardo — e quella verticale mentre la
     pagina scorre, coi telefoni pari e dispari sfalsati di qualche pixel. */

  function binario() {
    const sez = $(".inmano"), nastro = $("#binario");
    if (!sez || !nastro) return;
    const punti = $$("#tappePunti i");
    const tappe = $$(".tappa", nastro);

    const aggiornaPunti = () => {
      if (!punti.length) return;
      const centro = nastro.scrollLeft + nastro.clientWidth / 2;
      let vicina = 0, minimo = Infinity;
      tappe.forEach((t, i) => {
        const m = Math.abs(t.offsetLeft + t.offsetWidth / 2 - centro);
        if (m < minimo) { minimo = m; vicina = i; }
      });
      punti.forEach((pt, i) => pt.classList.toggle("qui", i === vicina));
    };

    let prenotato = false;
    const pennello = () => {
      prenotato = false;
      if (ridotto) return;
      const r = sez.getBoundingClientRect();
      const fuori = r.bottom < 0 || r.top > innerHeight;
      const pv = fuori ? 0 : (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      const sfogliabile = nastro.scrollWidth > nastro.clientWidth + 4;
      const centro = nastro.scrollLeft + nastro.clientWidth / 2;
      tappe.forEach((t, i) => {
        const tel = $(".mini-telefono", t);
        if (!tel) return;
        let x = 0, scala = 1, velo = 1;
        if (sfogliabile) {
          const d = (t.offsetLeft + t.offsetWidth / 2 - centro) / nastro.clientWidth;
          const vicino = Math.max(0, 1 - Math.abs(d) * 1.5);
          x = -d * 16;
          scala = 0.94 + 0.06 * vicino;
          velo = 0.6 + 0.4 * vicino;
        }
        const y = pv * (i % 2 ? 26 : -18);
        tel.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) scale(" + scala.toFixed(3) + ")";
        tel.style.opacity = velo.toFixed(2);
      });
    };
    const chiedi = () => { if (!prenotato) { prenotato = true; requestAnimationFrame(pennello); } };

    nastro.addEventListener("scroll", () => { chiedi(); aggiornaPunti(); }, { passive: true });
    addEventListener("scroll", chiedi, { passive: true });
    addEventListener("resize", () => { chiedi(); aggiornaPunti(); });
    chiedi(); aggiornaPunti();
  }

  /* ---------- il puntatore che si allarga ---------- */

  function puntatore() {
    const c = $("#puntatore");
    if (!c || !matchMedia("(hover: hover)").matches) return;
    let x = 0, y = 0, cx = 0, cy = 0, visibile = false, girando = false;

    const gira = () => {
      cx += (x - cx) * .18;
      cy += (y - cy) * .18;
      c.style.transform = `translate(${cx}px, ${cy}px)`;
      if (Math.abs(x - cx) > .1 || Math.abs(y - cy) > .1) requestAnimationFrame(gira);
      else girando = false;
    };

    addEventListener("pointermove", (e) => {
      x = e.clientX; y = e.clientY;
      if (!visibile) { visibile = true; c.style.opacity = "1"; cx = x; cy = y; }
      if (!girando) { girando = true; requestAnimationFrame(gira); }
      const t = e.target;
      c.classList.toggle("sopra", !!(t && t.closest && t.closest("a,button,input")));
    }, { passive: true });
  }

  /* ---------- il video dell'attacco ----------
     su iOS l'autoplay parte solo se il video è muto e "playsinline": lo
     ripetiamo da codice perché alcuni browser ignorano gli attributi */

  function video() {
    const v = $("#videoClessidra");
    if (!v) return;
    v.muted = true; v.loop = true; v.playsInline = true;
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
  }

  /* ---------- avvio ---------- */

  riempiBanda();
  riempiGiostre();
  rivelazioni();
  barre();
  classifica();
  rigaSogno();
  binario();
  puntatore();
  video();
})();
