# WALLSTREET.EXE — $WSEX

> The market was never meant to run this way.

Static website + visual identity for **WALLSTREET.EXE**, a fictional corrupted Wall Street trading terminal from the late-90s that came back online.

## Stack

Plain HTML / CSS / JavaScript. No build step, no dependencies. Deployable directly to GitHub Pages.

```
index.html   page structure
styles.css   design system (CRT / Win98 / Bloomberg terminal aesthetic)
app.js       boot sequence, live tickers, candlestick charts, draggable desktop, interactive terminal
assets/      generated visual identity (logo, favicon, token image, PFP, skyline, bull/bear, CRT, warning popup)
```

## Run locally

```
python3 -m http.server 8080
```

Open http://localhost:8080.

## Brand assets

| File | Use |
| --- | --- |
| `assets/logo.png` | Master logo, 1024×1024, transparent |
| `assets/pfp-1024.png` | X profile picture (dark square background) |
| `assets/token-512.png` | Token image |
| `assets/favicon-32.png` / `favicon-64.png` | Favicon |

## Terminal commands

Type in the TERMINAL window on the desktop: `HELP`, `MARKET`, `BUY`, `SELL`, `HOLD`, `PANIC`, `STATUS`, `CONTRACT`, `DIR`, `CLEAR`, `EXIT`.

---

Fictional software. Not financial advice. Not a regulated financial product.
