/* ============================================================
   PRIMO — motore di budget
   Prende { income, cityId, housing, goals } e restituisce un
   piano mensile completo, con regole ispirate ai 10 maestri:
   - 50/30/20 adattiva (Warren)
   - paga prima te stesso, minimo 1€ (Clason / Buffett)
   - fondo emergenza = 3 mesi di spese essenziali (Ramsey)
   ============================================================ */

function round5(v) {
  if (v < 20) return Math.max(0, Math.round(v));
  return Math.round(v / 5) * 5;
}

/* voto sul tenore di vita: quanto pesano le spese essenziali su
   quello che puoi spendere — usato anche live, sui numeri veri */
function gradeFor(ratio, cityName) {
  if (ratio <= 0.45) return { grade: "A", gradeLabel: "Ossigeno pieno", gradeColor: "#d9ff4b", gradeNote: `Le spese essenziali si prendono il ${Math.round(ratio * 100)}% di quello che puoi spendere: hai margine vero. Usalo bene, non lasciarlo evaporare.` };
  if (ratio <= 0.6) return { grade: "B", gradeLabel: "In equilibrio", gradeColor: "#a8e34b", gradeNote: `Il ${Math.round(ratio * 100)}% se ne va in essenziali: sei nella zona sana delle regole dei maestri.` };
  if (ratio <= 0.75) return { grade: "C", gradeLabel: "Tirato ma vivo", gradeColor: "#ffc24b", gradeNote: `Le spese fisse pesano il ${Math.round(ratio * 100)}%. Non è colpa tua: è il costo di ${cityName}. Ogni euro libero va difeso.` };
  if (ratio <= 0.9) return { grade: "D", gradeLabel: "Molto tirato", gradeColor: "#ff9a4b", gradeNote: `Il ${Math.round(ratio * 100)}% se ne va prima ancora di divertirti. Il piano parte piccolo, ma parte.` };
  if (ratio <= 1) return { grade: "E", gradeLabel: "In apnea", gradeColor: "#ff7a59", gradeNote: `Le spese essenziali si mangiano quasi tutto. Ogni euro messo da parte qui vale doppio.` };
  return { grade: "F", gradeLabel: "Sott'acqua", gradeColor: "#ff5c72", gradeNote: `Così le uscite superano le entrate: non sei tu il problema, ma servono mosse di emergenza. Guarda i consigli dopo la conferma.` };
}

/* ---------- l'Europa ----------
   I prezzi italiani sono studiati città per città. Per gli altri paesi
   dell'euro non li inventiamo: partiamo dalla media italiana e la scaliamo
   con l'indice ufficiale Eurostat, che esiste già diviso nelle stesse voci
   che usiamo qui (casa, spesa, trasporti, salute). Tanto ogni cifra la
   conferma comunque l'utente: questo è solo un punto di partenza onesto. */

function scalaPaese(codice, voce) {
  if (!codice || codice === "IT") return 1;
  if (typeof EUROPA === "undefined") return 1;
  const p = EUROPA.prezzi && EUROPA.prezzi[codice];
  return (p && p[voce]) || 1;
}

function mediaItalia() {
  const n = CITIES.length;
  const s = CITIES.reduce((a, c) => ({ r: a.r + c.r, m: a.m + c.m, g: a.g + c.g, t: a.t + c.t }),
                          { r: 0, m: 0, g: 0, t: 0 });
  return { r: s.r / n, m: s.m / n, g: s.g / n, t: s.t / n };
}

/* I posti fra cui scegliere in un paese: le 21 città vere per l'Italia,
   una media nazionale per gli altri. */
function luoghiDelPaese(codice) {
  if (!codice || codice === "IT") return CITIES;
  const base = mediaItalia();
  const casa = scalaPaese(codice, "casa");
  const nome = (typeof EUROPA !== "undefined" && EUROPA.paesi[codice]) || codice;
  return [{
    id: "media-" + codice,
    name: "Media nazionale — " + nome,
    r: Math.round(base.r * casa),
    m: Math.round(base.m * casa),
    g: Math.round(base.g * scalaPaese(codice, "spesa")),
    t: Math.round(base.t * scalaPaese(codice, "trasporti")),
  }];
}

