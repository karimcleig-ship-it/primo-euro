#!/usr/bin/env python3
"""
PRIMO EURO — i numeri veri dell'Europa.

Scarica da due fonti ufficiali e li scrive in app/js/europa.js, che l'app carica
come un file qualsiasi:

  BCE       inflazione paese per paese e tassi ufficiali
  Eurostat  quanto costa vivere in ogni paese, voce per voce

    python3 dati-europa.py

Perché non chiamiamo BCE ed Eurostat dal browser a ogni visita: perché l'app
deve restare un sito statico — istantaneo, gratis, funzionante offline e
senza server. I dati li congeliamo qui, finiscono su GitHub insieme al
codice, e ogni aggiornamento resta scritto nella storia del progetto: fra un
anno si potrà dire con precisione quali numeri mostrava l'app in un dato
giorno. Per un'app che parla di soldi è la proprietà che conta di più.

ATTENZIONE alla serie dell'inflazione: fino a febbraio 2026 stava nel
dataset "ICP", che ora è congelato (ultimo dato: dicembre 2025) ma risponde
ancora, senza errori. Chi lo interroga oggi si porta a casa numeri vecchi di
mesi credendoli freschi. Quello buono è "HICP", con una chiave diversa (4D0
al posto di 4). Il controllo sulla freschezza, in fondo, serve a non
ricascarci.
"""

import json
import pathlib
import urllib.error
import urllib.request
from datetime import date, datetime

BCE = "https://data-api.ecb.europa.eu/service/data"
EUROSTAT = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data"
ROOT = pathlib.Path(__file__).parent

# I paesi che pagano in euro, più l'area euro come riferimento.
# Eurostat chiama la Grecia "EL" e la BCE "GR": la colonna serve a quello.
PAESI = {
    #  codice BCE   nome              codice Eurostat
    "U2": ("Area euro",   "EA20"),
    "AT": ("Austria",     "AT"),
    "BE": ("Belgio",      "BE"),
    "BG": ("Bulgaria",    "BG"),
    "HR": ("Croazia",     "HR"),
    "CY": ("Cipro",       "CY"),
    "EE": ("Estonia",     "EE"),
    "FI": ("Finlandia",   "FI"),
    "FR": ("Francia",     "FR"),
    "DE": ("Germania",    "DE"),
    "GR": ("Grecia",      "EL"),
    "IE": ("Irlanda",     "IE"),
    "IT": ("Italia",      "IT"),
    "LV": ("Lettonia",    "LV"),
    "LT": ("Lituania",    "LT"),
    "LU": ("Lussemburgo", "LU"),
    "MT": ("Malta",       "MT"),
    "NL": ("Paesi Bassi", "NL"),
    "PT": ("Portogallo",  "PT"),
    "SK": ("Slovacchia",  "SK"),
    "SI": ("Slovenia",    "SI"),
    "ES": ("Spagna",      "ES"),
}

# Le categorie Eurostat che corrispondono alle voci di spesa dell'app.
# Sono indici: 100 = media dell'Unione Europea.
CATEGORIE = {
    "casa":       "A0104",   # abitazione, acqua, luce, gas
    "spesa":      "A0101",   # cibo e bevande
    "trasporti":  "A0107",
    "salute":     "A0106",
    "shopping":   "A0103",   # vestiti e scarpe
    "uscite":     "A0111",   # ristoranti e alberghi
    "generale":   "A01",     # tutti i consumi delle famiglie
}

TASSI = {
    "deposito": ("FM/D.U2.EUR.4F.KR.DFR.LEV",
                 "Tasso sui depositi: quanto rende il denaro parcheggiato in BCE"),
    "rifinanziamento": ("FM/D.U2.EUR.4F.KR.MRR_FR.LEV",
                        "Tasso di rifinanziamento: la base dei mutui e dei prestiti"),
}


def scarica(url):
    try:
        with urllib.request.urlopen(url, timeout=45) as r:
            return r.read().decode("utf-8")
    except (urllib.error.URLError, TimeoutError) as e:
        print(f"    non raggiungibile ({e})")
        return None


def serie_bce(percorso, quante=1):
    """Una serie dalla BCE. Restituisce [(periodo, valore), ...] dal più vecchio."""
    testo = scarica(f"{BCE}/{percorso}?lastNObservations={quante}&format=csvdata")
    if not testo:
        return []
    righe = testo.strip().splitlines()
    if len(righe) < 2:
        return []

    intestazione = righe[0].split(",")
    i_periodo = intestazione.index("TIME_PERIOD")
    i_valore = intestazione.index("OBS_VALUE")

    fuori = []
    for riga in righe[1:]:
        campi = riga.split(",")
        try:
            fuori.append((campi[i_periodo], float(campi[i_valore])))
        except (IndexError, ValueError):
            continue
    return fuori


