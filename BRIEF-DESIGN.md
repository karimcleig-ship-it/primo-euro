# PRIMO EURO® — brief di design

> **Come si usa questo file:** aprilo, copia tutto, incollalo in una chat nuova su
> claude.ai e chiedi quello che ti serve — la presentazione, i mockup del telefono,
> la landing, le slide. Qui dentro c'è tutto quello che serve per disegnare
> "in stile PRIMO EURO" senza inventarsi niente.
>
> Il primo messaggio può essere semplicemente:
> *"Questo è il design system della mia app. Fammi una presentazione con i mockup
> del telefono."*

---

## 1. Cos'è PRIMO EURO®

Un'app di educazione finanziaria per il telefono, in italiano, pensata per i
21 paesi dell'euro.

**La frase che spiega tutto: la valuta non è l'euro, è il tempo.**

Scrivi un sogno con parole tue — *"andare a Tokyo"*, *"la mia prima macchina"*,
*"aprire un chiosco sulla spiaggia"* — e l'app ti dice **quanti giorni** ti
separano da lì. Poi ogni scelta che fai accorcia quel numero sotto i tuoi occhi.

Non è un'app che ti dice quanto hai speso. È un'app che ti dice **quanto manca**.

### A chi parla
A chi non ha mai messo via niente e pensa che risparmiare sia roba da ricchi o
da contabili. Under 35, primo lavoro o partita IVA, in tutta Europa.

### Cosa la rende diversa
Ogni altra app dei soldi ti fa sentire in colpa **mentre** risparmi: i tagli, i
sacrifici, il grafico rosso. Qui la fatica sta nascosta e in vista c'è il
traguardo: la clessidra che si riempie di monete.

---

## 2. I principi (non sono slogan: sono regole di prodotto)

| Principio | Cosa vuol dire quando disegni |
|---|---|
| **Mai giudicare** | Nessun voto, nessun "ecco come stai messo", nessun rosso da errore. Tono da accompagnatore, sempre. |
| **1 € al mese è meglio di niente** | Se i conti non tornano, non si dice che hai sbagliato: si mostra da dove ripartire. |
| **Il traguardo, non la fatica** | In copertina va sempre il sogno e il tempo che manca, mai il sacrificio. |
| **I numeri sono suoi** | Ogni cifra resta correggibile a mano. L'app propone, l'utente decide. |
| **Tutto è possibile** | Nessun sogno viene mai rifiutato. Se non lo conosce, chiede: *"non è questo il tuo sogno? scrivimelo comunque"*. |

---

## 3. Il percorso: quattro schermate, in quest'ordine

L'app è **una schermata alla volta, senza scroll**. In fondo una barra con
quattro fasi, sempre nello stesso ordine:

**1. 🎯 Sogno** — «Cosa vuoi, *davvero?*»
Una riga in cui scrivere il sogno con parole proprie, più esempi cliccabili
sotto. L'app stima quanto costa (dizionario di 181 sogni), e la cifra resta
sempre modificabile.

**2. 💡 Risveglio** — «Adesso i numeri veri.»
Le cifre della persona, una per una: entrate, città, casa, come si muove,
partita IVA. Poi ogni voce di spesa da confermare o correggere: casa, bollette,
spesa, trasporti, salute, abbonamenti, hobby, shopping. È l'unica fase con due
passaggi (compilazione + tabella riassuntiva).

**3. ⚡ Azione** — «I consigli della settimana.»
Le mosse per accorciare il conto alla rovescia, divise in *"Ogni settimana"* e
*"E una volta sola, se ti va"*. Ogni mossa nasce da una spesa vera della
persona: chi ha scritto 60 € di abbonamenti si sente dire *"disdici un
abbonamento → 21 €/mese, dai tuoi 60 € di abbonamenti"*. Chi ha scritto 0 non
se lo sente chiedere.

**4. ⏳ Clessidra** — la schermata finale, quella da mettere in copertina.
Un video 3D di una clessidra-salvadanaio che si riempie di monete verdi, a tutto
schermo su nero. Sopra: il conto alla rovescia e il sogno. Sotto: i tre
salvadanai.