/* Quanto corre l'inflazione dove vivi, in percentuale annua. */
function inflazione(codice) {
  if (typeof EUROPA === "undefined") return 0;
  const i = EUROPA.inflazione && (EUROPA.inflazione[codice] || EUROPA.inflazione.U2);
  return i ? i.valore : 0;
}

function computeBudget(state) {
  const luoghi = luoghiDelPaese(state.country);
  const city = luoghi.find((c) => c.id === state.cityId) || luoghi[0];
  const income = Math.max(0, state.income | 0);
  const housing = state.housing;

  /* partita IVA: il 50% di ogni incasso va da parte per tasse e
     contributi (regola prudente per l'Italia) — il budget vero
     si costruisce su quello che resta */
  const isPiva = state.incomeType === "piva";
  const tasse = isPiva ? Math.round(income * 0.5) : 0;
  const spendibile = income - tasse;

  /* --- costi fissi stimati sulla città --- */
  const vehicle = VEHICLES.find((v) => v.id === state.vehicle) || VEHICLES[0];
  /* anche salute e bollette seguono il paese: lasciarle a cifre italiane
     darebbe a un irlandese un conto per metà sbagliato */
  const kCasa = scalaPaese(state.country, "casa");
  const kSalute = scalaPaese(state.country, "salute");

  let casa = 0, bollette = 0, spesa = city.g, salute = round5(30 * kSalute);
  let trasporti = vehicle.cost == null ? city.t : round5(vehicle.cost * scalaPaese(state.country, "trasporti"));

  if (housing === "genitori") {
    casa = 0;
    bollette = 0;
    spesa = round5(city.g * 0.35);   // mangi quasi sempre a casa
    salute = round5(15 * kSalute);
  } else if (housing === "stanza") {
    casa = city.r;
    bollette = round5(50 * kCasa);    // spesso parte è inclusa nell'affitto
  } else if (housing === "mono") {
    casa = city.m;
    bollette = round5(150 * kCasa);
  } else if (housing === "mutuo") {
    casa = round5(city.m * 0.9);      // stima rata mutuo
    bollette = round5(150 * kCasa);
  }

  /* famiglia: più bocche = più spesa e più salute */
  const family = state.family || "solo";
  if (family === "coppia") { spesa = spesa * 1.15; salute += 10; }
  if (family === "figli") { spesa = spesa * 1.5; salute += 30; }

  spesa = round5(Math.min(spesa, Math.max(60, spendibile * 0.45)));
  trasporti = round5(trasporti);

  const fixed = casa + bollette + spesa + trasporti + salute;
  const disponibile = spendibile - fixed;

  let abbonamenti = 0, hobby = 0, shopping = 0, viaggi = 0;
  let risparmio = 1, investimento = 0, beneficenza = 0;
  let deficit = 0;
  let mode = "ok";

  if (disponibile <= 1) {
    /* modalità 1€: le uscite fisse mangiano (quasi) tutto */
    mode = "deficit";
    risparmio = 1;
    deficit = Math.max(0, fixed + tasse + 1 - income);
  } else {
    /* regola 70/30 (Rohn): punta al 30% per il futuro, diviso tra
       risparmio, investimenti e beneficenza — adattato a quanto
       resta davvero, con priorità: prima il cuscino, poi il resto */
    const pool = Math.min(Math.round(spendibile * 0.3), Math.floor(disponibile * 0.6));

    if (pool >= 45) {
      investimento = round5(pool * 0.33);
      beneficenza = round5(pool * 0.2);
      risparmio = Math.max(1, pool - investimento - beneficenza);
    } else if (pool >= 15) {
      investimento = round5(pool * 0.3);
      risparmio = Math.max(1, pool - investimento);
    } else {
      risparmio = Math.max(1, pool);
    }

    const futuroTot = risparmio + investimento + beneficenza;
    let wants = disponibile - futuroTot;
    abbonamenti = round5(Math.min(wants * 0.15, 60));
    wants -= abbonamenti;
    hobby = round5(wants * 0.35);
    shopping = round5(wants * 0.3);
    viaggi = Math.max(0, disponibile - futuroTot - abbonamenti - hobby - shopping);

    if (spendibile > 0 && (risparmio + investimento) / spendibile < 0.1) mode = "tight";
  }

  const cats = [
    ...(isPiva ? [{ id: "tasse", emoji: "🏛️", label: "Fisco", sub: "50% — imposte e contributi, non toccarlo", val: tasse, group: "fisco" }] : []),
    { id: "casa",       emoji: "🏠", label: "Casa",        sub: housing === "genitori" ? "vivi coi genitori" : housing === "mutuo" ? "rata mutuo stimata" : "affitto stimato", val: casa,       group: "fissi" },
    { id: "bollette",   emoji: "💡", label: "Bollette",    sub: "luce, gas, internet",   val: bollette,   group: "fissi" },
    { id: "spesa",      emoji: "🛒", label: "Spesa",       sub: "cibo e casa",           val: spesa,      group: "vivere" },
    { id: "trasporti",  emoji: vehicle.emoji, label: "Trasporti", sub: vehicle.id === "mezzi" ? "abbonamento mezzi" : vehicle.desc, val: trasporti, group: "vivere" },
    { id: "salute",     emoji: "❤️", label: "Salute",      sub: "farmacia, visite",      val: salute,     group: "vivere" },
    { id: "abbonamenti",emoji: "📺", label: "Abbonamenti", sub: "streaming, app, palestra", val: abbonamenti, group: "svago" },
    { id: "hobby",      emoji: "🎨", label: "Hobby & uscite", sub: "sport, cene, divertimento", val: hobby, group: "svago" },
    { id: "shopping",   emoji: "🛍️", label: "Shopping",   sub: "vestiti, sfizi",        val: shopping,   group: "svago" },
    { id: "viaggi",     emoji: "✈️", label: "Viaggi",      sub: "si accumula ogni mese", val: viaggi, group: "svago" },
    { id: "beneficenza",emoji: "💝", label: "Beneficenza", sub: "donare = sapere che ne hai abbastanza", val: beneficenza, group: "dono" },
    { id: "investimento",emoji: "📈", label: "Investimenti", sub: "soldi che lavorano mentre dormi", val: investimento, group: "risparmio" },
    { id: "risparmio",  emoji: "🌱", label: "Risparmio",   sub: "intoccabile, a prescindere", val: risparmio,  group: "risparmio" },
  ];

  const essenziali = fixed;              // per il fondo emergenza (3 mesi)
  const ratio = spendibile > 0 ? fixed / spendibile : 2;
  const { grade, gradeLabel, gradeNote, gradeColor } = gradeFor(ratio, city.name);

  const tips = [];
  if (mode === "deficit") {
    tips.push(`Le uscite stimate superano le entrate di <b>€${deficit}</b>. Prima mossa: tagliare gli abbonamenti a zero (fatto qui sotto).`);
    if (isPiva) tips.push("Il 50% per il fisco sembra tanto, ma le tasse arrivano comunque: meglio saperlo ora che a giugno.");
    if (vehicle.id === "autoB") tips.push(`L'auto a benzina costa ~€${vehicle.cost} al mese: mezzi pubblici o uno scooter elettrico ne libererebbero più di 150.`);
    if (housing !== "genitori") tips.push("La casa è la voce che pesa di più: una stanza condivisa o un coinquilino in più può liberare 100–300€ al mese.");
    tips.push("Intanto si parte da <b>1€ al mese</b>. Sul serio: 1€ è un'abitudine, e le abitudini crescono con lo stipendio.");
  }

  return { cats, income, city, housing, vehicle, family, isPiva, tasse, spendibile, fixed, disponibile, deficit, mode, essenziali, ratio, grade, gradeLabel, gradeNote, gradeColor, tips };
}

