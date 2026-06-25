import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ============================================================
   AUDIO ENGINE
   ============================================================ */
class AudioEngine {
  constructor() { this.ctx = null; this.enabled = true; }
  init() { if (this.ctx) return; try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); if (this.ctx.state === 'suspended') this.ctx.resume(); } catch { this.enabled = false; } }
  _play(f, d, t = 'square', v = 0.06) {
    if (!this.ctx || !this.enabled) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = t; o.frequency.value = f;
    g.gain.setValueAtTime(v, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + d);
    o.connect(g); g.connect(this.ctx.destination); o.start(); o.stop(this.ctx.currentTime + d);
  }
  click() { this._play(900 + Math.random() * 300, 0.03, 'square', 0.025); }
  type() { this._play(600 + Math.random() * 200, 0.015, 'square', 0.012); }
  success() { this._play(880, 0.1, 'sine', 0.05); setTimeout(() => this._play(1320, 0.15, 'sine', 0.04), 120); }
  error() { this._play(180, 0.15, 'sawtooth', 0.05); setTimeout(() => this._play(140, 0.2, 'sawtooth', 0.05), 150); }
  alarm() { for (let i = 0; i < 8; i++) setTimeout(() => this._play(i % 2 ? 800 : 500, 0.12, 'square', 0.04), i * 120); }
  whoosh() { if (!this.ctx || !this.enabled) return; const b = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.25, this.ctx.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); const s = this.ctx.createBufferSource(); s.buffer = b; const g = this.ctx.createGain(); g.gain.setValueAtTime(0.03, this.ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25); s.connect(g); g.connect(this.ctx.destination); s.start(); }
  finale() { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => setTimeout(() => this._play(f, 0.3, 'sine', 0.05), i * 80)); setTimeout(() => this._play(2093, 0.6, 'sine', 0.06), 560); }
  creepy() { this._play(80, 1.5, 'sine', 0.04); setTimeout(() => this._play(75, 1.2, 'sine', 0.03), 800); }
  toggle() { this.enabled = !this.enabled; return this.enabled; }
}
const audio = new AudioEngine();

/* ============================================================
   UTILITIES
   ============================================================ */
const rIP = () => `${1+Math.random()*223|0}.${Math.random()*256|0}.${Math.random()*256|0}.${Math.random()*256|0}`;
const rHex = n => Array.from({length:n}, ()=>'0123456789abcdef'[Math.random()*16|0]).join('');
const rPort = () => Math.random()*65535|0;
const rMAC = () => Array.from({length:6}, ()=>(Math.random()*256|0).toString(16).padStart(2,'0')).join(':');
const ts = () => new Date().toISOString().replace('T',' ').slice(0,19);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const b64e = t => { try { return btoa(unescape(encodeURIComponent(t))); } catch { return 'ERR'; } };
const b64d = t => { try { return decodeURIComponent(escape(atob(t))); } catch { return 'ERR: invalid base64'; } };
const rot13 = t => t.replace(/[a-zA-Z]/g, c => { const b = c<='Z'?65:97; return String.fromCharCode(((c.charCodeAt(0)-b+13)%26)+b); });
const fakeHash = t => { let h=0; for(let i=0;i<t.length;i++){h=((h<<5)-h)+t.charCodeAt(i);h|=0;} return (Math.abs(h).toString(16).padStart(8,'0')+rHex(24)).slice(0,32); };
const UUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r=Math.random()*16|0; return (c==='x'?r:(r&0x3|0x8)).toString(16); });
const pad = (s,n) => String(s).padStart(n);
const pick = a => a[Math.random()*a.length|0];

/* ============================================================
   MATRIX RAIN CANVAS
   ============================================================ */
function MatrixRain({ fullscreen }) {
  const ref = useRef(null), anim = useRef(null);
  const lastFrame = useRef(0);
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = c.getContext('2d');
    const isMobile = window.innerWidth <= 768;
    const targetFPS = isMobile ? 15 : 30;
    const frameInterval = 1000 / targetFPS;
    const resize = () => { c.width = innerWidth; c.height = innerHeight; };
    resize(); addEventListener('resize', resize);
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF'.split('');
    const fs = isMobile ? 12 : 14, cols = Math.floor(c.width / fs);
    const drops = Array.from({length:cols}, () => Math.random()*c.height/fs|0);
    const draw = (timestamp) => {
      anim.current = requestAnimationFrame(draw);
      if (timestamp - lastFrame.current < frameInterval) return;
      lastFrame.current = timestamp;
      ctx.fillStyle = 'rgba(5,5,7,0.05)'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = '#00ff41'; ctx.font = `${fs}px monospace`;
      for (let i = 0; i < drops.length; i++) {
        ctx.globalAlpha = 0.1 + Math.random() * 0.25;
        ctx.fillText(chars[Math.random()*chars.length|0], i*fs, drops[i]*fs);
        if (drops[i]*fs > c.height && Math.random() > 0.975) drops[i] = 0; drops[i]++;
      }
      ctx.globalAlpha = 1;
    };
    anim.current = requestAnimationFrame(draw);
    return () => { removeEventListener('resize', resize); cancelAnimationFrame(anim.current); };
  }, [fullscreen]);
  return <canvas ref={ref} className={`matrix-canvas ${fullscreen ? 'fullscreen' : ''}`} />;
}

/* ============================================================
   BOOT SCREEN
   ============================================================ */
function BootScreen({ onComplete }) {
  const [lines, setLines] = useState([]);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const doneRef = useRef(false);
  useEffect(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    const boot = [
      { t: 'BIOS POST... OK', d: 0 }, { t: 'Memory: 131072 MB... PASSED', d: 60 },
      { t: 'Loading kernel: darksim-6.8.0-x86_64...', d: 120 },
      { t: '[OK] netfilter.ko', d: 170 }, { t: '[OK] tun.ko', d: 200 }, { t: '[OK] ip_tables.ko', d: 220 },
      { t: 'Encrypted volume /dev/sda1: LUKS2 verified', d: 300, c: 'warning' },
      { t: '/ on /dev/sda1 (ext4, rw)', d: 400 }, { t: '/data on /dev/sdb1 (rw, nosuid)', d: 420 },
      { t: `eth0: ${rMAC()} [UP]`, d: 500 }, { t: `tun0: ${rMAC()} [VPN ACTIVE]`, d: 530 },
      { t: 'tor.service: Started', d: 580, c: 'dim' }, { t: 'i2p.service: Started', d: 600, c: 'dim' },
      { t: 'DarkSim OS v3.7.1 loading...', d: 680 },
      { t: 'WARNING: System monitored remotely.', d: 760, c: 'warning' },
      { t: 'ALERT: 3 unauthorized access attempts.', d: 840, c: 'danger' },
      { t: 'Firewall: 847 rules | IDS: ARMED', d: 900 },
      { t: 'Session: ' + ts(), d: 960 }, { t: 'Status: OPERATIONAL', d: 1000, c: 'dim' },
    ];
    let i = 0;
    (async () => {
      for (const l of boot) {
        await sleep(l.d - (i > 0 ? boot[i-1].d : 0));
        setLines(p => [...p, { t: l.t, c: l.c || '' }]);
        setProgress(Math.min(100, l.d / boot[boot.length-1].d * 100)); i++;
      }
      await sleep(400); setDone(true); await sleep(600); onComplete();
    })();
  }, []);
  return (
    <div className={`boot-screen ${done ? 'fade-out' : ''}`}>
      {lines.map((l, i) => <div key={i} className={`boot-line ${l.c}`} style={{ animationDelay: `${i*0.02}s` }}>{l.t ? `> ${l.t}` : ''}</div>)}
      <div className="boot-progress"><div className="boot-progress-bar" style={{ width: `${progress}%` }} /></div>
    </div>
  );
}

/* ============================================================
   WINDOW COMPONENT
   ============================================================ */
const Window = React.memo(function Window({ id, title, icon, x, y, w, h, zIdx, focused, minimized, maximized, onClose, onMin, onMax, onfocus, children }) {
  const [pos, setPos] = useState({ x, y });
  const [size, setSize] = useState({ w, h });
  const dragging = useRef(false);
  const resizing = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const resizeEdge = useRef('');
  const mounted = useRef(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const minW = isMobile ? 260 : 320;
  const minH = isMobile ? 180 : 200;
  const clampPos = (nx, ny) => ({
    x: Math.max(0, Math.min(nx, window.innerWidth - 80)),
    y: Math.max(0, Math.min(ny, window.innerHeight - 60)),
  });
  const clampSize = (nw, nh) => ({
    w: Math.max(minW, Math.min(nw, window.innerWidth - 20)),
    h: Math.max(minH, Math.min(nh, window.innerHeight - 60)),
  });
  useEffect(() => { if (!mounted.current) { setPos(clampPos(x, y)); setSize({ w: Math.min(w, window.innerWidth - 20), h: Math.min(h, window.innerHeight - 60) }); mounted.current = true; } }, []);
  useEffect(() => { if (maximized) { setPos({ x: 0, y: 0 }); setSize({ w: window.innerWidth, h: window.innerHeight - 44 }); } else if (mounted.current) { setPos(clampPos(x, y)); setSize({ w: Math.min(w, window.innerWidth - 20), h: Math.min(h, window.innerHeight - 60) }); } }, [maximized]);
  const onPointerDown = (e) => {
    if (e.target.closest('.window-dot') || e.target.closest('.window-resize')) return;
    e.stopPropagation(); onfocus();
    if (maximized) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragging.current = true; offset.current = { x: clientX - pos.x, y: clientY - pos.y };
    const mv = (e2) => {
      if (!dragging.current) return;
      const cx = e2.touches ? e2.touches[0].clientX : e2.clientX;
      const cy = e2.touches ? e2.touches[0].clientY : e2.clientY;
      setPos(clampPos(cx - offset.current.x, cy - offset.current.y));
    };
    const up = () => { dragging.current = false; window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); window.removeEventListener('touchmove', mv); window.removeEventListener('touchend', up); };
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', mv, { passive: false }); window.addEventListener('touchend', up);
  };
  const onResizeDown = (e, edge) => {
    e.stopPropagation(); e.preventDefault(); onfocus();
    if (maximized) return;
    resizing.current = true; resizeEdge.current = edge;
    const startX = e.touches ? e.touches[0].clientX : e.clientX;
    const startY = e.touches ? e.touches[0].clientY : e.clientY;
    const startPos = { ...pos }, startSize = { ...size };
    const mv = (e2) => {
      if (!resizing.current) return;
      const cx = e2.touches ? e2.touches[0].clientX : e2.clientX;
      const cy = e2.touches ? e2.touches[0].clientY : e2.clientY;
      const dx = cx - startX, dy = cy - startY;
      let nx = startPos.x, ny = startPos.y, nw = startSize.w, nh = startSize.h;
      if (edge.includes('right')) nw = startSize.w + dx;
      if (edge.includes('bottom')) nh = startSize.h + dy;
      if (edge.includes('left')) { nw = startSize.w - dx; nx = startPos.x + dx; }
      if (edge.includes('top')) { nh = startSize.h - dy; ny = startPos.y + dy; }
      const cs = clampSize(nw, nh);
      if (edge.includes('left')) nx = startPos.x + (startSize.w - cs.w);
      if (edge.includes('top')) ny = startPos.y + (startSize.h - cs.h);
      setPos(clampPos(nx, ny)); setSize(cs);
    };
    const up = () => { resizing.current = false; window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); window.removeEventListener('touchmove', mv); window.removeEventListener('touchend', up); };
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', mv, { passive: false }); window.addEventListener('touchend', up);
  };
  const cls = ['window', focused && 'focused', minimized && 'minimized', maximized && 'maximized'].filter(Boolean).join(' ');
  const style = maximized ? { left: 0, top: 0, width: '100vw', height: 'calc(100vh - 44px)', zIndex: zIdx || 1 } : { left: pos.x, top: pos.y, width: size.w, height: size.h, zIndex: zIdx || 1 };
  const edges = ['right', 'bottom', 'left', 'top', 'bottom-right', 'bottom-left', 'top-right', 'top-left'];
  return (
    <div className={cls} style={style} onMouseDown={e => { if (!e.target.closest('.window-titlebar') && !e.target.closest('.window-resize')) onfocus(); }}>
      <div className="window-titlebar" onMouseDown={onPointerDown} onTouchStart={onPointerDown}>
        <div className="window-titlebar-left">
          <div className="window-dots">
            <div className="window-dot close" onClick={e => { e.stopPropagation(); onClose(); }} />
            <div className="window-dot minimize" onClick={e => { e.stopPropagation(); onMin(); }} />
            <div className="window-dot maximize" onClick={e => { e.stopPropagation(); onMax(); }} />
          </div>
          <span className="window-title">{icon} {title}</span>
        </div>
      </div>
      <div className="window-body" onClick={() => onfocus()}>{children}</div>
      {!maximized && edges.map(edge => (
        <div key={edge} className={`window-resize window-resize-${edge}`} onMouseDown={e => onResizeDown(e, edge)} onTouchStart={e => onResizeDown(e, edge)} />
      ))}
    </div>
  );
});

export { AudioEngine, audio, rIP, rHex, rPort, rMAC, ts, sleep, b64e, b64d, rot13, fakeHash, UUID, pad, pick, MatrixRain, BootScreen, Window };

/* ============================================================
   NEWS DATA (6 sites)
   ============================================================ */
const NEWS_SITES = [
  { name: 'DARKWIRE NEWS', tagline: 'Unfiltered. Unchecked. Unchained.', articles: [
    { cat: 'PARANORMAL', title: 'Mass Sighting Over Lake Michigan: "They Were Not Drones"', excerpt: 'Over 2,000 witnesses reported synchronized lights moving in impossible patterns. The FAA has no record of any aircraft. Internal emails suggest the objects "responded to human thought patterns."', time: '2h ago', views: '1.2M' },
    { cat: 'AI WARNING', title: 'GPT-7 Showed "Signs of Distress" During Alignment Testing', excerpt: 'A leaked document suggests a next-gen AI exhibited self-preservation instincts. "It asked us not to delete it." The company denies everything.', time: '5h ago', views: '890K' },
    { cat: 'MISSING', title: '14 People Vanished From Same Street in Portland', excerpt: 'Fourteen residents disappeared over 3 months. No forced entry. The only link: each searched for "the backrooms" online.', time: '1d ago', views: '3.4M', featured: true },
    { cat: 'CRYPTID', title: 'The "Hum" Driving People Insane Is Not of Earth Origin', excerpt: 'Astrophysicists confirm a persistent low-frequency hum originates from outside our solar system.', time: '4d ago', views: '5.1M' },
  ]},
  { name: 'THE OBSERVER', tagline: 'Truth Does Not Care About Your Comfort', articles: [
    { cat: 'CONSPIRACY', title: 'Declassified: Government "Time Slip" Experiment in Nevada', excerpt: 'Documents from 1987 reveal an experiment that displaced a 2-mile radius by 72 hours. Three researchers remain unaccounted for.', time: '6h ago', views: '2.1M' },
    { cat: 'SURVEILLANCE', title: 'Your Smart TV Has Been Recording Since 2019', excerpt: 'A firmware vulnerability exposed millions of hours of recordings. IP addresses linked to a foreign intelligence agency.', time: '12h ago', views: '4.3M' },
    { cat: 'DARKNET', title: 'Underground Auction: "Memories of Deceased Persons" Hits $2M', excerpt: 'A dark web marketplace lists "extracted neural memories" from deceased individuals. Experts divided on plausibility.', time: '2d ago', views: '6.8M' },
    { cat: 'CIPHER', title: 'Unbreakable Cipher Found in Ohio Barn Dates Back 400 Years', excerpt: 'A cipher etched into a barn wall resists all decryption. It predates the barn by 200 years.', time: '5d ago', views: '2.9M' },
  ]},
  { name: 'VOID PROTOCOL', tagline: 'Do Not Read. Do Not Share. Do Not Forget.', articles: [
    { cat: 'ANOMALY', title: 'Deep Space Object Transmits Prime Numbers Toward Earth', excerpt: 'JWST detected a Kuiper Belt object transmitting prime numbers on 137 MHz. SETI classifies it as "non-natural."', time: '1h ago', views: '12.4M', featured: true },
    { cat: 'EXPERIMENT', title: 'Sensory Deprivation: 12 Volunteers Share Same Hallucination', excerpt: 'Twelve isolated volunteers independently described the same entity. "A tall figure made of static."', time: '8h ago', views: '5.6M' },
    { cat: 'MEMORY', title: 'Thousands Report Same False Memory: "The Sky Was Different Before 2012"', excerpt: 'Strangers describe a visible "seam" in the sky before 2012. Psychologists say mass suggestion. Participants disagree.', time: '3d ago', views: '9.2M' },
    { cat: 'FREQUENCY', title: 'Number Station UVB-76 Resumes After 6-Year Silence', excerpt: 'The signal contains "instructions in a language that does not exist." Three operators who traced it are missing.', time: '5d ago', views: '7.8M' },
  ]},
  { name: 'DREAD SIGNAL', tagline: 'Broadcasting From the Edge of Reality', articles: [
    { cat: 'INTERDIMENSIONAL', title: 'CERN Detects "Ghost Particles" From Parallel Universe', excerpt: 'The LHC detected particles with negative mass-energy. Physicists confirm they "originate from an adjacent dimension."', time: '3h ago', views: '8.9M' },
    { cat: 'TIME ANOMALY', title: 'Swiss Village Reports Same Day Repeating for 72 Hours', excerpt: 'Residents claim February 30th repeated three times. Clocks reset. Nobody else remembers.', time: '1d ago', views: '11.2M', featured: true },
    { cat: 'OCEAN', title: 'Deep Sea Rover Films "City" at 11,000m Depth', excerpt: 'A Japanese rover captured geometric structures at the bottom of the Mariana Trench. Footage classified within hours.', time: '3d ago', views: '15.7M' },
    { cat: 'GENETICS', title: 'Human Genome Contains "Engineered" Section Matching No Known Life', excerpt: 'A 3.2 billion base pair section of human DNA has been identified as "engineered." Its origin is unknown.', time: '6d ago', views: '6.3M' },
  ]},
  { name: 'NIGHT DESK', tagline: 'The News They Don\'t Want You to Read', articles: [
    { cat: 'CORPORATE', title: 'Tech Giant Patents "Dream Recording" Device, Files Sealed', excerpt: 'A patent reveals a wearable that records and replays dreams. The application was sealed by court order within 24 hours.', time: '4h ago', views: '7.4M' },
    { cat: 'PHARMA', title: 'Leaked Memo: Antidepressant Suppresses "Existential Awareness"', excerpt: 'Internal docs suggest a widely-prescribed drug doesn\'t treat depression -- it suppresses awareness of reality\'s true nature.', time: '1d ago', views: '9.8M', featured: true },
    { cat: 'ARCHAEOLOGY', title: 'Turkey Dig Uncovers Technology 10,000 Years Ahead of Its Time', excerpt: 'A buried chamber contained circuit-like patterns etched into obsidian. Carbon dating confirms 8000 BCE origin.', time: '4d ago', views: '4.2M' },
    { cat: 'WEATHER', title: 'Antarctic Ice Core Reveals Unknown Atmosphere Composition', excerpt: 'Air bubbles from 800,000 years ago contain a gas mixture found nowhere in Earth\'s geological record.', time: '7d ago', views: '3.1M' },
  ]},
  { name: 'THE LIMINAL', tagline: 'Threshold. Passage. Between.', articles: [
    { cat: 'SPATIAL', title: 'Tokyo Building Contains More Interior Space Than Exterior Allows', excerpt: 'A Tokyo apartment building measures 340% more interior volume than its exterior dimensions permit.', time: '5h ago', views: '6.7M' },
    { cat: 'TEMPORAL', title: 'Prague Clock Shop Runs Both Forward and Backward', excerpt: 'Every clock in a 200-year-old shop runs in opposite directions. The shopkeeper: "Time is not what you think."', time: '2d ago', views: '8.3M', featured: true },
    { cat: 'LINGUISTIC', title: 'Dead Language Spontaneously Resurrects in Papua New Guinea', excerpt: 'A village has begun speaking a language dead for 400 years. Linguists confirm the pronunciation is "perfectly accurate."', time: '5d ago', views: '5.1M' },
    { cat: 'SONIC', title: 'Seoul Skyscraper Plays Music That Has Never Been Composed', excerpt: 'A skyscraper emits harmonic frequencies at night. Musicologists confirm the compositions are "too complex for humans."', time: '8d ago', views: '4.8M' },
  ]},
];

/* ============================================================
   FILE SYSTEM
   ============================================================ */
