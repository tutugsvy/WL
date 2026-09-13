/* ==========================================================================
   WALLSTREET.EXE — app.js
   All data is fictional. Nothing here is real except the volatility.
   ========================================================================== */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const pad = (n) => String(n).padStart(2, "0");
  const fmtPct = (v) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
  const fmtUsd = (v, d = 2) => "$" + v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = () => window.matchMedia("(max-width: 900px)").matches;

  const GREEN = "#3dff7a", RED = "#ff4d4d", GRAY = "#8a939c", DIM = "rgba(61,255,122,0.08)";

  /* ------------------------------------------------------------------------
     Fictional market universe
     ------------------------------------------------------------------------ */
  const MARKETS = [
    { sym: "WSEX", name: "WALLSTREET.EXE", price: 0.0421, chg: 42.0, vol: 18_400_000, kind: "crypto", status: "vol" },
    { sym: "NVDA", name: "NVIDIA", price: 1184.32, chg: 4.82, vol: 41_200_000, kind: "eq" },
    { sym: "AAPL", name: "APPLE", price: 231.14, chg: -1.24, vol: 58_900_000, kind: "eq" },
    { sym: "TSLA", name: "TESLA", price: 402.77, chg: 2.91, vol: 96_100_000, kind: "eq" },
    { sym: "MSFT", name: "MICROSOFT", price: 512.6, chg: 1.42, vol: 22_300_000, kind: "eq" },
    { sym: "AMZN", name: "AMAZON", price: 218.05, chg: 0.63, vol: 34_700_000, kind: "eq" },
    { sym: "GME", name: "GAMESTOP", price: 28.41, chg: 12.47, vol: 88_800_000, kind: "eq", status: "halt" },
    { sym: "BTC", name: "BITCOIN", price: 118_420, chg: 3.42, vol: 31_000_000_000, kind: "crypto" },
    { sym: "ETH", name: "ETHEREUM", price: 4_612.5, chg: 2.17, vol: 18_600_000_000, kind: "crypto" },
    { sym: "SOL", name: "SOLANA", price: 241.9, chg: -3.08, vol: 4_100_000_000, kind: "crypto" },
    { sym: "SPX", name: "S&P 500", price: 6_812.4, chg: 0.41, vol: 0, kind: "idx" },
    { sym: "NDX", name: "NASDAQ 100", price: 24_910.2, chg: 0.88, vol: 0, kind: "idx" },
    { sym: "DJI", name: "DOW JONES", price: 46_120.7, chg: -0.12, vol: 0, kind: "idx" },
    { sym: "VIX", name: "VOLATILITY", price: 48.2, chg: 31.7, vol: 0, kind: "idx", status: "vol" },
  ];

  /* ------------------------------------------------------------------------
     Boot screen
     ------------------------------------------------------------------------ */
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

  /* ------------------------------------------------------------------------
     Clocks
     ------------------------------------------------------------------------ */
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

  /* ------------------------------------------------------------------------
     Hero terminal typing
     ------------------------------------------------------------------------ */
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

  /* ------------------------------------------------------------------------
     Hero background canvas: floating market data + particles
     ------------------------------------------------------------------------ */
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

  /* ------------------------------------------------------------------------
     Ticker tape
     ------------------------------------------------------------------------ */
  function buildTape() {
    const tape = $("#tape");
    const items = MARKETS.map((m) =>
      `<span class="tape__item"><b>${m.sym}</b> ${m.price < 1 ? m.price.toFixed(4) : m.price.toLocaleString("en-US", { maximumFractionDigits: 2 })} <span class="${m.chg >= 0 ? "up" : "down"}">${fmtPct(m.chg)}</span></span>`
    ).join("");
    tape.innerHTML = items + items; // duplicated for seamless loop
    const dt = $("#deskTape");
    dt.innerHTML = `<span>${MARKETS.map((m) => `${m.sym} ${fmtPct(m.chg)}`).join("   ·   ")}   ·   WALLSTREET.EXE IS RUNNING   ·   DO NOT CLOSE THIS WINDOW   ·   </span>`;
  }
  buildTape();

  /* ------------------------------------------------------------------------
     Live tickers (panel + desktop)
     ------------------------------------------------------------------------ */
  function liveTickers() {
    const rows = $$("#liveTickers tr");
    const state = rows.map((r) => ({ el: r.querySelector(".tk__pct"), v: parseFloat(r.dataset.base) }));
    const paint = (s) => {
      s.el.textContent = fmtPct(s.v);
      s.el.classList.toggle("up", s.v >= 0);
      s.el.classList.toggle("down", s.v < 0);
    };
    state.forEach(paint);
    setInterval(() => {
      const s = pick(state);
      const d = rand(-0.18, 0.2);
      s.v += d;
      paint(s);
      s.el.classList.remove("flash-up", "flash-down");
      void s.el.offsetWidth;
      s.el.classList.add(d >= 0 ? "flash-up" : "flash-down");
    }, 900);
  }
  liveTickers();

  /* ------------------------------------------------------------------------
     Candlestick engine
     ------------------------------------------------------------------------ */
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
    const data = makeSeries(n, opts.start || 0.03);
    let w, h, dpr;
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", () => { resize(); draw(); });

    // live candle
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

      // grid
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
          ctx.fillText(val < 1 ? val.toFixed(4) : val.toFixed(2), w - padR + 8, yy + 3);
        }
        ctx.setLineDash([]);
        // vertical
        for (let i = 0; i < all.length; i += 10) {
          const xx = padL + i * step;
          ctx.strokeStyle = "rgba(255,255,255,0.03)";
          ctx.beginPath(); ctx.moveTo(xx, padT); ctx.lineTo(xx, padT + ch); ctx.stroke();
        }
      }

      // volume
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

      // candles
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
          // live glow
          ctx.shadowColor = col; ctx.shadowBlur = 10;
          ctx.fillRect(x - bw / 2, top, bw, bh);
          ctx.shadowBlur = 0;
        }
      }

      // last price line
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
        ctx.fillText(live.c < 1 ? live.c.toFixed(4) : live.c.toFixed(2), w - padR + 7, ly + 4);
        // watermark
        ctx.fillStyle = DIM;
        ctx.font = 'bold 28px Inter, sans-serif';
        ctx.textAlign = "left";
        ctx.fillText("WALLSTREET.EXE", padL + 10, padT + 34);
      }

      if (opts.onPrice) opts.onPrice(live.c, data[0].o);
    };

    const update = () => {
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
    return { data, get price() { return live.c; } };
  }

  const priceEl = $("#chartPrice"), chgEl = $("#chartChg");
  const mainChart = candleChart($("#mainChart"), {
    count: 64, start: 0.0312, volume: true,
    onPrice: (p, base) => {
      priceEl.textContent = p.toFixed(4);
      const c = ((p - base) / base) * 100;
      chgEl.textContent = fmtPct(c);
      const up = c >= 0;
      priceEl.className = up ? "c-green" : "c-red";
      chgEl.className = up ? "c-green" : "c-red";
    },
  });
  candleChart($("#deskChart"), { count: 40, start: 0.04, mini: true });

  /* ------------------------------------------------------------------------
     System log (panel)
     ------------------------------------------------------------------------ */
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
    // latency + ping
    setInterval(() => {
      $("#latency").textContent = Math.round(rand(8, 46)) + "ms";
      $("#mPing").textContent = Math.round(rand(9, 38)) + "ms";
    }, 1800);
    // portfolio drift
    let v = 124921.42, c = 8.42;
    setInterval(() => {
      const d = rand(-180, 220);
      v += d; c += d / 1500;
      $("#pfValue").textContent = fmtUsd(v);
      $("#deskPf").textContent = fmtUsd(v);
      const el = $("#pfChange");
      el.textContent = fmtPct(c);
      el.className = "pf__value " + (c >= 0 ? "c-green" : "c-red");
    }, 1400);
    // meters
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

  /* ------------------------------------------------------------------------
     Desktop: draggable windows
     ------------------------------------------------------------------------ */
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
      // controls
      const ctl = $$(".win__ctl b", w);
      if (ctl[0] && ctl.length === 3) ctl[0].addEventListener("click", (e) => { e.stopPropagation(); w.classList.toggle("is-min"); });
      if (ctl[2] && ctl.length === 3) ctl[2].addEventListener("click", (e) => {
        e.stopPropagation();
        w.style.opacity = "0"; w.style.transform += " scale(0.96)";
        setTimeout(() => { w.style.opacity = ""; w.style.transform = w.style.transform.replace(" scale(0.96)", ""); toast(`${w.dataset.win.toUpperCase()}: CANNOT CLOSE. STILL RUNNING.`); }, 700);
      });
      if (ctl.length === 3) ctl[1].addEventListener("click", (e) => { e.stopPropagation(); toast("MAXIMIZE DISABLED BY MARKET REGULATOR"); });

      // dragging
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

    // desktop tickers table
    const tb = $("#deskTickers tbody");
    const rowsData = MARKETS.filter((m) => ["WSEX", "NVDA", "TSLA", "GME", "BTC", "ETH", "SOL"].includes(m.sym));
    tb.innerHTML = rowsData.map((m) => `<tr data-sym="${m.sym}"><td>${m.sym}</td><td>${m.price < 1 ? m.price.toFixed(4) : m.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}</td><td class="tk__pct ${m.chg >= 0 ? "up" : "down"}">${fmtPct(m.chg)}</td></tr>`).join("");
    setInterval(() => {
      const tr = pick($$("tr", tb));
      const m = rowsData.find((x) => x.sym === tr.dataset.sym);
      const d = rand(-0.4, 0.5);
      m.chg += d; m.price *= 1 + d / 100;
      tr.children[1].textContent = m.price < 1 ? m.price.toFixed(4) : m.price.toLocaleString("en-US", { maximumFractionDigits: 2 });
      const pc = tr.children[2];
      pc.textContent = fmtPct(m.chg); pc.className = "tk__pct " + (m.chg >= 0 ? "up" : "down");
      pc.classList.remove("flash-up", "flash-down"); void pc.offsetWidth; pc.classList.add(d >= 0 ? "flash-up" : "flash-down");
    }, 1100);

    // warning popup: occasional, dismissable
    const warn = $("#warnWin");
    const showWarn = () => {
      if (isMobile() || !warn) return;
      warn.hidden = false; focus(warn);
    };
    $$(".warn-close", warn).forEach((b) => b.addEventListener("click", () => { warn.hidden = true; toast("WARNING DISMISSED. VOLATILITY REMAINS."); }));
    setTimeout(showWarn, 14000);
    setInterval(() => { if (Math.random() < 0.35) showWarn(); }, 60000);

    // news feed
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

  /* ------------------------------------------------------------------------
     Interactive terminal
     ------------------------------------------------------------------------ */
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
      help: () => print("COMMANDS:\n  MARKET    show market snapshot\n  BUY       buy $WSEX\n  SELL      attempt to sell\n  HOLD      do nothing (recommended)\n  PANIC     panic\n  STATUS    system status\n  CONTRACT  show contract\n  CLEAR     clear screen\n  EXIT      close terminal", "dim"),
      market: () => print(MARKETS.slice(0, 8).map((m) => `  ${m.sym.padEnd(6)} ${(m.price < 1 ? m.price.toFixed(4) : m.price.toFixed(2)).padStart(11)}  ${fmtPct(m.chg).padStart(8)}`).join("\n")),
      buy: () => { print("EXECUTING BUY ORDER... FILLED.", "hi"); print(`ACQUIRED ${Math.round(rand(10_000, 900_000)).toLocaleString()} $WSEX @ ${mainChart.price.toFixed(4)}`); print("WARNING: YOU ARE NOW EMOTIONALLY INVOLVED.", "err"); glitchNow(); },
      sell: () => print("ERROR: SELL FUNCTION NOT FOUND.\nDID YOU MEAN: HOLD?", "err"),
      hold: () => print("HOLDING... HOLDING... STILL HOLDING.\nRESULT: OK"),
      panic: () => { print("PANIC INITIATED.", "err"); print("PANIC COMPLETE. NOTHING CHANGED.", "dim"); print("SYSTEM CONTINUES RUNNING.", "hi"); $("#warnWin").hidden = false; },
      status: () => print(`SYSTEM: ONLINE\nMARKET: OPEN\nVOLATILITY: EXTREME\nUPTIME: ${$("#uptime").textContent}\nHOPE: 12%`),
      contract: () => print("$WSEX CONTRACT:\n0x0000000000000000000000000000000000000000\n(TBA)", "hi"),
      clear: () => { out.textContent = ""; },
      exit: () => print("ACCESS DENIED. THERE IS NO EXIT.", "err"),
      dir: () => print(" Volume in drive C is WALLSTREET\n\n  WALLSTREET  EXE   1,000,000,000  09-13-26  9:41a\n  PANIC       LOG          48,213  09-13-26  9:41a\n  LOSSES      TXT     <HIDDEN>\n  HOPE        DLL             12  01-01-98 12:00a", "dim"),
      whoami: () => print("GUEST (UNVERIFIED, UNDIVERSIFIED)"),
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

  /* ------------------------------------------------------------------------
     Big terminal table
     ------------------------------------------------------------------------ */
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
      return `<span class="status"><i class="dot dot--green"></i>OPEN</span>`;
    };
    const render = () => {
      tb.innerHTML = MARKETS.map((m) => `<tr data-sym="${m.sym}">
        <td>${m.sym}<span class="sym-sub">${m.name}</span></td>
        <td>${m.price < 1 ? m.price.toFixed(4) : m.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}</td>
        <td class="${m.chg >= 0 ? "up" : "down"}">${fmtPct(m.chg)} ${spark(m.chg >= 0)}</td>
        <td>${fmtVol(m.vol)}</td>
        <td>${statusHtml(m)}</td></tr>`).join("");
      $("#rowCount").textContent = MARKETS.length;
    };
    render();
    setInterval(() => {
      const m = pick(MARKETS);
      const d = rand(-0.3, 0.35);
      m.chg += d; m.price *= 1 + d / 100; if (m.vol) m.vol *= 1 + rand(0, 0.004);
      const tr = $(`tr[data-sym="${m.sym}"]`, tb);
      if (!tr) return;
      tr.children[1].textContent = m.price < 1 ? m.price.toFixed(4) : m.price.toLocaleString("en-US", { maximumFractionDigits: 2 });
      const pc = tr.children[2];
      pc.className = m.chg >= 0 ? "up" : "down";
      pc.innerHTML = `${fmtPct(m.chg)} ${spark(m.chg >= 0)}`;
      tr.children[3].textContent = fmtVol(m.vol);
      tr.children[1].classList.remove("flash-up", "flash-down"); void tr.offsetWidth; tr.children[1].classList.add(d >= 0 ? "flash-up" : "flash-down");
    }, 1000);
  }
  bigTable();

  /* ------------------------------------------------------------------------
     Market chaos: signals + panic log
     ------------------------------------------------------------------------ */
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

    // panic log
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

  /* ------------------------------------------------------------------------
     Desktop particles canvas
     ------------------------------------------------------------------------ */
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

  /* ------------------------------------------------------------------------
     Glitch (rare, controlled)
     ------------------------------------------------------------------------ */
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

  /* ------------------------------------------------------------------------
     Copy buttons + toast + reveal
     ------------------------------------------------------------------------ */
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
  $("#buyBtn").addEventListener("click", (e) => { e.preventDefault(); toast("BUY LINK: TBA. HOLD YOUR HORSES."); });
  $("#chartBtn").addEventListener("click", (e) => { e.preventDefault(); toast("CHART LINK: TBA. THE LINE GOES SOMEWHERE."); });

  // reveal on scroll
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { threshold: 0.12 });
  $$(".section > .win, .section__head, .signal, .about__grid, .chaos__warn, .chaos__bottom > *").forEach((el) => { el.classList.add("reveal"); io.observe(el); });

  // Menu items in app: playful
  $$(".app__menu span").forEach((m) => m.addEventListener("click", () => toast(`${m.textContent}: MENU UNAVAILABLE DURING VOLATILITY`)));

  // console easter egg
  console.log("%cWALLSTREET.EXE", "font: bold 28px Inter, sans-serif; color:#3dff7a");
  console.log("%cSYSTEM STATUS: STILL RUNNING.\nType HELP in the terminal.", "color:#8a939c; font-family: monospace");
})();