/* costo effettivo di un obiettivo (i dinamici dipendono dalle spese
   essenziali; con figli i viaggi costano di più: si parte in tre) */
function goalCost(goal, budget) {
  let cost;
  if (goal.cost != null) cost = goal.cost;
  else if (goal.id === "fondo") cost = Math.max(500, round5(budget.essenziali * 3));
  else if (goal.id === "liberta") cost = Math.max(3000, round5(budget.essenziali * 12));
  else cost = 1000;
  if (budget.family === "figli" && (goal.id === "viaggio" || goal.id === "eventi")) cost = round5(cost * 1.6);
  if (budget.family === "coppia" && goal.id === "viaggio") cost = round5(cost * 1.3);
  return cost;
}

/* ============================================================
   Guida per obiettivo: quanto serve al mese per farcela entro
   l'orizzonte scelto, da quale busta, e come stai andando ora
   ============================================================ */
function goalPlan(state, budget, vals) {
  const v = (id) => vals[id] || 0;
  const rows = [];
  for (const [h, col] of Object.entries(GOALS)) {
    const id = state.goals[h];
    if (!id) continue;
    const g = col.items.find((x) => x.id === id);
    if (!g) continue;

    const cost = goalCost(g, budget);
    const months = HORIZON_MONTHS[h];
    const needed = Math.max(1, Math.ceil(cost / months / 5) * 5);

    let bucketId = "risparmio", bucketName = "Risparmio";
    if (g.id === "viaggio" || g.id === "eventi") { bucketId = "viaggi"; bucketName = "busta Viaggi"; }
    else if (g.id === "diecimila") { bucketId = "investimento"; bucketName = "Investimenti"; }

    const rate = v(bucketId);
    const ok = rate >= needed;
    const eta = monthsTo(cost, rate);

    rows.push({ emoji: g.emoji, label: g.label, horizon: col.title, cost, months, needed, bucketId, bucketName, rate, ok, eta });
  }
  return rows;
}

