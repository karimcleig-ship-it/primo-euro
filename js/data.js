/* ============================================================
   PRIMO — dati: città, obiettivi, principi
   Stime 2026 di costo della vita per una persona sola (€/mese):
   r = stanza in affitto, m = monolocale/bilocale,
   g = spesa alimentare, t = abbonamento trasporti
   ============================================================ */

const CITIES = [
  { id: "milano",   name: "Milano",        r: 730, m: 1250, g: 320, t: 39 },
  { id: "roma",     name: "Roma",          r: 620, m: 1050, g: 300, t: 35 },
  { id: "bologna",  name: "Bologna",       r: 610, m: 950,  g: 290, t: 36 },
  { id: "firenze",  name: "Firenze",       r: 600, m: 950,  g: 290, t: 35 },
  { id: "venezia",  name: "Venezia",       r: 580, m: 900,  g: 300, t: 37 },
  { id: "bergamo",  name: "Bergamo",       r: 500, m: 800,  g: 280, t: 30 },
  { id: "trento",   name: "Trento",        r: 500, m: 780,  g: 285, t: 25 },
  { id: "padova",   name: "Padova",        r: 480, m: 750,  g: 270, t: 30 },
  { id: "verona",   name: "Verona",        r: 480, m: 780,  g: 280, t: 30 },
  { id: "parma",    name: "Parma",         r: 470, m: 720,  g: 275, t: 28 },
  { id: "torino",   name: "Torino",        r: 460, m: 700,  g: 270, t: 38 },
  { id: "modena",   name: "Modena",        r: 460, m: 700,  g: 275, t: 28 },
  { id: "brescia",  name: "Brescia",       r: 450, m: 720,  g: 275, t: 30 },
  { id: "cagliari", name: "Cagliari",      r: 450, m: 700,  g: 265, t: 30 },
  { id: "genova",   name: "Genova",        r: 400, m: 620,  g: 270, t: 40 },
  { id: "napoli",   name: "Napoli",        r: 400, m: 650,  g: 260, t: 35 },
  { id: "trieste",  name: "Trieste",       r: 400, m: 620,  g: 270, t: 28 },
  { id: "bari",     name: "Bari",          r: 400, m: 620,  g: 255, t: 30 },
  { id: "palermo",  name: "Palermo",       r: 340, m: 550,  g: 250, t: 30 },
  { id: "catania",  name: "Catania",       r: 330, m: 520,  g: 250, t: 30 },
  { id: "altro",    name: "Piccolo centro", r: 300, m: 480, g: 240, t: 25 },
];

/* Come ti muovi: stima mensile di carburante/ricariche, assicurazione,
   bollo e manutenzione. "mezzi" usa l'abbonamento della città. */
const VEHICLES = [
  { id: "mezzi",    emoji: "🚌", label: "Mezzi pubblici",     desc: "abbonamento urbano",              cost: null },
  { id: "apiedi",   emoji: "🚶", label: "A piedi",            desc: "costa zero",                      cost: 0 },
  { id: "bici",     emoji: "🚲", label: "Bicicletta",         desc: "manutenzione e poco altro",       cost: 10 },
  { id: "scooter",  emoji: "🏍️", label: "Scooter",            desc: "benzina + assicurazione",         cost: 60 },
  { id: "scooterE", emoji: "🛵", label: "Motorino elettrico", desc: "ricariche + assicurazione",       cost: 35 },
  { id: "autoE",    emoji: "⚡", label: "Auto elettrica",     desc: "torrette + assicurazione",        cost: 135 },
  { id: "autoB",    emoji: "🚗", label: "Auto a benzina",     desc: "benzina, assicurazione, bollo",   cost: 210 },
];

const HOUSING = [
  { id: "genitori", emoji: "🏠", label: "Con i genitori", desc: "Casa (quasi) gratis" },
  { id: "stanza",   emoji: "🚪", label: "Stanza in affitto", desc: "Condividi l'appartamento" },
  { id: "mono",     emoji: "🛋️", label: "Casa in affitto", desc: "Mono o bilocale tuo" },
  { id: "mutuo",    emoji: "🔑", label: "Casa di proprietà", desc: "Paghi un mutuo" },
];

/* Età e famiglia: cambiano spese stimate e obiettivi */
const AGES = [
  { id: "u20", label: "Meno di 20" },
  { id: "20s", label: "20 – 29" },
  { id: "30s", label: "30 – 45" },
  { id: "46+", label: "46 o più" },
];

const FAMILY = [
  { id: "solo",   emoji: "🙋", label: "Solo per me" },
  { id: "coppia", emoji: "💑", label: "In coppia" },
  { id: "figli",  emoji: "👨‍👩‍👧", label: "Ho figli" },
];