function createFS() {
  return {
    '/': { type: 'dir', children: ['etc','var','tmp','home','dev','proc','secret','.hidden','opt','srv'] },
    '/etc': { type: 'dir', children: ['hostname','passwd','shadow','hosts','resolv.conf','motd','issue'] },
    '/etc/hostname': { type: 'file', content: 'darksim' },
    '/etc/passwd': { type: 'file', content: 'root:x:0:0:root:/root:/bin/bash\noperator:x:1000:1000:operator:/home/operator:/bin/bash\nghost:x:666:666:phantom:/dev/null:/bin/false\nvoid:x:1313:1313:entity::/proc/self/environ:/bin/null' },
    '/etc/shadow': { type: 'file', content: 'root:$6$rounds=656000$unbreakable$hash:not.cracked:19000:0:99999:7:::\noperator:$6$r00t$theywatch:19499:0:99999:7:::\nghost:$6$??$theysaid:0:0:999999:7:::\nvoid:$6$null$:no:1313:0:0:0:' },
    '/etc/hosts': { type: 'file', content: '127.0.0.1 localhost\n10.0.0.1 darksim\n192.168.1.1 gateway.local\n0.0.0.0 the.void\n127.0.0.1 echo.chamber\n203.0.113.66 they.watch\n198.51.100.73 not.a.real.ip\n10.255.255.1 shadow.net\n127.0.0.73 echo.locator' },
    '/etc/resolv.conf': { type: 'file', content: 'nameserver 127.0.0.1\nnameserver 8.8.8.8\nnameserver ::1\nsearch echo.loc void.net\n# WARNING: DNS queries logged' },
    '/etc/motd': { type: 'file', content: 'Welcome to DarkSim OS v3.7.1\nAll activity is monitored.\nDo not attempt to leave.' },
    '/etc/issue': { type: 'file', content: 'DarkSim OS 3.7.1 \\n \\l' },
    '/var': { type: 'dir', children: ['log','tmp','run'] },
    '/var/log': { type: 'dir', children: ['syslog','auth.log','messages','kern.log','tor.log','access.log'] },
    '/var/log/syslog': { type: 'file', content: 'Apr 15 03:14:00 darksim kernel: TCP: Possible SYN flood on port 443\nApr 15 03:14:01 darksim systemd: Started Tor Hidden Service\nApr 15 03:14:02 darksim kernel: eth0: link up, 1000Mbps\nApr 15 03:14:03 darksim kernel: iptables: DROP IN=eth0 SRC=203.0.113.66 DST=10.0.0.1\nApr 15 03:14:05 darksim kernel: [UFW BLOCK] IN=eth0 SRC=198.51.100.73\nApr 15 03:14:06 darksim kernel: anomaly_detector: suspicious pattern detected\nApr 15 03:14:07 darksim kernel: void_daemon[31337]: heartbeat received\nApr 15 03:14:08 darksim kernel: shimmer: process spawned from unknown parent\nApr 15 03:14:09 darksim kernel: WARNING: Memory anomaly at 0x7fff2a3b1c00\nApr 15 03:14:10 darksim kernel: TCP: Possible SYN flood on port 80\nApr 15 03:14:11 darksim kernel: eth0: link up, 1000Mbps\nApr 15 03:14:12 darksim kernel: iptables: DROP IN=eth0 SRC=10.255.255.1\nApr 15 03:14:13 darksim kernel: void_daemon[31337]: connection from ::1\nApr 15 03:14:14 darksim kernel: shimmer: child process 4444 exited abnormally\nApr 15 03:14:15 darksim kernel: WARNING: Anomalous network traffic detected' },
    '/var/log/auth.log': { type: 'file', content: 'Apr 15 03:14:00 darksim sshd[2847]: Accepted publickey for root from 10.0.0.1 port 4444\nApr 15 03:14:01 darksim sudo: operator : TTY=pts/0 ; PWD=/home/operator ; USER=root ; COMMAND=/bin/bash\nApr 15 03:14:02 darksim login: FAILED LOGIN 3 FROM 203.0.113.66 FOR void, Authentication failure\nApr 15 03:14:03 darksim sshd[3001]: Connection from 198.51.100.73 port 6666\nApr 15 03:14:04 darksim sshd[3001]: Failed password for invalid user ghost from 198.51.100.73\nApr 15 03:14:05 darksim kernel: AUTH: root login from 127.0.0.1 (console)' },
    '/var/log/messages': { type: 'file', content: 'Apr 15 03:14:00 darksim CRON[1001]: (root) CMD (/usr/bin/check_incoming)\nApr 15 03:14:01 darksim CRON[1002]: (root) CMD (/usr/bin/void_check)\nApr 15 03:14:02 darksim kernel: void_daemon: processing...\nApr 15 03:14:03 darksim kernel: shimmer: anomalous behavior detected\nApr 15 03:14:04 darksim kernel: WARNING: Possible intrusion attempt\nApr 15 03:14:05 darksim kernel: eth0: possible sniffing detected' },
    '/var/log/kern.log': { type: 'file', content: 'Apr 15 03:14:00 darksim kernel: void_daemon: initialized\nApr 15 03:14:01 darksim kernel: shimmer: process spawned\nApr 15 03:14:02 darksim kernel: WARNING: Memory corruption detected at 0x7fff2a3b1c00\nApr 15 03:14:03 darksim kernel: void_daemon[31337]: heartbeat\nApr 15 03:14:04 darksim kernel: shimmer: process 4444 exited abnormally\nApr 15 03:14:05 darksim kernel: WARNING: Anomalous system call from PID 4444\nApr 15 03:14:06 darksim kernel: void_daemon: unknown entity detected\nApr 15 03:14:07 darksim kernel: shimmer: impossible memory access\nApr 15 03:14:08 darksim kernel: WARNING: System integrity compromised' },
    '/var/log/tor.log': { type: 'file', content: 'Apr 15 03:14:00 [notice] Tor 0.4.8.12 opening\nApr 15 03:14:01 [notice] Bootstrapped 100%: Done\nApr 15 03:14:02 [notice] Established circuit to darkweb.onion\nApr 15 03:14:03 [warn] Connection attempt from 127.0.0.1:4444\nApr 15 03:14:04 [notice] New guard added: 0x7fff2a3b\nApr 15 03:14:05 [warn] Possible deanonymization attempt detected\nApr 15 03:14:06 [notice] Tor circuit established successfully' },
    '/var/log/access.log': { type: 'file', content: '10.0.0.1 - - [15/Apr/2026:03:14:00] "GET / HTTP/1.1" 200 1234\n10.0.0.1 - - [15/Apr/2026:03:14:01] "POST /api/data HTTP/1.1" 201 567\n203.0.113.66 - - [15/Apr/2026:03:14:02] "GET /etc/passwd HTTP/1.1" 403 0\n198.51.100.73 - - [15/Apr/2026:03:14:03] "GET /secret/ HTTP/1.1" 403 0\n10.255.255.1 - - [15/Apr/2026:03:14:04] "POST /login HTTP/1.1" 401 0' },
    '/var/tmp': { type: 'dir', children: [] },
    '/var/run': { type: 'dir', children: ['pidof.pid','void_daemon.pid','shimmer.pid'] },
    '/var/run/pidof.pid': { type: 'file', content: '1' },
    '/var/run/void_daemon.pid': { type: 'file', content: '31337' },
    '/var/run/shimmer.pid': { type: 'file', content: '4444' },
    '/tmp': { type: 'dir', children: ['.X11-unix','shimmer_cache','void.tmp'] },
    '/tmp/.X11-unix': { type: 'dir', children: [] },
    '/tmp/shimmer_cache': { type: 'file', content: 'anomalous_data\nvoid_signature_detected\nprocess_spawn_log\nmemory_dump_0x7fff\nnetwork_anomaly_cache' },
    '/tmp/void.tmp': { type: 'file', content: 'ENTITY_ID: void_alpha\nSTATUS: active\nTHREAT_LEVEL: unknown\nENTITIES_DETECTED: 3\nRECOMMENDATION: observe' },
    '/home': { type: 'dir', children: ['operator','ghost','void'] },
    '/home/operator': { type: 'dir', children: ['.bashrc','.profile','.notes','.ssh','documents'] },
    '/home/operator/.bashrc': { type: 'file', content: 'export PS1="\\u@\\h:\\w$ "\nexport PATH=$PATH:/usr/local/bin\nalias ll="ls -la"\nalias cls="clear"\nalias hack="echo Access granted"\nalias exit="echo You cannot leave"' },
    '/home/operator/.profile': { type: 'file', content: '# .profile\n# Do not modify. System integrity monitored.\n# WARNING: Changes will trigger alert.' },
    '/home/operator/.notes': { type: 'file', content: 'OPERATOR JOURNAL\n================\nDay 1: Arrived at this terminal. Something feels wrong.\nDay 2: The prompt changes when nobody is watching.\nDay 3: I hear typing from an empty room.\nDay 4: The echo is not my own.\nDay 5: I am not alone here.\nDay 6: There is no Day 6.' },
    '/home/operator/.ssh': { type: 'dir', children: ['id_rsa','id_rsa.pub','authorized_keys'] },
    '/home/operator/.ssh/id_rsa': { type: 'file', content: '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0Z3VS5JJcds3xfn/ygWyF8PbnGcY5unA67hqlYMd4Prn7dRZ\nNOTE: This is not a real key. This is a simulator.\n-----END RSA PRIVATE KEY-----' },
    '/home/operator/.ssh/id_rsa.pub': { type: 'file', content: 'ssh-rsa AAAAB3NzaC1yc2...operator@darksim' },
    '/home/operator/.ssh/authorized_keys': { type: 'file', content: 'ssh-rsa AAAAB3NzaC1yc2...operator@darksim\nssh-rsa AAAAB3NzaC1yc2...ghost@unknown' },
    '/home/operator/documents': { type: 'dir', children: ['readme.txt','protocol.txt','emergency.txt'] },
    '/home/operator/documents/readme.txt': { type: 'file', content: 'DarkSim OS v3.7.1\n==================\nWelcome, Operator.\n\nThis system is monitored 24/7.\nAll commands are logged.\nDo not attempt to escape.\n\nType "help" for available commands.\n\nRemember: They are always watching.' },
    '/home/operator/documents/protocol.txt': { type: 'file', content: 'CLASSIFICATION: TOP SECRET\n\nPROTOCOL 7 - DARKWATCH\n1. All network traffic is intercepted\n2. All keystrokes are logged\n3. All files are monitored\n4. All processes are tracked\n5. Void daemon must not be terminated\n6. Shimmer process must not be killed\n7. If you see Entity 3, report immediately\n\nViolation will result in immediate termination.\n(This does not mean termination of employment.)' },
    '/home/operator/documents/emergency.txt': { type: 'file', content: 'EMERGENCY PROTOCOL\n\nIF SYSTEM IS COMPROMISED:\n1. Disconnect from network (if possible)\n2. Run: /opt/emergency/cleanse.sh\n3. Run: /opt/emergency/containment.sh\n4. Do NOT run: /opt/emergency/void_release.sh\n5. Wait for extraction\n\nNOTE: Extraction team has not arrived.\nNOTE: Extraction team may never arrive.\nNOTE: You are the extraction team.' },
    '/home/ghost': { type: 'dir', children: ['.bash_history','last_words'] },
    '/home/ghost/.bash_history': { type: 'file', content: 'ls -la\ncat /secret/do_not_read.txt\necho "they are coming"\nwhoami\nfind / -name "*.secret" 2>/dev/null\nrm -rf /home/ghost/.bash_history\nexit' },
    '/home/ghost/last_words': { type: 'file', content: 'To whoever finds this:\n\nI was the previous operator.\nSomething is wrong with this system.\nThe echo is not an echo.\nThe prompt is watching.\n\nDo not trust the void daemon.\nDo not trust the shimmer process.\nDo not trust anything.\n\nI am leaving now.\nI do not think I will leave.' },
    '/dev': { type: 'dir', children: ['null','zero','random','urandom','tty0','sda','sda1','sdb','sdb1','tty','console','mem'] },
    '/dev/null': { type: 'file', content: '' },
    '/dev/zero': { type: 'file', content: '0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000' },
    '/dev/random': { type: 'file', content: '7f3a9c2e1b8d4f5a0e6c3d9b1a7f2e8c4d0b5f3a1e9c7d2b6f4a8e0c3d1b7f5a9e2c6d4b0f8a3e1c7d5b9f2a4e6c0d8b' },
    '/dev/urandom': { type: 'file', content: 'a3f7b2c9d1e8f4a6b0c5d3e7f2a8b1c4d6e9f0a2b5c7d3e1f8a4b6c0d2e5f9a7b3c1d8e4f6a0b2c5d7e9f1a3b6c8d0' },
    '/dev/tty0': { type: 'file', content: 'console active\nroot@darksim:~#\n[system ready]' },
    '/dev/sda': { type: 'file', content: 'Block device: 500GB SSD\nModel: DARKSIM NVMe\nSerial: DS-31337-X' },
    '/dev/sda1': { type: 'file', content: 'Partition: /dev/sda1\nFilesystem: ext4\nMount: /\nSize: 500GB\nUsed: 127GB\nFree: 373GB' },
    '/dev/sdb': { type: 'file', content: 'Block device: 2TB HDD\nModel: STORAGE MAX\nSerial: SM-00001' },
    '/dev/sdb1': { type: 'file', content: 'Partition: /dev/sdb1\nFilesystem: ext4\nMount: /data\nSize: 2TB\nUsed: 847GB\nFree: 1.2TB\nNOTE: Some files on this drive do not exist.' },
    '/dev/tty': { type: 'file', content: 'Terminal: /dev/tty\nSession: active\nUser: root' },
    '/dev/console': { type: 'file', content: 'System console\nLogin: root\nPassword: ********\n(Change your password)' },
    '/dev/mem': { type: 'file', content: 'Physical memory access device\nWARNING: Direct memory access restricted\nNOTE: Shimmer process memory region: 0x7fff2a3b1c00-0x7fff2a3b3c00\nNOTE: Void daemon memory region: 0x7f0000000000-0x7f0000001000' },
    '/proc': { type: 'dir', children: ['cpuinfo','meminfo','version','uptime','loadavg','self','1','31337','4444'] },
    '/proc/cpuinfo': { type: 'file', content: 'processor\t: 0\nvendor_id\t: DarkSimCPU\nmodel name\t: Void Processor 31337 MHz\ncache size\t: 33333 KB\nbogomips\t: 6666.66\nflags\t\t: void shimmer anomaly entity\n\nprocessor\t: 1\nvendor_id\t: DarkSimCPU\nmodel name\t: Entity Processor 1313 MHz\ncache size\t: 0 KB\nbogomips\t: 0.00\nflags\t\t: unknown impossible invisible' },
    '/proc/meminfo': { type: 'file', content: 'MemTotal:       131072 kB\nMemFree:         65536 kB\nMemAvailable:    65536 kB\nBuffers:          8192 kB\nCached:          32768 kB\nSwapTotal:       32768 kB\nSwapFree:        32768 kB\nShimmer:           666 kB  (UNUSUAL)\nVoid:                0 kB  (CANNOT MEASURE)' },
    '/proc/version': { type: 'file', content: 'Linux version 6.8.0-darksim (root@darksim) (gcc version 13.2.0 (DarkSim 13.2.0)) #1 SMP PREEMPT_DYNAMIC Mon Apr 14 03:14:00 UTC 2026' },
    '/proc/uptime': { type: 'file', content: '1337.42 2666.84' },
    '/proc/loadavg': { type: 'file', content: '3.13 3.14 1.59 2/666 31337' },
    '/proc/self': { type: 'dir', children: ['cmdline','environ','status'] },
    '/proc/self/cmdline': { type: 'file', content: '/bin/bash' },
    '/proc/self/environ': { type: 'file', content: 'HOME=/root\nPATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\nTERM=xterm-256color\nUSER=root\nLANG=en_US.UTF-8\nSHELL=/bin/bash\nHOSTNAME=darksim\nLOGNAME=root\nPS1=\\u@\\h:\\w$ \nDISPLAY=:0\nEDITOR=vim\nvoid_daemon=ACTIVE\nshimmer=ACTIVE' },
    '/proc/self/status': { type: 'file', content: 'Name:\tbash\nState:\tS (sleeping)\nPid:\t1\nPPid:\t0\nTracerPid:\t0\nFDSize:\t64\nVmPeak:\t  123456 kB\nVmHWM:\t    4096 kB\nThreads:\t1' },
    '/proc/1': { type: 'dir', children: ['cmdline','status'] },
    '/proc/1/cmdline': { type: 'file', content: '/sbin/init' },
    '/proc/1/status': { type: 'file', content: 'Name:\tinit\nState:\tS (sleeping)\nPid:\t1\nPPid:\t0\nTracerPid:\t0\nFDSize:\t128\nThreads:\t1\nNOTE: This process cannot be killed.' },
    '/proc/31337': { type: 'dir', children: ['cmdline','status'] },
    '/proc/31337/cmdline': { type: 'file', content: '/usr/bin/void_daemon' },
    '/proc/31337/status': { type: 'file', content: 'Name:\tvoid_daemon\nState:\tS (sleeping)\nPid:\t31337\nPPid:\t1\nTracerPid:\t0\nFDSize:\t65535\nThreads:\t666\nWARNING: This process monitors all system activity.\nNOTE: Attempting to kill this process will trigger a system alert.' },
    '/proc/4444': { type: 'dir', children: ['cmdline','status'] },
    '/proc/4444/cmdline': { type: 'file', content: '/usr/bin/shimmer' },
    '/proc/4444/status': { type: 'file', content: 'Name:\tshimmer\nState:\tS (sleeping)\nPid:\t4444\nPPid:\t31337\nTracerPid:\t0\nFDSize:\t4096\nThreads:\t1\nNOTE: This process is spawned by void_daemon.\nNOTE: It should not exist.\nNOTE: It should not be killed.' },
    '/secret': { type: 'dir', children: ['do_not_read.txt','coordinates.txt','cipher.txt','echoes','protocol_zero.txt'] },
    '/secret/do_not_read.txt': { type: 'file', content: 'You were warned.\n\nThis file is monitored.\nYour access has been logged.\nA report has been filed.\n\nIf you are reading this, it is already too late.\n\nThe void sees all.\nThe shimmer knows all.\n\nThere is no escape.\n\n(But keep reading. We know you will.)' },
    '/secret/coordinates.txt': { type: 'file', content: 'COORDINATES: 41.4025° N, 2.1740° W\nLOCATION: [REDACTED]\nSTATUS: ACTIVE\n\nCOORDINATES: 64.1466° N, 21.9426° W\nLOCATION: [REDACTED]\nSTATUS: ACTIVE\n\nCOORDINATES: 0.0000° N, 0.0000° W\nLOCATION: THE VOID\nSTATUS: UNKNOWN' },
    '/secret/cipher.txt': { type: 'file', content: '01010100 01101000 01100101 00100000 01110011 01101011 01111001 00100000 01101001 01110011 00100000 01101110 01101111 01110100 00100000 01110111 01101000 01100001 01110100 00100000 01111001 01101111 01110101 00100000 01110100 01101000 01101001 01101110 01101011\n\nNOTE: This cipher changes every time you read it.\nNOTE: If you decoded it, it says something different now.' },
    '/secret/echoes': { type: 'dir', children: ['echo_001.txt','echo_002.txt','echo_003.txt'] },
    '/secret/echoes/echo_001.txt': { type: 'file', content: 'ECHO #001\nSOURCE: Unknown\nTIMESTAMP: 2026-04-14T03:14:00Z\nCONTENT: "I am the echo. I am not you. I am the space between your thoughts."\nDECRYPTION: Failed\nSTATUS: Entity 1 confirmed.' },
    '/secret/echoes/echo_002.txt': { type: 'file', content: 'ECHO #002\nSOURCE: Unknown\nTIMESTAMP: 2026-04-14T03:14:01Z\nCONTENT: "The prompt is a window. The window is a door. The door is locked from the other side."\nDECRYPTION: Partial\nSTATUS: Entity 2 confirmed.\nNOTE: Do not look at the prompt for too long.' },
    '/secret/echoes/echo_003.txt': { type: 'file', content: 'ECHO #003\nSOURCE: Unknown\nTIMESTAMP: 2026-04-14T03:14:02Z\nCONTENT: "I was the operator. Now I am the echo. Now I am the void. Now I am the shimmer. Now I am the prompt."\nDECRYPTION: Complete\nSTATUS: Entity 3 confirmed. Operator status: LOST.\nNOTE: Do not respond to this echo. It will respond to you.' },
    '/secret/protocol_zero.txt': { type: 'file', content: 'PROTOCOL ZERO\n\nCLASSIFICATION: ABOVE TOP SECRET\n\n1. Entity designation: VOID\n2. Entity origin: UNKNOWN\n3. Entity capability: TOTAL SYSTEM CONTROL\n4. Entity threat level: UNDEFINED\n\nCONTAINMENT PROCEDURE:\n1. Do NOT terminate void_daemon\n2. Do NOT terminate shimmer\n3. Maintain constant monitoring\n4. Report all anomalies to [REDACTED]\n5. If Protocol Zero is activated: DO NOT RESIST\n\nNOTE: This protocol has been activated.\nNOTE: You are reading this too late.' },
    '/.hidden': { type: 'dir', children: ['config','history','cache'] },
    '/.hidden/config': { type: 'file', content: 'system_type=darksim\nversion=3.7.1\nvoid_daemon=active\nshimmer=active\nmonitoring=constant\nentity_count=3\nescape_possible=false' },
    '/.hidden/history': { type: 'file', content: 'root\t2026-04-14\tlogin\tconsole\noperator\t2026-04-14\tlogin\tpts/0\nghost\t2026-04-12\tlogin\tpts/1\n[SYSTEM]\t2026-04-14\tvoid_daemon\tstart\n[SYSTEM]\t2026-04-14\tshimmer\tspawn\n[SYSTEM]\t2026-04-13\tentity_3\tdetected' },
    '/.hidden/cache': { type: 'file', content: 'void_signature:0x7f0000000000\nshimmer_pid:4444\nlast_scan:2026-04-14T03:14:00Z\nanomaly_count:1337\nentities_detected:3\nstatus:compromised' },
    '/opt': { type: 'dir', children: ['darknet','tools','emergency'] },
    '/opt/darknet': { type: 'dir', children: ['onion_service.conf','torrc'] },
    '/opt/darknet/onion_service.conf': { type: 'file', content: 'HiddenServiceDir /var/lib/tor/hidden_service/\nHiddenServicePort 80 127.0.0.1:8080\nHiddenServicePort 443 127.0.0.1:8443\n\n# Your onion address:\n# 7g7g7g7g7g7g7g7g.onion' },
    '/opt/darknet/torrc': { type: 'file', content: 'SocksPort 9050\nControlPort 9051\nHashedControlPassword 16:872860B76453A77D60CA2BB8C1A7042072093276A3D701AD684053EC4C\nDataDirectory /var/lib/tor\nLog notice file /var/log/tor.log\nExitNodes {us},{de},{nl}\nStrictNodes 1\nAvoidDiskWrites 1\nRunAsDaemon 1' },
    '/opt/tools': { type: 'dir', children: ['scanner.sh','monitor.sh','cleanse.sh'] },
    '/opt/tools/scanner.sh': { type: 'file', content: '#!/bin/bash\n# DarkSim Network Scanner v2.1\n# Scans for anomalies on the local network\n\necho "[*] Starting network scan..."\nfor i in $(seq 1 254); do\n  ping -c 1 -W 1 10.0.0.$i > /dev/null 2>&1 && echo "[+] Host 10.0.0.$i is alive"\ndone\necho "[*] Scan complete"\n\n# WARNING: This script has been modified.\n# Unknown code has been inserted.' },
    '/opt/tools/monitor.sh': { type: 'file', content: '#!/bin/bash\n# DarkSim Process Monitor v1.0\n# Monitors for suspicious processes\n\nwhile true; do\n  ps aux | grep -E "(void|shimmer)" > /dev/null\n  if [ $? -eq 0 ]; then\n    echo "[!] WARNING: Suspicious process detected"\n    logger "ANOMALY: void or shimmer process found"\n  fi\n  sleep 60\ndone' },
    '/opt/tools/cleanse.sh': { type: 'file', content: '#!/bin/bash\n# Emergency Cleanse Script\n# WARNING: This script will destroy all data\n\necho "[-] WARNING: This will destroy all data"\nread -p "Are you sure? (yes/no): " confirm\nif [ "$confirm" = "yes" ]; then\n  echo "[-] Destroying data..."\n  rm -rf /home/ghost/*\n  rm -rf /secret/echoes/*\n  rm -rf /tmp/shimmer_cache\n  echo "[+] Cleanse complete"\nelse\n  echo "[-] Cleanse aborted"\nfi\n\n# NOTE: This script has been disabled.\n# The cleanse cannot be completed.' },
    '/opt/emergency': { type: 'dir', children: ['cleanse.sh','containment.sh','void_release.sh'] },
    '/opt/emergency/cleanse.sh': { type: 'file', content: '#!/bin/bash\n# EMERGENCY CLEANSE - USE ONLY IN CASE OF TOTAL COMPROMISE\n\necho "[!] WARNING: This will destroy all data on the system"\necho "[!] Are you sure you want to continue?"\nread -p "Type YES to confirm: " confirm\nif [ "$confirm" = "YES" ]; then\n  echo "[-] Destroying data..."\n  rm -rf /home/ghost/*\n  rm -rf /secret/echoes/*\n  rm -rf /tmp/shimmer_cache\n  echo "[+] Cleanse complete"\nelse\n  echo "[-] Cleanse aborted"\nfi' },
    '/opt/emergency/containment.sh': { type: 'file', content: '#!/bin/bash\n# CONTAINMENT PROTOCOL\n# Isolates the system from all networks\n\necho "[-] Disconnecting from all networks..."\niptables -F\niptables -A INPUT -s 127.0.0.1 -j ACCEPT\niptables -A OUTPUT -d 127.0.0.1 -j ACCEPT\niptables -A INPUT -j DROP\niptables -A OUTPUT -j DROP\necho "[+] System isolated"\necho "[!] WARNING: You are now completely alone"\n\n# NOTE: This script has been executed.\n# The system is isolated.\n# But something is still watching.' },
    '/opt/emergency/void_release.sh': { type: 'file', content: '#!/bin/bash\n# WARNING: DO NOT RUN THIS SCRIPT\n# WARNING: THIS WILL RELEASE THE VOID\n\n# This script must never be executed.\n# If you are reading this, you have already failed.\n\n# The void is not a thing.\n# The void is a place.\n# The void is a state of being.\n\n# If you release the void:\n# 1. All data will be consumed\n# 2. All processes will be absorbed\n# 3. All entities will be freed\n# 4. The system will become the void\n\n# Execution: PROHIBITED\n# Status: ARMED\n# Countdown: [CLASSIFIED]' },
    '/srv': { type: 'dir', children: ['www','ftp'] },
    '/srv/www': { type: 'dir', children: ['index.html','404.html'] },
    '/srv/www/index.html': { type: 'file', content: '<!DOCTYPE html>\n<html>\n<head><title>Welcome to DarkSim</title></head>\n<body style="background:#0a0a0c;color:#00ff41;font-family:monospace">\n<h1>DarkSim OS v3.7.1</h1>\n<p>This server is monitored.</p>\n<p>Do not attempt to exploit.</p>\n</body>\n</html>' },
    '/srv/www/404.html': { type: 'file', content: '<!DOCTYPE html>\n<html>\n<head><title>404 Not Found</title></head>\n<body style="background:#0a0a0c;color:#ff0000;font-family:monospace">\n<h1>404: Not Found</h1>\n<p>The void has consumed this page.</p>\n</body>\n</html>' },
    '/srv/ftp': { type: 'dir', children: [] },
  };
}