/* mesi per raggiungere un obiettivo con il risparmio attuale */
function monthsTo(cost, saving) {
  if (saving <= 0) return Infinity;
  return Math.ceil(cost / saving);
}

/* ============================================================
   Salvadanai: trasforma il budget in "buste" da replicare
   nella propria banca. pref: "inf" | "3" | "0"
   ============================================================ */
function buildJars(pref, vals, budget) {
  const v = (id) => vals[id] || 0;
  const isPiva = budget.isPiva;
  const jars = [];
  const main = []; // resta sul conto principale

  if (pref === "inf") {
    /* paga prima te stesso: il risparmio è la PRIMA mossa, poi gli
       investimenti, poi il fisco; casa e bollette restano sul conto */
    main.push({ label: "Casa + bollette", ids: ["casa", "bollette"] });
    jars.push(
      { emoji: "🌱", name: "Risparmio", cls: "jar-lime", ids: ["risparmio"], note: "paga prima te stesso: è la mossa n°1" },
      { emoji: "📈", name: "Investimenti", cls: "jar-inv", ids: ["investimento"], note: "lavorano mentre dormi" },
      { emoji: "💝", name: "Dono", ids: ["beneficenza"], note: "il 10% di Rohn: dare è ricchezza" }
    );
    if (isPiva) jars.push({ emoji: "🏛️", name: "Fisco", cls: "jar-tax", ids: ["tasse"], note: "intoccabile fino alle scadenze" });
    jars.push(
      { emoji: "🛒", name: "Spesa", ids: ["spesa"] },
      { emoji: "🚌", name: "Trasporti", ids: ["trasporti"] },
      { emoji: "❤️", name: "Salute", ids: ["salute"] },
      { emoji: "📺", name: "Abbonamenti", ids: ["abbonamenti"] },
      { emoji: "🎨", name: "Hobby & uscite", ids: ["hobby"] },
      { emoji: "🛍️", name: "Shopping", ids: ["shopping"] },
      { emoji: "✈️", name: "Viaggi", ids: ["viaggi"], note: v("viaggi") > 0 ? `si riempie da solo: tra un anno ${v("viaggi") * 12}€` : "si accumula mese dopo mese" }
    );
  } else if (pref === "3") {
    main.push({ label: "Vivere: casa, bollette, spesa, trasporti, salute", ids: ["casa", "bollette", "spesa", "trasporti", "salute"] });
    if (isPiva) {
      jars.push(
        { emoji: "🏛️", name: "1 · Fisco", cls: "jar-tax", ids: ["tasse"], note: "intoccabile fino alle scadenze" },
        { emoji: "🌱", name: "2 · Futuro", cls: "jar-lime", ids: ["risparmio", "investimento", "viaggi"], note: "risparmio + investimenti + viaggi: prima lui" },
        { emoji: "🎉", name: "3 · Svago & dono", ids: ["abbonamenti", "hobby", "shopping", "beneficenza"], note: "quando è vuoto, è vuoto" }
      );
    } else {
      jars.push(
        { emoji: "🌱", name: "1 · Futuro", cls: "jar-lime", ids: ["risparmio", "investimento"], note: "risparmio + investimenti: riempilo per primo" },
        { emoji: "✈️", name: "2 · Viaggi & dono", ids: ["viaggi", "beneficenza"], note: "si accumula mese dopo mese" },
        { emoji: "🎉", name: "3 · Svago", ids: ["abbonamenti", "hobby", "shopping"], note: "quando è vuoto, è vuoto" }
      );
    }
  } else {
    /* zero salvadanai: metodo carta e penna, ogni voce è una riga */
    if (isPiva) jars.push({ emoji: "🏛️", name: "Fisco", cls: "jar-tax", ids: ["tasse"] });
    jars.push(
      { emoji: "🏠", name: "Casa + bollette", ids: ["casa", "bollette"] },
      { emoji: "🛒", name: "Spesa", ids: ["spesa"] },
      { emoji: "🚌", name: "Trasporti + salute", ids: ["trasporti", "salute"] },
      { emoji: "🎉", name: "Svago", ids: ["abbonamenti", "hobby", "shopping"] },
      { emoji: "✈️", name: "Viaggi", ids: ["viaggi"] },
      { emoji: "💝", name: "Dono", ids: ["beneficenza"] },
      { emoji: "🌱", name: "Futuro", cls: "jar-lime", ids: ["risparmio", "investimento"] }
    );
  }

  const sum = (ids) => ids.reduce((s, id) => s + v(id), 0);
  return {
    main: main.map((m) => ({ ...m, amount: sum(m.ids) })),
    jars: jars.map((j) => ({ ...j, amount: sum(j.ids) })).filter((j) => j.amount > 0 || j.ids.includes("risparmio")),
  };
}

