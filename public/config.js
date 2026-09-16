window.WSEX_CONFIG = {
  TOKEN: {
    address: "0xa5af66ba606e2a322db1695f0eb7181bb7cd6d70",
    symbol: "WSEX",
    name: "WALLSTREET.EXE",
    decimals: 18,
    totalSupply: 1_000_000_000,
  },

  CHAIN: {
    id: 5042,
    hexId: "0x13b2",
    name: "Arc",
    rpc: "/api/rpc",
    walletRpc: "https://argus.world/rpc",
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
      { symbol: "ARGUS", address: "0xeCe5cA8bf9220718E5727754026757512212cb3c", decimals: 18 },
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
      "$WSEX is the access key. Hold it, and the terminal unlocks.",
    ],
    features: [
      { status: "LIVE", name: "WALLET CONNECT → REAL PORTFOLIO", desc: "Connect any EVM wallet. TOTAL VALUE is computed from real on-chain holdings on Arc: native USDC, tokenized assets, stablecoins." },
      { status: "LIVE", name: "LIVE $WSEX FEED", desc: "Price, 24h change, volume, FDV and chart data from Argus for the live Arc token market." },
      { status: "BUILDING", name: "ARC TOKEN WATCHLIST", desc: "Track Arc assets with native USDC settlement and 24/7 market data." },
      { status: "BUILDING", name: "TERMINAL PRO (TOKEN-GATED)", desc: "Whale feed, price alerts, PnL tracker and multi-wallet view. Unlocked by holding $WSEX — verified with a balanceOf call, no account needed." },
      { status: "PLANNED", name: "FEE FLYWHEEL", desc: "Creator trading fees from the Argus launch flow into a public treasury wallet used for buybacks and product development. Every transaction is visible on-chain." },
      { status: "PLANNED", name: "AGENT MODE", desc: "An open API + MCP endpoint so AI agents can query the terminal. Arc is pushing agentic trading; WALLSTREET.EXE speaks that language." },
    ],
    utility: [
      { k: "ACCESS", v: "Hold $WSEX → unlock TERMINAL PRO" },
      { k: "FEES", v: "Launch fees → treasury → buybacks" },
      { k: "NETWORK", v: "Arc native USDC on Arc" },
      { k: "CULTURE", v: "The meme is the marketing" },
    ],
  },
};
