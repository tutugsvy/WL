window.OWN_CONFIG = {
  TOKEN: {
    address: "0xE09e97A5F644d376cbE388D66cb77a1692fa0C20",
    symbol: "OWN",
    name: "Own Vault",
    decimals: 18,
    totalSupply: 1_000_000_000,
  },

  CHAIN: {
    id: 5042,
    hexId: "0x13b2",
    name: "Arc",
    rpc: "https://argus.world/rpc",
    explorer: "https://explorer.arc.network",
    currency: { name: "USD Coin", symbol: "USDC", decimals: 18 },
    
    weth: "",
    
    geckoTerminalNetwork: "arc",
    dexscreenerChain: "arc",
  },

    PRICE: {
    source: "argus",
    refreshMs: 15_000,
    argus: {
      tokenUrl: "/api/argus/{address}",
      corsProxy: "",
    },
  },

  
  
  HOLDINGS: {
    watchlist: [
      { symbol: "NVDA", address: "0xd0601ce157db5bdc3162bbac2a2c8af5320d9eec", decimals: 18 },
      { symbol: "SPCX", address: "0x4a0E65A3EcceC6dBe60AE065F2e7bb85Fae35eEa", decimals: 18 },
      { symbol: "TSLA", address: "0x322F0929c4625eD5bAd873c95208D54E1c003b2d", decimals: 18 },
      { symbol: "AMZN", address: "0x12f190a9F9d7D37a250758b26824B97CE941bF54", decimals: 18 },
      { symbol: "SPY", address: "0x117cc2133c37B721F49dE2A7a74833232B3B4C0C", decimals: 18 },
      { symbol: "AAPL", address: "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9", decimals: 18 },
    ],
    
    
    useBlockscout: true,
    
    proMinHold: 1_000_000,
  },

  LINKS: {
    buy: "https://argus.world/token/{address}",
    chart: "https://argus.world/token/{address}",
    x: "",
    telegram: "",
  },

  
  PRODUCT: {
    eyebrow: "// PRODUCT.SYS",
    headline: "THE TERMINAL IS THE PRODUCT.",
    pitch: [
      "Arc is the chain where tokenized markets and vault assets move 24/7 with native USDC for gas and settlement.",
      "WALLSTREET.EXE is that terminal: a Bloomberg-style, retro trading desk that reads real balances, real prices and real charts straight from Arc. No signup. No custody. Connect a wallet and it runs.",
      "$OWN is the access key. Hold it, and the terminal unlocks.",
    ],
    features: [
      { status: "LIVE", name: "WALLET CONNECT → REAL PORTFOLIO", desc: "Connect any EVM wallet. TOTAL VALUE is computed from real on-chain holdings on Arc: native USDC, tokenized assets, stablecoins." },
      { status: "LIVE", name: "LIVE $OWN FEED", desc: "Price, 24h change, volume, FDV and chart data from Argus for the live Arc token market." },
      { status: "BUILDING", name: "ARC TOKEN WATCHLIST", desc: "Track Arc assets with native USDC settlement and 24/7 market data." },
      { status: "BUILDING", name: "TERMINAL PRO (TOKEN-GATED)", desc: "Whale feed, price alerts, PnL tracker and multi-wallet view. Unlocked by holding $OWN — verified with a balanceOf call, no account needed." },
      { status: "PLANNED", name: "FEE FLYWHEEL", desc: "Creator trading fees from the Argus launch flow into a public treasury wallet used for buybacks and product development. Every transaction is visible on-chain." },
      { status: "PLANNED", name: "AGENT MODE", desc: "An open API + MCP endpoint so AI agents can query the terminal. Arc is pushing agentic trading; WALLSTREET.EXE speaks that language." },
    ],
    utility: [
      { k: "ACCESS", v: "Hold $OWN → unlock TERMINAL PRO" },
      { k: "FEES", v: "Launch fees → treasury → buybacks" },
      { k: "NETWORK", v: "Arc native USDC on Arc" },
      { k: "CULTURE", v: "The meme is the marketing" },
    ],
  },
};