/* ============================================================
   Consigli per la schermata finale: dove migliorare, con tono
   giusto (rosso = urgente, ambra = margine, ok = tutto sano)
   ============================================================ */
function buildAdvice(budget, vals, state) {
  const a = [];
  const base = budget.spendibile > 0 ? budget.spendibile : 1;
  const v = (id) => vals[id] || 0;

  /* il deficit si giudica sui numeri veri, non sulla stima iniziale */
  const totalOut = budget.cats.reduce((s, c) => s + v(c.id), 0);
  const liveDeficit = Math.max(0, totalOut - budget.income);

  /* consigli precisi per raggiungere gli obiettivi scelti */
  if (state && liveDeficit === 0) {
    goalPlan(state, budget, vals).filter((r) => !r.ok).slice(0, 3).forEach((r) => {
      a.push({ tone: "amber", emoji: r.emoji, html: `Per <b>${r.label}</b> (€${r.cost.toLocaleString("it-IT")} entro ${r.months >= 24 ? Math.round(r.months / 12) + " anni" : r.months + " mesi"}) servono <b>~€${r.needed}/mese</b> in ${r.bucketName}: ora ne metti €${r.rate}. Alza quella voce, oppure dai più tempo all'obiettivo.` });
    });
  }

  if (liveDeficit > 0) {
    a.push({ tone: "red", emoji: "🚨", html: `Le uscite superano le entrate di <b>€${liveDeficit}</b>: qualcosa va limato. Parti da svago e abbonamenti, mai dal risparmio.` });
    if (budget.housing !== "genitori" && v("casa") / base > 0.42) a.push({ tone: "red", emoji: "🏠", html: `La casa è la voce che pesa di più: una stanza condivisa o un coinquilino possono liberare 100–300€ al mese.` });
    if (budget.isPiva) a.push({ tone: "red", emoji: "🏛️", html: `Occhio a non tagliare il <b>Fisco</b> per far quadrare i conti: le tasse arrivano comunque.` });
    a.push({ tone: "red", emoji: "🌱", html: `Intanto si parte da <b>1€ al mese</b>. Sul serio: 1€ è un'abitudine, e le abitudini crescono con le entrate.` });
  } else {
    if (budget.housing !== "genitori" && v("casa") / base > 0.42) {
      a.push({ tone: "amber", emoji: "🏠", html: `La casa si prende il <b>${Math.round((v("casa") / base) * 100)}%</b> di quello che puoi spendere. Un coinquilino in più o una zona diversa possono liberare decine di euro al mese.` });
    }
    if (budget.vehicle && budget.vehicle.id === "autoB") {
      a.push({ tone: "amber", emoji: "🚗", html: `L'auto a benzina pesa <b>~€${budget.vehicle.cost}</b> al mese tra carburante, assicurazione e bollo: mezzi o un elettrico leggero possono più che dimezzarla.` });
    }
    if (v("abbonamenti") > 40) {
      a.push({ tone: "amber", emoji: "📺", html: `<b>€${v("abbonamenti")}</b> di abbonamenti: quali usi davvero ogni settimana? Tagliane uno e gira quei soldi al salvadanaio Futuro.` });
    }
    if (v("shopping") > base * 0.15) {
      a.push({ tone: "amber", emoji: "🛍️", html: `Lo shopping supera il 15% dello spendibile: prova la <b>regola delle 48 ore</b> — se dopo due giorni lo vuoi ancora, comprali.` });
    }
    if ((v("risparmio") + v("investimento")) / base < 0.1) {
      a.push({ tone: "amber", emoji: "🌱", html: `Oggi metti via il <b>${Math.round(((v("risparmio") + v("investimento")) / base) * 100)}%</b>: va benissimo partire così. Alla prossima entrata in più, alza <b>prima</b> il futuro, poi il resto.` });
    }
    if (v("investimento") === 0 && v("risparmio") >= 50) {
      a.push({ tone: "amber", emoji: "📈", html: `Hai un buon risparmio ma <b>0€ investiti</b>: quando il cuscino c'è, anche 10€ al mese in un piano semplice e automatico fanno la differenza su anni (Rohn direbbe: 10% risparmio, 10% investimenti, 10% dono).` });
    }
  }

  if (budget.isPiva) {
    a.push({ tone: "amber", emoji: "🏛️", html: `Il salvadanaio <b>Fisco</b> non è tuo: non toccarlo nemmeno "in prestito". A giugno ringrazierai.` });
  }

  if (!a.length) {
    a.push({ tone: "ok", emoji: "✨", html: `Niente da segnalare: il piano è sano e dentro le regole dei maestri. Da qui in poi conta una cosa sola: <b>la costanza</b>.` });
  }
  return a;
}

function fmtMonths(m) {
  if (!isFinite(m)) return "∞";
  if (m <= 18) return `~${m} mesi`;
  const y = m / 12;
  return `~${y < 3 ? y.toFixed(1).replace(".", ",") : Math.round(y)} anni`;
}