def prezzi_eurostat(categoria):
    """Livello dei prezzi per paese in una categoria. 100 = media UE."""
    url = (f"{EUROSTAT}/prc_ppp_ind?format=JSON&lang=EN"
           f"&na_item=PLI_EU27_2020&ppp_cat={categoria}&lastTimePeriod=1")
    testo = scarica(url)
    if not testo:
        return {}, None

    dati = json.loads(testo)
    geo = dati["dimension"]["geo"]["category"]["index"]
    per_posizione = {posizione: codice for codice, posizione in geo.items()}
    anno = list(dati["dimension"]["time"]["category"]["label"].values())[0]

    fuori = {}
    for posizione, valore in dati["value"].items():
        codice = per_posizione.get(int(posizione))
        if codice:
            fuori[codice] = valore
    return fuori, anno


def mesi_fa(periodo):
    """Quanti mesi ci separano da un dato tipo '2026-06'."""
    try:
        anno, mese = (int(x) for x in periodo.split("-")[:2])
    except ValueError:
        return 999
    oggi = date.today()
    return (oggi.year - anno) * 12 + (oggi.month - mese)


def main():
    print("BCE — inflazione, paese per paese…")
    inflazione = {}
    for codice, (nome, _) in PAESI.items():
        serie = serie_bce(f"HICP/M.{codice}.N.000000.4D0.ANR", quante=13)
        if not serie:
            print(f"  {nome}: nessun dato — lo salto")
            continue
        periodo, valore = serie[-1]
        inflazione[codice] = {
            "valore": valore,
            "periodo": periodo,
            "anno": [v for _, v in serie],    # ultimi 13 mesi, per la tendenza
        }
        print(f"  {nome}: {valore}%  ({periodo})")

    print("\nBCE — tassi ufficiali…")
    tassi = {}
    for chiave, (percorso, spiegazione) in TASSI.items():
        serie = serie_bce(percorso)
        if not serie:
            continue
        periodo, valore = serie[-1]
        tassi[chiave] = {"valore": valore, "dal": periodo, "spiegazione": spiegazione}
        print(f"  {chiave}: {valore}%  (dal {periodo})")

    print("\nEurostat — quanto costa vivere, voce per voce…")
    grezzi, anno_prezzi = {}, None
    for voce, categoria in CATEGORIE.items():
        valori, anno = prezzi_eurostat(categoria)
        anno_prezzi = anno_prezzi or anno
        grezzi[voce] = valori
        print(f"  {voce}: {len(valori)} paesi  ({anno})")

    if "IT" not in grezzi.get("generale", {}):
        raise SystemExit(
            "\nEurostat non risponde per l'Italia: mi fermo invece di scrivere\n"
            "un file monco. L'Italia è il riferimento su cui scaliamo tutto."
        )

    # Il cuore: quanto costa ogni voce RISPETTO all'Italia. I prezzi italiani
    # nell'app sono studiati città per città; da lì si arriva a ogni paese
    # moltiplicando per questo numero. 1.0 = come l'Italia.
    prezzi = {}
    for codice, (nome, codice_eurostat) in PAESI.items():
        rispetto = {}
        for voce, valori in grezzi.items():
            italia = valori.get("IT")
            suo = valori.get(codice_eurostat)
            if italia and suo:
                rispetto[voce] = round(suo / italia, 3)
        if rispetto:
            prezzi[codice] = rispetto

    dati = {
        "aggiornato": datetime.now().strftime("%Y-%m-%d"),
        "fonti": {
            "inflazione": "Banca Centrale Europea — data-api.ecb.europa.eu",
            "prezzi": f"Eurostat — livelli di prezzo comparati, {anno_prezzi}",
        },
        "paesi": {c: n for c, (n, _) in PAESI.items()},
        "inflazione": inflazione,
        "tassi": tassi,
        "prezzi": prezzi,     # 1.0 = come l'Italia
    }

    corpo = json.dumps(dati, ensure_ascii=False, indent=2)
    (ROOT / "app" / "js" / "europa.js").write_text(
        "/* Generato da dati-europa.py — non modificare a mano.\n"
        f"   Numeri ufficiali di BCE ed Eurostat, presi il {dati['aggiornato']}.\n"
        "   Per aggiornarli: python3 dati-europa.py, poi commit e push. */\n\n"
        f"const EUROPA = {corpo};\n",
        encoding="utf-8",
    )

    print(f"\n✓ app/js/europa.js scritto: {len(inflazione)} paesi")
    if "U2" in inflazione:
        u2 = inflazione["U2"]
        print(f"  inflazione area euro: {u2['valore']}% ({u2['periodo']})")
        ritardo = mesi_fa(u2["periodo"])
        if ritardo > 3:
            print(
                f"\n⚠️  L'ultimo dato sull'inflazione ha {ritardo} mesi. È troppo:\n"
                "   quasi certamente la BCE ha spostato la serie da un'altra parte.\n"
                "   Non fidarti di questi numeri finché non hai controllato."
            )

    caro = sorted(prezzi.items(), key=lambda x: -x[1].get("generale", 0))
    print("\n  vivere costa, rispetto all'Italia:")
    for codice, voci in caro[:3] + caro[-3:]:
        print(f"    {PAESI[codice][0]:<14} {voci.get('generale', 0):>5.0%}"
              f"   (casa {voci.get('casa', 0):.0%})")


if __name__ == "__main__":
    main()