---

## 4. I colori

Fondo scuro, quasi nero. Tre accenti, e **ognuno ha un significato fisso**: non
si scambiano mai.

```
--nero        #05050a   il fondo della pagina
--ink         #0b0b12   le superfici, le card
--ink-2       #14141f   la barra in fondo
--paper       #f5f4ef   il testo (bianco caldo, mai bianco puro)
--lime        #d9ff4b   IL SOGNO — l'accento principale
--violet      #7c5cff   IL RISPARMIO
--arancio     #ff9d4d   GLI INVESTIMENTI
```

Trasparenze usate nell'app:
```
testo secondario   rgba(245,244,239,.55)
testo tenue        rgba(245,244,239,.30)
bordi              rgba(245,244,239,.10)
card               rgba(255,255,255,.04)
alone lime         rgba(217,255,75,.13)
```

**Il lime è la firma.** Su nero è elettrico e si vede da lontano — è il colore
del sogno e del "ce la fai". Va usato con parsimonia: un elemento per schermata,
mai due cose lime che si contendono l'occhio.

I tre salvadanai (sogno lime, risparmio viola, investimenti arancio) sono il
codice colore da cui non si scappa: se in una slide compare il risparmio, è
viola. Sempre.

---

## 5. I caratteri

- **Space Grotesk** (400/500/600/700) — titoli, numeri, etichette.
  Il conto alla rovescia è enorme: 52–70px, peso 700, `letter-spacing: -.05em`.
- **Inter** (400/500/600) — testi, descrizioni, tutto il resto.

Dettagli che fanno lo stile:
- Le etichette in alto sono **maiuscolo spaziato**: `letter-spacing: .18em`,
  colore lime, corpo piccolo (es. `LA TUA CLESSIDRA`).
- I numeri usano sempre `font-variant-numeric: tabular-nums` così non ballano.
- Il numero grande del conto alla rovescia ha un gradiente dall'alto
  (`#f5f4ef` → `#b9c47a`) e respira con un battito lentissimo (5 secondi).
- Quando il tempo supera l'anno, il numero diventa parola: **"2 anni e 4 mesi"**
  grande, e "860 giorni" piccolo sotto.

---

## 6. Le forme

- **Angoli morbidi ovunque**: card 16–18px, bottoni a pillola (999px), il
  telefono 34px.
- **Vetro**: le card sono semitrasparenti con `backdrop-filter: blur(6px)` —
  la clessidra dietro si intravede.
- **Aloni, non ombre**: il box del sogno ha un bagliore lime
  (`box-shadow: 0 0 24px -10px rgba(217,255,75,.5)`), non un'ombra grigia.
- **Il movimento è lento e morbido**: `cubic-bezier(.22,1,.36,1)`. Niente
  rimbalzi, niente animazioni allegre. Il tempo scorre con calma.

---

## 7. Come parla (importante quanto i colori)

Italiano diretto, minuscolo, mai burocratico. Dà del tu. Non spiega la finanza:
la traduce.

**Frasi vere dell'app** — usale nella presentazione, sono già scritte:
- «Cosa vuoi, *davvero?*»
- «Scrivilo con parole tue. Da qui in poi ogni euro che metti via ha un motivo e un nome.»
- «Adesso i numeri veri.»
- «362 giorni a « andare a tokyo »»
- «Pronto entro luglio 2027»
- «225 € da mettere via ogni mese»
- «0 € messi via» / «2600 € mancanti»
- «Ho fatto i miei tagli → alla clessidra»
- «di più non ce n'è: prima libera qualcosa dalle altre voci»
- «⚠️ così sfori di 40 €: abbassa qualche voce o alza le entrate»

**Le citazioni che scorrono in fondo alla Clessidra** (coppia frase · autore):
```
1€ al mese · è meglio di 0€
regola 70/30 · Jim Rohn
regola 50/30/20 · Elizabeth Warren
paga prima te stesso · George Clason
fondo emergenza · Dave Ramsey
spesa consapevole · Ramit Sethi
le abitudini battono la matematica · Morgan Housel
semplice > complicato · John Bogle
```

