#!/usr/bin/env python3
"""
PRIMO EURO — il dizionario dei sogni.

Legge sogni.csv (che si apre con Excel, si ordina, si modifica) e lo
trasforma in js/sogni.js, il file che l'app carica.

    python3 costruisci-sogni.py

Il CSV è la fonte di verità: il file JavaScript non va toccato a mano,
viene riscritto ogni volta.

Colonne:
  categoria   per raggrupparle in Excel (Viaggi, Casa, Salute…)
  emoji       una sola, quella che compare nel contatore
  nome        come lo dice l'app: "Di solito <nome> costa più o meno così"
  costo       euro, numero intero — oppure la parola "fondo" per le voci
              che si calcolano sulle spese vere della persona
  parole      le parole che fanno scattare la voce, separate da |
  priorita    0 normale. Alza a 1 o 2 quando questa voce deve vincere anche
              se un'altra ha una parola più lunga: "aprire un chiosco sulla
              spiaggia" è un lavoro, non una vacanza al mare
  nota        cosa comprende la cifra: serve a noi, non all'utente

L'ordine delle righe non conta: quando due voci potrebbero corrispondere,
l'app sceglie quella con la parola più lunga ("anticipo casa" batte "casa"),
e la priorità serve a ribaltare il verdetto dove il buon senso lo chiede.
Così il CSV si può ordinare come si vuole senza rompere niente.
"""

import csv
import json
import pathlib
import re
import unicodedata

ROOT = pathlib.Path(__file__).parent
CSV = ROOT / "sogni.csv"
USCITA = ROOT / "js" / "sogni.js"


def normalizza(t):
    """minuscolo e senza accenti: 'Perù' e 'peru' devono agganciare uguale"""
    t = unicodedata.normalize("NFD", t.lower())
    return "".join(c for c in t if unicodedata.category(c) != "Mn")


def main():
    if not CSV.exists():
        raise SystemExit(f"Manca {CSV.name}: è il file da cui nasce tutto.")

    voci, problemi = [], []
    viste = {}

    with CSV.open(encoding="utf-8-sig", newline="") as f:
        for n, riga in enumerate(csv.DictReader(f, delimiter=";"), start=2):
            categoria = (riga.get("categoria") or "").strip()
            nome = (riga.get("nome") or "").strip()
            emoji = (riga.get("emoji") or "✨").strip()
            grezzo = (riga.get("costo") or "").strip().lower()
            parole = [normalizza(p).strip() for p in (riga.get("parole") or "").split("|") if p.strip()]
            nota = (riga.get("nota") or "").strip()

            if not nome or not parole:
                problemi.append(f"riga {n}: manca il nome o le parole — la salto")
                continue

            voce = {"cat": categoria, "emoji": emoji, "what": nome, "k": parole}

            try:
                p = int((riga.get("priorita") or "0").strip() or 0)
            except ValueError:
                problemi.append(f"riga {n} ({nome}): priorità illeggibile — la tratto come 0")
                p = 0
            if p:
                voce["p"] = p

            if grezzo == "fondo":
                voce["dynamic"] = "fondo"      # si calcola sulle spese vere
                voce["cost"] = 3600            # ripiego se il piano non c'è ancora
            else:
                cifra = re.sub(r"[^\d]", "", grezzo)
                if not cifra:
                    problemi.append(f"riga {n} ({nome}): costo illeggibile «{grezzo}» — la salto")
                    continue
                voce["cost"] = int(cifra)

            if nota:
                voce["nota"] = nota

            for p in parole:
                if p in viste:
                    problemi.append(f"riga {n}: «{p}» era già in «{viste[p]}» — vince la parola più lunga")
                else:
                    viste[p] = nome

            voci.append(voce)

    if not voci:
        raise SystemExit("Nessuna voce valida: controlla il CSV.")

    per_categoria = {}
    for v in voci:
        per_categoria[v["cat"]] = per_categoria.get(v["cat"], 0) + 1

    corpo = json.dumps(voci, ensure_ascii=False, indent=1)
    USCITA.write_text(
        "/* Generato da costruisci-sogni.py — non modificare a mano.\n"
        "   Si cambia sogni.csv (si apre con Excel), poi si rilancia lo script. */\n\n"
        f"const SOGNI = {corpo};\n",
        encoding="utf-8",
    )

    print(f"✓ js/sogni.js: {len(voci)} sogni, {len(viste)} parole chiave")
    for cat, n in sorted(per_categoria.items(), key=lambda x: -x[1]):
        print(f"    {cat or '(senza categoria)':<14} {n}")

    if problemi:
        print(f"\n  da guardare ({len(problemi)}):")
        for p in problemi[:12]:
            print(f"    {p}")
        if len(problemi) > 12:
            print(f"    …e altri {len(problemi) - 12}")


if __name__ == "__main__":
    main()
