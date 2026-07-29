#!/usr/bin/env python3
"""
PRIMO EURO — build di un file unico e autonomo.

Prende index.html + css + js e produce un solo file HTML con TUTTO dentro
(font e GSAP compresi), che funziona anche offline con un doppio click e
si può spedire per email o WhatsApp.

    python3 build-standalone.py

Produce:
  dist/primo-euro.html        documento completo, da aprire con doppio click
  dist/artifact-body.html     stessa pagina senza <html>/<head>/<body>,
                              per la pubblicazione come link condivisibile
"""

import base64
import pathlib
import re
import urllib.request

ROOT = pathlib.Path(__file__).parent
APP = ROOT
DIST = ROOT / "dist"

GSAP_URL = "https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"
FONTS_URL = (
    "https://fonts.googleapis.com/css2"
    "?family=Space+Grotesk:wght@400;500;600;700"
    "&family=Inter:wght@400;500;600&display=swap"
)
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36"


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req) as r:
        return r.read()


def inline_fonts() -> str:
    """Scarica i font e li incorpora come data URI: niente CDN, niente fallback
    silenziosi. Teniamo solo il sottoinsieme latino, basta per l'italiano."""
    css = fetch(FONTS_URL).decode("utf-8")
    blocks = []
    for comment, block in re.findall(r"/\*\s*([\w-]+)\s*\*/\s*(@font-face\s*\{[^}]*\})", css):
        if comment != "latin":
            continue
        url_match = re.search(r"url\((https://[^)]+\.woff2)\)", block)
        if not url_match:
            continue
        data = base64.b64encode(fetch(url_match.group(1))).decode("ascii")
        blocks.append(block.replace(url_match.group(1), f"data:font/woff2;base64,{data}"))
    print(f"  font incorporati: {len(blocks)}")
    return "\n".join(blocks)


def build() -> None:
    """La vecchia dashboard desktop (ora archiviata su dashboard.html)."""
    html = (APP / "dashboard.html").read_text(encoding="utf-8")

    print("Scarico font e GSAP…")
    fonts_css = inline_fonts()
    gsap = fetch(GSAP_URL).decode("utf-8")
    site_css = (APP / "css" / "style.css").read_text(encoding="utf-8")

    # 1. via i tag verso l'esterno (preconnect + Google Fonts)
    html = re.sub(r'\s*<link rel="preconnect"[^>]*>', "", html)
    html = re.sub(r'\s*<link href="https://fonts\.googleapis[^>]*>', "", html)

    # 2. il CSS del sito, con i font davanti, diventa un blocco <style>
    html = html.replace(
        '<link rel="stylesheet" href="css/style.css" />',
        f"<style>\n{fonts_css}\n\n{site_css}\n</style>",
    )

    # 3. GSAP e tutti gli script locali finiscono dentro la pagina
    html = html.replace(
        f'<script src="{GSAP_URL}" defer></script>',
        f"<script>\n{gsap}\n</script>",
    )
    for name in ("config", "data", "engine", "bg", "app", "auth"):
        code = (APP / "js" / f"{name}.js").read_text(encoding="utf-8")
        html = html.replace(
            f'<script src="js/{name}.js" defer></script>',
            f"<script>\n{code}\n</script>",
        )

    leftovers = re.findall(r'<(?:script|link)[^>]*(?:src|href)="(?!data:)[^"]+"', html)
    if leftovers:
        raise SystemExit(f"Risorse esterne rimaste, il file non è autonomo: {leftovers}")

    DIST.mkdir(exist_ok=True)
    (DIST / "primo-euro.html").write_text(html, encoding="utf-8")

    # versione per la pubblicazione: solo il contenuto, senza involucro
    body = re.search(r"<body>(.*)</body>", html, re.S).group(1)
    head_bits = re.search(r"(<style>.*?</style>)", html, re.S).group(1)
    title = "<title>PRIMO EURO — Il tuo primo euro messo da parte</title>"
    (DIST / "artifact-body.html").write_text(f"{title}\n{head_bits}\n{body}", encoding="utf-8")

    for f in ("primo-euro.html", "artifact-body.html"):
        print(f"  {f}: {(DIST / f).stat().st_size / 1024:.0f} KB")


def build_mobile(demo: bool = False) -> None:
    """L'app mobile (Sogno → Risveglio → Azione) in un file solo,
    pronta anche per essere pubblicata come pagina condivisibile.

    Con demo=True l'app riparte sempre dalla schermata Sogno: serve a
    mostrare il percorso intero a chi ha già un piano salvato nel
    browser. Il sito vero riprende invece il piano dove era rimasto."""
    html = (APP / "index.html").read_text(encoding="utf-8")

    if demo:
        html = html.replace("const RIPRENDI = true;", "const RIPRENDI = false;  /* anteprima */")
        print("  (anteprima: si riparte sempre dal Sogno)")

    print("App mobile: scarico i font…")
    fonts_css = inline_fonts()

    html = re.sub(r'\s*<link rel="preconnect"[^>]*>', "", html)
    html = re.sub(r'\s*<link href="https://fonts\.googleapis[^>]*>', "", html)
    html = html.replace("<style>", f"<style>\n{fonts_css}\n", 1)

    # i tag possono avere una versione (?v=...) per non restare in cache:
    # qui dentro non serve, il file è unico e si porta tutto appresso
    for name in ("europa", "sogni", "data", "engine"):
        code = (APP / "js" / f"{name}.js").read_text(encoding="utf-8")
        html = re.sub(rf'<script src="js/{name}\.js(\?[^"]*)?"></script>',
                      lambda _m, c=code: f"<script>\n{c}\n</script>", html)

    leftovers = re.findall(r'<(?:script|link)[^>]*(?:src|href)="(?!data:)[^"]+"', html)
    if leftovers:
        raise SystemExit(f"Risorse esterne rimaste: {leftovers}")

    DIST.mkdir(exist_ok=True)
    (DIST / "app.html").write_text(html, encoding="utf-8")

    body = re.search(r"<body>(.*)</body>", html, re.S).group(1)
    style = re.search(r"(<style>.*?</style>)", html, re.S).group(1)
    title = "<title>Il tuo sogno, in giorni</title>"
    (DIST / "app-body.html").write_text(f"{title}\n{style}\n{body}", encoding="utf-8")

    for f in ("app.html", "app-body.html"):
        print(f"  {f}: {(DIST / f).stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    import sys
    demo = "--demo" in sys.argv
    if "--mobile" in sys.argv:
        build_mobile(demo)
    else:
        build()
        build_mobile(demo)
    print("Fatto ✓")
