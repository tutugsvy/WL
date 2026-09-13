/* ==========================================================================
   WALLSTREET.EXE — config.js
   ---------------------------------------------------------------------------
   SATU-SATUNYA FILE YANG PERLU KAMU EDIT SETELAH LAUNCH.
   (The only file you need to edit after launch.)

   1. TOKEN.address   → ganti 0x000… dengan alamat kontrak $WSEX setelah launch.
                        Begitu alamat diisi, situs otomatis:
                        - menarik harga asli, 24h change, volume, FDV, chart OHLCV
                        - mengaktifkan tombol BUY / VIEW CHART
                        - menghitung $WSEX HELD saat wallet konek
   2. PRICE.source    → "geckoterminal" (default, bisa dipanggil langsung dari
                        browser, sudah mengindeks token Pons sejak bonding curve),
                        "dexscreener" (hanya setelah graduasi ke Uniswap), atau
                        "pons" (API ponsfamily.com — TIDAK mengirim header CORS,
                        jadi butuh PRICE.pons.corsProxy).
   3. PRODUCT         → teks "kenapa $WSEX punya value": headline, pitch,
                        fitur + status (LIVE / BUILDING / PLANNED), utility.
   4. LINKS           → link beli, chart, X, Telegram.

   Placeholder {address} di URL diganti otomatis dengan TOKEN.address.
   ========================================================================== */
window.WSEX_CONFIG = {
  TOKEN: {
    address: "0x0000000000000000000000000000000000000000", // ← ISI SETELAH LAUNCH
    symbol: "WSEX",
    name: "WALLSTREET.EXE",
    decimals: 18,
    totalSupply: 1_000_000_000,
  },

  CHAIN: {
    id: 4663,
    hexId: "0x1237",
    name: "Robinhood Chain",
    rpc: "https://rpc.mainnet.chain.robinhood.com",
    explorer: "https://robinhoodchain.blockscout.com",
    currency: { name: "Ether", symbol: "ETH", decimals: 18 },
    // Alamat WETH di Robinhood Chain — dipakai untuk harga ETH/USD.
    weth: "0x0bd7d308f8e1639fab988df18a8011f41eacad73",
    // Slug jaringan di aggregator.
    geckoTerminalNetwork: "robinhood",
    dexscreenerChain: "robinhood",
  },

  PRICE: {
    source: "geckoterminal", // "geckoterminal" | "dexscreener" | "pons"
    refreshMs: 30_000,       // GeckoTerminal free tier ≈ 30 req/menit → jangan < 15000
    pons: {
      chartUrl: "https://www.ponsfamily.com/api/pons-v2-market/{address}/chart?range=1h",
      // Contoh proxy: "https://corsproxy.io/?" → URL akhir = corsProxy + encodeURIComponent(chartUrl)
      corsProxy: "",
    },
  },

  // Token lain yang ikut dihitung dalam TOTAL VALUE saat wallet konek
  // (selain ETH native + $WSEX). Dibaca via RPC balanceOf, harga via GeckoTerminal.
  HOLDINGS: {
    watchlist: [
      { symbol: "USDG", address: "0x5fc5360d0400a0fd4f2af552add042d716f1d168", decimals: 6 },
      { symbol: "WETH", address: "0x0bd7d308f8e1639fab988df18a8011f41eacad73", decimals: 18 },
      { symbol: "NVDA", address: "0xd0601ce157db5bdc3162bbac2a2c8af5320d9eec", decimals: 18 },
      { symbol: "SPCX", address: "0x4a0E65A3EcceC6dBe60AE065F2e7bb85Fae35eEa", decimals: 18 },
      { symbol: "TSLA", address: "0x322F0929c4625eD5bAd873c95208D54E1c003b2d", decimals: 18 },
      { symbol: "AMZN", address: "0x12f190a9F9d7D37a250758b26824B97CE941bF54", decimals: 18 },
      { symbol: "SPY", address: "0x117cc2133c37B721F49dE2A7a74833232B3B4C0C", decimals: 18 },
      { symbol: "AAPL", address: "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9", decimals: 18 },
    ],
    // Coba juga ambil SEMUA token ERC-20 wallet dari Blockscout (best-effort;
    // Blockscout kadang diblokir Cloudflare → otomatis dilewati).
    useBlockscout: true,
    // TERMINAL PRO: minimal $WSEX yang harus dipegang untuk status PRO.
    proMinHold: 1_000_000,
  },

  LINKS: {
    buy: "https://www.ponsfamily.com/launchpad/{address}",
    chart: "https://www.geckoterminal.com/robinhood/tokens/{address}",
    x: "",
    telegram: "",
  },

  /* ------------------------------------------------------------------------
     PRODUCT — "kenapa $WSEX punya value".
     Edit bebas. status: "LIVE" | "BUILDING" | "PLANNED"
     ------------------------------------------------------------------------ */
  PRODUCT: {
    eyebrow: "// PRODUCT.SYS",
    headline: "THE TERMINAL IS THE PRODUCT.",
    pitch: [
      "Robinhood Chain is the first chain where NVDA, TSLA and AAPL trade 24/7 as tokens. It has DEXs and wallets — but no terminal.",
      "WALLSTREET.EXE is that terminal: a Bloomberg-style, retro trading desk that reads real balances, real prices and real charts straight from the chain. No signup. No custody. Connect a wallet and it runs.",
      "$WSEX is the access key. Hold it, and the terminal unlocks.",
    ],
    features: [
      { status: "LIVE", name: "WALLET CONNECT → REAL PORTFOLIO", desc: "Connect any EVM wallet. TOTAL VALUE is computed from real on-chain holdings on Robinhood Chain: ETH, $WSEX, stock tokens, stablecoins." },
      { status: "LIVE", name: "LIVE $WSEX FEED", desc: "Price, 24h change, volume, FDV and OHLCV chart pulled from on-chain DEX data (GeckoTerminal / Dexscreener / Pons) the moment the contract goes live." },
      { status: "BUILDING", name: "STOCK TOKEN WATCHLIST", desc: "Replace the simulated tape with real Robinhood Chain stock tokens (NVDA, TSLA, AAPL, SPY…) — 24/7 prices, no market hours." },
      { status: "BUILDING", name: "TERMINAL PRO (TOKEN-GATED)", desc: "Whale feed, price alerts, PnL tracker and multi-wallet view. Unlocked by holding $WSEX — verified with a balanceOf call, no account needed." },
      { status: "PLANNED", name: "FEE FLYWHEEL", desc: "Creator trading fees from the Pons launch flow into a public treasury wallet used for buybacks and product development. Every transaction is visible on-chain." },
      { status: "PLANNED", name: "AGENT MODE", desc: "An open API + MCP endpoint so AI agents can query the terminal. Robinhood is pushing agentic trading; WALLSTREET.EXE speaks that language." },
    ],
    utility: [
      { k: "ACCESS", v: "Hold $WSEX → unlock TERMINAL PRO" },
      { k: "FEES", v: "Launch fees → treasury → buybacks" },
      { k: "NETWORK", v: "Robinhood Chain native, day one" },
      { k: "CULTURE", v: "The meme is the marketing" },
    ],
  },
};