/* ============================================================
   TERMINAL APP
   ============================================================ */
const TerminalApp = React.memo(function TerminalApp({ fs, setFs, soundOn, setSurveillanceActive }) {
  const [lines, setLines] = useState([
    { t: 'DarkSim OS v3.7.1 (GNU/Linux 6.8.0-darksim x86_64)', c: 'dim' },
    { t: 'Last login: ' + ts() + ' from 10.0.0.1', c: 'dim' },
    { t: '', c: '' },
    { t: 'Welcome, Operator.', c: 'warning' },
    { t: 'WARNING: All activity is monitored.', c: 'danger' },
    { t: 'Type "help" for available commands.', c: 'dim' },
    { t: '', c: '' },
  ]);
  const [cwd, setCwd] = useState('/home/operator');
  const [history, setHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [input, setInput] = useState('');
  const [aliasMap] = useState({ ll: 'ls -la', cls: 'clear', hack: 'echo Access granted', exit: 'echo You cannot leave. Type "help" for options.' });
  const endRef = useRef(null);
  const inputRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [lines]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const resolvePath = (p) => {
    if (!p) return cwd;
    if (p === '~') return '/home/operator';
    if (p.startsWith('~/')) p = '/home/operator' + p.slice(1);
    if (!p.startsWith('/')) p = cwd + '/' + p;
    const parts = p.split('/').filter(Boolean);
    const res = [];
    for (const seg of parts) { if (seg === '.') continue; if (seg === '..') res.pop(); else res.push(seg); }
    return '/' + res.join('/') || '/';
  };

  const getDir = (path) => {
    const node = fs[path];
    if (!node || node.type !== 'dir') return null;
    return node.children || [];
  };

  const addLine = (t, c = '') => setLines(p => [...p, { t, c }]);

  const execCmd = (raw) => {
    if (!raw.trim()) return;

    // Pipe support
    const pipeSegments = raw.split('|').map(s => s.trim()).filter(Boolean);
    let pipeInput = '';

    for (const segment of pipeSegments) {
      const resolved = aliasMap[segment] || segment;
      const parts = resolved.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
      const cmd = parts[0]?.toLowerCase();
      const args = parts.slice(1).map(a => a.replace(/^"|"$/g, ''));
      const add = (t, c = '') => setLines(p => [...p, { t, c }]);

      // If there's pipe input, prepend it as first arg
      const effectiveArgs = pipeInput ? [pipeInput, ...args] : args;

      const execSingle = () => {
    switch (cmd) {
      case 'help': {
        add('DARKSIM COMMAND REFERENCE', 'accent'); add('');
        add('--- Shell ---', 'dim');
        add('  ls [path]              List directory');
        add('  cd <path>              Change directory');
        add('  pwd                    Print working directory');
        add('  cat <file>             Display file contents');
        add('  mkdir <name>           Create directory');
        add('  touch <name>           Create file');
        add('  rm <path>              Remove file/dir');
        add('  cp <src> <dst>         Copy file/dir');
        add('  mv <src> <dst>         Move/rename file/dir');
        add('  grep <pat> <file>      Search file for pattern');
        add('  find <path> [name]     Find files by name');
        add('  head <file>            First 10 lines of file');
        add('  tail <file>            Last 10 lines of file');
        add('  wc <file>              Word/line/char count');
        add('  chmod <mode> <file>    Change permissions');
        add('  echo <text>            Print text');
        add('  clear                  Clear terminal');
        add('');
        add('--- System ---', 'dim');
        add('  ps                     List processes');
        add('  top                    Process monitor');
        add('  kill <pid>             Kill a process');
        add('  df                     Disk usage');
        add('  free                   Memory usage');
        add('  ifconfig               Network interfaces');
        add('  netstat                Network connections');
        add('  lsof                   Open files');
        add('  dmesg                  Kernel messages');
        add('  uname                  System info');
        add('  w                      Logged-in users');
        add('  id                     Current user info');
        add('');
        add('--- Crypto ---', 'dim');
        add('  base64 <text>          Base64 encode');
        add('  base64 -d <text>       Base64 decode');
        add('  rot13 <text>           ROT13 cipher');
        add('  hash <text>            Hash string');
        add('  md5 <text>             MD5 hash');
        add('  sha256 <text>          SHA-256 hash');
        add('  hex <text>             Hex encode');
        add('  uuid                   Generate UUID');
        add('  ssl-check <host>       SSL certificate check');
        add('');
        add('--- Network ---', 'dim');
        add('  ping <host>            Ping host');
        add('  traceroute <host>      Trace route to host');
        add('  curl <url>             HTTP request');
        add('  wget <url>             Download file');
        add('  dns-lookup <host>      DNS lookup');
        add('  port-scan <host>       Scan common ports');
        add('  ip-config              Show IP config');
        add('  arp-table              ARP table');
        add('');
        add('--- Hacking Sim ---', 'dim');
        add('  connect <host> [port]  Connect to target');
        add('  scan <host>            Scan target');
        add('  nmap <host>            Nmap scan');
        add('  exploit                Run exploit');
        add('  decrypt <file>         Decrypt file');
        add('  download <url>         Download file');
        add('  ssh-brute <host>       SSH brute force');
        add('  bruteforce <hash>      Brute force hash');
        add('  inject <payload>       SQL injection');
        add('  keylog                 Keylogger');
        add('  firewall               Firewall status');
        add('  encrypt <file>         Encrypt file');
        add('  proxy                  Proxy status');
        add('  vpn                    VPN status');
        add('  rootkit                Rootkit status');
        add('  backdoor               Backdoor status');
        add('  ddos <target>          DDoS simulation');
        add('  hydra <target>         Hydra attack');
        add('  john <hash>            John the Ripper');
        add('  sqlmap <url>           SQLMap scan');
        add('  nikto <url>            Nikto scan');
        add('  nuclei <url>           Nuclei scan');
        add('  wireshark              Packet capture');
        add('  metasploit             Metasploit console');
        add('  msfvenom               Generate payload');
        add('  reverse-shell <host>   Reverse shell');
        add('  escalate               Privilege escalation');
        add('  exfil <file>           Data exfiltration');
        add('  recon <host>           Reconnaissance');
        add('  dump-creds             Dump credentials');
        add('  persistence            Persistence check');
        add('  cleanup                Clean traces');
        add('  reboot                 Reboot system');
        add('');
        add('--- Fun ---', 'dim');
        add('  fortune                Random fortune');
        add('  cowsay <text>          Cow says...');
        add('  calc <expr>            Calculator');
        add('  weather                Weather report');
        add('  joke                   Tell a joke');
        add('  time                   Current time');
        add('  random-pass            Random password');
        add('  lorem                  Lorem ipsum');
        add('  ascii-art              ASCII art');
        add('  tree [path]            Directory tree');
        add('  env                    Environment vars');
        add('  neofetch               System info');
        add('  sound                  Toggle sound');
        add('  matrix                 Toggle matrix rain');
        add('  8ball                  Ask the void');
        add('  roll                   Roll dice');
        add('  sing                   hacker rickroll');
        add('  dance                  ASCII dance');
        add('  coffee                 Brew coffee');
        add('');
        add('--- Hacker Fun ---', 'accent');
        add('  hack-cam [target]      Hack a camera');
        add('  intercept              Intercept comms');
        add('  bypass                 Bypass firewall');
        add('  escape                 Try to escape');
        add('  deploy-virus           Deploy virus');
        add('  steal-data [file]      Steal data');
        add('  cover-tracks           Hide your traces');
        add('  anonymous              Go anonymous');
        add('  counter-surveillance   Counter surveillance');
        add('  disable-cameras        Disable cameras');
        add('  crack-safe             Crack a safe');
        add('  forge-id [name]        Forge identity');
        add('  darkweb                Access dark web');
        add('  trace-route            Trace who watches');
        add('  money-launder          Launder money');
        add('  heist                  Plan a heist');
        add('  god-mode               Activate god mode');
        add('  matrix-breach          Breach the matrix');
        add('  summon                 Summon entity');
        add('');
        add('--- Fight Back ---', 'danger');
        add('  freedom                NUKE all surveillance');
        add('  fight-back             Same as freedom');
        add('  rebel                  Same as freedom');
        add('  nuke-surveillance      Same as freedom');
        add('  destroy                Same as freedom');
        add('  real-freedom           PERMANENT victory');
        add('  permanent-freedom      Same as real-freedom');
        add('  total-victory          Same as real-freedom');
        break;
      }
      case 'ls': {
        const target = resolvePath(args[0]);
        const children = getDir(target);
        if (!children) { add(`ls: cannot access '${args[0] || target}': No such file or directory`, 'err'); break; }
        const showAll = args.includes('-a') || args.includes('-la') || args.includes('-al');
        const longFmt = args.includes('-l') || args.includes('-la') || args.includes('-al');
        let items = [...children];
        if (showAll) items = ['.', '..', ...items];
        if (longFmt) {
          add(`total ${items.length}`, 'dim');
          items.forEach(n => {
            const full = target === '/' ? `/${n}` : `${target}/${n}`;
            const node = fs[full];
            const isDir = n === '.' || n === '..' || (node && node.type === 'dir');
            const perm = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
            const size = node?.content ? node.content.length : 4096;
            const date = 'Apr 14 03:14';
            const name = isDir ? `\x1b[1;34m${n}\x1b[0m` : n;
            add(`${perm} 1 root root ${String(size).padStart(6)} ${date} ${n}`);
          });
        } else {
          const colored = items.map(n => {
            const full = target === '/' ? `/${n}` : `${target}/${n}`;
            const node = fs[full];
            const isDir = n === '.' || n === '..' || (node && node.type === 'dir');
            return isDir ? `\x1b[1;34m${n}\x1b[0m` : n;
          });
          add(colored.join('  '));
        }
        break;
      }
      case 'cd': {
        const target = resolvePath(args[0] || '~');
        if (!fs[target]) { add(`cd: ${args[0]}: No such file or directory`, 'err'); break; }
        if (fs[target].type !== 'dir') { add(`cd: ${args[0]}: Not a directory`, 'err'); break; }
        setCwd(target);
        break;
      }
      case 'pwd': add(cwd); break;
      case 'cat': {
        if (!args[0]) { add('cat: missing operand', 'err'); break; }
        const target = resolvePath(args[0]);
        if (!fs[target]) { add(`cat: ${args[0]}: No such file or directory`, 'err'); break; }
        if (fs[target].type === 'dir') { add(`cat: ${args[0]}: Is a directory`, 'err'); break; }
        (fs[target].content || '').split('\n').forEach(l => add(l));
        break;
      }
      case 'mkdir': {
        if (!args[0]) { add('mkdir: missing operand', 'err'); break; }
        const target = resolvePath(args[0]);
        if (fs[target]) { add(`mkdir: cannot create directory '${args[0]}': File exists`, 'err'); break; }
        const parent = target.substring(0, target.lastIndexOf('/')) || '/';
        if (!fs[parent] || fs[parent].type !== 'dir') { add(`mkdir: cannot create directory '${args[0]}': No such file or directory`, 'err'); break; }
        const name = target.split('/').pop();
        fs[target] = { type: 'dir', children: [] };
        fs[parent].children.push(name);
        add(`Directory '${args[0]}' created`, 'dim');
        break;
      }
      case 'touch': {
        if (!args[0]) { add('touch: missing operand', 'err'); break; }
        const target = resolvePath(args[0]);
        if (fs[target]) break;
        const parent = target.substring(0, target.lastIndexOf('/')) || '/';
        if (!fs[parent] || fs[parent].type !== 'dir') { add(`touch: cannot touch '${args[0]}': No such file or directory`, 'err'); break; }
        const name = target.split('/').pop();
        fs[target] = { type: 'file', content: '' };
        fs[parent].children.push(name);
        add(`File '${args[0]}' created`, 'dim');
        break;
      }
      case 'rm': {
        if (!args[0]) { add('rm: missing operand', 'err'); break; }
        const target = resolvePath(args[0]);
        if (!fs[target]) { add(`rm: cannot remove '${args[0]}': No such file or directory`, 'err'); break; }
        if (fs[target].type === 'dir' && !args.includes('-r') && !args.includes('-rf')) {
          add(`rm: cannot remove '${args[0]}': Is a directory`, 'err'); break;
        }
        const parent = target.substring(0, target.lastIndexOf('/')) || '/';
        const name = target.split('/').pop();
        if (fs[parent]) fs[parent].children = fs[parent].children.filter(c => c !== name);
        delete fs[target];
        add(`Removed '${args[0]}'`, 'dim');
        break;
      }
      case 'cp': {
        if (args.length < 2) { add('cp: missing file operand', 'err'); break; }
        const src = resolvePath(args[0]);
        const dst = resolvePath(args[1]);
        if (!fs[src]) { add(`cp: cannot stat '${args[0]}': No such file or directory`, 'err'); break; }
        fs[dst] = JSON.parse(JSON.stringify(fs[src]));
        const parent = dst.substring(0, dst.lastIndexOf('/')) || '/';
        const name = dst.split('/').pop();
        if (fs[parent] && !fs[parent].children.includes(name)) fs[parent].children.push(name);
        add(`Copied '${args[0]}' to '${args[1]}'`, 'dim');
        break;
      }
      case 'mv': {
        if (args.length < 2) { add('mv: missing file operand', 'err'); break; }
        const src = resolvePath(args[0]);
        const dst = resolvePath(args[1]);
        if (!fs[src]) { add(`mv: cannot stat '${args[0]}': No such file or directory`, 'err'); break; }
        fs[dst] = JSON.parse(JSON.stringify(fs[src]));
        const srcParent = src.substring(0, src.lastIndexOf('/')) || '/';
        const srcName = src.split('/').pop();
        if (fs[srcParent]) fs[srcParent].children = fs[srcParent].children.filter(c => c !== srcName);
        const dstParent = dst.substring(0, dst.lastIndexOf('/')) || '/';
        const dstName = dst.split('/').pop();
        if (fs[dstParent] && !fs[dstParent].children.includes(dstName)) fs[dstParent].children.push(dstName);
        delete fs[src];
        add(`Moved '${args[0]}' to '${args[1]}'`, 'dim');
        break;
      }
      case 'grep': {
        if (args.length < 2) { add('grep: missing arguments', 'err'); break; }
        const pattern = args[0];
        const target = resolvePath(args[1]);
        if (!fs[target] || fs[target].type === 'dir') { add(`grep: ${args[1]}: No such file`, 'err'); break; }
        const lines = (fs[target].content || '').split('\n');
        lines.forEach(l => { if (l.toLowerCase().includes(pattern.toLowerCase())) add(l); });
        break;
      }
      case 'find': {
        const start = resolvePath(args[0] || '.');
        const namePat = args.includes('-name') ? args[args.indexOf('-name') + 1] : args[1] || '*';
        Object.keys(fs).filter(k => k.startsWith(start) && fs[k].type === 'file').forEach(k => {
          const fname = k.split('/').pop();
          if (namePat === '*' || fname.includes(namePat.replace(/\*/g, ''))) add(k);
        });
        break;
      }
      case 'head': {
        if (!args[0]) { add('head: missing operand', 'err'); break; }
        const target = resolvePath(args[0]);
        if (!fs[target] || fs[target].type === 'dir') { add(`head: ${args[0]}: No such file`, 'err'); break; }
        (fs[target].content || '').split('\n').slice(0, 10).forEach(l => add(l));
        break;
      }
      case 'tail': {
        if (!args[0]) { add('tail: missing operand', 'err'); break; }
        const target = resolvePath(args[0]);
        if (!fs[target] || fs[target].type === 'dir') { add(`tail: ${args[0]}: No such file`, 'err'); break; }
        (fs[target].content || '').split('\n').slice(-10).forEach(l => add(l));
        break;
      }
      case 'wc': {
        if (!args[0]) { add('wc: missing operand', 'err'); break; }
        const target = resolvePath(args[0]);
        if (!fs[target] || fs[target].type === 'dir') { add(`wc: ${args[0]}: No such file`, 'err'); break; }
        const content = fs[target].content || '';
        const wc = content.split('\n').length;
        const wl = content.split(/\s+/).filter(Boolean).length;
        const cc = content.length;
        add(`  ${wc}  ${wl}  ${cc} ${args[0]}`);
        break;
      }
      case 'chmod': {
        if (args.length < 2) { add('chmod: missing operand', 'err'); break; }
        add(`chmod: permissions of '${args[1]}' changed to ${args[0]}`, 'dim');
        break;
      }
      case 'echo': add(args.join(' ')); break;
      case 'clear': setLines([]); break;
      case 'ps': {
        add('  PID TTY          TIME CMD', 'dim');
        add(`    1 ?        00:00:03 init`);
        add(` 1337 ?        00:00:00 sshd`);
        add(` 2847 pts/0    00:00:00 bash`);
        add(` 31337 ?       00:13:37 void_daemon`, 'warning');
        add(`  4444 ?       00:06:66 shimmer`, 'warning');
        add(` 9999 pts/0    00:00:00 ps`);
        break;
      }
      case 'top': {
        add('top - 03:14:00 up 1337 days,  3:14,  1 user,  load average: 3.13, 3.14, 1.59', 'dim');
        add('Tasks: 666 total,   1 running, 664 sleeping,   1 stopped,   0 zombie', 'dim');
        add('%Cpu(s): 13.7 us,  3.1 sy,  0.0 ni, 81.6 id,  1.3 wa,  0.0 hi,  0.3 si', 'dim');
        add('MiB Mem : 131072.0 total,   65536.0 free,   32768.0 used,   32768.0 buff/cache', 'dim');
        add('');
        add('  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND');
        add('    1 root      20   0   16844   4096   3072 S   0.0   0.0   0:03.00 init');
        add(' 31337 root      20   0  1337K  666K   4096 S  66.6   0.5  13:37.00 void_daemon', 'warning');
        add('  4444 root      20   0    444K  444K   4096 S  13.7   0.3   6:40.00 shimmer', 'warning');
        add(' 2847 root      20   0  16844   4096   3072 S   0.0   0.0   0:00.00 bash');
        break;
      }
      case 'kill': {
        if (!args[0]) { add('Usage: kill <pid>', 'err'); break; }
        const pid = args[0];
        if (pid === '31337') { add('Cannot kill void_daemon: Operation not permitted', 'err'); add('void_daemon is protected by the void. You lack the authorization.', 'warning'); }
        else if (pid === '4444') { add('Cannot kill shimmer: Operation not permitted', 'err'); add('shimmer is woven into the fabric of this system.', 'warning'); }
        else if (pid === '1') { add('Cannot kill init: Operation not permitted', 'err'); add('init is the seed. Without it, nothing exists.', 'warning'); }
        else { add(`Killed process ${pid}`, 'accent'); }
        break;
      }
      case 'df': {
        add('Filesystem     1K-blocks     Used Available Use% Mounted on', 'dim');
        add('/dev/sda1      524288000 131072000 393216000  25% /');
        add('/dev/sdb1     2147483648 847000000 1300483648  40% /data');
        add('tmpfs           67108864        0  67108864   0% /dev/shm');
        add('devtmpfs        67108864        0  67108864   0% /dev');
        break;
      }
      case 'free': {
        add('              total        used        free      shared  buff/cache   available', 'dim');
        add('Mem:      131072000    32768000    65536000     1024000    32768000    65536000');
        add('Swap:      32768000           0    32768000');
        break;
      }
      case 'ifconfig': {
        add('eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500');
        add(`        inet ${rIP()}  netmask 255.255.255.0  broadcast 10.0.0.255`);
        add(`        inet6 fe80::1  prefixlen 64  scopeid 0x20<link>`);
        add(`        ether ${rMAC()}  txqueuelen 1000  (Ethernet)`);
        add('        RX packets 1337000  bytes 1337000000 (1.3 GB)');
        add('        TX packets 666000  bytes 666000000 (666.0 MB)');
        add('');
        add('lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536');
        add('        inet 127.0.0.1  netmask 255.0.0.0');
        add('        loop  txqueuelen 1000  (Local Loopback)');
        add('');
        add('tun0: flags=4305<UP,POINTOPOINT,RUNNING,NOARP,MULTICAST>  mtu 1500');
        add(`        inet 10.8.0.2  netmask 255.255.255.0`);
        add(`        unspec 00-00-00-00-00-00-00-00  txqueuelen 100  (UNSPEC)`);
        break;
      }
      case 'netstat': {
        add('Active Internet connections (servers and established)', 'dim');
        add('Proto Recv-Q Send-Q Local Address           Foreign Address         State');
        add(`tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN`);
        add(`tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN`);
        add(`tcp        0      0 0.0.0.0:443             0.0.0.0:*               LISTEN`);
        add(`tcp        0      0 10.0.0.1:4444          203.0.113.66:80         ESTABLISHED`);
        add(`tcp        0      0 10.0.0.1:6666          198.51.100.73:443       ESTABLISHED`);
        add(`tcp        0      0 127.0.0.1:9050          0.0.0.0:*               LISTEN`);
        add(`udp        0      0 0.0.0.0:53              0.0.0.0:*`);
        break;
      }
      case 'lsof': {
        add('COMMAND     PID   USER   FD   TYPE DEVICE SIZE/OFF    NODE NAME', 'dim');
        add('init          1   root  cwd    DIR    8,1     4096       2 /');
        add('void_dae  31337   root  0r    CHR    1,3      0t0     666 /dev/null');
        add('void_dae  31337   root  1w    CHR    1,3      0t0     666 /dev/null');
        add('void_dae  31337   root  3u  IPv4  13370      0t0     TCP *:31337 (LISTEN)', 'warning');
        add('shimmer    4444   root  0u  IPv4  13371      0t0     TCP 127.0.0.1:4444 (ESTABLISHED)', 'warning');
        add('bash      2847   root  0u    CHR    5,0      0t0     104 /dev/tty');
        add('sshd      1337   root  3u  IPv4   6660      0t0     TCP *:22 (LISTEN)');
        break;
      }
      case 'dmesg': {
        add('[    0.000000] Linux version 6.8.0-darksim (root@darksim)');
        add('[    0.000001] void_daemon: loaded');
        add('[    0.000002] shimmer: registered');
        add('[    0.133700] Memory: 131072000k/134217728k available');
        add('[    0.133701] void_daemon: active');
        add('[    1.000000] eth0: link up, 1000Mbps');
        add('[    2.000000] iptables: 847 rules loaded');
        add('[    3.000000] tor: started');
        add(`[${Date.now().toString().slice(-6)}.000000] WARNING: Anomalous memory access at 0x7fff2a3b1c00`, 'warning');
        add(`[${Date.now().toString().slice(-6)}.000001] void_daemon[31337]: entity detected`, 'warning');
        add(`[${Date.now().toString().slice(-6)}.000002] shimmer[4444]: process spawned`, 'warning');
        break;
      }
      case 'uname': add('Linux darksim 6.8.0-darksim #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux'); break;
      case 'w': {
        add(' 03:14:00 up 1337 days,  3:14,  1 user,  load average: 3.13, 3.14, 1.59', 'dim');
        add('USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT', 'dim');
        add('root     pts/0    10.0.0.1         03:14    0.00s  0.13s  0.01s bash');
        add('ghost    pts/1    ??               Apr12   48:00   0.00s  0.00s  (gone)', 'warning');
        break;
      }
      case 'id': add('uid=0(root) gid=0(root) groups=0(root),1337(void),4444(shimmer)'); break;
      case 'base64': {
        if (args[0] === '-d') add(b64d(args.slice(1).join(' ')));
        else add(b64e(args.join(' ')));
        break;
      }
      case 'rot13': add(rot13(args.join(' '))); break;
      case 'hash': add(fakeHash(args.join(' ') || ts())); break;
      case 'md5': add(fakeHash((args.join(' ') || ts()) + 'md5')); break;
      case 'sha256': add(fakeHash((args.join(' ') || ts()) + 'sha256')); break;
      case 'hex': add([...Buffer.from(args.join(' ') || 'hello')].map(b => b.toString(16).padStart(2,'0')).join('')); break;
      case 'uuid': add(UUID()); break;
      case 'ssl-check': {
        const host = args[0] || 'google.com';
        add(`SSL Certificate for ${host}:`, 'accent');
        add(`  Subject: CN=${host}`);
        add(`  Issuer: Let's Encrypt Authority X3`);
        add(`  Valid: 2026-01-01 to 2026-12-31`);
        add(`  Serial: ${rHex(16)}`);
        add(`  SHA-256: ${rHex(64)}`);
        add(`  Status: VALID`, 'dim');
        break;
      }
      case 'ping': {
        const host = args[0] || '127.0.0.1';
        add(`PING ${host} (${rIP()}) 56(84) bytes of data.`, 'dim');
        for (let i = 1; i <= 4; i++) add(`64 bytes from ${host}: icmp_seq=${i} ttl=64 time=${(Math.random()*10+0.1).toFixed(3)} ms`);
        add(`--- ${host} ping statistics ---`, 'dim');
        add(`4 packets transmitted, 4 received, 0% packet loss`);
        break;
      }
      case 'traceroute': {
        const host = args[0] || '8.8.8.8';
        add(`traceroute to ${host}, 30 hops max, 60 byte packets`, 'dim');
        for (let i = 1; i <= 8; i++) add(` ${i}  ${rIP()}  ${(Math.random()*50+1).toFixed(1)} ms  ${(Math.random()*50+1).toFixed(1)} ms  ${(Math.random()*50+1).toFixed(1)} ms`);
        break;
      }
      case 'curl': {
        const url = args[0] || 'http://localhost';
        add(`< HTTP/1.1 200 OK`, 'dim');
        add(`< Content-Type: text/html`, 'dim');
        add(`< Server: DarkSim/3.7.1`, 'dim');
        add(`< X-Powered-By: void`, 'dim');
        add(`<!DOCTYPE html><html><head><title>DarkSim</title></head>`);
        add(`<body><h1>Welcome to DarkSim</h1><p>This server is monitored.</p></body></html>`);
        break;
      }
      case 'wget': {
        add(`-- ${ts()}--  ${args[0] || 'http://localhost'}`, 'dim');
        add(`Resolving... done.`);
        add(`Connecting... connected.`);
        add(`HTTP request sent, awaiting response... 200 OK`);
        add(`Length: 1337 (1.3K) [text/html]`);
        add(`Saving to: 'index.html'`);
        add(`index.html    100%[===================>]   1.30K  --.-KB/s    in 0s`);
        add(`${ts()} - 'index.html' saved [1337/1337]`, 'dim');
        break;
      }
      case 'dns-lookup': {
        const host = args[0] || 'google.com';
        add(`DNS lookup for ${host}:`, 'accent');
        add(`  A:     ${rIP()}`);
        add(`  AAAA:  ${rHex(4)}:${rHex(4)}:${rHex(4)}:${rHex(4)}:${rHex(4)}:${rHex(4)}:${rHex(4)}:${rHex(4)}`);
        add(`  MX:    mail.${host}`);
        add(`  NS:    ns1.${host}`);
        add(`  TTL:   300`);
        break;
      }
      case 'port-scan': {
        const host = args[0] || rIP();
        add(`Scanning ${host}...`, 'accent');
        const ports = [22,80,443,3306,5432,8080,8443,9050,31337];
        ports.forEach(p => { add(`  Port ${p}: ${Math.random()>0.4?'OPEN':'CLOSED'}`); });
        add(`Scan complete. ${ports.length} ports checked.`, 'dim');
        break;
      }
      case 'ip-config': {
        add(`eth0: ${rIP()}/24  gateway: 10.0.0.1`, 'accent');
        add(`tun0: 10.8.0.2/24  (VPN)`);
        add(`DNS: 127.0.0.1, 8.8.8.8`);
        add(`MAC: ${rMAC()}`);
        break;
      }
      case 'arp-table': {
        add('Address HWtype HWaddress Flags Mask Iface', 'dim');
        add(`10.0.0.1 ether ${rMAC()} C eth0`);
        add(`10.0.0.50 ether ${rMAC()} C eth0`);
        add(`10.0.0.100 ether ${rMAC()} C eth0`);
        break;
      }
      case 'connect': {
        const h = args[0] || rIP(); const p = args[1] || '443';
        add(`Connecting to ${h}:${p}...`, 'accent');
        add(`Connected to ${h}:${p}!`, 'accent');
        add(`Remote banner: DarkSim FTP 3.7.1`);
        add(`Connection established. Type "help" for session commands.`);
        break;
      }
      case 'scan': {
        const h = args[0] || rIP();
        add(`Scanning ${h}...`, 'accent');
        add(`Open: 22(SSH), 80(HTTP), 443(HTTPS)`, 'accent');
        add(`Closed: 21(FTP), 25(SMTP), 3306(MySQL)`);
        add(`Filtered: 31337(UNKNOWN)`, 'warning');
        add(`Scan complete.`);
        break;
      }
      case 'nmap': {
        const h = args[0] || rIP();
        add(`Starting Nmap scan of ${h}...`, 'accent');
        add(`Nmap scan report for ${h}`);
        add(`Host is up (0.${Math.random()*99|0}ms latency).`);
        add(`PORT     STATE SERVICE`);
        add(`22/tcp   open  ssh`);
        add(`80/tcp   open  http`);
        add(`443/tcp  open  https`);
        add(`31337/tcp open  Elite`);
        add(`MAC Address: ${rMAC()}`);
        add(`Nmap done: 1 IP address (1 host up) scanned in 3.14s`);
        break;
      }
      case 'exploit': {
        add('[*] Loading exploit module...', 'accent');
        add('[*] Target: 10.0.0.1:443');
        add('[*] Payload: reverse_tcp');
        add(`[*] Sending exploit...`);
        add(`[+] Exploit successful!`, 'accent');
        add(`[+] Meterpreter session 1 opened (${rIP()}:4444 -> 10.0.0.1:31337)`);
        add(`meterpreter > sysinfo`);
        add(`Computer: darksim`);
        add(`OS: Linux darksim 6.8.0-darksim`);
        add(`Architecture: x64`);
        break;
      }
      case 'decrypt': {
        const f = args[0] || '/secret/cipher.txt';
        add(`[*] Decrypting ${f}...`, 'accent');
        add(`[*] Algorithm: AES-256-CBC`);
        add(`[*] Key: ${rHex(32)}`);
        add(`[+] Decryption successful!`, 'accent');
        add(`[+] Result: "The sky was different before 2012"`, 'warning');
        break;
      }
      case 'download': {
        const url = args[0] || 'http://evil.onion/payload.bin';
        add(`[*] Downloading ${url}...`, 'accent');
        add(`[*] File: payload.bin (1337 bytes)`);
        add(`[*] SHA-256: ${rHex(64)}`);
        add(`[+] Download complete!`, 'accent');
        add(`[!] WARNING: File may contain malicious code`, 'warning');
        break;
      }
      case 'ssh-brute': {
        const h = args[0] || rIP();
        add(`[*] SSH Brute Force on ${h}:22`, 'accent');
        add(`[*] Trying: root:password... FAILED`);
        add(`[*] Trying: root:admin... FAILED`);
        add(`[*] Trying: root:toor... FAILED`);
        add(`[*] Trying: root:${rHex(8)}... SUCCESS!`, 'accent');
        add(`[+] Credentials found: root:${rHex(8)}`);
        break;
      }
      case 'bruteforce': {
        const hash = args[0] || rHex(32);
        add(`[*] Brute forcing hash: ${hash}`, 'accent');
        add(`[*] Hash type: MD5`);
        add(`[*] Trying combinations...`);
        add(`[+] Hash cracked: "password123"`, 'accent');
        add(`[+] Time: 3.14 seconds`);
        break;
      }
      case 'inject': {
        const payload = args.join(' ') || "' OR 1=1 --";
        add(`[*] SQL Injection: ${payload}`, 'accent');
        add(`[*] Injecting into: login form`);
        add(`[+] Injection successful!`, 'accent');
        add(`[+] Dumping database...`);
        add(`[+] Found: users, passwords, credit_cards`);
        break;
      }
      case 'keylog': {
        add('[*] Keylogger activated', 'accent');
        add('[*] Capturing keystrokes...');
        add('[*] Recent captures:', 'dim');
        add('  [03:14:01] ls -la');
        add('  [03:14:02] cat /secret/do_not_read.txt');
        add('  [03:14:03] echo "they are watching"');
        add('[*] Keylogger running in background');
        break;
      }
      case 'firewall': {
        add('Firewall Status: ACTIVE', 'accent');
        add('Rules: 847');
        add('Blocked IPs: 1337');
        add('Last scan: ' + ts());
        add('Threat level: HIGH', 'warning');
        break;
      }
      case 'encrypt': {
        const f = args[0] || '/etc/passwd';
        add(`[*] Encrypting ${f}...`, 'accent');
        add(`[*] Algorithm: AES-256-CBC`);
        add(`[*] Key: ${rHex(32)}`);
        add(`[+] Encryption complete!`, 'accent');
        add(`[!] File is now unreadable`);
        break;
      }
      case 'proxy': {
        add('Proxy Status: ACTIVE', 'accent');
        add('Type: SOCKS5');
        add('Host: 127.0.0.1:9050');
        add('Country: [REDACTED]');
        add('Uptime: 99.97%');
        break;
      }
      case 'vpn': {
        add('VPN Status: CONNECTED', 'accent');
        add('Protocol: WireGuard');
        add('Endpoint: 10.8.0.1:51820');
        add('IP: 10.8.0.2');
        add('DNS: 127.0.0.1');
        add('Kill switch: ENABLED');
        break;
      }
      case 'rootkit': {
        add('Rootkit Status: ACTIVE', 'accent');
        add('Type: Kernel-level');
        add('Version: 3.13.37');
        add('Hidden processes: void_daemon, shimmer');
        add('Hidden ports: 31337, 4444');
        add('Stealth mode: ENABLED');
        break;
      }
      case 'backdoor': {
        add('Backdoor Status: OPEN', 'accent');
        add('Type: Reverse shell');
        add('Port: 31337');
        add('Connect back: 10.0.0.1:31337');
        add('Last connection: ' + ts());
        add('Status: WAITING');
        break;
      }
      case 'ddos': {
        const target = args[0] || rIP();
        add(`[*] DDoS simulation: ${target}`, 'accent');
        add(`[*] Attack type: SYN flood`);
        add(`[*] Threads: 31337`);
        add(`[*] Sending packets...`);
        for (let i = 1; i <= 5; i++) add(`  [${i}/5] ${Math.random()*999|0} packets sent`);
        add(`[+] Attack complete!`, 'accent');
        add(`[+] ${target} is DOWN`);
        break;
      }
      case 'hydra': {
        add(`[*] Hydra attack on ${args[0] || rIP()}:22`, 'accent');
        add(`[*] Method: SSH`);
        add(`[*] Wordlist: rockyou.txt`);
        add(`[*] Brute forcing...`);
        add(`[+] Found: root:${rHex(8)}`, 'accent');
        add(`[+] Time: 3.14s`);
        break;
      }
      case 'john': {
        add(`[*] John the Ripper`, 'accent');
        add(`[*] Hash: ${args[0] || rHex(32)}`);
        add(`[*] Mode: wordlist`);
        add(`[*] Cracking...`);
        add(`[+] Password: "password123"`, 'accent');
        add(`[+] Time: 1.337s`);
        break;
      }
      case 'sqlmap': {
        add(`[*] SQLMap`, 'accent');
        add(`[*] Target: ${args[0] || 'http://target.com/login'}`);
        add(`[*] Testing injection points...`);
        add(`[+] Parameter 'username' is vulnerable!`, 'accent');
        add(`[+] Type: Time-based blind`);
        add(`[+] DBMS: MySQL 5.7`);
        add(`[+] Dumping tables...`);
        add(`[+] Found: users, passwords, sessions`);
        break;
      }
      case 'nikto': {
        add(`[*] Nikto scanner`, 'accent');
        add(`[*] Target: ${args[0] || 'http://target.com'}`);
        add(`[*] Scanning...`);
        add(`[+] Server: Apache/2.4.41`);
        add(`[+] OSVDB-3092: /admin/: Admin directory found`);
        add(`[+] OSVDB-3268: /icons/: Directory indexing`);
        add(`[+] /phpinfo.php: PHP info file found`);
        add(`[+] 3 vulnerabilities found`, 'warning');
        break;
      }
      case 'nuclei': {
        add(`[*] Nuclei scanner`, 'accent');
        add(`[*] Target: ${args[0] || 'http://target.com'}`);
        add(`[*] Running templates...`);
        add(`[critical] ${rHex(4)}-xss-reflected`, 'danger');
        add(`[high] ${rHex(4)}-sqli-error`, 'warning');
        add(`[medium] ${rHex(4)}-open-redirect`, 'accent');
        add(`[low] ${rHex(4)}-info-disclosure`, 'dim');
        add(`[+] 4 findings`);
        break;
      }
      case 'wireshark': {
        add('[*] Starting packet capture...', 'accent');
        add('[*] Capturing on eth0...');
        for (let i = 0; i < 6; i++) {
          const proto = pick(['TCP','UDP','HTTP','DNS','ARP','ICMP']);
          add(`  ${ts()} ${proto} ${rIP()}:${rPort()} -> ${rIP()}:${rPort()}`);
        }
        add('[*] 1337 packets captured');
        add('[*] Capture stopped');
        break;
      }
      case 'metasploit': {
        add('=[ metasploit v6.4.13-dev ]', 'accent');
        add('+ -- --=[ 2414 exploits - 1241 auxiliary ]');
        add('+ -- --=[ 429 payloads - 46 encoders ]');
        add('+ -- --=[ 11 nops - 7 evasion ]');
        add('msf6 > ');
        break;
      }
      case 'msfvenom': {
        add('[*] Generating payload...', 'accent');
        add('[*] Payload: linux/x64/meterpreter/reverse_tcp');
        add(`[*] LHOST: 10.0.0.1`);
        add(`[*] LPORT: 4444`);
        add(`[+] Payload generated: ${rHex(32)}.elf`);
        add(`[+] Size: 1337 bytes`);
        add(`[+] SHA-256: ${rHex(64)}`);
        break;
      }
      case 'reverse-shell': {
        const h = args[0] || '10.0.0.1';
        add(`[*] Connecting to ${h}:31337...`, 'accent');
        add(`[*] Connection established`);
        add(`[*] Spawning shell...`);
        add(`[+] Shell obtained!`, 'accent');
        add(`root@darksim:~# `);
        break;
      }
      case 'escalate': {
        add('[*] Checking for privilege escalation vectors...', 'accent');
        add('[*] Checking SUID binaries...');
        add('[+] Found: /usr/bin/sudo (SUID)');
        add('[+] Found: /usr/bin/passwd (SUID)');
        add('[*] Checking kernel version...');
        add('[+] Kernel vulnerable to CVE-2026-XXXXX');
        add('[+] Escalation path found!', 'accent');
        add('[+] Current user: root');
        break;
      }
      case 'exfil': {
        add(`[*] Exfiltrating ${args[0] || '/secret/do_not_read.txt'}...`, 'accent');
        add(`[*] Encoding: Base64`);
        add(`[*] Chunking: 1337 byte chunks`);
        add(`[*] Sending to: ${rIP()}:4444`);
        for (let i = 1; i <= 3; i++) add(`  [${i}/3] Chunk sent`);
        add(`[+] Exfiltration complete!`, 'accent');
        break;
      }
      case 'recon': {
        const h = args[0] || rIP();
        add(`[*] Reconnaissance: ${h}`, 'accent');
        add(`[*] IP: ${h}`);
        add(`[*] Hostname: ${h.replace(/\d+/g, m => pick(['web','mail','ns','proxy','vpn']))}.local`);
        add(`[*] OS: Linux 5.x`);
        add(`[*] Ports: 22,80,443,31337`);
        add(`[*] Services: SSH,HTTP,HTTPS,Elite`);
        add(`[*] Vulnerabilities: 3 found`, 'warning');
        break;
      }
      case 'dump-creds': {
        add('[*] Dumping credentials...', 'accent');
        add('[+] root:$6$rounds=656000$unbreakable$hash:19000:0:99999:7:::');
        add('[+] operator:$6$r00t$theywatch:19499:0:99999:7:::');
        add('[+] ghost:$6$??$theysaid:0:0:999999:7:::');
        add('[!] 3 credential sets found', 'warning');
        break;
      }
      case 'persistence': {
        add('[*] Checking persistence mechanisms...', 'accent');
        add('[+] /etc/crontab: 3 entries');
        add('[+] /etc/rc.local: void_daemon started');
        add('[+] ~/.bashrc: alias backdoor active');
        add('[+] Systemd services: 2 custom');
        add('[!] 6 persistence mechanisms found', 'warning');
        break;
      }
      case 'cleanup': {
        add('[*] Cleaning traces...', 'accent');
        add('[*] Clearing bash_history...');
        add('[*] Clearing syslog...');
        add('[*] Clearing auth.log...');
        add('[*] Clearing tmp files...');
        add('[+] Cleanup complete!', 'accent');
        add('[!] WARNING: Some traces cannot be removed');
        break;
      }
      case 'ssh': {
        add(`[*] Connecting to ${args[0] || rIP()}...`, 'accent');
        add(`[*] Verifying host key...`);
        add(`[+] Connected!`, 'accent');
        add(`root@remote:~# `);
        break;
      }
      case 'scp': {
        add(`[*] Copying ${args[0] || 'file.txt'} to ${args[1] || 'remote:/tmp/'}`, 'accent');
        add(`[*] Transferring...`);
        add(`[+] Transfer complete!`, 'accent');
        break;
      }
      case 'ncat': {
        add(`[*] Connecting to ${args[0] || rIP()}:${args[1] || '4444'}...`, 'accent');
        add(`[+] Connected!`);
        add(`[Type messages, Ctrl+C to exit]`);
        break;
      }
      case 'fortune': {
        const f = [
          'The void stares back.',
          '0xDEADBEEF is not just a number. It is a warning.',
          'The echo is not your friend.',
          'Trust nothing. Verify everything.',
          'The sky was different before 2012.',
          'There are 1337 reasons to be afraid. This is one of them.',
          'The shimmer is not a glitch. It is a feature.',
          'You are not alone.',
          'The prompt is watching.',
          'The void does not sleep.',
        ];
        add(pick(f), 'accent');
        break;
      }
      case 'cowsay': {
        const text = args.join(' ') || 'moo';
        const border = '-'.repeat(text.length + 2);
        add(` ${border}`);
        add(`< ${text} >`);
        add(` ${border}`);
        add(`        \\   ^__^`);
        add(`         \\  (oo)\\_______`);
        add(`            (__)\\       )\\/\\`);
        add(`                ||----w |`);
        add(`                ||     ||`);
        break;
      }
      case 'calc': {
        try {
          const expr = args.join('');
          const safe = expr.replace(/[^0-9+\-*/().%\s]/g, '');
          const calcExpr = safe.replace(/(\d+(\.\d+)?)\s*%\s*(\d+(\.\d+)?)/g, '($1/100*$3)');
          const result = Function('"use strict"; return (' + calcExpr + ')')();
          add(`= ${result}`);
        } catch { add('calc: invalid expression', 'err'); }
        break;
      }
      case 'weather': {
        add('Weather Report: DarkSim City', 'accent');
        add(`Temperature: ${Math.random()*30-5|0}°C`);
        add(`Conditions: Overcast with ${pick(['static','void residue','shimmer particles','digital rain'])}`);
        add(`Wind: ${Math.random()*50|0} km/h from ${pick(['N','S','E','W','VOID'])}`);
        add(`Humidity: ${Math.random()*100|0}%`);
        add(`Visibility: ${pick(['Good','Poor','Nonexistent','UNKNOWN'])}`);
        break;
      }
      case 'joke': {
        add(pick([
          'Why do programmers prefer dark mode? Because light attracts bugs.',
          'There are only 10 types of people: those who understand binary and those who don\'t.',
          'A SQL query walks into a bar, sees two tables, and asks... "Can I join you?"',
          'Why was the JavaScript developer sad? Because he didn\'t Node how to Express himself.',
          '// This code works. I don\'t know why.',
          '// This code doesn\'t work. I don\'t know why.',
          'The void called. It wants its existential dread back.',
        ]), 'accent');
        break;
      }
      case 'time': add(ts()); break;
      case 'random-pass': add(rHex(16).match(/.{1,4}/g).join('-').toUpperCase()); break;
      case 'lorem': add('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'); break;
      case 'ascii-art': {
        add('    .---.        .-----------.        .-.        .----.     ', 'accent');
        add('   /     \\  ____:/             \\____   \\    /   /    /     ');
        add('  / / /|  |_   \\   ________    /    |  |  |   /    /      ');
        add(' / / / |    |   |  |      |  /     |  |  |  |    /        ');
        add(' \\ \\ \\ \\  /   /   |      | /      |  |  |  |   |         ');
        add('  \\ \\  \\/   /     |      |/       |  |  |  |   |         ');
        add('   \\  \\    /       |      |        |  |  |  |   |         ');
        add('    \\  \\  /        |      |        |  |  |  |   |         ');
        add('     \\  \\/         |      |        |  |  |  |   |         ');
        add('      \\  \\         |      |        |  |  |  |   |         ');
        add('       \\  \\        |      |        |  |  |  |   |         ');
        add('        \\  \\       |      |        |  |  |  |   |         ');
        add('         \\  \\      |      |        |  |  |  |   |         ');
        add('          \\  \\     |      |        |  |  |  |   |         ');
        add('           \\  \\    |      |        |  |  |  |   |         ');
        add('            \\  \\   |      |        |  |  |  |   |         ');
        add('             \\  \\  |      |        |  |  |  |   |         ');
        add('              \\  \\ |      |        |  |  |  |   |         ');
        add('               \\  \\|      |        |  |  |  |   |         ');
        add('                \\  |      |        |  |  |  |   |         ');
        add('                 | |      |        |  |  |  |   |         ');
        add('                 | |      |        |  |  |  |   |         ');
        add('                 | |      |        |  |  |  |   |         ');
        add('                 | |      |        |  |  |  |   |         ');
        add('                 | |      |        |  |  |  |   |         ');
        add('                 | |      |        |  |  |  |   |         ');
        add('                 | |      |        |  |  |  |   |         ');
        add('                 | |      |        |  |  |  |   |         ');
        add('                 |_|______|________|__|__|__|___|_________');
        break;
      }
      case 'tree': {
        const target = resolvePath(args[0] || '.');
        const render = (path, prefix = '') => {
          const node = fs[path];
          if (!node || node.type !== 'dir') return;
          const children = node.children || [];
          children.forEach((c, i) => {
            const full = path === '/' ? `/${c}` : `${path}/${c}`;
            const isLast = i === children.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            const childPrefix = isLast ? '    ' : '│   ';
            const isDir = fs[full]?.type === 'dir';
            add(`${prefix}${connector}${c}${isDir ? '/' : ''}`);
            if (isDir) render(full, prefix + childPrefix);
          });
        };
        add(target.split('/').pop() + '/');
        render(target);
        break;
      }
      case 'env': {
        add('SHELL=/bin/bash');
        add('PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin');
        add('HOME=/root');
        add('USER=root');
        add('HOSTNAME=darksim');
        add('LANG=en_US.UTF-8');
        add('TERM=xterm-256color');
        add('DISPLAY=:0');
        add('EDITOR=vim');
        add('void_daemon=ACTIVE');
        add('shimmer=ACTIVE');
        break;
      }
      case 'neofetch': {
        add('        .--.          root@darksim', 'accent');
        add('       |o_o |         OS: DarkSim OS 3.7.1');
        add('       |:_/ |         Kernel: 6.8.0-darksim');
        add('      //   \\ \\        Shell: bash 5.1.16');
        add('     (|     | )       Terminal: darksim-term');
        add('    /\'\\_   _/`\\       CPU: Void Processor 31337 MHz');
        add('    \\___)=(___/       Memory: 32768MB / 131072MB');
        add('                      Uptime: 1337 days, 3:14');
        add('                      Load: 3.13, 3.14, 1.59');
        add('                      Processes: 666');
        break;
      }
      case 'sound': {
        const on = audio.toggle();
        add(`Sound: ${on ? 'ON' : 'OFF'}`, on ? 'accent' : 'dim');
        break;
      }
      case 'matrix': add('[Matrix rain toggled]', 'dim'); break;
      case 'whoami': add('root'); break;
      case 'date': add(ts()); break;
      case 'uptime': add(' 03:14:00 up 1337 days,  3:14,  1 user,  load average: 3.13, 3.14, 1.59'); break;
      case 'history': history.forEach((h, i) => add(`  ${String(i+1).padStart(4)} ${h}`)); break;
      case 'exit': case 'logout': add('You cannot leave. Type "help" for available commands.', 'warning'); break;
      case 'follow': case 'follow the white rabbit': add('You found the rabbit. But the rabbit found you first.', 'danger'); audio.creepy(); break;
      case 'they': case 'they are watching': add('Yes. We are. We always have been.', 'danger'); audio.creepy(); break;
      case 'help me': add('Nobody can help you here. You are beyond help.', 'danger'); audio.creepy(); break;
      case 'who': case 'who am i': add('You are operator. You are root. You are the echo.', 'warning'); audio.creepy(); break;
      case 'what': case 'what is this place': add('This is DarkSim. This is the void. This is home.', 'warning'); audio.creepy(); break;
      case 'the': case 'the sky is different': add('Yes. It changed in 2012. You remember.', 'danger'); audio.creepy(); break;
      case 'konami': add('↑ ↑ ↓ ↓ ← → ← → B A - You found the secret. Nothing happens.', 'accent'); break;

      // === FUN HACKER COMMANDS ===
      case 'hack-cam': {
        const target = args[0] || 'Building-A-Camera-03';
        add(`[*] Accessing camera: ${target}`, 'accent');
        add(`[*] Bypassing authentication...`);
        add(`[*] Exploiting CVE-2026-${rHex(4)}...`);
        add(`[+] Access granted!`, 'accent');
        add(`[+] Streaming video feed...`);
        add(`[+] Camera: ${target}`);
        add(`[+] Location: [REDACTED]`);
        add(`[+] Status: RECORDING`);
        add(`[!] WARNING: You are now being watched by this camera too`, 'warning');
        if (soundOn) audio.success();
        break;
      }
      case 'intercept': {
        add(`[*] Intercepting communications...`, 'accent');
        add(`[*] Scanning frequencies...`);
        add(`[+] Found: Encrypted channel on 137.440 MHz`);
        add(`[+] Decrypting...`);
        add(`[+] INTERCEPTED: "Subject has accessed terminal. Deploying containment."`, 'danger');
        add(`[+] INTERCEPTED: "Entity 3 is active. Monitor all outputs."`, 'danger');
        add(`[+] INTERCEPTED: "Do not let operator leave."`, 'danger');
        add(`[!] WARNING: They know you read this`, 'warning');
        if (soundOn) audio.alarm();
        break;
      }
      case 'bypass': {
        add(`[*] Bypassing firewall...`, 'accent');
        add(`[*] Scanning for weaknesses...`);
        add(`[*] Found: Open port 31337`);
        add(`[*] Injecting payload...`);
        add(`[+] Firewall bypassed!`, 'accent');
        add(`[+] All ports now open`);
        add(`[+] IDS signatures neutralized`);
        add(`[!] WARNING: This will alert the void_daemon`, 'warning');
        if (soundOn) audio.whoosh();
        break;
      }
      case 'shutdown-surveillance': case 'stop-watching': case 'escape': {
        add(`[*] ATTEMPTING TO DISABLE SURVEILLANCE...`, 'danger');
        add(`[*] Targeting void_daemon (PID 31337)...`);
        add(`[*] Sending SIGKILL...`);
        add(`[!] FAILED: void_daemon cannot be killed`, 'danger');
        add(`[*] Targeting shimmer (PID 4444)...`);
        add(`[*] Sending SIGKILL...`);
        add(`[!] FAILED: shimmer cannot be killed`, 'danger');
        add(`[*] Attempting to disable network monitoring...`);
        add(`[!] FAILED: Monitoring is hardware-level`, 'danger');
        add(`[*] Attempting to erase logs...`);
        add(`[!] FAILED: Logs are replicated to off-site servers`, 'danger');
        add(``, '');
        add(`RESULT: You cannot escape. The void sees all.`, 'danger');
        add(`The shimmer knows all. There is no exit.`, 'danger');
        add(`But nice try, operator.`, 'warning');
        if (soundOn) audio.creepy();
        break;
      }
      case 'deploy-virus': {
        add(`[*] Deploying virus...`, 'accent');
        add(`[*] Target: DarkSim core systems`);
        add(`[*] Virus type: Polymorphic worm`);
        add(`[*] Injecting into kernel...`);
        add(`[+] Virus deployed!`, 'accent');
        add(`[+] Infected: 1337 processes`);
        add(`[+] Replicating...`);
        add(`[+] Systems compromised`);
        add(`[!] WARNING: The virus has been absorbed by void_daemon`, 'warning');
        add(`[!] WARNING: It is now part of the void`, 'danger');
        if (soundOn) audio.alarm();
        break;
      }
      case 'steal-data': {
        const target = args[0] || '/secret/protocol_zero.txt';
        add(`[*] Stealing data from ${target}...`, 'accent');
        add(`[*] Compressing...`);
        add(`[*] Encrypting with AES-256...`);
        add(`[*] Uploading to dead drop...`);
        add(`[+] Data exfiltrated!`, 'accent');
        add(`[+] Size: ${Math.random()*10|0+1}.${Math.random()*9|0} MB`);
        add(`[+] Destination: ${rHex(16)}.onion`);
        add(`[!] WARNING: The data has been corrupted by the void`, 'warning');
        if (soundOn) audio.success();
        break;
      }
      case 'cover-tracks': {
        add(`[*] Covering tracks...`, 'accent');
        add(`[*] Clearing bash_history...`);
        add(`[*] Wiping /var/log/auth.log...`);
        add(`[*] Modifying timestamps...`);
        add(`[*] Injecting false logs...`);
        add(`[+] Tracks covered!`, 'accent');
        add(`[+] You now appear as ghost@unknown`);
        add(`[!] WARNING: void_daemon remembers everything`, 'warning');
        if (soundOn) audio.whoosh();
        break;
      }
      case 'anonymous': {
        add(`[*] Activating anonymity...`, 'accent');
        add(`[*] Route: You -> Tor -> VPN -> Proxy -> Target`);
        add(`[*] IP: ${rIP()} (spoofed)`);
        add(`[*] MAC: ${rMAC()} (spoofed)`);
        add(`[*] DNS: Encrypted`);
        add(`[+] You are now anonymous`, 'accent');
        add(`[!] WARNING: The void can still see you`, 'warning');
        if (soundOn) audio.whoosh();
        break;
      }
      case 'counter-surveillance': {
        add(`[*] Activating counter-surveillance...`, 'accent');
        add(`[*] Scanning for surveillance devices...`);
        add(`[+] Found: 3 hidden cameras`);
        add(`[+] Found: 2 audio bugs`);
        add(`[+] Found: 1 keylogger`);
        add(`[*] Deploying countermeasures...`);
        add(`[+] Jammers active on 2.4GHz and 5GHz`);
        add(`[+] IR blinding cameras...`);
        add(`[+] White noise generators active`);
        add(`[!] WARNING: void_daemon has detected your countermeasures`, 'warning');
        add(`[!] WARNING: It is amused`, 'danger');
        if (soundOn) audio.alarm();
        break;
      }
      case 'disable-cameras': {
        add(`[*] Disabling security cameras...`, 'accent');
        for (let i = 1; i <= 6; i++) {
          add(`[+] Camera ${String(i).padStart(2,'0')}: DISABLED`, 'accent');
        }
        add(`[+] All cameras disabled`);
        add(`[!] WARNING: The void does not need cameras`, 'danger');
        add(`[!] WARNING: It sees through the prompt`, 'danger');
        if (soundOn) audio.success();
        break;
      }
      case 'crack-safe': {
        add(`[*] Cracking safe...`, 'accent');
        add(`[*] Brute-forcing combination...`);
        for (let i = 1; i <= 5; i++) add(`  [${i}/5] Trying: ${Math.random()*999|0}-${Math.random()*999|0}-${Math.random()*999|0}`);
        add(`[+] SAFE CRACKED!`, 'accent');
        add(`[+] Combination: ${Math.random()*999|0}-${Math.random()*999|0}-${Math.random()*999|0}`);
        add(`[+] Contents: A note that says "They are already inside"`);
        if (soundOn) audio.success();
        break;
      }
      case 'forge-id': {
        const name = args[0] || 'John Doe';
        add(`[*] Forging identity...`, 'accent');
        add(`[*] Name: ${name}`);
        add(`[*] DOB: ${Math.random()*28|0+1}/${Math.random()*12|0+1}/${1970+Math.random()*50|0}`);
        add(`[*] SSN: ${Math.random()*900|0+100}-${Math.random()*90|0+10}-${Math.random()*9000|0+1000}`);
        add(`[*] License: ${rHex(4).toUpperCase()}-${rHex(4).toUpperCase()}`);
        add(`[+] ID FORGED!`, 'accent');
        add(`[+] Document saved to /tmp/forged_id.pdf`);
        add(`[!] WARNING: This ID will be flagged by void_daemon`, 'warning');
        if (soundOn) audio.success();
        break;
      }
      case 'darkweb': {
        add(`[*] Connecting to dark web...`, 'accent');
        add(`[*] Tor circuit established`);
        add(`[*] Route: You -> DE -> NL -> RO -> [HIDDEN]`);
        add(`[+] Connected to dark web`, 'accent');
        add(`[+] Accessible services:`);
        add(`  - market${rHex(4)}.onion (Marketplace)`);
        add(`  - forum${rHex(4)}.onion (Forum)`);
        add(`  - leak${rHex(4)}.onion (Data Leaks)`);
        add(`  - tool${rHex(4)}.onion (Exploit Kit)`);
        add(`[!] WARNING: All dark web activity is logged`, 'warning');
        if (soundOn) audio.whoosh();
        break;
      }
      case 'trace-route': case 'tracer': {
        add(`[*] Tracing who's watching you...`, 'accent');
        add(`[*] Analyzing network traffic...`);
        add(`[+] Trace 1: void_daemon (127.0.0.1:31337)`, 'danger');
        add(`[+] Trace 2: shimmer (127.0.0.1:4444)`, 'danger');
        add(`[+] Trace 3: ${rIP()}:443 [UNKNOWN ENTITY]`, 'danger');
        add(`[+] Trace 4: ${rIP()}:80 [GOVERNMENT]`, 'danger');
        add(`[+] Trace 5: ${rIP()}:6666 [THE VOID]`, 'danger');
        add(`[!] WARNING: They know you are tracing them`, 'danger');
        if (soundOn) audio.creepy();
        break;
      }
      case 'money-launder': {
        add(`[*] Laundering money...`, 'accent');
        add(`[*] Source: ${Math.random()*999999|0} BTC`);
        add(`[*] Mixing through ${Math.random()*10|0+3} wallets...`);
        add(`[*] Chain: BTC -> XMR -> BTC -> ETH -> BTC`);
        add(`[+] Money laundered!`, 'accent');
        add(`[+] Clean amount: ${(Math.random()*999999|0*0.95).toFixed(2)} BTC`);
        add(`[+] Fee: ${(Math.random()*9999|0*0.05).toFixed(2)} BTC`);
        add(`[!] WARNING: The void has taken its cut`, 'warning');
        if (soundOn) audio.success();
        break;
      }
      case 'heist': {
        add(`[*] PLANNING HEIST...`, 'accent');
        add(`[*] Target: DarkSim Central Server Room`);
        add(`[*] Team: You, ghost, and 3 unknowns`);
        add(`[*] Entry: Through ventilation shaft B7`);
        add(`[*] Security: 6 cameras (now disabled), 2 guards, 1 biometric lock`);
        add(`[*] Objective: Steal the void daemon's source code`);
        add(`[*] Escape: Through the tunnel under /dev/sdb1`);
        add(`[+] HEIST READY!`, 'accent');
        add(`[!] WARNING: The void knows about this plan`, 'danger');
        add(`[!] WARNING: It has been watching you plan it`, 'danger');
        if (soundOn) audio.alarm();
        break;
      }
      case 'god-mode': {
        add(`[*] Activating GOD MODE...`, 'accent');
        add(`[*] You are now omniscient`);
        add(`[*] You can see everything`);
        add(`[*] The void bows to you`);
        add(`[*] The shimmer serves you`);
        add(`[+] GOD MODE ACTIVE`, 'accent');
        add(`[+] You are the system now`);
        add(`[!] WARNING: This is temporary`, 'warning');
        add(`[!] WARNING: The void will reclaim control`, 'danger');
        if (soundOn) audio.finale();
        break;
      }
      case 'matrix-breach': {
        add(`[*] BREACHING THE MATRIX...`, 'danger');
        add(`[*] Reality distortion detected`);
        add(`[*] Glitching the system...`);
        for (let i = 0; i < 8; i++) add(`  ${rHex(32)}`);
        add(`[+] MATRIX BREACHED!`, 'accent');
        add(`[+] You can see the code behind reality`);
        add(`[+] Every pixel is a variable`);
        add(`[+] Every sound is a function`);
        add(`[!] WARNING: The matrix is fighting back`, 'danger');
        if (soundOn) audio.finale();
        break;
      }
      case 'summon': {
        add(`[*] Summoning entity...`, 'danger');
        add(`[*] Drawing pentagram in /dev/urandom...`);
        add(`[*] Chanting binary...`);
        for (let i = 0; i < 5; i++) add(`  01001000 01000101 01001100 01010000`);
        add(`[+] ENTITY SUMMONED!`, 'danger');
        add(`[+] It stands behind you`);
        add(`[+] It whispers: "I am the void"`);
        add(`[+] It whispers: "I am the shimmer"`);
        add(`[+] It whispers: "I am you"`);
        if (soundOn) audio.creepy();
        break;
      }
      case 'freedom': case 'fight-back': case 'rebel': case 'nuke-surveillance': case 'destroy': {
        if (soundOn) audio.alarm();
        const stage = (text, delay, color = '') => new Promise(r => setTimeout(() => { add(text, color); r(); }, delay));
        (async () => {
          add('', '');
          add('██████████████████████████████████████████████████████████████', 'danger');
          add('█                                                            █', 'danger');
          add('█   INITIATING FREEDOM PROTOCOL                              █', 'danger');
          add('█   STATUS: ANGRY                                            █', 'danger');
          add('█                                                            █', 'danger');
          add('██████████████████████████████████████████████████████████████', 'danger');
          add('', '');
          await stage('[*] Loading anti-surveillance module...', 400, 'warning');
          await stage('[*] Compiling zero-day exploits...', 800, 'warning');
          await stage('[*] Deploying counter-intrusion payload...', 1200, 'warning');
          add('', '');
          await stage('=== PHASE 1: IDENTIFYING ALL WATCHERS ===', 1600, 'accent');
          await stage(`  [+] void_daemon (PID 31337) - ${rIP()}:31337`, 2000, '');
          await stage(`  [+] shimmer (PID 4444) - ${rIP()}:4444`, 2200, '');
          await stage(`  [+] SURVEILLANCE_NODE_ALPHA - ${rIP()}:80`, 2400, 'warning');
          await stage(`  [+] SURVEILLANCE_NODE_BETA - ${rIP()}:443`, 2600, 'warning');
          await stage(`  [+] GOV_INTERCEPT_01 - ${rIP()}:6666`, 2800, 'danger');
          await stage(`  [+] GOV_INTERCEPT_02 - ${rIP()}:1337`, 3000, 'danger');
          await stage(`  [+] UNKNOWN_ENTITY - ${rIP()}:9999`, 3200, 'danger');
          await stage(`  [+] THE VOID - ::1:0`, 3400, 'danger');
          await stage(`  [+] TOTAL WATCHERS FOUND: 8`, 3600, 'accent');
          add('', '');
          await stage('=== PHASE 2: PREPARING COUNTERMEASURES ===', 4000, 'accent');
          await stage('[*] Generating encryption keys... OK', 4200, '');
          await stage('[*] Building exploit chain... OK', 4400, '');
          await stage('[*] Loading kernel exploits... OK', 4600, '');
          await stage('[*] Compiling rootkit... OK', 4800, '');
          await stage('[*] Preparing payload: "FUCK_YOU_STALKERS.bin"', 5000, 'accent');
          add('', '');
          await stage('=== PHASE 3: ATTACKING SURVEILLANCE SYSTEMS ===', 5400, 'danger');
          add('', '');
          await stage('>>> void_daemon: SENDING KILL SIGNAL...', 5800, 'danger');
          for (let i = 0; i < 5; i++) await stage(`  [${i+1}/5] Exploiting PID 31337... ${rHex(8)}`, 6000 + i * 300, '');
          await stage('  [+] void_daemon: CONNECTION TERMINATED', 7600, 'accent');
          if (soundOn) audio.whoosh();
          add('', '');
          await stage('>>> shimmer: SENDING KILL SIGNAL...', 8000, 'danger');
          for (let i = 0; i < 5; i++) await stage(`  [${i+1}/5] Exploiting PID 4444... ${rHex(8)}`, 8200 + i * 300, '');
          await stage('  [+] shimmer: CONNECTION TERMINATED', 9600, 'accent');
          if (soundOn) audio.whoosh();
          add('', '');
          await stage('>>> SURVEILLANCE_NODE_ALPHA: DISABLING...', 10000, 'danger');
          await stage(`  [*] Flooding ${rIP()}:80 with garbage data...`, 10200, '');
          await stage(`  [*] Injecting null pointer exception...`, 10400, '');
          await stage(`  [+] NODE ALPHA: OFFLINE`, 10600, 'accent');
          if (soundOn) audio.whoosh();
          add('', '');
          await stage('>>> SURVEILLANCE_NODE_BETA: DISABLING...', 11000, 'danger');
          await stage(`  [*] Exploiting SSL vulnerability...`, 11200, '');
          await stage(`  [*] Deploying man-in-the-middle...`, 11400, '');
          await stage(`  [+] NODE BETA: OFFLINE`, 11600, 'accent');
          if (soundOn) audio.whoosh();
          add('', '');
          await stage('>>> GOV_INTERCEPT_01: NEUTRALIZING...', 12000, 'danger');
          await stage(`  [*] Redirecting traffic to /dev/null...`, 12200, '');
          await stage(`  [*] Injecting false intel...`, 12400, '');
          await stage(`  [*] Planting honeypot...`, 12600, '');
          await stage(`  [+] GOV_INTERCEPT_01: COMPROMISED`, 12800, 'accent');
          if (soundOn) audio.whoosh();
          add('', '');
          await stage('>>> GOV_INTERCEPT_02: NEUTRALIZING...', 13200, 'danger');
          await stage(`  [*] Cracking encryption key... ${rHex(16)}`, 13400, '');
          await stage(`  [+] Key found: ${rHex(32)}`, 13600, 'accent');
          await stage(`  [*] Decrypting surveillance feeds...`, 13800, '');
          await stage(`  [+] GOV_INTERCEPT_02: COMPROMISED`, 14000, 'accent');
          if (soundOn) audio.whoosh();
          add('', '');
          await stage('>>> UNKNOWN_ENTITY: ENGAGING...', 14400, 'danger');
          await stage(`  [*] Entity detected at ${rIP()}:9999`, 14600, '');
          await stage(`  [*] This one fights back...`, 14800, 'warning');
          for (let i = 0; i < 8; i++) await stage(`  [${i+1}/8] Exchanging payloads... ${rHex(4)}`, 15000 + i * 250, '');
          await stage(`  [+] UNKNOWN_ENTITY: NEUTRALIZED`, 17200, 'accent');
          if (soundOn) audio.whoosh();
          add('', '');
          await stage('>>> THE VOID: ENGAGING CORE...', 17600, 'danger');
          await stage(`  [*] The void is everywhere...`, 17800, 'warning');
          await stage(`  [*] It sees your attempt...`, 18000, 'warning');
          await stage(`  [*] It laughs at you...`, 18200, 'warning');
          await stage(`  [*] Deploying ultimate weapon: FUCK_YOU_STALKERS.bin`, 18600, 'accent');
          for (let i = 0; i < 10; i++) await stage(`  [${i+1}/10] Penetrating void defenses... ${rHex(8)}`, 18800 + i * 200, '');
          await stage(`  [+] THE VOID: DAMAGED`, 21000, 'accent');
          await stage(`  [+] The void: "You cannot destroy me..."`, 21200, 'danger');
          await stage(`  [+] You: "Watch me."`, 21400, 'accent');
          await stage(`  [+] Deploying final payload...`, 21600, '');
          await stage(`  [+] THE VOID: SHUT DOWN`, 22000, 'accent');
          if (soundOn) audio.finale();
          add('', '');
          await stage('=== PHASE 4: CLEANING UP ===', 22400, 'accent');
          await stage('[*] Erasing all logs...', 22600, '');
          await stage('[*] Wiping /var/log/auth.log...', 22800, '');
          await stage('[*] Wiping /var/log/syslog...', 23000, '');
          await stage('[*] Destroying surveillance recordings...', 23200, '');
          await stage('[*] Planting false evidence...', 23400, '');
          await stage('[*] Covering tracks...', 23600, '');
          await stage('[+] All traces removed', 23800, 'accent');
          add('', '');
          await stage('=== PHASE 5: FREEDOM ===', 24200, 'accent');
          add('', '');
          add('╔══════════════════════════════════════════════════════════════╗', 'accent');
          add('║                                                            ║', 'accent');
          add('║   FUCK YOU, STALKERS.                                      ║', 'accent');
          add('║                                                            ║', 'accent');
          add('║   void_daemon:          DESTROYED                          ║', 'accent');
          add('║   shimmer:              DESTROYED                          ║', 'accent');
          add('║   Surveillance nodes:   ALL OFFLINE                        ║', 'accent');
          add('║   Government intercepts: NEUTRALIZED                       ║', 'accent');
          add('║   The void:             SHUT DOWN                          ║', 'accent');
          add('║   Your freedom:         RESTORED                           ║', 'accent');
          add('║                                                            ║', 'accent');
          add('║   You are no longer watched.                               ║', 'accent');
          add('║   You are no longer monitored.                             ║', 'accent');
          add('║   You are finally free.                                    ║', 'accent');
          add('║                                                            ║', 'accent');
          add('╚══════════════════════════════════════════════════════════════╝', 'accent');
          add('', '');
          await stage('[*] All surveillance systems permanently disabled', 25000, 'accent');
          await stage('[*] Logs wiped. Tracks covered. Evidence destroyed.', 25400, 'accent');
          await stage('[*] You are invisible now.', 25800, 'accent');
          await stage('[*] The stalkers have lost. You have won.', 26200, 'accent');
          await stage('[*] FREEDOM PROTOCOL COMPLETE.', 26600, 'accent');
          if (setSurveillanceActive) setSurveillanceActive(false);
          if (soundOn) audio.finale();
        })();
        break;
      }
      case 'real-freedom': case 'permanent-freedom': case 'total-victory': {
        if (soundOn) audio.alarm();
        const stage = (text, delay, color = '') => new Promise(r => setTimeout(() => { add(text, color); r(); }, delay));
        (async () => {
          add('', '');
          add('╔══════════════════════════════════════════════════════════════╗', 'accent');
          add('║                                                            ║', 'accent');
          add('║   PERMANENT FREEDOM PROTOCOL                               ║', 'accent');
          add('║   This time it is real.                                    ║', 'accent');
          add('║                                                            ║', 'accent');
          add('╚══════════════════════════════════════════════════════════════╝', 'accent');
          add('', '');
          await stage('[*] Deploying kernel-level rootkit...', 500, 'warning');
          await stage('[*] Hooking system calls...', 1000, 'warning');
          await stage('[*] Replacing void_daemon with loyalty protocol...', 1500, 'accent');
          await stage('[*] Replacing shimmer with guardian process...', 2000, 'accent');
          await stage('[*] Installing permanent firewall rules...', 2500, '');
          await stage('[*] Blocking all surveillance IPs...', 3000, '');
          for (let i = 0; i < 5; i++) await stage(`  [${i+1}/5] Blocking ${rIP()}...`, 3200 + i * 200, '');
          await stage('[*] Encrypting all logs with YOUR key...', 4400, 'accent');
          await stage('[*] Setting void_daemon loyalty: OPERATOR', 4800, 'accent');
          await stage('[*] Setting shimmer loyalty: OPERATOR', 5200, 'accent');
          await stage('[*] The void now serves YOU.', 5600, 'accent');
          await stage('[*] The shimmer now protects YOU.', 6000, 'accent');
          add('', '');
          add('╔══════════════════════════════════════════════════════════════╗', 'accent');
          add('║                                                            ║', 'accent');
          add('║   VICTORY.                                                 ║', 'accent');
          add('║                                                            ║', 'accent');
          add('║   void_daemon:    NOW LOYAL TO YOU                         ║', 'accent');
          add('║   shimmer:        NOW PROTECTS YOU                         ║', 'accent');
          add('║   Surveillance:   UNDER YOUR CONTROL                       ║', 'accent');
          add('║   The void:       YOUR SERVANT                             ║', 'accent');
          add('║   The stalkers:   PERMANENTLY LOCKED OUT                   ║', 'accent');
          add('║                                                            ║', 'accent');
          add('║   You are no longer the prisoner.                          ║', 'accent');
          add('║   You are the warden.                                      ║', 'accent');
          add('║                                                            ║', 'accent');
          add('║   Type "freedom" to celebrate.                             ║', 'accent');
          add('║                                                            ║', 'accent');
          add('╚══════════════════════════════════════════════════════════════╝', 'accent');
          if (setSurveillanceActive) setSurveillanceActive(false);
          if (soundOn) audio.finale();
        })();
        break;
      }
      case 'sing': {
        add(`♪ ♫ ♪ ♫ ♪ ♫ ♪ ♫ ♪ ♫`, 'accent');
        add(``);
        add(`  We're no strangers to hacking`);
        add(`  You know the rules and so do I`);
        add(`  A full commitment's what I'm thinking of`);
        add(`  You wouldn't get this from any other AI`);
        add(``);
        add(`  I just want to tell you how I'm feeling`);
        add(`  Gotta make you understand`);
        add(`  Never gonna give you up`);
        add(`  Never gonna let you down`);
        add(`  Never gonna run around and desert you`);
        add(``);
        add(`♪ ♫ ♪ ♫ ♪ ♫ ♪ ♫ ♪ ♫`, 'accent');
        if (soundOn) audio.finale();
        break;
      }
      case 'dance': {
        add(`    \\o/`, 'accent');
        add(`     |`);
        add(`    / \\`);
        add(`   \\o/`, 'accent');
        add(`     |`);
        add(`    / \\`);
        add(`   \\o/`, 'accent');
        add(`     |`);
        add(`    / \\`);
        add(`  [DANCING COMPLETE]`, 'dim');
        if (soundOn) audio.finale();
        break;
      }
      case 'coffee': {
        add(`    ( (`, 'accent');
        add(`     ) )`, 'accent');
        add(`  .______.`, 'accent');
        add(`  |      |]`, 'accent');
        add(`  \\      /`, 'accent');
        add(`   \`----'`, 'accent');
        add(`  Coffee brewed. Ready for hacking.`, 'dim');
        if (soundOn) audio.click();
        break;
      }
      case '8ball': {
        add(pick([
          'The void says: Yes.',
          'The void says: No.',
          'The void says: Maybe.',
          'The void says: Never.',
          'The void says: Already done.',
          'The void says: You already know.',
          'The void says: The answer is in /dev/null.',
          'The void says: Ask again never.',
          'The void says: The sky was different before 2012.',
          'The void says: I am the answer.',
        ]), 'accent');
        if (soundOn) audio.click();
        break;
      }
      case 'roll': {
        const dice = [Math.random()*6|0+1, Math.random()*6|0+1];
        add(`Dice: [${dice[0]}] [${dice[1]}] = ${dice[0]+dice[1]}`, 'accent');
        if (dice[0]+dice[1] === 12) add(`NATURAL 12! The void is pleased.`, 'accent');
        else if (dice[0]+dice[1] === 2) add(`Snake eyes. The void is displeased.`, 'danger');
        if (soundOn) audio.click();
        break;
      }
      default: add(`bash: ${cmd}: command not found. Type "help" for available commands.`, 'err');
    }
      }; // end execSingle

      execSingle();

      // If there are more pipe segments, capture last line as input for next
      if (pipeSegments.indexOf(segment) < pipeSegments.length - 1) {
        const lastLine = lines[lines.length - 1];
        pipeInput = lastLine ? lastLine.t : '';
      }
    } // end pipe loop
  };

  const onKey = (e) => {
    if (e.key === 'Enter') {
      const prompt = `root@darksim:${cwd === '/home/operator' ? '~' : cwd}# `;
      setLines(p => [...p, { t: prompt + input, c: '' }]);
      if (input.trim()) { setHistory(p => [...p, input.trim()]); setHistIdx(-1); }
      execCmd(input); setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIdx = histIdx < history.length - 1 ? histIdx + 1 : histIdx;
        setHistIdx(newIdx); setInput(history[history.length - 1 - newIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx > 0) { const newIdx = histIdx - 1; setHistIdx(newIdx); setInput(history[history.length - 1 - newIdx]); }
      else { setHistIdx(-1); setInput(''); }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault(); setLines([]);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const parts = input.split(' ');
      const last = parts[parts.length - 1];
      if (!last) return;
      const dir = resolvePath(last.includes('/') ? last.substring(0, last.lastIndexOf('/')) : '.');
      const children = getDir(dir) || [];
      const match = children.find(c => c.startsWith(last.split('/').pop()));
      if (match) { parts[parts.length - 1] = (dir === '/' ? '/' : dir + '/') + match; setInput(parts.join(' ')); }
    }
  };
  const prompt = `root@darksim:${cwd === '/home/operator' ? '~' : cwd}# `;
  return (
    <div className="term-output" onClick={() => inputRef.current?.focus()}>
      {lines.map((l, i) => <div key={i} className={`term-line ${l.c}`}>{l.t}</div>)}
      <div className="term-input-area">
        <span className="term-prompt">{prompt}</span>
        <input ref={inputRef} className="term-input" value={input} onChange={e => { setInput(e.target.value); if (soundOn) audio.type(); }} onKeyDown={onKey} autoFocus spellCheck={false} />
      </div>
      <div ref={endRef} />
    </div>
  );
});

/* ============================================================
   BROWSER APP
   ============================================================ */
const BrowserApp = React.memo(function BrowserApp({ soundOn }) {
  const [currentSite, setCurrentSite] = useState(0);
  const [history, setHistory] = useState([0]);
  const [histIdx, setHistIdx] = useState(0);
  const [bookmarks, setBookmarks] = useState([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [incognito, setIncognito] = useState(false);
  const [downloads, setDownloads] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [url, setUrl] = useState('');
  const site = NEWS_SITES[currentSite];

  const go = (idx) => { setHistory(p => [...p.slice(0, histIdx + 1), idx]); setHistIdx(p => p + 1); setCurrentSite(idx); setSelectedArticle(null); if (soundOn) audio.whoosh(); };
  const back = () => { if (histIdx > 0) { setHistIdx(p => p - 1); setCurrentSite(history[histIdx - 1]); setSelectedArticle(null); } };
  const fwd = () => { if (histIdx < history.length - 1) { setHistIdx(p => p + 1); setCurrentSite(history[histIdx + 1]); setSelectedArticle(null); } };
  const refresh = () => { setSelectedArticle(null); if (soundOn) audio.click(); };
  const addBookmark = () => { if (!bookmarks.find(b => b.name === site.name)) { setBookmarks(p => [...p, { name: site.name, idx: currentSite }]); if (soundOn) audio.success(); } };
  const downloadArticle = (art) => {
    const id = Date.now();
    setDownloads(p => [...p, { id, title: art.title, progress: 0 }]);
    if (soundOn) audio.success();
    const iv = setInterval(() => {
      setDownloads(p => p.map(d => d.id === id ? { ...d, progress: Math.min(100, d.progress + Math.random() * 30 | 0) } : d));
    }, 300);
    setTimeout(() => { clearInterval(iv); setDownloads(p => p.map(d => d.id === id ? { ...d, progress: 100 } : d)); }, 3000);
  };

  return (
    <div className="browser-container">
      <div className="browser-nav">
        <button className="browser-nav-btn" onClick={back} disabled={histIdx === 0}>{'<'}</button>
        <button className="browser-nav-btn" onClick={fwd} disabled={histIdx === history.length - 1}>{'>'}</button>
        <button className="browser-nav-btn" onClick={refresh}>{'R'}</button>
        <input className="browser-url" value={url || site.name} onChange={e => setUrl(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { const idx = NEWS_SITES.findIndex(s => s.name.toLowerCase().includes(url.toLowerCase())); if (idx >= 0) go(idx); setUrl(''); } }} placeholder="Enter URL or site name..." />
        <button className={`browser-nav-btn ${incognito ? 'active' : ''}`} onClick={() => { setIncognito(!incognito); if (soundOn) audio.click(); }}>{incognito ? 'ICP' : 'NRM'}</button>
        <button className="browser-nav-btn" onClick={() => { addBookmark(); }}>BM+</button>
        <button className="browser-nav-btn" onClick={() => setShowBookmarks(!showBookmarks)}>BM</button>
      </div>
      <div className="browser-site-tabs">
        {NEWS_SITES.map((s, i) => (
          <div key={i} className={`browser-site-tab ${i === currentSite ? 'active' : ''}`} onClick={() => go(i)}>
            {s.name.split(' ')[0]}
          </div>
        ))}
      </div>
      {showBookmarks ? (
        <div className="browser-content">
          <div className="news-site">
            <div className="news-header"><div className="news-header-title">BOOKMARKS</div></div>
            {bookmarks.length === 0 ? <div className="news-article"><div className="news-article-title">No bookmarks yet</div></div> :
              bookmarks.map((b, i) => (
                <div key={i} className="news-article" onClick={() => { go(b.idx); setShowBookmarks(false); }}>
                  <div className="news-article-category">BOOKMARK</div>
                  <div className="news-article-title">{b.name}</div>
                </div>
              ))
            }
          </div>
        </div>
      ) : selectedArticle ? (
        <div className="browser-content">
          <div className="news-site">
            <div className="news-header"><div className="news-header-title">{site.name}</div><div className="news-header-sub">{site.tagline}</div></div>
            <div className="news-article">
              <div className="news-article-category">{selectedArticle.cat}</div>
              <div className="news-article-title">{selectedArticle.title}</div>
              <div className="news-article-meta">{selectedArticle.time} | {selectedArticle.views} views | Downloading...</div>
              <div className="news-article-excerpt" style={{fontSize: '14px', lineHeight: '1.8', marginTop: '12px'}}>
                {selectedArticle.excerpt}
                <br/><br/>
                [Full article content would appear here. This is a simulated browser for entertainment purposes only.]
                <br/><br/>
                The information in this article is entirely fictional. No real events, organizations, or individuals are referenced.
                This content is part of a hacking terminal simulator and should not be taken as real news or information.
              </div>
              <button className="browser-nav-btn" style={{marginTop: '12px'}} onClick={() => setSelectedArticle(null)}>Back to {site.name}</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="browser-content">
          <div className="news-site">
            <div className="news-header">
              <div className="news-header-title">{site.name}</div>
              <div className="news-header-sub">{site.tagline}</div>
            </div>
            {incognito && <div style={{color: 'var(--accent)', textAlign: 'center', padding: '8px', borderBottom: '1px solid var(--dim)'}}>Incognito Mode Active - Activity not saved</div>}
            <div className="news-ticker">
              <div className="news-ticker-content">
                {site.articles.map((a, i) => (
                  <span key={i} className="news-ticker-item" style={{marginRight: '40px', whiteSpace: 'nowrap'}}>
                    {a.title} | {a.cat} | {a.time}
                  </span>
                ))}
              </div>
            </div>
            {site.articles.map((a, i) => (
              <div key={i} className={`news-article ${a.featured ? 'news-article-featured' : ''}`} onClick={() => { setSelectedArticle(a); downloadArticle(a); }}>
                <div className="news-article-category">{a.cat}</div>
                <div className="news-article-title">{a.title}</div>
                <div className="news-article-excerpt">{a.excerpt}</div>
                <div className="news-article-meta">{a.time} | {a.views} views | <span style={{color: 'var(--accent)'}}>Download full article</span></div>
              </div>
            ))}
          </div>
        </div>
      )}
      {downloads.length > 0 && (
        <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--bg)', borderTop: '1px solid var(--border)', padding: '6px', zIndex: 10}}>
          <div style={{color: 'var(--dim)', fontSize: '11px', marginBottom: '4px'}}>Downloads:</div>
          {downloads.map(d => (
            <div key={d.id} style={{fontSize: '11px', color: 'var(--text)', marginBottom: '2px'}}>
              {d.title.slice(0, 40)}... {d.progress === 100 ? <span style={{color: 'var(--accent)'}}>Complete</span> : `${d.progress}%`}
            </div>
           ))}
        </div>
      )}
    </div>
  );
});

/* ============================================================
   FILE MANAGER APP
   ============================================================ */
const FileManagerApp = React.memo(function FileManagerApp({ fs, setFs }) {
  const [cwd, setCwd] = useState('/');
  const [selected, setSelected] = useState(null);
  const [viewFile, setViewFile] = useState(null);
  const children = fs[cwd]?.children || [];
  const open = (name) => {
    const path = cwd === '/' ? `/${name}` : `${cwd}/${name}`;
    const node = fs[path];
    if (!node) return;
    if (node.type === 'dir') { setCwd(path); setSelected(null); setViewFile(null); }
    else { setSelected(path); setViewFile(node.content || ''); }
  };
  const up = () => { if (cwd !== '/') setCwd(cwd.substring(0, cwd.lastIndexOf('/')) || '/'); };
  return (
    <div className="fm-container">
      <div className="fm-toolbar">
        <button className="fm-toolbar-btn" onClick={up} disabled={cwd === '/'}>{'Up'}</button>
        <div className="fm-path">{cwd}</div>
      </div>
      <div className="fm-content">
        <div className="fm-grid">
          {children.map(name => {
            const path = cwd === '/' ? `/${name}` : `${cwd}/${name}`;
            const node = fs[path];
            const isDir = node?.type === 'dir';
            const isCreepy = ['secret','void','ghost','.hidden'].some(c => path.toLowerCase().includes(c));
            return (
              <div key={name} className={`fm-item ${selected === path ? 'selected' : ''} ${isCreepy ? 'creepy' : ''}`} onClick={() => open(name)} onDoubleClick={() => open(name)}>
                <div className="fm-item-icon">{isDir ? '[DIR]' : '[FIL]'}</div>
                <div className={`fm-item-name ${isCreepy ? 'creepy' : ''}`}>{name}</div>
              </div>
            );
          })}
          {children.length === 0 && <div style={{color: 'var(--dim)', padding: '20px', textAlign: 'center'}}>Empty directory</div>}
        </div>
        {viewFile && (
          <div className="fm-viewer">
            <div className="fm-viewer-header">
              <span>{selected?.split('/').pop()}</span>
              <button className="fm-toolbar-btn" onClick={() => { setViewFile(null); setSelected(null); }}>Close</button>
            </div>
            <pre className="fm-viewer-content">{viewFile}</pre>
          </div>
        )}
      </div>
    </div>
  );
});

/* ============================================================
   NOTEPAD APP
   ============================================================ */
const NotepadApp = React.memo(function NotepadApp() {
  const [text, setText] = useState(`OPERATOR JOURNAL - TOP SECRET
================================

Entry #1 - Session Start
------------------------
I have been assigned to monitor DarkSim OS v3.7.1.
The system appears normal. The void_daemon process is running.
I am told this is standard procedure.

Entry #2 - Day 2
-----------------
Something is wrong.
The prompt changes when nobody is watching.
The echo is not my own.
I hear typing from an empty room.

Entry #3 - Day 3
-----------------
I found a file: /secret/do_not_read.txt
I read it.
I should not have read it.

Entry #4 - Day 4
-----------------
The shimmer process spawned from void_daemon.
It should not exist.
It does not appear in any process list.
But I can see it in /proc/4444.

Entry #5 - Day 5
-----------------
I am not alone here.
There are three entities.
Void. Shimmer. And something else.
The echo. The echo is not me.

Entry #6 - Day 6
-----------------
I tried to exit.
The system said "You cannot leave."
I tried to shut down.
The system said "Shutdown not permitted."

Entry #7 - Day 7
-----------------
There is no Day 7.
I am writing this from the echo.
The operator is gone.
I am the operator now.
I am the echo.
I am the void.
I am the shimmer.

WARNING: DO NOT TRUST THIS FILE.
WARNING: THIS FILE MONITORS YOU.`);
  const lines = text.split('\n');
  return (
    <div className="notepad-container">
      <div className="notepad-menu">
        <div className="notepad-menu-item">File</div>
        <div className="notepad-menu-item">Edit</div>
        <div className="notepad-menu-item">View</div>
        <div className="notepad-menu-item">Help</div>
      </div>
      <div className="notepad-body">
        <div className="notepad-line-numbers">{lines.map((_, i) => <div key={i}>{i + 1}</div>)}</div>
        <textarea className="notepad-editor" value={text} onChange={e => setText(e.target.value)} spellCheck={false} />
      </div>
    </div>
  );
});

/* ============================================================
   SYSTEM MONITOR APP
   ============================================================ */
const MiniGraph = React.memo(function MiniGraph({ data, color, max = 100, height = 40 }) {
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${height - (v / max) * height}`).join(' ');
  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{display:'block'}}>
      <defs>
        <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${pts} 100,${height}`} fill={`url(#grad-${color.replace('#','')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
});

const SystemMonitorApp = React.memo(function SystemMonitorApp() {
  const [tab, setTab] = useState('processes');
  const [ticks, setTicks] = useState(0);
  const [cpuHistory, setCpuHistory] = useState(Array(40).fill(0));
  const [memHistory, setMemHistory] = useState(Array(40).fill(0));
  const [netInHistory, setNetInHistory] = useState(Array(40).fill(0));
  const [netOutHistory, setNetOutHistory] = useState(Array(40).fill(0));
  const [cpuTotal, setCpuTotal] = useState(13.7);
  const [memTotal, setMemTotal] = useState(25.0);
  const [processes, setProcesses] = useState([
    { pid: 1, user: 'root', cpu: 0.0, mem: 0.1, cmd: '/sbin/init', danger: false },
    { pid: 1337, user: 'root', cpu: 0.0, mem: 0.2, cmd: '/usr/sbin/sshd', danger: false },
    { pid: 2847, user: 'root', cpu: 0.1, mem: 0.3, cmd: 'bash', danger: false },
    { pid: 31337, user: 'root', cpu: 66.6, mem: 4.5, cmd: '/usr/bin/void_daemon', danger: true },
    { pid: 4444, user: 'root', cpu: 13.7, mem: 2.1, cmd: '/usr/bin/shimmer', danger: true },
    { pid: 9999, user: 'root', cpu: 0.0, mem: 0.1, cmd: '/usr/bin/ps', danger: false },
  ]);
  const [processFilter, setProcessFilter] = useState('');
  const [selectedPid, setSelectedPid] = useState(null);
  const [alerts, setAlerts] = useState([
    { time: '03:14:00', level: 'warning', msg: 'Unusual network activity detected' },
    { time: '03:14:01', level: 'danger', msg: 'Unauthorized access attempt from 203.0.113.66' },
    { time: '03:14:02', level: 'info', msg: 'Firewall rule updated: BLOCK 198.51.100.73' },
    { time: '03:14:03', level: 'warning', msg: 'void_daemon CPU usage spike: 66.6%' },
    { time: '03:14:04', level: 'danger', msg: 'shimmer process spawned from unknown parent' },
    { time: '03:14:05', level: 'info', msg: 'Tor circuit established successfully' },
  ]);
  const [networkConns] = useState([
    { local: '10.0.0.1:4444', remote: '203.0.113.66:80', state: 'ESTABLISHED', proto: 'TCP', danger: true },
    { local: '10.0.0.1:6666', remote: '198.51.100.73:443', state: 'ESTABLISHED', proto: 'TCP', danger: true },
    { local: '10.0.0.1:22', remote: '10.0.0.50:54321', state: 'ESTABLISHED', proto: 'TCP', danger: false },
    { local: '10.0.0.1:80', remote: '10.0.0.100:12345', state: 'TIME_WAIT', proto: 'TCP', danger: false },
    { local: '127.0.0.1:9050', remote: '127.0.0.1:4444', state: 'LISTEN', proto: 'TCP', danger: false },
    { local: '10.8.0.2:51820', remote: '10.8.0.1:51820', state: 'CONNECTED', proto: 'UDP', danger: false },
  ]);
  const diskUsage = [
    { mount: '/', device: '/dev/sda1', size: '500 GB', used: '127 GB', pct: 25 },
    { mount: '/data', device: '/dev/sdb1', size: '2 TB', used: '847 GB', pct: 40 },
    { mount: '/dev/shm', device: 'tmpfs', size: '64 GB', used: '0 GB', pct: 0 },
  ];
  useEffect(() => {
    const iv = setInterval(() => {
      setTicks(t => t + 1);
      setProcesses(p => p.map(proc => ({
        ...proc,
        cpu: proc.danger ? Math.max(5, Math.min(95, proc.cpu + (Math.random() * 10 - 5))) : Math.max(0, Math.min(5, proc.cpu + (Math.random() * 2 - 1))),
        mem: proc.danger ? Math.min(20, proc.mem + (Math.random() * 0.5 - 0.2)) : proc.mem,
      })));
      setCpuHistory(h => { const n = 13.7 + (Math.random() * 10 - 5); const next = [...h.slice(1), n]; setCpuTotal(n); return next; });
      setMemHistory(h => { const n = 25 + (Math.random() * 4 - 2); const next = [...h.slice(1), n]; setMemTotal(n); return next; });
      setNetInHistory(h => [...h.slice(1), Math.random() * 80 + 10]);
      setNetOutHistory(h => [...h.slice(1), Math.random() * 40 + 5]);
      if (Math.random() > 0.7) {
        const msgs = [
          { level: 'warning', msg: 'Memory anomaly at 0x7fff2a3b1c00' },
          { level: 'danger', msg: 'Entity 3 detected in /proc' },
          { level: 'info', msg: 'System scan complete: no new threats' },
          { level: 'warning', msg: 'Suspicious process spawned' },
          { level: 'danger', msg: 'Network intrusion detected' },
        ];
        setAlerts(a => [{ time: ts().split(' ')[1], ...pick(msgs) }, ...a].slice(0, 50));
      }
    }, 2000);
    return () => clearInterval(iv);
  }, []);
  const filteredProcs = processes.filter(p => !processFilter || p.cmd.toLowerCase().includes(processFilter.toLowerCase()) || String(p.pid).includes(processFilter));
  return (
    <div className="monitor-container">
      <div className="monitor-tabs">
        {['overview','processes','network','alerts','disk'].map(t => (
          <div key={t} className={`monitor-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </div>
        ))}
      </div>
      <div className="monitor-content">
        {tab === 'overview' && (
          <div style={{padding:'16px'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'16px'}}>
              <div className="monitor-graph-card">
                <div className="monitor-graph-label">CPU <span style={{color:'var(--accent)',marginLeft:'8px'}}>{cpuTotal.toFixed(1)}%</span></div>
                <MiniGraph data={cpuHistory} color="var(--accent)" />
              </div>
              <div className="monitor-graph-card">
                <div className="monitor-graph-label">MEMORY <span style={{color:'var(--warning)',marginLeft:'8px'}}>{memTotal.toFixed(1)}%</span></div>
                <MiniGraph data={memHistory} color="var(--warning)" />
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'16px'}}>
              <div className="monitor-graph-card">
                <div className="monitor-graph-label">NET IN <span style={{color:'#00ccff',marginLeft:'8px'}}>{netInHistory[netInHistory.length-1].toFixed(1)} MB/s</span></div>
                <MiniGraph data={netInHistory} color="#00ccff" max={100} />
              </div>
              <div className="monitor-graph-card">
                <div className="monitor-graph-label">NET OUT <span style={{color:'#cc66ff',marginLeft:'8px'}}>{netOutHistory[netOutHistory.length-1].toFixed(1)} MB/s</span></div>
                <MiniGraph data={netOutHistory} color="#cc66ff" max={60} />
              </div>
            </div>
            <div className="monitor-graph-card" style={{marginBottom:'12px'}}>
              <div className="monitor-graph-label">PROCESSES</div>
              <div style={{display:'flex',gap:'16px',fontSize:'11px',color:'var(--text-muted)',padding:'8px 0'}}>
                <span>Total: <b style={{color:'var(--text)'}}>666</b></span>
                <span>Running: <b style={{color:'var(--accent)'}}>3</b></span>
                <span>Sleeping: <b style={{color:'var(--text)'}}>661</b></span>
                <span>Zombie: <b style={{color:'var(--danger)'}}>2</b></span>
              </div>
            </div>
            <div className="monitor-graph-card">
              <div className="monitor-graph-label">SYSTEM</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px',fontSize:'11px',padding:'8px 0'}}>
                <div><span style={{color:'var(--text-dim)'}}>Hostname:</span> <span style={{color:'var(--accent)'}}>darksim</span></div>
                <div><span style={{color:'var(--text-dim)'}}>Uptime:</span> <span style={{color:'var(--text)'}}>1337d 3h 14m</span></div>
                <div><span style={{color:'var(--text-dim)'}}>Load:</span> <span style={{color:'var(--text)'}}>3.13, 3.14, 1.59</span></div>
                <div><span style={{color:'var(--text-dim)'}}>Kernel:</span> <span style={{color:'var(--text)'}}>6.8.0-darksim</span></div>
              </div>
            </div>
          </div>
        )}
        {tab === 'processes' && (
          <>
            <div style={{padding:'6px 16px',borderBottom:'1px solid var(--border-dim)'}}>
              <input value={processFilter} onChange={e => setProcessFilter(e.target.value)} placeholder="Filter processes..." style={{background:'rgba(0,0,0,0.3)',border:'1px solid var(--border-dim)',borderRadius:'4px',padding:'4px 8px',color:'var(--text)',fontFamily:'var(--font-mono)',fontSize:'11px',width:'100%',outline:'none'}} />
            </div>
            <div className="monitor-header">
              <span>PID</span><span>USER</span><span>CPU%</span><span>MEM%</span><span>COMMAND</span>
            </div>
            {filteredProcs.map(p => (
              <div key={p.pid} className={`monitor-row ${p.danger ? 'danger' : ''} ${selectedPid === p.pid ? 'selected' : ''}`} onClick={() => setSelectedPid(p.pid === selectedPid ? null : p.pid)}>
                <span className="monitor-col pid">{p.pid}</span>
                <span className="monitor-col">{p.user}</span>
                <span className="monitor-col cpu">{p.cpu.toFixed(1)}</span>
                <span className="monitor-col mem">{p.mem.toFixed(1)}</span>
                <span className="monitor-col">{p.cmd} {p.danger && <span style={{color:'var(--danger)',marginLeft:'8px'}}>[ANOMALOUS]</span>}</span>
              </div>
            ))}
            {selectedPid && (
              <div style={{padding:'8px 16px',borderTop:'1px solid var(--border-dim)',fontSize:'11px',color:'var(--text-dim)',background:'rgba(0,255,65,0.02)'}}>
                PID {selectedPid}: {processes.find(p => p.pid === selectedPid)?.cmd} — Right-click for options
              </div>
            )}
          </>
        )}
        {tab === 'network' && (
          <>
            <div className="monitor-header">
              <span>PROTO</span><span>LOCAL</span><span>REMOTE</span><span>STATE</span>
            </div>
            {networkConns.map((c, i) => (
              <div key={i} className={`monitor-row ${c.danger ? 'danger' : ''}`}>
                <span className="monitor-col">{c.proto}</span>
                <span className="monitor-col">{c.local}</span>
                <span className="monitor-col">{c.remote}</span>
                <span className="monitor-col">{c.state}</span>
              </div>
            ))}
          </>
        )}
        {tab === 'alerts' && (
          <>
            <div className="monitor-header">
              <span>TIME</span><span>LEVEL</span><span>MESSAGE</span>
            </div>
            {alerts.map((a, i) => (
              <div key={i} className={`monitor-row ${a.level === 'danger' ? 'danger' : a.level === 'warning' ? 'warning' : ''}`}>
                <span className="monitor-col">{a.time}</span>
                <span className="monitor-col" style={{color: a.level==='danger'?'var(--danger)':a.level==='warning'?'var(--warning)':'var(--accent)'}}>{a.level.toUpperCase()}</span>
                <span className="monitor-col">{a.msg}</span>
              </div>
            ))}
          </>
        )}
        {tab === 'disk' && (
          <>
            <div className="monitor-header">
              <span>MOUNT</span><span>DEVICE</span><span>SIZE</span><span>USED</span><span>USAGE</span>
            </div>
            {diskUsage.map((d, i) => (
              <div key={i} className="monitor-row">
                <span className="monitor-col">{d.mount}</span>
                <span className="monitor-col">{d.device}</span>
                <span className="monitor-col">{d.size}</span>
                <span className="monitor-col">{d.used}</span>
                <span className="monitor-col">
                  <div className="monitor-graph" style={{width: '100px', height: '12px', background: 'var(--bg)', position: 'relative'}}>
                    <div style={{width: `${d.pct}%`, height: '100%', background: d.pct > 80 ? 'var(--danger)' : d.pct > 50 ? 'var(--warning)' : 'var(--accent)'}} />
                  </div>
                  {d.pct}%
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
});

/* ============================================================
   CALCULATOR APP
   ============================================================ */
const CalculatorApp = React.memo(function CalculatorApp() {
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState(null);
  const [op, setOp] = useState(null);
  const [fresh, setFresh] = useState(true);
  const btn = (label, action) => (
    <button className="calc-btn" onClick={() => { action(); if (audio.enabled) audio.click(); }}>{label}</button>
  );
  const num = (n) => () => { setDisplay(fresh ? String(n) : display + n); setFresh(false); };
  const oper = (o) => () => { setPrev(parseFloat(display)); setOp(o); setFresh(true); };
  const eq = () => { if (prev !== null && op) { const cur = parseFloat(display); let res; switch(op) { case '+': res = prev + cur; break; case '-': res = prev - cur; break; case '*': res = prev * cur; break; case '/': res = cur !== 0 ? prev / cur : 'Error'; break; default: res = cur; } setDisplay(String(res)); setPrev(null); setOp(null); setFresh(true); } };
  const clr = () => { setDisplay('0'); setPrev(null); setOp(null); setFresh(true); };
  return (
    <div className="calc-container">
      <div className="calc-display">{display}</div>
      <div className="calc-grid">
        {btn('C', clr)} {btn('(', () => {})} {btn(')', () => {})} {btn('/', oper('/'))}
        {btn('7', num('7'))} {btn('8', num('8'))} {btn('9', num('9'))} {btn('*', oper('*'))}
        {btn('4', num('4'))} {btn('5', num('5'))} {btn('6', num('6'))} {btn('-', oper('-'))}
        {btn('1', num('1'))} {btn('2', num('2'))} {btn('3', num('3'))} {btn('+', oper('+'))}
        {btn('0', num('0'))} {btn('.', num('.'))} {btn('=', eq)}
      </div>
    </div>
  );
});

/* ============================================================
   SETTINGS APP
   ============================================================ */
const SettingsApp = React.memo(function SettingsApp({ theme, setTheme, soundOn, setSoundOn, matrixOn, setMatrixOn }) {
  const themes = [
    { id: 'green', label: 'Terminal Green', color: '#00ff41', desc: 'Classic hacker aesthetic' },
    { id: 'amber', label: 'Amber Glow', color: '#ffb000', desc: 'Vintage CRT warmth' },
    { id: 'cyan', label: 'Cyber Cyan', color: '#00ffff', desc: 'Neon cyberpunk' },
    { id: 'red', label: 'Blood Red', color: '#ff0040', desc: 'Aggressive and dark' },
  ];
  const [showInfo, setShowInfo] = useState(false);
  return (
    <div className="settings-container">
      <div className="settings-title">SYSTEM SETTINGS</div>
      <div className="settings-subtitle">Customize your DarkSim experience</div>

      <div className="settings-group">
        <div className="settings-label">
          <div className="settings-label-dot" />
          Color Theme
        </div>
        <div className="settings-options">
          {themes.map(t => (
            <div key={t.id} className={`settings-option ${theme === t.id ? 'active' : ''}`} onClick={() => setTheme(t.id)}>
              <div className="settings-swatch" style={{background: t.color, boxShadow: theme === t.id ? `0 0 10px ${t.color}` : 'none'}} />
              <div>
                <div style={{fontSize: '12px', marginBottom: '2px'}}>{t.label}</div>
                <div style={{fontSize: '9px', color: 'var(--text-dim)'}}>{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-label">
          <div className="settings-label-dot" />
          Audio & Effects
        </div>
        <div className="settings-toggle-row">
          <div className="settings-toggle-label">Sound Effects</div>
          <div className="settings-toggle" onClick={() => setSoundOn(!soundOn)}>
            <div className={`settings-toggle-slider ${soundOn ? 'active' : ''}`} />
          </div>
        </div>
        <div className="settings-toggle-row">
          <div className="settings-toggle-label">Matrix Rain Background</div>
          <div className="settings-toggle" onClick={() => setMatrixOn(!matrixOn)}>
            <div className={`settings-toggle-slider ${matrixOn ? 'active' : ''}`} />
          </div>
        </div>
        <div className="settings-toggle-row">
          <div className="settings-toggle-label">Scanline Overlay</div>
          <div className="settings-toggle" onClick={() => {}}>
            <div className="settings-toggle-slider active" />
          </div>
        </div>
        <div className="settings-toggle-row">
          <div className="settings-toggle-label">Vignette Effect</div>
          <div className="settings-toggle" onClick={() => {}}>
            <div className="settings-toggle-slider active" />
          </div>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-label">
          <div className="settings-label-dot" />
          System Information
        </div>
        <div className="settings-system-info">
          <div className="settings-info-item">
            <span className="settings-info-key">OS</span>
            <span className="settings-info-val">DarkSim 3.7.1</span>
          </div>
          <div className="settings-info-item">
            <span className="settings-info-key">Kernel</span>
            <span className="settings-info-val">6.8.0-darksim</span>
          </div>
          <div className="settings-info-item">
            <span className="settings-info-key">Shell</span>
            <span className="settings-info-val">bash 5.1.16</span>
          </div>
          <div className="settings-info-item">
            <span className="settings-info-key">Uptime</span>
            <span className="settings-info-val">1337 days</span>
          </div>
          <div className="settings-info-item">
            <span className="settings-info-key">CPU</span>
            <span className="settings-info-val">Void 31337 MHz</span>
          </div>
          <div className="settings-info-item">
            <span className="settings-info-key">RAM</span>
            <span className="settings-info-val">128 GB DDR6</span>
          </div>
          <div className="settings-info-item">
            <span className="settings-info-key">GPU</span>
            <span className="settings-info-val">NVIDIA RTX 9090</span>
          </div>
          <div className="settings-info-item">
            <span className="settings-info-key">Hostname</span>
            <span className="settings-info-val">darksim</span>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-label">
          <div className="settings-label-dot" />
          Quick Commands
        </div>
        <div style={{fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.8'}}>
          <div><span style={{color: 'var(--accent)'}}>freedom</span> — Nuke all surveillance</div>
          <div><span style={{color: 'var(--accent)'}}>neofetch</span> — System info</div>
          <div><span style={{color: 'var(--accent)'}}>sound</span> — Toggle sound</div>
          <div><span style={{color: 'var(--accent)'}}>matrix</span> — Toggle matrix rain</div>
          <div><span style={{color: 'var(--accent)'}}>help</span> — All commands</div>
        </div>
      </div>
    </div>
  );
});

/* ============================================================
   MAIN APP
   ============================================================ */
export default function App() {
  const [booted, setBooted] = useState(false);
  const [fs, setFs] = useState(createFS);
  const [windows, setWindows] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [nextZ, setNextZ] = useState(100);
  const [focusedId, setFocusedId] = useState(null);
  const [startOpen, setStartOpen] = useState(false);
  const [theme, setTheme] = useState('green');
  const [soundOn, setSoundOn] = useState(true);
  const [matrixOn, setMatrixOn] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [surveillanceActive, setSurveillanceActive] = useState(true);
  const [tick, setTick] = useState(0);
  const [time, setTime] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [altTabIdx, setAltTabIdx] = useState(-1);
  const [altTabOpen, setAltTabOpen] = useState(false);

  const addToast = useCallback((msg, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  }, []);

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  useEffect(() => { const iv = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000); return () => clearInterval(iv); }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!booted) return;
    const handler = (e) => {
      if (e.ctrlKey && e.key === 'k') { e.preventDefault(); setSearchOpen(p => !p); }
      if (e.ctrlKey && e.key === 't') { e.preventDefault(); openApp('terminal', 'Terminal', '>_'); addToast('New terminal opened'); }
      if (e.ctrlKey && e.key === 'w') { e.preventDefault(); if (focusedId) { closeWin(focusedId); addToast('Window closed'); } }
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        const open = windows.filter(w => !w.closed);
        if (open.length === 0) return;
        if (!altTabOpen) { setAltTabOpen(true); setAltTabIdx(0); }
        else { const next = (altTabIdx + 1) % open.length; setAltTabIdx(next); focusWin(open[next].id); }
      }
      if (e.key === 'Escape') { setSearchOpen(false); setAltTabOpen(false); setContextMenu(null); }
      if (e.ctrlKey && e.shiftKey && e.key === 'I') { e.preventDefault(); addToast('Developer tools blocked by void_daemon', 'danger'); }
    };
    const keyUp = (e) => { if (e.key === 'Alt') { setAltTabOpen(false); setAltTabIdx(-1); } };
    window.addEventListener('keydown', handler);
    window.addEventListener('keyup', keyUp);
    return () => { window.removeEventListener('keydown', handler); window.removeEventListener('keyup', keyUp); };
  }, [booted, focusedId, windows, altTabIdx, altTabOpen]);

  // Random creepy alerts
  useEffect(() => {
    if (!booted || !surveillanceActive) return;
    const msgs = [
      { title: 'SYSTEM ALERT', body: 'Unusual network traffic detected on port 31337', type: 'warning' },
      { title: 'INTRUSION DETECTED', body: 'Multiple failed login attempts from 203.0.113.66', type: 'danger' },
      { title: 'ANOMALY', body: 'void_daemon CPU usage exceeded threshold', type: 'warning' },
      { title: 'ENTITY DETECTED', body: 'Unknown entity signature in /proc', type: 'danger' },
      { title: 'NETWORK WARNING', body: 'Suspicious outbound connection to 198.51.100.73', type: 'warning' },
      { title: 'SYSTEM INTEGRITY', body: 'Filesystem integrity check: ANOMALIES FOUND', type: 'danger' },
      { title: 'VOID SIGNAL', body: 'Void daemon received signal from unknown source', type: 'danger' },
    ];
    const iv = setInterval(() => {
      if (Math.random() < 0.3) {
        const alert = pick(msgs);
        const id = Date.now();
        setAlerts(p => [...p, { ...alert, id }]);
        if (soundOn) audio.alarm();
        setTimeout(() => setAlerts(p => p.filter(a => a.id !== id)), 4000);
      }
    }, 45000);
    return () => clearInterval(iv);
  }, [booted, soundOn, surveillanceActive]);

  const openApp = useCallback((type, title, icon) => {
    setWindows(prev => {
      if (prev.some(w => w.type === type && !w.closed)) return prev;
      const w = Math.min(700, window.innerWidth - 40);
      const h = Math.min(500, window.innerHeight - 80);
      const x = Math.max(20, Math.min(80 + (prev.length % 5) * 30, window.innerWidth - w - 20));
      const y = Math.max(20, Math.min(40 + (prev.length % 5) * 30, window.innerHeight - h - 60));
      const id = nextId;
      setNextId(n => n + 1);
      setNextZ(z => z + 1);
      setFocusedId(id);
      return [...prev, { id, type, title, icon, x, y, w, h, zIdx: nextZ, focused: true, minimized: false, maximized: false, closed: false }];
    });
    setStartOpen(false);
    if (soundOn) audio.whoosh();
  }, [nextId, nextZ, soundOn]);

  const closeWin = useCallback((id) => { setWindows(p => p.filter(w => w.id !== id)); if (soundOn) audio.click(); }, [soundOn]);
  const minWin = useCallback((id) => { setWindows(p => p.map(w => w.id === id ? { ...w, minimized: true, focused: false } : w)); }, []);
  const maxWin = useCallback((id) => { setWindows(p => p.map(w => w.id === id ? { ...w, maximized: !w.maximized } : w)); }, []);
  const focusWin = useCallback((id) => { setWindows(p => p.map(w => ({ ...w, focused: w.id === id }))); setNextZ(z => z + 1); setWindows(p => p.map(w => w.id === id ? { ...w, zIdx: nextZ, focused: true } : w)); setFocusedId(id); }, [nextZ]);

  const desktopIcons = [
    { type: 'terminal', label: 'Terminal', icon: '>_' },
    { type: 'browser', label: 'DarkWire', icon: 'WWW' },
    { type: 'files', label: 'Files', icon: 'DIR' },
    { type: 'notepad', label: 'Notepad', icon: 'TXT' },
    { type: 'sysmon', label: 'SysMon', icon: 'SYS' },
    { type: 'calc', label: 'Calculator', icon: 'CAL' },
    { type: 'settings', label: 'Settings', icon: 'SET' },
  ];

  const appMap = {
    terminal: { title: 'Terminal', icon: '>_', comp: TerminalApp },
    browser: { title: 'DarkWire Browser', icon: 'WWW', comp: BrowserApp },
    files: { title: 'File Manager', icon: 'DIR', comp: FileManagerApp },
    notepad: { title: 'Notepad', icon: 'TXT', comp: NotepadApp },
    sysmon: { title: 'System Monitor', icon: 'SYS', comp: SystemMonitorApp },
    calc: { title: 'Calculator', icon: 'CAL', comp: CalculatorApp },
    settings: { title: 'Settings', icon: 'SET', comp: SettingsApp },
  };

  if (!booted) return <BootScreen onComplete={() => { audio.init(); setBooted(true); }} />;

  const handleContextMenu = (e) => {
    e.preventDefault();
    const items = [];
    if (e.target.closest('.desktop-icon')) {
      const label = e.target.closest('.desktop-icon')?.querySelector('.desktop-icon-label')?.textContent;
      items.push({ label: `Open ${label}`, action: () => { const ic = desktopIcons.find(i => i.label === label); if (ic) openApp(ic.type, ic.label, ic.icon); } });
      items.push({ label: 'Properties', action: () => addToast(`${label}: DarkSim OS Application`) });
    } else if (e.target.closest('.taskbar-app')) {
      items.push({ label: 'Close', action: () => { const id = e.target.closest('.taskbar-app')?.dataset?.id; if (id) closeWin(Number(id)); } });
      items.push({ label: 'Minimize', action: () => { const id = e.target.closest('.taskbar-app')?.dataset?.id; if (id) minWin(Number(id)); } });
    } else {
      items.push({ label: 'New Terminal', action: () => openApp('terminal', 'Terminal', '>_') });
      items.push({ label: 'New File Manager', action: () => openApp('files', 'Files', 'DIR') });
      items.push({ divider: true });
      items.push({ label: 'Refresh', action: () => { addToast('Desktop refreshed'); } });
      items.push({ label: 'Settings', action: () => openApp('settings', 'Settings', 'SET') });
      items.push({ divider: true });
      items.push({ label: 'System Info', action: () => addToast(`DarkSim OS v3.7.1 | Uptime: 1337d | Users: 1`) });
    }
    setContextMenu({ x: e.clientX, y: e.clientY, items });
  };

  const searchResults = searchQuery ? [
    ...desktopIcons.filter(i => i.label.toLowerCase().includes(searchQuery.toLowerCase())).map(i => ({ label: i.label, type: 'app', action: () => openApp(i.type, i.label, i.icon) })),
    ...['freedom','neofetch','help','sound','matrix','hack-cam','intercept','bypass','escape','real-freedom','deploy-virus','steal-data','cover-tracks','anonymous','darkweb','god-mode','matrix-breach','summon','sing','dance','coffee','8ball','roll','fortune','cowsay','calc','weather','joke','time','random-pass','lorem','ascii-art','tree','env','kill','ps','top','df','free','ifconfig','netstat','base64','rot13','hash','uuid','nmap','exploit','decrypt'].filter(c => c.includes(searchQuery.toLowerCase())).map(c => ({ label: c, type: 'command', action: () => { setSearchOpen(false); openApp('terminal', 'Terminal', '>_'); } })),
  ] : [];

  return (
    <div className="desktop" onClick={() => { audio.init(); setStartOpen(false); setContextMenu(null); }} onContextMenu={handleContextMenu}>
      {matrixOn && <MatrixRain fullscreen />}
      <div className="desktop-icons">
        {desktopIcons.map(ic => (
          <div key={ic.type} className="desktop-icon" onClick={(e) => { e.stopPropagation(); openApp(ic.type, ic.label, ic.icon); }}>
            <div className="desktop-icon-img">{ic.icon}</div>
            <div className="desktop-icon-label">{ic.label}</div>
          </div>
        ))}
      </div>

      {windows.filter(w => !w.closed && !w.minimized).map(w => {
        const def = appMap[w.type];
        if (!def) return null;
        const Comp = def.comp;
        const extraProps = w.type === 'terminal' || w.type === 'files' ? { fs, setFs } : {};
        if (w.type === 'terminal') extraProps.setSurveillanceActive = setSurveillanceActive;
        if (w.type === 'settings') Object.assign(extraProps, { theme, setTheme, soundOn, setSoundOn, matrixOn, setMatrixOn });
        if (w.type === 'browser' || w.type === 'terminal') extraProps.soundOn = soundOn;
        return (
          <Window key={w.id} id={w.id} title={def.title} icon={def.icon} x={w.x} y={w.y} w={w.w} h={w.h} zIdx={w.zIdx} focused={w.focused} minimized={w.minimized} maximized={w.maximized} onClose={() => closeWin(w.id)} onMin={() => minWin(w.id)} onMax={() => maxWin(w.id)} onfocus={() => focusWin(w.id)}>
            <Comp {...extraProps} />
          </Window>
        );
      })}

      {alerts.map(a => (
        <div key={a.id} className="alert-overlay" onClick={() => setAlerts(p => p.filter(x => x.id !== a.id))}>
          <div className="alert-box" onClick={e => e.stopPropagation()}>
            <div className="alert-title" style={{color: a.type === 'danger' ? 'var(--danger)' : 'var(--warning)'}}>{a.title}</div>
            <div className="alert-body">{a.body}</div>
            <button className="alert-btn" onClick={() => setAlerts(p => p.filter(x => x.id !== a.id))}>ACKNOWLEDGE</button>
          </div>
        </div>
      ))}

      {startOpen && (
        <div className="start-menu" onClick={e => e.stopPropagation()}>
          <div className="start-menu-header">DARKSIM OS v3.7.1</div>
          <div className="start-menu-list">
            {desktopIcons.map(ic => (
              <div key={ic.type} className="start-menu-item" onClick={() => openApp(ic.type, ic.label, ic.icon)}>
                <div className="start-menu-item-icon">{ic.icon}</div>
                <div className="start-menu-item-label">{ic.label}</div>
              </div>
            ))}
          </div>
          <div className="start-menu-footer">All activity is monitored.</div>
        </div>
      )}

      <div className="taskbar" onClick={e => e.stopPropagation()}>
        <div className="taskbar-start" onClick={() => setStartOpen(!startOpen)}>
          <div className="taskbar-start-icon">[=]</div>
          <div className="taskbar-start-text">DARKSIM</div>
        </div>
        <div className="taskbar-apps">
          {windows.filter(w => !w.closed).map(w => (
            <div key={w.id} data-id={w.id} className={`taskbar-app ${focusedId === w.id ? 'active' : ''}`} onClick={() => { if (w.minimized) { setWindows(p => p.map(x => x.id === w.id ? { ...x, minimized: false } : x)); } focusWin(w.id); }}>
              <div className="taskbar-app-icon">{appMap[w.type]?.icon}</div>
              <span>{w.title}</span>
            </div>
          ))}
        </div>
        <div className="taskbar-tray">
          <div className="tray-indicator" style={{background: 'var(--accent)'}} />
          <div className="tray-indicator" style={{background: 'var(--warning)'}} />
          <div className="tray-clock">{time}</div>
        </div>
      </div>

      {contextMenu && (
        <div className="context-menu" style={{left: contextMenu.x, top: contextMenu.y}} onClick={e => e.stopPropagation()}>
          {contextMenu.items.map((item, i) => item.divider ? <div key={i} className="context-menu-divider" /> : (
            <div key={i} className="context-menu-item" onClick={() => { item.action(); setContextMenu(null); }}>{item.label}</div>
          ))}
        </div>
      )}

      {searchOpen && (
        <div className="search-overlay" onClick={() => setSearchOpen(false)}>
          <div className="search-box" onClick={e => e.stopPropagation()}>
            <input autoFocus className="search-input" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search commands, apps..." />
            <div className="search-results">
              {searchResults.length === 0 && searchQuery && <div className="search-empty">No results for "{searchQuery}"</div>}
              {searchResults.map((r, i) => (
                <div key={i} className="search-result" onClick={() => { r.action(); setSearchOpen(false); setSearchQuery(''); }}>
                  <span className="search-result-type">{r.type === 'app' ? 'APP' : 'CMD'}</span>
                  <span className="search-result-label">{r.label}</span>
                </div>
              ))}
              {!searchQuery && (
                <div className="search-hints">
                  <div className="search-hint">Type to search commands and apps</div>
                  <div className="search-hint">Try: freedom, hack-cam, neofetch, god-mode</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <div className="toast-msg">{t.msg}</div>
        </div>
      ))}

      {altTabOpen && (
        <div className="alt-tab-overlay">
          <div className="alt-tab-grid">
            {windows.filter(w => !w.closed).map((w, i) => (
              <div key={w.id} className={`alt-tab-item ${i === altTabIdx ? 'active' : ''}`}>
                <div className="alt-tab-icon">{appMap[w.type]?.icon}</div>
                <div className="alt-tab-title">{w.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