**Da non dire mai:** "budget", "gestione delle finanze", "obiettivi di
risparmio", "monitora le tue spese". E soprattutto niente linguaggio da hustle:
nessun "grind", nessun "sacrificio", nessun "disciplina ferrea".

---

## 8. I numeri da mettere nelle slide (sono veri, non inventati)

- **21 paesi** dell'euro coperti
- **181 sogni** nel dizionario, **859 parole chiave**, 10 categorie
- **Inflazione** dalla Banca Centrale Europea, paese per paese
- **Prezzi** da Eurostat, livelli comparati
- **Tassi** BCE (depositi e rifinanziamento)
- Il dato che colpisce: **lo stesso stipendio di 1.500 € permette di mettere via
  24 € al mese in Irlanda e 203 € in Portogallo.** Un'app che desse gli stessi
  numeri a entrambi starebbe mentendo a uno dei due.
- **Partita IVA: il 50% di ogni incasso è del fisco**, non tuo. È la prima voce
  della lista, sempre.
- I dati stanno **nel telefono** (localStorage): nessun account, nessuna
  iscrizione, funziona anche offline.

---

## 9. La schermata da mettere in copertina

Se la presentazione ha un solo mockup, è questo — la **Clessidra**:

```
            LA TUA CLESSIDRA            (lime, maiuscolo spaziato)     ↺

  🗾  362                                    ┌──────────────────┐
      giorni a « andare a tokyo »            │        🗾 Sogno  │  (bordo lime,
                                             │          225 €  │   alone)
                                             │   da mettere via │
                                             │       ogni mese  │
                                             └──────────────────┘

  ▓▓░░░░░░░░░░░░░░░░░░  (barra con le tacche dei mesi)
  0 €          Pronto entro luglio 2027          2600 €
  messi via                                      mancanti

              ╭─────────╮
  ┌─────────┐ │ clessidra│ ┌─────────────┐
  │🌱 Risp. │ │  3D che  │ │📈 Investim. │   (i due box larghi uguali,
  │  300 €  │ │ si riempie│ │     150 €   │    ai lati del collo)
  └─────────┘ │di monete │ └─────────────┘
              ╰─────────╯

  ✦ paga prima te stesso · George Clason ✦   (banda che scorre)
  ──────────────────────────────────────────
   🎯 Sogno   💡 Risveglio   ⚡ Azione   ⏳ Clessidra
```

Regole di composizione già decise, da rispettare:
- Il titolo «LA TUA CLESSIDRA» parte **al filo superiore** del box Sogno;
  «giorni a…» appoggia **sulla base** dello stesso box.
- I box Risparmio e Investimenti sono **larghi uguali**, a filo del contenuto.
- La clessidra è **centrata**, riempie l'80% dello spazio tra la barra e la
  banda delle citazioni.
- Tutto su nero pieno: la clessidra non ha cornice né riquadro, galleggia.

---

## 10. Cosa chiedere a Claude su claude.ai

Esempi di richieste che funzionano bene con questo brief:

- «Fammi una presentazione dell'app: cos'è, per chi, come funziona, i quattro
  passaggi, i numeri europei. Con i mockup del telefono per ogni schermata.»
- «Fammi la landing page di PRIMO EURO®, mobile-first, con il conto alla
  rovescia in copertina.»
- «Disegnami i mockup delle quattro schermate dentro una cornice di iPhone.»
- «Fammi 6 slide da pitch per un investitore, con il dato Irlanda/Portogallo
  come slide del problema.»

**Da dire sempre:** i colori e i font sono quelli qui sopra, il tono è quello
delle frasi vere, e la fatica non si mostra mai — si mostra il traguardo.

---

*App online: https://karimcleig-ship-it.github.io/primo-euro/*
*Vista diretta della Clessidra: https://karimcleig-ship-it.github.io/primo-euro/?clessidra*
