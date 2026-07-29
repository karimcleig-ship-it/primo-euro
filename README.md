# PRIMO EURO 💶

**La valuta non è l'euro. È il tempo.**
Scrivi un sogno, l'app ti dice quanti **giorni** ti separano da lì — e ogni scelta
che fai lo accorcia sotto i tuoi occhi.

## Il percorso: Sogno → Risveglio → Azione

**1. Sogno.** Una riga su cui scrivere quello che vuoi, con parole tue: *"andare
a Tokyo con Giulia"*, *"aprire un chiosco sulla spiaggia"*, *"rifarmi i denti"*.
Un'AI stima quanto costa davvero in Italia oggi; la cifra resta sempre
correggibile. Sotto, esempi cliccabili che fanno capire che si scrive libero.

**2. Risveglio.** Le tue cifre vere, una per una: entrate, città, casa, come ti
muovi, partita IVA. Poi ogni voce di spesa — casa, bollette, spesa, trasporti,
salute, abbonamenti, hobby, shopping — da confermare o correggere a mano. Non è
un questionario: è il momento in cui i numeri smettono di essere un'idea vaga.
Finché non le hai confermate tutte non si va avanti, perché è lì che sta il senso.

**3. Azione.** Il contatore nasce solo adesso, ed è vero perché nasce dai tuoi
numeri. Sotto, le mosse per accorciarlo.

## Le mosse sono cucite sulle tue cifre

È la parte che rende l'app diversa da un elenco di consigli.

Ogni mossa nasce da una **tua** voce di spesa, non da una media nazionale:

| Se hai scritto | La mossa dice |
|---|---|
| 60 € di abbonamenti | *Disdici un abbonamento* → **21 €/mese**, «dai tuoi 60 € di abbonamenti» |
| 20 € di abbonamenti | *Disdici un abbonamento* → **7 €/mese** |
| 140 € di bollette | *Cambia gestore luce e gas* → **25 €/mese** — e passa in cima alla lista |

Le mosse si riordinano da sole: davanti quelle che sul **tuo** calendario pesano
di più. Quelle che non ti riguardano spariscono — a chi ha scritto 0 di
abbonamenti non viene chiesto di disdirne uno.

Due famiglie, in due schede:

- **Una volta e basta** — strutturali: cambi gestore, rinegozi, disdici. Zero
  rinunce, valgono per sempre. Si propongono per prime.
- **Ogni settimana** — rinunce vere, che costano disciplina. Si guardano dopo.

Quando una rinuncia è troppo piccola per spostare il calendario, l'app non
promette «−0 giorni»: dice quanto vale in un anno, che non è mai zero.

## Le altre scelte di fondo

- **Regola 70/30 (Jim Rohn)**: **risparmio**, **investimenti** e **sogno** sono
  tre salvadanai distinti e tutti e tre visibili. Il risparmio costruisce il
  futuro a prescindere dal sogno; il sogno ha il suo salvadanaio che si riempie.
- **Investimenti al massimo il 20%** di quello che resta.
- **Partita IVA**: il 50% di ogni incasso è del fisco, non tuo. È la prima voce.
- **Mai giudicare.** Nessun voto, nessun «ecco come stai messo»: tono da
  accompagnatore, sempre.
- **1 € al mese è meglio di niente.** Se i conti non tornano l'app non ti dice
  che hai sbagliato: ti mostra da dove ripartire.
- **Il tempo passa anche a app chiusa**: se torni dopo una settimana, quello che
  hai messo via nel frattempo è già scalato dal contatore.

I dati restano nel browser (localStorage). Nessun account, nessuna iscrizione.

## Come si avvia

```bash
python3 -m http.server 4173
```

e apri http://localhost:4173 — da telefono, sulla stessa rete: `http://<ip-del-mac>:4173/`.

## Come è organizzato

| File | Cos'è |
|---|---|
| `index.html` | **L'app.** Markup, stile e logica in un file solo |
| `js/data.js` | città, veicoli, obiettivi, i principi dei maestri |
| `js/engine.js` | il motore di budget (70/30, fisco 50% p.IVA, salvadanai) |
| `netlify/functions/stima-sogno.js` | la stima AI del costo di un sogno |
| `dashboard.html` | la vecchia dashboard desktop, tenuta come archivio |

### Attivare la stima dei sogni con l'AI

Senza configurazione la barra del sogno usa un dizionario locale di parole
chiave; con l'AI collegata capisce qualsiasi cosa venga scritta.

**La chiave API non può stare nel sito**: sarebbe leggibile da chiunque apra il
codice sorgente della pagina. Per questo la chiamata passa da una funzione
serverless che gira sul server e tiene la chiave al sicuro. Nessuna dipendenza
da installare.

1. Procurati una chiave su [console.anthropic.com](https://console.anthropic.com)
2. Su Netlify → **Site configuration → Environment variables** → aggiungi
   `ANTHROPIC_API_KEY`
3. Rilancia il deploy (le variabili si leggono al momento del deploy: finché non
   ripubblichi, la funzione gira con la configurazione vecchia)

Senza chiave la funzione risponde "non configurato" e l'app continua a funzionare
col dizionario — nessun errore visibile. Ogni sogno già stimato viene ricordato,
così non si paga due volte.

Per provarla in locale serve la CLI di Netlify:

```bash
ANTHROPIC_API_KEY=la-tua-chiave npx netlify dev
```

> ⚠️ L'endpoint è pubblico: chiunque conosca l'URL può consumare credito.
> Prima di condividerlo largamente, metti un limite di spesa sulla console.

## Come si condivide

Versione in **un file solo** (font inclusi, funziona offline con un doppio click):

```bash
python3 build-standalone.py --mobile
```

Produce `dist/app.html` — si spedisce per email o WhatsApp — e `dist/app-body.html`,
la stessa pagina senza involucro, pronta per essere pubblicata come link.
Con `--demo` la build riparte sempre dalla schermata Sogno, utile per far vedere
il percorso intero a chi ha già un piano salvato nel browser.

Per un indirizzo pubblico: trascina la cartella su
[app.netlify.com/drop](https://app.netlify.com/drop). Per **aggiornare** un sito
che esiste già, trascina la cartella dentro il progetto → sezione *Deploys*: se
la lasci cadere nella pagina generale, Netlify crea un progetto nuovo e ti
ritrovi con due versioni diverse online.

## Stack

HTML / CSS / JavaScript vanilla, nessuna build. Sfondo in canvas 2D (aloni che
derivano lentamente), font Space Grotesk + Inter.

> Le stime di affitti e costi (2026) sono indicative: servono a partire, non a
> sostituire i tuoi numeri reali — che l'app ti chiede sempre di correggere.
