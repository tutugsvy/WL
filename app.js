(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const pad = (n) => String(n).padStart(2, "0");
  const fmtPct = (v) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
  const fmtUsd = (v, d = 2) => "$" + v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  const fmtPrice = (p) => {
    if (!Number.isFinite(p)) return "—";
    if (p >= 1000) return p.toLocaleString("en-US", { maximumFractionDigits: 2 });
    if (p >= 1) return p.toFixed(2);
    if (p >= 0.01) return p.toFixed(4);
    if (p <= 0) return "0.0000";
    return p.toFixed(Math.min(18, -Math.floor(Math.log10(p)) + 2));
  };
  const fmtBig = (v) => !Number.isFinite(v) || v === 0 ? "—" : v >= 1e9 ? "$" + (v / 1e9).toFixed(2) + "B" : v >= 1e6 ? "$" + (v / 1e6).toFixed(2) + "M" : v >= 1e3 ? "$" + (v / 1e3).toFixed(1) + "K" : "$" + v.toFixed(2);
  const fmtQty = (q) => q >= 1e6 ? q.toLocaleString("en-US", { maximumFractionDigits: 0 }) : q >= 1 ? q.toLocaleString("en-US", { maximumFractionDigits: 4 }) : q.toLocaleString("en-US", { maximumFractionDigits: 6 });
  const shortAddr = (a) => a ? a.slice(0, 6) + "…" + a.slice(-4) : "";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = () => window.matchMedia("(max-width: 900px)").matches;

  const GREEN = "#3dff7a", RED = "#ff4d4d", GRAY = "#8a939c", DIM = "rgba(61,255,122,0.08)";

  const CFG = window.WSEX_CONFIG || {};
  const TOKEN = Object.assign({ address: "0x0000000000000000000000000000000000000000", symbol: "WSEX", decimals: 18, totalSupply: 1e9 }, CFG.TOKEN);
  const CHAIN = Object.assign({ id: 4663, hexId: "0x1237", name: "Robinhood Chain", rpc: "https://rpc.mainnet.chain.robinhood.com", explorer: "https://robinhoodchain.blockscout.com", currency: { name: "Ether", symbol: "ETH", decimals: 18 }, weth: "", geckoTerminalNetwork: "robinhood", dexscreenerChain: "robinhood" }, CFG.CHAIN);
  const PRICE = Object.assign({ source: "geckoterminal", refreshMs: 30000, pons: { chartUrl: "", corsProxy: "" } }, CFG.PRICE);
  const HOLD = Object.assign({ watchlist: [], useBlockscout: true, proMinHold: 0 }, CFG.HOLDINGS);
  const LINKS = Object.assign({ buy: "", chart: "", x: "", telegram: "" }, CFG.LINKS);
  const PRODUCT = CFG.PRODUCT || null;
  const ZERO = "0x0000000000000000000000000000000000000000";
  const isAddr = (a) => /^0x[0-9a-fA-F]{40}$/.test(a || "") && a.toLowerCase() !== ZERO;
  const LAUNCHED = isAddr(TOKEN.address);
  const withAddr = (url) => (url || "").replace(/\{address\}/g, TOKEN.address);
  const S = { feed: null, wallet: null };

  const getJSON = async (url, ms = 9000) => {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), ms);
    try {
      const r = await fetch(url, { signal: ctl.signal, headers: { accept: "application/json" } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } finally { clearTimeout(t); }
  };
async function refreshRealMarketData() {
  try {
    const assets = CFG.MARKET_DATA?.assets || [];

    if (!assets.length) return;

    const addresses = assets
      .map(a => a.address)
      .filter(isAddr)
      .map(a => a.toLowerCase());

    if (!addresses.length) return;

    const url =
      `${GT}/simple/networks/${CHAIN.geckoTerminalNetwork}/token_price/` +
      `${addresses.join(",")}?include_24hr_price_change=true`;

    const res = await getJSON(url);

    const attrs = res?.data?.attributes || {};
    const prices = attrs.token_prices || {};
    const changes = attrs.h24_price_change_percentage || {};

    for (const asset of assets) {
      const market = MARKETS.find(
        m => m.sym === asset.symbol
      );

      if (!market) continue;

      const address = asset.address.toLowerCase();

      const price = Number(prices[address]);
      const change = Number(changes[address]);

      if (Number.isFinite(price)) {
        market.price = price;
        market.real = true;
      }

      if (Number.isFinite(change)) {
        market.chg = change;
      }
    }

    document.dispatchEvent(new CustomEvent("wsex:market"));

  } catch (err) {
    console.error("REAL MARKET DATA ERROR:", err);
  }
}
const MARKETS = [
  {
    sym: "WSEX",
    name: "WALLSTREET.EXE",
    price: 0,
    chg: 0,
    vol: 0,
    kind: "crypto",
  },
  {
    sym: "NVDA",
    name: "NVIDIA",
    price: 0,
    chg: 0,
    vol: 0,
    kind: "eq",
  },
  {
    sym: "AAPL",
    name: "APPLE",
    price: 0,
    chg: 0,
    vol: 0,
    kind: "eq",
  },
  {
    sym: "TSLA",
    name: "TESLA",
    price: 0,
    chg: 0,
    vol: 0,
    kind: "eq",
  },
  {
    sym: "AMZN",
    name: "AMAZON",
    price: 0,
    chg: 0,
    vol: 0,
    kind: "eq",
  },
  {
    sym: "SPY",
    name: "SPDR S&P 500 ETF",
    price: 0,
    chg: 0,
    vol: 0,
    kind: "eq",
  },
];

  const boot = $("#boot");
  const bootBar = $("#bootBar");
  const bootStatus = $("#bootStatus");
  const bootSteps = [
    "LOADING SYSTEM...",
    "MOUNTING C:\\WALLSTREET",
    "CONNECTING TO MARKETS...",
    "LOADING SECURITIES...",
    "VOLATILITY DETECTED...",
    "SYSTEM STATUS: ONLINE",
  ];
  let bootDone = false;
  const finishBoot = () => {
    if (bootDone) return;
    bootDone = true;
    boot.classList.add("is-done");
    setTimeout(() => boot.remove(), 600);
    startHeroTyping();
  };
  if (reduced) {
    finishBoot();
  } else {
    let i = 0;
    const tick = () => {
      if (bootDone) return;
      i++;
      const p = Math.min(100, Math.round((i / bootSteps.length) * 100));
      bootBar.style.width = p + "%";
      bootStatus.textContent = bootSteps[Math.min(i - 1, bootSteps.length - 1)];
      if (i >= bootSteps.length) setTimeout(finishBoot, 420);
      else setTimeout(tick, rand(220, 420));
    };
    setTimeout(tick, 300);
    $("#bootSkip").addEventListener("click", finishBoot);
    window.addEventListener("keydown", finishBoot, { once: true });
  }

  const started = Date.now();
  const tickClock = () => {
    const d = new Date();
    const t = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    $("#clock").textContent = t;
    $("#appTime").textContent = t;
    $("#deskClock").textContent = t.slice(0, 5);
    const up = Math.floor((Date.now() - started) / 1000);
    $("#uptime").textContent = `${pad(Math.floor(up / 3600))}:${pad(Math.floor((up % 3600) / 60))}:${pad(up % 60)}`;
  };
  tickClock();
  setInterval(tickClock, 1000);

  const heroLines = [
    "C:\\> WALLSTREET.EXE",
    "INITIALIZING WALLSTREET.EXE...",
    "CONNECTING TO MARKETS......... OK",
    "LOADING SECURITIES............ OK",
    "VOLATILITY DETECTED........... EXTREME",
    "SYSTEM STATUS: ONLINE",
  ];
  function startHeroTyping() {
    const el = $("#heroTermBody");
    if (reduced) { el.textContent = heroLines.join("\n") + "\n█"; return; }
    let li = 0, ci = 0, out = "";
    const step = () => {
      if (li >= heroLines.length) { el.textContent = out + "█"; el.classList.add("blink-cursor"); return; }
      const line = heroLines[li];
      out += line[ci] || "";
      ci++;
      el.textContent = out + "█";
      if (ci > line.length) { out += "\n"; li++; ci = 0; setTimeout(step, rand(180, 420)); }
      else setTimeout(step, rand(12, 38));
    };
    step();
  }

  function heroCanvas() {
    const cv = $("#heroCanvas");
    const ctx = cv.getContext("2d");
    let w, h, dpr;
    const items = [];
    const syms = MARKETS.map((m) => m.sym);
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    const N = isMobile() ? 34 : 70;
    for (let i = 0; i < N; i++) {
      const type = Math.random() < 0.7 ? "num" : "dot";
      items.push({
        type,
        x: Math.random() * w, y: Math.random() * h,
        z: rand(0.3, 1),
        vy: rand(0.08, 0.3),
        text: type === "num" ? `${pick(syms)} ${(rand(-5, 8)).toFixed(2)}` : "",
        up: Math.random() > 0.35,
        life: Math.random(),
      });
    }
    let last = 0;
    const draw = (t) => {
      if (reduced) return;
      if (t - last < 33) { requestAnimationFrame(draw); return; }
      last = t;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      for (const it of items) {
        it.y -= it.vy * it.z;
        it.life += 0.004;
        if (it.y < -20) { it.y = h + 20; it.x = Math.random() * w; it.text = `${pick(syms)} ${(rand(-5, 8)).toFixed(2)}`; it.up = Math.random() > 0.35; }
        // keep center readable: fade near center
        const dx = (it.x - cx) / (w * 0.5), dy = (it.y - cy) / (h * 0.5);
        const d = Math.sqrt(dx * dx + dy * dy);
        const centerFade = Math.min(1, Math.max(0, (d - 0.35) / 0.4));
        const a = (0.15 + 0.45 * it.z) * centerFade * (0.6 + 0.4 * Math.sin(it.life * 6.28));
        if (a <= 0.01) continue;
        if (it.type === "num") {
          ctx.font = `${9 + 4 * it.z}px "JetBrains Mono", monospace`;
          ctx.fillStyle = it.up ? `rgba(61,255,122,${a})` : `rgba(255,77,77,${a * 0.9})`;
          ctx.fillText(it.text, it.x, it.y);
        } else {
          ctx.fillStyle = `rgba(61,255,122,${a})`;
          ctx.fillRect(it.x, it.y, 2 * it.z, 2 * it.z);
        }
      }
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }
  heroCanvas();

  function buildTape() {
    const tape = $("#tape");
    const items = MARKETS.map((m) =>
      `<span class="tape__item"><b>${m.sym}</b> ${fmtPrice(m.price)} <span class="${m.chg >= 0 ? "up" : "down"}">${fmtPct(m.chg)}</span></span>`
    ).join("");
    tape.innerHTML = items + items; 
    const dt = $("#deskTape");
    dt.innerHTML = `<span>${MARKETS.map((m) => `${m.sym} ${fmtPct(m.chg)}`).join("   ·   ")}   ·   WALLSTREET.EXE IS RUNNING   ·   DO NOT CLOSE THIS WINDOW   ·   </span>`;
  }
  buildTape();

function liveTickers() {
  const rows = $$("#liveTickers tr");

  function paintRow(row) {
    const sym = row.dataset.sym;
    const market = MARKETS.find((m) => m.sym === sym);
    const el = row.querySelector(".tk__pct");

    if (!market || !el) return;

    const value = Number(market.chg) || 0;

    el.textContent = fmtPct(value);
    el.classList.toggle("up", value >= 0);
    el.classList.toggle("down", value < 0);
  }

  rows.forEach(paintRow);

  document.addEventListener("wsex:market", () => {
    rows.forEach(paintRow);
  });
}

liveTickers();

  function makeSeries(n, start) {
    const out = [];
    let p = start;
    for (let i = 0; i < n; i++) {
      const o = p;
      const drift = rand(-0.02, 0.024) * p;
      const c = Math.max(p * 0.6, o + drift);
      const hi = Math.max(o, c) + rand(0, 0.012) * p;
      const lo = Math.min(o, c) - rand(0, 0.012) * p;
      out.push({ o, h: hi, l: lo, c, v: rand(0.3, 1) });
      p = c;
    }
    return out;
  }

  function candleChart(canvas, opts = {}) {
    const ctx = canvas.getContext("2d");
    const n = opts.count || 60;
    let data = makeSeries(n, opts.start || 0.03);
    let real = false; 
    let w, h, dpr;
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", () => { resize(); draw(); });

    let live = { ...data[data.length - 1] };
    live = { o: live.c, h: live.c, l: live.c, c: live.c, v: 0.2 };
    let phase = 0;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const all = data.concat([live]);
      const padL = opts.mini ? 4 : 10, padR = opts.mini ? 4 : 64, padT = opts.mini ? 4 : 14, padB = opts.mini ? 4 : (opts.volume ? 50 : 18);
      const cw = w - padL - padR, ch = h - padT - padB;
      let hi = -Infinity, lo = Infinity;
      for (const k of all) { hi = Math.max(hi, k.h); lo = Math.min(lo, k.l); }
      const range = hi - lo || 1;
      const y = (v) => padT + (1 - (v - lo) / range) * ch;
      const step = cw / all.length;
      const bw = Math.max(1, step * 0.62);

      if (!opts.mini) {
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        for (let i = 0; i <= 4; i++) {
          const yy = padT + (ch / 4) * i;
          ctx.beginPath(); ctx.moveTo(padL, yy); ctx.lineTo(w - padR, yy); ctx.stroke();
          ctx.fillStyle = GRAY;
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.textAlign = "left";
          const val = hi - (range / 4) * i;
          ctx.fillText(fmtPrice(val), w - padR + 8, yy + 3);
        }
        ctx.setLineDash([]);
        for (let i = 0; i < all.length; i += 10) {
          const xx = padL + i * step;
          ctx.strokeStyle = "rgba(255,255,255,0.03)";
          ctx.beginPath(); ctx.moveTo(xx, padT); ctx.lineTo(xx, padT + ch); ctx.stroke();
        }
      }

      if (opts.volume) {
        const vb = h - padB + 8, vh = padB - 16;
        for (let i = 0; i < all.length; i++) {
          const k = all[i];
          const x = padL + i * step + (step - bw) / 2;
          const up = k.c >= k.o;
          ctx.fillStyle = up ? "rgba(61,255,122,0.28)" : "rgba(255,77,77,0.28)";
          const vv = k.v * vh;
          ctx.fillRect(x, vb + vh - vv, bw, vv);
        }
      }

      for (let i = 0; i < all.length; i++) {
        const k = all[i];
        const x = padL + i * step + step / 2;
        const up = k.c >= k.o;
        const col = up ? GREEN : RED;
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, y(k.h)); ctx.lineTo(x, y(k.l)); ctx.stroke();
        const top = y(Math.max(k.o, k.c)), bot = y(Math.min(k.o, k.c));
        const bh = Math.max(1, bot - top);
        if (up) { ctx.fillRect(x - bw / 2, top, bw, bh); }
        else { ctx.fillRect(x - bw / 2, top, bw, bh); }
        if (i === all.length - 1 && !opts.mini) {
          ctx.shadowColor = col; ctx.shadowBlur = 10;
          ctx.fillRect(x - bw / 2, top, bw, bh);
          ctx.shadowBlur = 0;
        }
      }


      if (!opts.mini) {
        const ly = y(live.c);
        ctx.strokeStyle = live.c >= live.o ? GREEN : RED;
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(padL, ly); ctx.lineTo(w - padR, ly); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = live.c >= live.o ? GREEN : RED;
        ctx.fillRect(w - padR + 2, ly - 8, padR - 6, 16);
        ctx.fillStyle = "#000";
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.textAlign = "left";
        ctx.fillText(fmtPrice(live.c), w - padR + 7, ly + 4);
        ctx.fillStyle = DIM;
        ctx.font = 'bold 28px Inter, sans-serif';
        ctx.textAlign = "left";
        ctx.fillText("WALLSTREET.EXE", padL + 10, padT + 34);
      }

      if (opts.onPrice) opts.onPrice(live.c, data[0].o);
    };

    const update = () => {
      if (real) return;
      phase++;
      const p = live.c;
      const d = rand(-0.006, 0.0068) * p;
      live.c = Math.max(p * 0.7, p + d);
      live.h = Math.max(live.h, live.c);
      live.l = Math.min(live.l, live.c);
      live.v = Math.min(1, live.v + 0.03);
      if (phase % 14 === 0) {
        data.push({ ...live });
        data.shift();
        live = { o: live.c, h: live.c, l: live.c, c: live.c, v: 0.15 };
      }
      draw();
    };
    draw();
    if (!reduced) setInterval(update, opts.mini ? 700 : 380);
    return {
      get data() { return data; },
      get price() { return live.c; },
      get real() { return real; },
      setSeries(candles) {
        if (!candles || !candles.length) return;
        const maxV = Math.max(...candles.map((k) => k.v || 0)) || 1;
        data = candles.slice(-n).map((k) => ({ o: k.o, h: k.h, l: k.l, c: k.c, v: Math.max(0.05, (k.v || 0) / maxV) }));
        const last = data[data.length - 1];
        live = { o: last.c, h: last.c, l: last.c, c: last.c, v: 0.2 };
        real = true;
        draw();
      },

      setLive(p) {
        if (!Number.isFinite(p) || p <= 0) return;
        if (!real) { data = makeSeries(n, p); real = true; }
        live.c = p; live.h = Math.max(live.h, p); live.l = Math.min(live.l, p);
        draw();
      },
    };
  }

  const priceEl = $("#chartPrice"), chgEl = $("#chartChg");
  const mainChart = candleChart($("#mainChart"), {
    count: 64, start: 0.0312, volume: true,
    onPrice: (p, base) => {
      priceEl.textContent = fmtPrice(p);
      const c = S.feed ? S.feed.change24h : ((p - base) / base) * 100;
      chgEl.textContent = fmtPct(c) + (S.feed && S.feed.changeLabel ? " " + S.feed.changeLabel : "");
      const up = c >= 0;
      priceEl.className = up ? "c-green" : "c-red";
      chgEl.className = up ? "c-green" : "c-red";
    },
  });
  candleChart($("#deskChart"), { count: 40, start: 0.04, mini: true });


  const sysMsgs = [
    "MARKET DATA RECEIVED", "VOLATILITY INCREASING", "BUY ORDERS DETECTED", "WALLSTREET.EXE RUNNING",
    "SELL PRESSURE: MODERATE", "LIQUIDITY CHECK: OK", "USER PANIC DETECTED", "ORDER BOOK REFRESHED",
    "LATENCY SPIKE: 41ms", "NEW BLOCK CONFIRMED", "WHALE MOVEMENT DETECTED", "SYSTEM CONTINUES RUNNING",
    "MEMORY LEAK IGNORED", "RETRYING CONNECTION... OK", "DIP DETECTED. BUYING.", "FUNDAMENTALS: NOT FOUND",
  ];
  const warnMsgs = ["SYSTEM WARNING: MARKET VOLATILITY DETECTED", "ERROR 0x0BADF00D: CHART BROKE UPWARD", "WARNING: LEVERAGE TOO HIGH"];
  function sysLog() {
    const ul = $("#sysLog");
    setInterval(() => {
      const li = document.createElement("li");
      const warn = Math.random() < 0.12;
      li.innerHTML = `<span>&gt;</span> ${warn ? pick(warnMsgs) : pick(sysMsgs)}`;
      if (warn) li.classList.add("is-warn");
      ul.appendChild(li);
      while (ul.children.length > 8) ul.removeChild(ul.firstChild);
    }, 2200);
    setInterval(() => {
      $("#latency").textContent = Math.round(rand(8, 46)) + "ms";
      $("#mPing").textContent = Math.round(rand(9, 38)) + "ms";
    }, 1800);

    const meters = [["mCpu", "mCpuV", 25, 90], ["mMem", "mMemV", 50, 82], ["mNet", "mNetV", 60, 99]];
    setInterval(() => {
      for (const [b, v, lo, hi] of meters) {
        const p = Math.round(rand(lo, hi));
        $("#" + b).style.width = p + "%";
        $("#" + v).textContent = p + "%";
      }
    }, 2600);
  }
  sysLog();

  const rpcBatch = async (calls) => {
    const body = calls.map((c, i) => ({ jsonrpc: "2.0", id: i + 1, method: c.method, params: c.params }));
    const r = await fetch(CHAIN.rpc, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`RPC HTTP ${r.status}`);
    const out = await r.json();
    const byId = new Map((Array.isArray(out) ? out : [out]).map((x) => [x.id, x]));
    return calls.map((_, i) => { const x = byId.get(i + 1); if (!x || x.error) throw new Error(x?.error?.message || "RPC error"); return x.result; });
  };
  const hexToUnits = (hex, decimals) => {
    if (!hex || hex === "0x") return 0;
    const bi = BigInt(hex);
    const base = 10n ** BigInt(decimals);
    return Number(bi / base) + Number(bi % base) / Number(base);
  };
  const balanceOfCall = (token, owner) => ({ method: "eth_call", params: [{ to: token, data: "0x70a08231" + owner.slice(2).toLowerCase().padStart(64, "0") }, "latest"] });


  const GT = `https://api.geckoterminal.com/api/v2`;
  const feedSources = {
    async geckoterminal(addr) {
      const r = await getJSON(`${GT}/networks/${CHAIN.geckoTerminalNetwork}/tokens/${addr}?include=top_pools`);
      const a = r.data.attributes;
      const pool = (r.included || [])[0];
      const pa = pool ? pool.attributes : {};
      const lp = a.launchpad_details;
      return {
        priceUsd: +a.price_usd, change24h: +((pa.price_change_percentage || {}).h24 || 0),
        volume24h: +((a.volume_usd || {}).h24 || 0), fdvUsd: +(a.fdv_usd || 0),
        liquidityUsd: +(pa.reserve_in_usd || a.total_reserve_in_usd || 0), poolAddress: pa.address || null,
        graduated: lp ? !!lp.completed : null, graduationPct: lp ? +lp.graduation_percentage : null,
        source: "GECKOTERMINAL",
      };
    },
    async dexscreener(addr) {
      const r = await getJSON(`https://api.dexscreener.com/token-pairs/v1/${CHAIN.dexscreenerChain}/${addr}`);
      const pairs = (Array.isArray(r) ? r : r.pairs || []).filter((p) => p.chainId === CHAIN.dexscreenerChain);
      if (!pairs.length) throw new Error("NO PAIR ON DEXSCREENER YET (NOT GRADUATED?)");
      pairs.sort((x, y) => ((y.liquidity || {}).usd || 0) - ((x.liquidity || {}).usd || 0));
      const p = pairs[0];
      return {
        priceUsd: +p.priceUsd, change24h: +((p.priceChange || {}).h24 || 0), volume24h: +((p.volume || {}).h24 || 0),
        fdvUsd: +(p.fdv || 0), liquidityUsd: +((p.liquidity || {}).usd || 0), poolAddress: p.pairAddress, source: "DEXSCREENER",
      };
    },

    async pons(addr) {
      const url = withAddr(PRICE.pons.chartUrl).replace(/\{address\}/g, addr);
      const full = PRICE.pons.corsProxy ? PRICE.pons.corsProxy + encodeURIComponent(url) : url;
      const r = await getJSON(full);
      const pts = (r.points || []).filter((p) => Number.isFinite(p.price));
      if (!pts.length) throw new Error("PONS: NO POINTS");
      const q = Number(r.quoteUsd) || 1;
      const first = pts[0], last = pts[pts.length - 1];

      const buckets = new Map();
      for (const p of pts) {
        const k = Math.floor(p.t / 60) * 60;
        const b = buckets.get(k);
        const px = p.price * q;
        if (!b) buckets.set(k, { o: px, h: px, l: px, c: px, v: (p.volumeQuote || 0) * q });
        else { b.h = Math.max(b.h, px); b.l = Math.min(b.l, px); b.c = px; b.v += (p.volumeQuote || 0) * q; }
      }
      const priceUsd = last.price * q;
      return {
        priceUsd, change24h: ((last.price - first.price) / first.price) * 100, changeLabel: (r.range || "").toUpperCase(),
        volume24h: pts.reduce((s, p) => s + (p.volumeQuote || 0), 0) * q, fdvUsd: priceUsd * TOKEN.totalSupply,
        liquidityUsd: NaN, poolAddress: null, source: "PONS", candles: [...buckets.values()],
      };
    },
  };
  const fetchCandles = async (pool) => {
    const r = await getJSON(`${GT}/networks/${CHAIN.geckoTerminalNetwork}/pools/${pool}/ohlcv/minute?aggregate=5&limit=64&currency=usd`);
    const list = (r.data.attributes.ohlcv_list || []).slice().sort((a, b) => a[0] - b[0]);
    return list.map(([, o, h, l, c, v]) => ({ o: +o, h: +h, l: +l, c: +c, v: +v }));
  };

  function priceFeed() {
    const badge = $("#chartSrc"), tokMarket = $("#tokMarket"), tokSrc = $("#tokSrc");
    const setBadge = (el, txt, cls) => { el.textContent = txt; el.className = "badge" + (cls ? " badge--" + cls : ""); };
    if (!LAUNCHED) { setBadge(badge, "SIMULATED · PRE-LAUNCH"); return; }
    const src = feedSources[PRICE.source] || feedSources.geckoterminal;
    let lastPool = null, candlesAt = 0;

    const apply = (q) => {
      S.feed = q;

      if (q.candles && q.candles.length) mainChart.setSeries(q.candles);
      mainChart.setLive(q.priceUsd);
      setBadge(badge, `LIVE · ${q.source}`, "live");

      const m = MARKETS[0];
      m.price = q.priceUsd; m.chg = q.change24h; m.vol = q.volume24h; m.real = true;
      document.dispatchEvent(new CustomEvent("wsex:price", { detail: q }));

      tokMarket.hidden = false;
      setBadge(tokSrc, q.source, "live");
      $("#tokPrice").textContent = "$" + fmtPrice(q.priceUsd);
      const ch = $("#tokChg"); ch.textContent = fmtPct(q.change24h) + (q.changeLabel ? " " + q.changeLabel : ""); ch.className = q.change24h >= 0 ? "c-green" : "c-red";
      $("#tokVol").textContent = fmtBig(q.volume24h);
      $("#tokFdv").textContent = fmtBig(q.fdvUsd);
      $("#tokLiq").textContent = q.graduated === false ? `CURVE ${Math.round(q.graduationPct || 0)}%` : fmtBig(q.liquidityUsd);
    };

    const refresh = async () => {
      try {
        const q = await src(TOKEN.address);
        if (!Number.isFinite(q.priceUsd) || q.priceUsd <= 0) throw new Error("NO PRICE");

        if (!q.candles && q.poolAddress && (q.poolAddress !== lastPool || Date.now() - candlesAt > 300000)) {
          try { q.candles = await fetchCandles(q.poolAddress); lastPool = q.poolAddress; candlesAt = Date.now(); } catch (_) { /* keep previous history */ }
        }
        apply(q);
      } catch (e) {
        setBadge(badge, `FEED OFFLINE · ${String(e.message || e).slice(0, 40).toUpperCase()}`, "err");
      }
    };
    refresh();
    setInterval(refresh, Math.max(15000, PRICE.refreshMs || 30000));
  }
  priceFeed();

  function wallet() {
    const found = new Map();
    window.addEventListener("eip6963:announceProvider", (e) => { const d = e.detail; if (d && d.info && d.provider) found.set(d.info.rdns, d); });
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    const providers = () => {
      const arr = [...found.values()];
      if (!arr.length && window.ethereum) arr.push({ info: { name: window.ethereum.isMetaMask ? "MetaMask" : "Injected Wallet", rdns: "injected", icon: null }, provider: window.ethereum });
      return arr;
    };

    const btn = $("#walletBtn"), btnText = $("#walletBtnText");
    const modal = $("#walletModal"), list = $("#walletList"), none = $("#walletNone");
    const pfPanel = $("#pfPanel"), pfMode = $("#pfMode"), pfValue = $("#pfValue"), pfChange = $("#pfChange");
    const pfBars = $("#pfBars"), pfHold = $("#pfHoldings"), pfConnect = $("#pfConnect"), pfAddr = $("#pfAddr"), pfAddChain = $("#pfAddChain");
    const deskOrig = { pf: $("#deskPf").textContent, chg: $("#deskPfChg").textContent, held: $("#deskPfHeld").textContent, k4: $("#deskPfRow4K").textContent, v4: $("#deskPfRow4V").textContent };
    const st = { address: null, provider: null, rdns: null, timer: null, holdings: null };
    const KEY = "wsex.wallet.rdns";

    const closeModal = () => { modal.hidden = true; };
    $$(".modal-close", modal).forEach((b) => b.addEventListener("click", closeModal));
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

    const openChooser = () => {
      const arr = providers();
      if (arr.length === 1) return connect(arr[0]);
      list.innerHTML = arr.map((p, i) => `<button class="wallet-opt" type="button" data-i="${i}">${p.info.icon ? `<img src="${p.info.icon}" alt="" />` : "<i>W</i>"}<span>${p.info.name}</span></button>`).join("");
      $$(".wallet-opt", list).forEach((b) => b.addEventListener("click", () => { closeModal(); connect(arr[+b.dataset.i]); }));
      none.hidden = arr.length > 0;
      modal.hidden = false;
    };

    const connect = async (p, silent = false) => {
      btn.classList.add("is-busy");
      try {
        const accounts = await p.provider.request({ method: silent ? "eth_accounts" : "eth_requestAccounts" });
        if (!accounts || !accounts.length) { if (!silent) toast("WALLET: NO ACCOUNT AUTHORIZED"); return; }
        st.address = accounts[0]; st.provider = p.provider; st.rdns = p.info.rdns;
        localStorage.setItem(KEY, p.info.rdns);
        p.provider.on && p.provider.on("accountsChanged", (a) => { if (!a || !a.length) disconnect(); else { st.address = a[0]; onConnected(); } });
        p.provider.on && p.provider.on("disconnect", () => disconnect());
        onConnected();
        if (!silent) toast(`WALLET CONNECTED: ${shortAddr(st.address).toUpperCase()}`);
      } catch (e) {
        if (!silent) toast(e && e.code === 4001 ? "CONNECTION REJECTED BY USER" : "WALLET ERROR: " + String(e.message || e).slice(0, 40).toUpperCase());
      } finally { btn.classList.remove("is-busy"); }
    };

    const disconnect = () => {
      clearInterval(st.timer);
      st.address = null; st.provider = null; st.rdns = null; st.holdings = null; S.wallet = null;
      localStorage.removeItem(KEY);
      btn.classList.remove("is-on"); btnText.textContent = "CONNECT WALLET"; btn.title = "Connect wallet";
      pfMode.textContent = "SIMULATED"; pfMode.className = "badge";
      pfBars.hidden = false; pfHold.hidden = true; pfHold.innerHTML = "";
      pfConnect.hidden = false; pfAddr.hidden = true; pfAddChain.hidden = true;
      pfPanel.querySelectorAll(".pf").forEach((x) => x.classList.remove("is-loading"));
      $("#deskPf").textContent = deskOrig.pf; $("#deskPfChg").textContent = deskOrig.chg; $("#deskPfChg").className = "c-green";
      $("#deskPfHeld").textContent = deskOrig.held; $("#deskPfRow4K").textContent = deskOrig.k4; $("#deskPfRow4V").textContent = deskOrig.v4;
      const acc = $("#deskPfAccess"); acc.textContent = "GUEST"; acc.className = "c-gray";
      $("#sessionUser").textContent = "GUEST";
      toast("WALLET DISCONNECTED. BACK TO SIMULATION.");
    };

    const onConnected = () => {
      S.wallet = st.address;
      btn.classList.add("is-on"); btnText.textContent = shortAddr(st.address).toUpperCase(); btn.title = "Click to disconnect";
      pfMode.textContent = "ON-CHAIN"; pfMode.className = "badge badge--live";
      pfBars.hidden = true; pfHold.hidden = false; pfConnect.hidden = true; pfAddChain.hidden = false;
      pfAddr.hidden = false; pfAddr.innerHTML = `<a href="${CHAIN.explorer}/address/${st.address}" target="_blank" rel="noopener">${shortAddr(st.address)}</a> · <a href="#" id="pfDisc">DISCONNECT</a>`;
      $("#pfDisc").addEventListener("click", (e) => { e.preventDefault(); disconnect(); });
      $("#sessionUser").textContent = shortAddr(st.address).toUpperCase();
      pfPanel.querySelectorAll(".pf").forEach((x) => x.classList.add("is-loading"));
      pfHold.innerHTML = `<div class="hold__note">READING ${CHAIN.name.toUpperCase()}…</div>`;
      clearInterval(st.timer);
      refreshHoldings();
      st.timer = setInterval(refreshHoldings, 60000);
    };

    const loadHoldings = async (owner) => {
      const tokens = new Map(); 
      const add = (t) => { const k = t.address.toLowerCase(); if (!tokens.has(k)) tokens.set(k, { ...t, address: k }); return tokens.get(k); };
      if (LAUNCHED) add({ symbol: TOKEN.symbol, address: TOKEN.address, decimals: TOKEN.decimals, wsex: true });
      for (const t of HOLD.watchlist || []) if (isAddr(t.address)) add(t);

      if (HOLD.useBlockscout) {
        try {
          const r = await getJSON(`${CHAIN.explorer}/api/v2/addresses/${owner}/token-balances`, 6000);
          for (const it of Array.isArray(r) ? r : []) {
            if (!it.token || it.token.type !== "ERC-20" || !isAddr(it.token.address)) continue;
            const t = add({ symbol: it.token.symbol || "?", address: it.token.address, decimals: +it.token.decimals || 18 });
            t.qty = Number(it.value) / 10 ** t.decimals;
            if (it.token.exchange_rate) t.bsPrice = +it.token.exchange_rate;
          }
        } catch (_) { /* best-effort */ }
      }

      const list = [...tokens.values()];
      const res = await rpcBatch([{ method: "eth_getBalance", params: [owner, "latest"] }, ...list.map((t) => balanceOfCall(t.address, owner))]);
      const ethQty = hexToUnits(res[0], 18);
      list.forEach((t, i) => { try { t.qty = hexToUnits(res[i + 1], t.decimals); } catch (_) { t.qty = t.qty || 0; } });


      const prices = {}, chg = {};
      const addrs = [...new Set([CHAIN.weth, ...list.filter((t) => t.qty > 0).map((t) => t.address)].filter(isAddr).map((a) => a.toLowerCase()))];
      for (let i = 0; i < addrs.length; i += 30) {
        try {
          const r = await getJSON(`${GT}/simple/networks/${CHAIN.geckoTerminalNetwork}/token_price/${addrs.slice(i, i + 30).join(",")}?include_24hr_price_change=true`);
          const a = r.data.attributes;
          for (const k in a.token_prices || {}) prices[k.toLowerCase()] = +a.token_prices[k];
          for (const k in a.h24_price_change_percentage || {}) chg[k.toLowerCase()] = +a.h24_price_change_percentage[k];
        } catch (_) { /* prices stay unknown */ }
      }
      const ethPrice = prices[(CHAIN.weth || "").toLowerCase()];
      const rows = [{ symbol: CHAIN.currency.symbol, qty: ethQty, priceUsd: ethPrice, chg: chg[(CHAIN.weth || "").toLowerCase()], native: true }];
      for (const t of list) {
        if (!(t.qty > 0)) continue;
        let px = prices[t.address], c = chg[t.address];
        if (t.wsex && S.feed) { px = S.feed.priceUsd; c = S.feed.change24h; }
        if (!Number.isFinite(px) && Number.isFinite(t.bsPrice)) px = t.bsPrice;
        rows.push({ symbol: t.symbol, qty: t.qty, priceUsd: px, chg: c, wsex: !!t.wsex, address: t.address });
      }
      for (const r of rows) r.usd = Number.isFinite(r.priceUsd) ? r.qty * r.priceUsd : NaN;
      const priced = rows.filter((r) => Number.isFinite(r.usd));
      const total = priced.reduce((s, r) => s + r.usd, 0);
      const withChg = priced.filter((r) => Number.isFinite(r.chg));
      const prev = withChg.reduce((s, r) => s + r.usd / (1 + r.chg / 100), 0);
      const change24h = prev > 0 ? ((withChg.reduce((s, r) => s + r.usd, 0) - prev) / prev) * 100 : NaN;
      const wsexRow = rows.find((r) => r.wsex);
      rows.sort((a, b) => (b.usd || 0) - (a.usd || 0));
      return { rows, total, change24h, wsexQty: wsexRow ? wsexRow.qty : 0, unpriced: rows.length - priced.length };
    };

    const refreshHoldings = async () => {
      const owner = st.address;
      if (!owner) return;
      try {
        const h = await loadHoldings(owner);
        if (owner !== st.address) return;
        st.holdings = h;
        render(h);
      } catch (e) {
        pfHold.innerHTML = `<div class="hold__note c-red">READ FAILED: ${String(e.message || e).slice(0, 60).toUpperCase()}</div>`;
        pfPanel.querySelectorAll(".pf").forEach((x) => x.classList.remove("is-loading"));
      }
    };

    const render = (h) => {
      pfPanel.querySelectorAll(".pf").forEach((x) => x.classList.remove("is-loading"));
      pfValue.textContent = fmtUsd(h.total);
      const up = !(h.change24h < 0);
      pfChange.textContent = Number.isFinite(h.change24h) ? fmtPct(h.change24h) : "—";
      pfChange.className = "pf__value " + (up ? "c-green" : "c-red");
      const top = h.rows.filter((r) => r.qty > 0 || r.native).slice(0, 8);
      pfHold.innerHTML = top.map((r) => `<div class="hold${r.wsex ? " hold--wsex" : ""}"><b>${r.wsex ? "$" : ""}${r.symbol}</b><span class="hold__qty">${fmtQty(r.qty)}</span><span class="hold__usd">${Number.isFinite(r.usd) ? fmtUsd(r.usd) : "—"}</span></div>`).join("")
        + `<div class="hold__note">${h.unpriced ? `${h.unpriced} UNPRICED · ` : ""}PRICES: GECKOTERMINAL · RPC: ${CHAIN.name.toUpperCase()}${LAUNCHED ? "" : " · $WSEX: PRE-LAUNCH"}</div>`;
      // desktop window
      $("#deskPf").textContent = fmtUsd(h.total);
      const dc = $("#deskPfChg"); dc.textContent = pfChange.textContent; dc.className = up ? "c-green" : "c-red";
      $("#deskPfHeld").textContent = LAUNCHED ? fmtQty(h.wsexQty) : "PRE-LAUNCH";
      $("#deskPfRow4K").textContent = "$WSEX PRICE";
      $("#deskPfRow4V").textContent = S.feed ? "$" + fmtPrice(S.feed.priceUsd) : (LAUNCHED ? "—" : "TBA");
      const acc = $("#deskPfAccess");
      const pro = LAUNCHED && HOLD.proMinHold > 0 && h.wsexQty >= HOLD.proMinHold;
      acc.textContent = pro ? "PRO" : LAUNCHED ? `BASIC (${fmtQty(HOLD.proMinHold)} $WSEX → PRO)` : "BASIC";
      acc.className = pro ? "c-green" : "c-gray";
    };

    const addChain = async () => {
      const p = st.provider || (providers()[0] || {}).provider;
      if (!p) return toast("NO WALLET FOUND");
      try {
        await p.request({ method: "wallet_addEthereumChain", params: [{ chainId: CHAIN.hexId, chainName: CHAIN.name, nativeCurrency: CHAIN.currency, rpcUrls: [CHAIN.rpc], blockExplorerUrls: [CHAIN.explorer] }] });
        toast(`${CHAIN.name.toUpperCase()} ADDED TO WALLET`);
      } catch (e) { toast(e && e.code === 4001 ? "REJECTED BY USER" : "COULD NOT ADD NETWORK"); }
    };

    btn.addEventListener("click", () => st.address ? disconnect() : openChooser());
    pfConnect.addEventListener("click", openChooser);
    pfAddChain.addEventListener("click", addChain);
    $("#tokAddChain").addEventListener("click", addChain);
    document.addEventListener("wsex:price", () => { if (st.holdings) render(st.holdings); });

    const saved = localStorage.getItem(KEY);
    if (saved) setTimeout(() => { const p = providers().find((x) => x.info.rdns === saved); if (p) connect(p, true); }, 400);

    return {
      get address() { return st.address; },
      get holdings() { return st.holdings; },
      open: openChooser, disconnect,
    };
  }
  const W = wallet();

  (() => {
    $("#contractAddr").textContent = TOKEN.address;
    $("#contractCopy").dataset.copy = TOKEN.address;
    const buy = $("#buyBtn"), chart = $("#chartBtn"), exp = $("#explorerBtn");
    if (LAUNCHED) {
      buy.href = withAddr(LINKS.buy) || "#"; chart.href = withAddr(LINKS.chart) || "#";
      exp.href = `${CHAIN.explorer}/token/${TOKEN.address}`; exp.hidden = false;
    }
    const soc = [["#linkX", LINKS.x], ["#linkTg", LINKS.telegram]];
    for (const [sel, url] of soc) { const a = $(sel); if (url) a.href = url; else a.addEventListener("click", (e) => { e.preventDefault(); toast("LINK: TBA"); }); }
  })();


  (() => {
    if (!PRODUCT) return;
    const sec = $("#product");
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    if (PRODUCT.eyebrow) $("#prodEyebrow").textContent = PRODUCT.eyebrow;
    if (PRODUCT.headline) $("#prodHeadline").textContent = PRODUCT.headline;
    $("#prodPitch").innerHTML = (PRODUCT.pitch || []).map((p) => `<p>${esc(p)}</p>`).join("");
    const feats = PRODUCT.features || [];
    $("#prodFeatures").innerHTML = feats.map((f, i) => {
      const s = String(f.status || "PLANNED").toUpperCase();
      return `<li style="animation-delay:${i * 60}ms"><span class="mod__status mod__status--${s.toLowerCase()}">${esc(s)}</span><div><div class="mod__name">${esc(f.name)}</div><div class="mod__desc">${esc(f.desc || "")}</div></div></li>`;
    }).join("");
    $("#prodCount").textContent = feats.length;
    $("#prodLive").textContent = `● LIVE: ${feats.filter((f) => String(f.status).toUpperCase() === "LIVE").length}`;
    $("#prodUtility").innerHTML = (PRODUCT.utility || []).map((u) => `<div class="fact"><span>${esc(u.k)}</span><b>${esc(u.v)}</b></div>`).join("");
    sec.hidden = false;
  })();

  function desktop() {
    const desk = $("#desk");
    const wins = $$(".dwin", desk);
    let z = 10;
    const focus = (w) => {
      wins.forEach((x) => x.classList.remove("is-active"));
      w.classList.add("is-active");
      w.style.zIndex = ++z;
      const name = w.dataset.win;
      $$(".desk__task").forEach((t) => t.classList.toggle("is-active", t.textContent.trim().toLowerCase().startsWith(name.slice(0, 4))));
    };
    wins.forEach((w) => {
      const bar = $(".dwin__bar", w);
      w.addEventListener("pointerdown", () => focus(w), true);

      const ctl = $$(".win__ctl b", w);
      if (ctl[0] && ctl.length === 3) ctl[0].addEventListener("click", (e) => { e.stopPropagation(); w.classList.toggle("is-min"); });
      if (ctl[2] && ctl.length === 3) ctl[2].addEventListener("click", (e) => {
        e.stopPropagation();
        w.style.opacity = "0"; w.style.transform += " scale(0.96)";
        setTimeout(() => { w.style.opacity = ""; w.style.transform = w.style.transform.replace(" scale(0.96)", ""); toast(`${w.dataset.win.toUpperCase()}: CANNOT CLOSE. STILL RUNNING.`); }, 700);
      });
      if (ctl.length === 3) ctl[1].addEventListener("click", (e) => { e.stopPropagation(); toast("MAXIMIZE DISABLED BY MARKET REGULATOR"); });


      let sx, sy, ox, oy, dragging = false;
      bar.addEventListener("pointerdown", (e) => {
        if (isMobile() || e.target.closest(".win__ctl")) return;
        dragging = true;
        w.classList.add("is-dragging");
        bar.setPointerCapture(e.pointerId);
        const r = w.getBoundingClientRect(), dr = desk.getBoundingClientRect();
        ox = r.left - dr.left; oy = r.top - dr.top;
        sx = e.clientX; sy = e.clientY;
        w.style.left = ox + "px"; w.style.top = oy + "px";
        e.preventDefault();
      });
      bar.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        const dr = desk.getBoundingClientRect();
        let nx = ox + (e.clientX - sx), ny = oy + (e.clientY - sy);
        nx = Math.max(-w.offsetWidth * 0.6, Math.min(dr.width - 60, nx));
        ny = Math.max(0, Math.min(dr.height - 60, ny));
        w.style.left = nx + "px"; w.style.top = ny + "px";
      });
      const end = () => { dragging = false; w.classList.remove("is-dragging"); };
      bar.addEventListener("pointerup", end);
      bar.addEventListener("pointercancel", end);
    });
    focus($('[data-win="market"]'));

    const tb = $("#deskTickers tbody");
    const rowsData = MARKETS.filter((m) => ["WSEX", "NVDA", "AAPL", "TSLA", "AMZN", "SPY"].includes(m.sym));
    tb.innerHTML = rowsData.map((m) => `<tr data-sym="${m.sym}"><td>${m.sym}</td><td>${fmtPrice(m.price)}</td><td class="tk__pct ${m.chg >= 0 ? "up" : "down"}">${fmtPct(m.chg)}</td></tr>`).join("");
    const paintRow = (tr, m, d) => {
      tr.children[1].textContent = fmtPrice(m.price);
      const pc = tr.children[2];
      pc.textContent = fmtPct(m.chg); pc.className = "tk__pct " + (m.chg >= 0 ? "up" : "down");
      pc.classList.remove("flash-up", "flash-down"); void pc.offsetWidth; pc.classList.add(d >= 0 ? "flash-up" : "flash-down");
    };
    setInterval(() => {
      const tr = pick($$("tr", tb));
      const m = rowsData.find((x) => x.sym === tr.dataset.sym);
      if (m.real) return; // real feed owns this row
      const d = rand(-0.4, 0.5);
      m.chg += d; m.price *= 1 + d / 100;
      paintRow(tr, m, d);
    }, 1100);
    document.addEventListener("wsex:price", () => { const tr = $('tr[data-sym="WSEX"]', tb); if (tr) paintRow(tr, MARKETS[0], MARKETS[0].chg); });


    const warn = $("#warnWin");
    const showWarn = () => {
      if (isMobile() || !warn) return;
      warn.hidden = false; focus(warn);
    };
    $$(".warn-close", warn).forEach((b) => b.addEventListener("click", () => { warn.hidden = true; toast("WARNING DISMISSED. VOLATILITY REMAINS."); }));
    setTimeout(showWarn, 14000);
    setInterval(() => { if (Math.random() < 0.35) showWarn(); }, 60000);

   
    const news = [
      "$WSEX up. Nobody knows why. Everyone pretends to.",
      "Terminal user reports seeing 'SYSTEM ONLINE' in dreams.",
      "Bear spotted near exit. Bull blocking door.",
      "Windows 98 declared 'financially relevant again'.",
      "Volatility index renamed to 'vibes index'.",
      "Analyst downgrades sleep to HOLD.",
      "Market opens. Market panics. Market continues.",
    ];
    setInterval(() => {
      const nb = $("#newsBody");
      const d = new Date();
      const p = document.createElement("p");
      p.innerHTML = `<time>${pad(d.getHours())}:${pad(d.getMinutes())}</time>${pick(news)}`;
      nb.prepend(p);
      while (nb.children.length > 5) nb.removeChild(nb.lastChild);
    }, 9000);
  }
  desktop();

  function terminal() {
    const out = $("#termOut"), input = $("#termInput"), body = $("#termBody");
    const print = (s, cls) => {
      const span = document.createElement("span");
      if (cls) span.className = cls;
      span.textContent = s + "\n";
      out.appendChild(span);
      body.scrollTop = body.scrollHeight;
    };
    body.addEventListener("click", () => input.focus());
    const cmds = {
      help: () => print("COMMANDS:\n  MARKET    show market snapshot\n  PRICE     live $WSEX quote\n  CONNECT   connect wallet\n  WALLET    show real holdings\n  WHOAMI    who are you\n  BUY       buy $WSEX\n  SELL      attempt to sell\n  HOLD      do nothing (recommended)\n  PANIC     panic\n  STATUS    system status\n  CONTRACT  show contract\n  CLEAR     clear screen\n  EXIT      close terminal", "dim"),
      price: () => {
        if (!S.feed) return print(LAUNCHED ? "FEED: WAITING FOR FIRST QUOTE..." : "FEED: OFFLINE (PRE-LAUNCH). CHART IS SIMULATED.", "dim");
        const q = S.feed;
        print(`$WSEX  $${fmtPrice(q.priceUsd)}  ${fmtPct(q.change24h)}${q.changeLabel ? " " + q.changeLabel : " 24H"}\nVOL 24H ${fmtBig(q.volume24h)}   FDV ${fmtBig(q.fdvUsd)}   LIQ ${fmtBig(q.liquidityUsd)}\nSOURCE: ${q.source}`, "hi");
      },
      connect: () => { if (W.address) return print(`ALREADY CONNECTED: ${W.address}`); print("OPENING WALLET SELECTOR...", "dim"); W.open(); },
      wallet: () => {
        if (!W.address) return print("NO WALLET CONNECTED. TYPE: CONNECT", "err");
        const h = W.holdings;
        if (!h) return print("LOADING HOLDINGS FROM CHAIN...", "dim");
        print(`ADDRESS ${W.address}\nNETWORK ${CHAIN.name.toUpperCase()}`, "dim");
        print(h.rows.map((r) => `  ${r.symbol.padEnd(8)} ${fmtQty(r.qty).padStart(16)}  ${(Number.isFinite(r.usd) ? "$" + fmtBig(r.usd) : "UNPRICED").padStart(12)}`).join("\n"));
        print(`TOTAL   $${fmtBig(h.total)}  ${Number.isFinite(h.change24h) ? fmtPct(h.change24h) + " 24H" : ""}`, "hi");
        print(h.wsexQty >= HOLD.proMinHold ? "ACCESS: TERMINAL PRO" : `ACCESS: BASIC (HOLD ${HOLD.proMinHold.toLocaleString()} $WSEX FOR PRO)`, h.wsexQty >= HOLD.proMinHold ? "hi" : "dim");
      },
      market: () => print(MARKETS.slice(0, 8).map((m) => `  ${m.sym.padEnd(6)} ${fmtPrice(m.price).padStart(14)}  ${fmtPct(m.chg).padStart(8)}`).join("\n")),
      buy: () => { print("EXECUTING BUY ORDER... FILLED.", "hi"); print(`ACQUIRED ${Math.round(rand(10_000, 900_000)).toLocaleString()} $WSEX @ ${fmtPrice(mainChart.price)}`); print("WARNING: YOU ARE NOW EMOTIONALLY INVOLVED.", "err"); glitchNow(); },
      sell: () => print("ERROR: SELL FUNCTION NOT FOUND.\nDID YOU MEAN: HOLD?", "err"),
      hold: () => print("HOLDING... HOLDING... STILL HOLDING.\nRESULT: OK"),
      panic: () => { print("PANIC INITIATED.", "err"); print("PANIC COMPLETE. NOTHING CHANGED.", "dim"); print("SYSTEM CONTINUES RUNNING.", "hi"); $("#warnWin").hidden = false; },
      status: () => print(`SYSTEM: ONLINE\nMARKET: OPEN\nVOLATILITY: EXTREME\nUPTIME: ${$("#uptime").textContent}\nHOPE: 12%`),
      contract: () => print(`$WSEX CONTRACT (${CHAIN.name.toUpperCase()}):\n${TOKEN.address}${LAUNCHED ? "" : "\n(PRE-LAUNCH — SET IN config.js)"}`, "hi"),
      clear: () => { out.textContent = ""; },
      exit: () => print("ACCESS DENIED. THERE IS NO EXIT.", "err"),
      dir: () => print(" Volume in drive C is WALLSTREET\n\n  WALLSTREET  EXE   1,000,000,000  09-13-26  9:41a\n  PANIC       LOG          48,213  09-13-26  9:41a\n  LOSSES      TXT     <HIDDEN>\n  HOPE        DLL             12  01-01-98 12:00a", "dim"),
      whoami: () => print(W.address ? `${W.address}\n(VERIFIED ON-CHAIN, STILL UNDIVERSIFIED)` : "GUEST (UNVERIFIED, UNDIVERSIFIED)"),
      moon: () => print("TRAJECTORY: UNKNOWN. SEATBELTS: NONE.", "hi"),
      sudo: () => print("USER IS NOT IN THE SUDOERS FILE. THIS INCIDENT WILL BE REPORTED TO THE SEC.", "err"),
    };
    input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const raw = input.value.trim();
      input.value = "";
      print("C:\\WALLSTREET> " + raw, "dim");
      if (!raw) return;
      const c = raw.toLowerCase().split(/\s+/)[0];
      if (cmds[c]) cmds[c]();
      else print(`'${raw.toUpperCase()}' IS NOT RECOGNIZED AS A MARKET COMMAND.\nTYPE HELP.`, "err");
    });
  }
  terminal();


  function bigTable() {
    const tb = $("#bigTable tbody");
    const fmtVol = (v) => v === 0 ? "—" : v >= 1e9 ? (v / 1e9).toFixed(1) + "B" : v >= 1e6 ? (v / 1e6).toFixed(1) + "M" : v.toLocaleString();
    const spark = (up) => {
      let pts = "", y = 12;
      for (let i = 0; i <= 12; i++) { y += rand(-4, 4) + (up ? -0.5 : 0.5); y = Math.max(2, Math.min(16, y)); pts += `${i * 7.5},${y} `; }
      return `<svg class="spark" viewBox="0 0 90 18" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="${up ? GREEN : RED}" stroke-width="1.2"/></svg>`;
    };
    const statusHtml = (m) => {
      if (m.status === "halt") return `<span class="status status--halt"><i class="dot"></i>HALTED</span>`;
      if (m.status === "vol") return `<span class="status status--vol"><i class="dot"></i>VOLATILE</span>`;
      if (m.status === "live") return `<span class="status status--live"><i class="dot dot--green"></i>LIVE</span>`;
      return `<span class="status"><i class="dot dot--green"></i>OPEN</span>`;
    };
    const render = () => {
      tb.innerHTML = MARKETS.map((m) => `<tr data-sym="${m.sym}">
        <td>${m.sym}<span class="sym-sub">${m.name}</span></td>
        <td>${fmtPrice(m.price)}</td>
        <td class="${m.chg >= 0 ? "up" : "down"}">${fmtPct(m.chg)} ${spark(m.chg >= 0)}</td>
        <td>${fmtVol(m.vol)}</td>
        <td>${statusHtml(m)}</td></tr>`).join("");
      $("#rowCount").textContent = MARKETS.length;
    };
    render();

    function paintRow(m, d) {
      const tr = $(`tr[data-sym="${m.sym}"]`, tb);
      if (!tr) return;
      tr.children[1].textContent = fmtPrice(m.price);
      const pc = tr.children[2];
      pc.className = m.chg >= 0 ? "up" : "down";
      pc.innerHTML = `${fmtPct(m.chg)} ${spark(m.chg >= 0)}`;
      tr.children[3].textContent = fmtVol(m.vol);
      tr.children[4].innerHTML = statusHtml(m);
      tr.children[1].classList.remove("flash-up", "flash-down"); void tr.offsetWidth; tr.children[1].classList.add(d >= 0 ? "flash-up" : "flash-down");
    }
    document.addEventListener("wsex:price", () => { MARKETS[0].status = "live"; paintRow(MARKETS[0], MARKETS[0].chg); });
  }
  bigTable();


  function chaos() {
    const sig = { buy: 68, sell: 22, hold: 41, panic: 87 };
    const paint = () => {
      for (const k in sig) {
        const el = $(`[data-signal="${k}"]`);
        el.textContent = Math.round(sig[k]) + "%";
        $("i", el.parentElement.querySelector(".signal__meter")).style.width = sig[k] + "%";
      }
    };
    setTimeout(paint, 300);
    setInterval(() => {
      for (const k in sig) sig[k] = Math.max(4, Math.min(99, sig[k] + rand(-9, 9)));
      sig.panic = Math.max(sig.panic, 70);
      paint();
    }, 1800);
    const levels = ["EXTREME", "EXTREME", "EXTREME", "CRITICAL", "UNHINGED", "EXTREME"];
    setInterval(() => { $("#volLevel").textContent = pick(levels); }, 5000);

  
    const log = $("#chaosLog");
    const events = [
      "MARKET CONNECTION ESTABLISHED", "NVDA PRICE UPDATE", "BUY ORDER DETECTED", "VOLATILITY SPIKE",
      "USER PANIC DETECTED", "SYSTEM CONTINUES RUNNING", "TSLA PRICE UPDATE", "SELL ORDER REJECTED",
      "WHALE ENTERED THE CHAT", "CHART BROKE. FIXING WITH TAPE.", "USER REFRESHED PAGE (x47)", "HOPE.DLL RELOADED",
      "BTC PRICE UPDATE", "$WSEX VOLUME ANOMALY", "COFFEE LEVELS: CRITICAL", "MARKET DID A THING",
      "REGULATOR NOT FOUND", "DIP PURCHASED", "SYSTEM STATUS: STILL RUNNING",
    ];
    const warns = ["USER PANIC DETECTED", "VOLATILITY SPIKE", "SELL ORDER REJECTED", "COFFEE LEVELS: CRITICAL"];
    const seed = ["MARKET CONNECTION ESTABLISHED", "NVDA PRICE UPDATE", "BUY ORDER DETECTED", "VOLATILITY SPIKE", "USER PANIC DETECTED", "SYSTEM CONTINUES RUNNING"];
    let t = new Date(); t.setHours(9, 41, 2);
    const add = (msg) => {
      t = new Date(t.getTime() + Math.round(rand(1500, 4200)));
      const ts = `[${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}]`;
      const line = document.createElement("div");
      line.innerHTML = `<span class="t">${ts}</span> <span class="${warns.includes(msg) ? "w" : ""}">${msg}</span>`;
      log.appendChild(line);
      while (log.children.length > 11) log.removeChild(log.firstChild);
    };
    seed.forEach(add);
    setInterval(() => add(pick(events)), 2400);
  }
  chaos();


  function deskParticles() {
    const cv = $("#deskCanvas");
    const ctx = cv.getContext("2d");
    let w, h, dpr;
    const P = [];
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize(); window.addEventListener("resize", resize);
    for (let i = 0; i < 60; i++) P.push({ x: Math.random() * w, y: Math.random() * h, s: rand(0.6, 1.8), v: rand(0.05, 0.25), a: rand(0.1, 0.5), n: Math.random() < 0.25 ? String(Math.round(rand(100, 9999))) : null });
    let last = 0;
    const draw = (ts) => {
      if (reduced) return;
      if (ts - last < 40) { requestAnimationFrame(draw); return; }
      last = ts;
      ctx.clearRect(0, 0, w, h);
      for (const p of P) {
        p.y -= p.v; if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        ctx.fillStyle = `rgba(61,255,122,${p.a})`;
        if (p.n) { ctx.font = '9px "JetBrains Mono", monospace'; ctx.fillText(p.n, p.x, p.y); }
        else ctx.fillRect(p.x, p.y, p.s, p.s);
      }
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }
  deskParticles();

  const title = $(".hero__title");
  const variants = ["WALLSTREET.EXE", "WALLSTREET.EXE_", "WALLSTREET.EXE//ERROR"];
  function glitchNow() {
    if (reduced) return;
    $$(".glitch").forEach((g) => { g.classList.add("is-glitching"); setTimeout(() => g.classList.remove("is-glitching"), 380); });
    const v = pick(variants.slice(1));
    const orig = title.textContent;
    title.textContent = v; title.dataset.text = v;
    setTimeout(() => { title.textContent = "WALLSTREET.EXE"; title.dataset.text = "WALLSTREET.EXE"; }, 340);
    void orig;
  }
  if (!reduced) setInterval(() => { if (Math.random() < 0.3) glitchNow(); }, 7000);
  title.addEventListener("mouseenter", glitchNow);


  let toastT;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.classList.add("is-on");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("is-on"), 2200);
  }
  $$(".copy").forEach((b) => b.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); } catch (_) { /* clipboard unavailable */ }
    b.classList.add("is-copied"); b.textContent = "COPIED";
    toast("COPIED TO CLIPBOARD");
    setTimeout(() => { b.classList.remove("is-copied"); b.textContent = "COPY"; }, 1400);
  }));
  if (!LAUNCHED) {
    $("#buyBtn").addEventListener("click", (e) => { e.preventDefault(); toast("BUY LINK: TBA. HOLD YOUR HORSES."); });
    $("#chartBtn").addEventListener("click", (e) => { e.preventDefault(); toast("CHART LINK: TBA. THE LINE GOES SOMEWHERE."); });
  }


  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { threshold: 0.12 });
  $$(".section > .win, .section__head, .signal, .about__grid, .product__grid, .utility, .chaos__warn, .chaos__bottom > *").forEach((el) => { el.classList.add("reveal"); io.observe(el); });


  $$(".app__menu span").forEach((m) => m.addEventListener("click", () => toast(`${m.textContent}: MENU UNAVAILABLE DURING VOLATILITY`)));

  console.log("%cWALLSTREET.EXE", "font: bold 28px Inter, sans-serif; color:#3dff7a");
  console.log("%cSYSTEM STATUS: STILL RUNNING.\nType HELP in the terminal.", "color:#8a939c; font-family: monospace");
})();

refreshRealMarketData();

setInterval(
  refreshRealMarketData,
  CFG.MARKET_DATA?.refreshMs || 15000
);
