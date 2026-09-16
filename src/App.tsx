import { useEffect, useState } from 'react';

const address = '0xac0f8c8a0dfdcaa415382622f0e3da23585d1b77';
const feedUrl = `https://api.geckoterminal.com/api/v2/networks/arc/tokens/${address}?include=top_pools`;

type Quote = { price_usd?: string; volume_usd?: { h24?: string }; fdv_usd?: string };

export default function App() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [status, setStatus] = useState('SYNCING MARKET FEED');
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch(feedUrl, { headers: { accept: 'application/json' } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        if (active) { setQuote(json.data?.attributes ?? null); setStatus('LIVE · GECKOTERMINAL'); }
      } catch { if (active) setStatus('FEED OFFLINE · VERIFY TOKEN POOL'); }
    };
    refresh(); const timer = window.setInterval(refresh, 30000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  const price = quote?.price_usd ? Number(quote.price_usd).toPrecision(6) : '—';
  return <main className="react-shell">
    <header><strong>WALLSTREET<span>.EXE</span></strong><nav><a href="#market">MARKET</a><a href="#terminal">TERMINAL</a><a href="#about">ABOUT</a></nav><time>{new Date().toLocaleTimeString()}</time></header>
    <section className="hero"><p className="eyebrow">// MARKET TERMINAL / ARC</p><h1>THE MARKET WAS NEVER<br/><em>MEANT TO RUN THIS WAY.</em></h1><p className="lede">A professional on-chain market interface for $WSEX. Real-time quotes, wallet intelligence, and terminal-grade market data.</p><div className="actions"><a className="primary" href="#market">OPEN TERMINAL</a><a href={`https://arcchain.blockscout.com/token/${address}`}>VIEW CONTRACT ↗</a></div></section>
    <section id="market" className="market-panel"><div className="panel-head"><span>MARKET CHART — $WSEX / USD</span><b className={status.startsWith('LIVE') ? 'live' : ''}>{status}</b></div><div className="quote"><div><small>LAST PRICE</small><strong>${price}</strong></div><div><small>24H VOLUME</small><strong>{quote?.volume_usd?.h24 ? `$${Number(quote.volume_usd.h24).toLocaleString()}` : '—'}</strong></div><div><small>FDV</small><strong>{quote?.fdv_usd ? `$${Number(quote.fdv_usd).toLocaleString()}` : '—'}</strong></div></div><div className="chart-placeholder"><span>LIVE OHLCV SERIES</span><div className="chart-line"/></div></section>
    <section id="terminal" className="terminal"><p className="eyebrow">// SYSTEM STATUS</p><pre>{`WALLSTREET.EXE v2.0\nNETWORK ........ ARC\nASSET .......... $WSEX\nFEED ........... ${status}\nPRICE .......... $${price}\n\nTYPE HELP TO VIEW AVAILABLE COMMANDS_`}</pre></section>
    <footer id="about">WALLSTREET.EXE <span>DATA IS READ DIRECTLY FROM PUBLIC MARKET SOURCES · NOT FINANCIAL ADVICE</span></footer>
  </main>;
}