/* Orizzonti: entro quanti mesi è ragionevole arrivarci */
const HORIZON_MONTHS = { short: 12, mid: 48, long: 120 };

/* Obiettivi per orizzonte. cost: null = calcolato (fondo emergenza = 3 mesi di spese) */
const GOALS = {
  short: {
    title: "Breve termine",
    when: "0 – 1 anno",
    items: [
      { id: "fondo",    emoji: "🛟", label: "Fondo salvagente", cost: null },
      { id: "viaggio",  emoji: "✈️", label: "Un viaggio vero",  cost: 2500 },
      { id: "tech",     emoji: "📱", label: "Telefono o PC nuovo", cost: 900 },
      { id: "eventi",   emoji: "🎫", label: "Concerti & eventi", cost: 300 },
    ],
  },
  mid: {
    title: "Medio termine",
    when: "1 – 5 anni",
    items: [
      { id: "auto",     emoji: "🚗", label: "Patente + prima auto", cost: 9000 },
      { id: "corso",    emoji: "🎓", label: "Corso o formazione", cost: 2500 },
      { id: "casa-via", emoji: "📦", label: "Andare a vivere da solə", cost: 5000 },
      { id: "sport",    emoji: "🏋️", label: "Un anno di sport/passioni", cost: 1500 },
    ],
  },
  long: {
    title: "Lungo termine",
    when: "5+ anni",
    items: [
      { id: "deposito", emoji: "🏡", label: "Anticipo per casa", cost: 25000 },
      { id: "diecimila", emoji: "📈", label: "Primi 10.000€ investiti", cost: 10000 },
      { id: "impresa",  emoji: "🚀", label: "Aprire la mia attività", cost: 15000 },
      { id: "liberta",  emoji: "🧘", label: "Libertà: 1 anno di respiro", cost: null },
    ],
  },
};

/* I 10 insegnanti: principi parafrasati, teen-friendly */
const TEACHERS = [
  { name: "Elizabeth Warren", rule: "La regola 50/30/20", quote: "Metà per i bisogni, un terzo per i desideri, il resto per il te del futuro." },
  { name: "George Clason", rule: "Paga prima te stesso", quote: "Una parte di tutto ciò che guadagni è tua: mettila via prima di toccare il resto." },
  { name: "Dave Ramsey", rule: "Fondo d'emergenza", quote: "Prima di tutto un cuscino: parti da poco, punta a 3 mesi di spese." },
  { name: "Warren Buffett", rule: "Risparmia, poi spendi", quote: "Non mettere da parte ciò che avanza dopo aver speso: spendi ciò che avanza dopo aver risparmiato." },
  { name: "Ramit Sethi", rule: "Spesa consapevole", quote: "Taglia senza pietà quello che non ami. Spendi senza sensi di colpa in quello che ami." },
  { name: "Morgan Housel", rule: "Conta il comportamento", quote: "Andare bene coi soldi c'entra poco con l'intelligenza e molto con le abitudini." },
  { name: "John Bogle", rule: "Semplicità vince", quote: "Automatico, a basso costo, noioso: è così che si costruisce un patrimonio." },
  { name: "Vicki Robin", rule: "Soldi = tempo di vita", quote: "Ogni acquisto costa ore della tua vita. Chiediti: le vale davvero?" },
  { name: "JL Collins", rule: "Il tasso di risparmio", quote: "Quanto metti da parte conta più di quanto guadagni. Anche l'1% è un inizio." },
  { name: "Robert Kiyosaki", rule: "Fai lavorare i soldi", quote: "Non lavorare solo per i soldi: col tempo, insegna ai soldi a lavorare per te." },
  { name: "Jim Rohn", rule: "La regola 70/30", quote: "Vivi con il 70%. Il resto dividilo in tre: risparmio, investimenti e qualcosa da donare." },
];

/* Frasi del ticker in home */
const TICKER = [
  ["1€ al mese", "è meglio di 0€"],
  ["regola 70/30", "Jim Rohn"],
  ["regola 50/30/20", "Elizabeth Warren"],
  ["paga prima te stesso", "George Clason"],
  ["fondo emergenza", "Dave Ramsey"],
  ["spesa consapevole", "Ramit Sethi"],
  ["le abitudini battono la matematica", "Morgan Housel"],
  ["semplice > complicato", "John Bogle"],
];

/* Battute della schermata di calcolo */
const LOADING_LINES = [
  "Stiamo facendo i conti…",
  "Applichiamo la regola 50/30/20…",
  "Controlliamo gli affitti nella tua città…",
  "Chiediamo un parere ai 10 maestri…",
  "Mettiamo al sicuro il tuo primo euro…",
];
