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

## Il dizionario dei sogni

**181 sogni, 859 parole chiave, 10 categorie.** Scrivi «viaggio alle Azzorre»,
«aprire un chiosco sulla spiaggia» o «rifarmi i denti» e l'app risponde
all'istante, senza chiamare nessun server e senza costare niente.

Vive in **`sogni.csv`, che si apre con Excel**: una riga per sogno, sei colonne.

| categoria | emoji | nome | costo | parole | priorita | nota |
|---|---|---|---|---|---|---|
| Viaggi | 🗾 | un viaggio in Giappone | 2600 | giappone\|tokyo\|kyoto | 0 | volo + 12 notti + JR Pass |

- **costo** — in euro, oppure la parola `fondo` per le voci che si calcolano
  sulle spese vere della persona (il cuscino per gli imprevisti)
- **parole** — quelle che fanno scattare la voce, separate da `|`
- **priorita** — normalmente 0. L'app sceglie la parola più lunga fra tutte
  quelle che corrispondono («anticipo casa» batte «casa»); la priorità
  ribalta il verdetto dove serve il buon senso: chi scrive «aprire un chiosco
  **sulla spiaggia**» vuole un lavoro, non una vacanza al mare
- **nota** — cosa comprende la cifra. Serve a noi quando fra sei mesi ci
  chiederemo da dove è uscito quel numero

L'ordine delle righe non conta: ordina il foglio come preferisci.

```bash
python3 costruisci-sogni.py
```

Legge il CSV, riscrive `js/sogni.js` e segnala i doppioni. Poi commit e push.

## I numeri veri dell'Europa

L'app copre i **21 paesi dell'euro** e non inventa niente: ogni cifra viene da
una fonte pubblica e verificabile.

- **Inflazione** — Banca Centrale Europea, paese per paese, aggiornata al mese.
- **Prezzi** — Eurostat, livelli comparati divisi nelle stesse voci che l'app
  già usa: casa, spesa, trasporti, salute, shopping, uscite.
- **Tassi** — BCE, tasso sui depositi e di rifinanziamento.

I prezzi italiani sono studiati città per città; per gli altri paesi si parte
dalla media italiana e la si scala con l'indice Eurostat. Non è una stima a
caso: è il rapporto ufficiale fra due paesi. E resta comunque un punto di
partenza, perché ogni cifra la conferma l'utente nel Risveglio.

Il risultato: **lo stesso stipendio di 1.500 € permette di mettere via 24 € al
mese in Irlanda e 203 € in Portogallo.** Un'app che desse gli stessi numeri a
entrambi starebbe mentendo a uno dei due.

**Il traguardo si muove.** Mentre risparmi, i prezzi salgono: il contatore lo
tiene in conto e lo dice apertamente («l'inflazione allontana il traguardo di
13 giorni»), con la fonte accanto. Non è pessimismo — è il motivo per cui una
parte dei soldi va fatta lavorare, ed è la sola cosa onesta da dire a chi mette
via 200 € al mese per due anni.

### Aggiornare i dati

```bash
python3 dati-europa.py
```

Scarica da BCE ed Eurostat e riscrive `js/europa.js`. Poi commit e push.

Non chiamiamo le API dal browser a ogni visita: l'app deve restare statica —
istantanea, gratis, funzionante offline. Congelando i dati nel repo, ogni
aggiornamento resta nella storia del progetto: fra un anno si potrà dire con
precisione quali numeri mostrava l'app in un dato giorno.

> ⚠️ Fino a febbraio 2026 l'inflazione stava nel dataset BCE `ICP`, ora
> **congelato** (ultimo dato: dicembre 2025) ma ancora attivo: chi lo interroga
> oggi si porta a casa numeri vecchi di mesi senza nessun errore. Quello giusto
> è `HICP`. Lo script ha un controllo che avvisa se i dati invecchiano.

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
| `sito/index.html` | **Il sito.** La pagina di presentazione |
| `sito/css/tokens/` | il design system: colori, tipografia, forme, movimento |
| `sito/js/sito.js` | le animazioni del sito, senza librerie esterne |
| `dashboard.html` | la vecchia dashboard desktop, tenuta come archivio |
| `media/crescita.mp4` | la clessidra 3D, condivisa fra app e sito |

Due indirizzi, un repo solo: l'app resta alla radice — i link già in giro non
si toccano — e il sito vive in `sito/`. Quando arriverà il dominio, un CNAME
solo li porta online tutti e due.

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
