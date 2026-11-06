'use strict';
/* =========================================================
   NEON ARCADE 공용 유틸 (브레이커 · 대시 · 런처)
   ========================================================= */
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const easeInCubic = t => t * t * t;
const easeOutBack = t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const easeOutElastic = t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * (TAU / 3)) + 1;
const easeOutBounce = t => {
  const n = 7.5625, d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375;
  return n * (t -= 2.625 / d) * t + .984375;
};

const FONT = '"Orbitron","Segoe UI","Malgun Gothic",sans-serif';
const KFONT = '"Malgun Gothic","Apple SD Gothic Neo","Segoe UI",sans-serif';
const CY = [80, 220, 255], PK = [255, 70, 160], OR = [255, 140, 40], YE = [255, 225, 90],
      PU = [175, 95, 255], GR = [90, 255, 150], RD = [255, 55, 70], WH = [255, 255, 255], BL = [80, 120, 255];
const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

// 글로우 스프라이트 (shadowBlur 대신 사용 → 빠름)
const glowCache = {};
function glow(c) {
  const k = c.join();
  if (glowCache[k]) return glowCache[k];
  const g = document.createElement('canvas'); g.width = g.height = 64;
  const x = g.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(.18, rgb(c, 1));
  gr.addColorStop(.45, rgb(c, .35));
  gr.addColorStop(1, rgb(c, 0));
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  return glowCache[k] = g;
}

/* ---------------- 캔버스 ---------------- */
let cvs = null, ctx = null, W = 0, H = 0, K = 1;
function initCanvas(w, h) {
  W = w; H = h; cvs = document.getElementById('c'); ctx = cvs.getContext('2d');
  addEventListener('resize', resizeCanvas); resizeCanvas();
}
function resizeCanvas() {
  const s = Math.min(innerWidth / W, innerHeight / H), d = Math.min(devicePixelRatio || 1, 2);
  cvs.style.width = W * s + 'px'; cvs.style.height = H * s + 'px';
  cvs.width = Math.round(W * s * d); cvs.height = Math.round(H * s * d);
  K = cvs.width / W;
}
function toGame(e) { const r = cvs.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
function drawGlow(c, x, y, s, a = 1) { ctx.globalAlpha = a; ctx.drawImage(glow(c), x - s, y - s, s * 2, s * 2); }
function addGlow(c, x, y, s, a = 1) {
  ctx.globalCompositeOperation = 'lighter'; drawGlow(c, x, y, s, a);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
}
function txt(s, x, y, size, c = '#fff', align = 'left', weight = 700, font = FONT) {
  ctx.font = `${weight} ${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = c; ctx.fillText(s, x, y);
}
function spacing(px) { try { ctx.letterSpacing = px + 'px'; } catch (e) { } }
let vignetteCv = null;
function drawVignette() {
  if (!vignetteCv) {
    vignetteCv = document.createElement('canvas'); vignetteCv.width = W; vignetteCv.height = H;
    const x = vignetteCv.getContext('2d'), m = Math.max(W, H), g = x.createRadialGradient(W / 2, H / 2, m * .25, W / 2, H / 2, m * .7);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.6)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
  }
  ctx.drawImage(vignetteCv, 0, 0, W, H);
}
// 글자가 하나씩 튀어나오는 로고
function drawLogo(word, cx, cy, size, t, c1 = '#fff', c2 = '#7ef0ff', c3 = '#ff4fa8', glowCol = '#4fd8ff') {
  ctx.font = `900 ${size}px ${FONT}`;
  const ws = [...word].map(ch => ctx.measureText(ch).width + 2), tw = ws.reduce((a, b) => a + b, 0);
  let x = cx - tw / 2;
  const g = ctx.createLinearGradient(0, cy - size / 2, 0, cy + size / 2);
  g.addColorStop(0, c1); g.addColorStop(.5, c2); g.addColorStop(1, c3);
  [...word].forEach((ch, i) => {
    const ti = clamp((t - i * .06) / .6, 0, 1);
    const y = cy + Math.sin(T * 3 + i * .5) * size * .09 - (1 - easeOutBack(ti)) * size * 2;
    ctx.save(); ctx.globalAlpha = ti; ctx.translate(x + ws[i] / 2, y);
    const sc = 1 + Math.max(0, Math.sin(T * 3 - i * .4)) * .08; ctx.scale(sc, sc);
    ctx.shadowColor = glowCol; ctx.shadowBlur = 25;
    ctx.fillStyle = g; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ch, 0, 0);
    ctx.restore();
    x += ws[i];
  });
}
// GAME OVER 글자가 통통 튀며 떨어짐
function drawDropWord(word, cx, cy, size, t, col = '#ff4060', glowCol = '#ff2050') {
  ctx.font = `900 ${size}px ${FONT}`;
  const ws = [...word].map(ch => ctx.measureText(ch).width + 2), tw = ws.reduce((a, b) => a + b, 0);
  let x = cx - tw / 2;
  [...word].forEach((ch, i) => {
    const ti = clamp((t - i * .07) / .7, 0, 1);
    if (ti > 0) {
      const y = cy - (1 - easeOutBounce(ti)) * 400;
      ctx.save(); ctx.translate(x + ws[i] / 2, y); ctx.rotate((1 - ti) * (i % 2 ? .6 : -.6));
      ctx.shadowColor = glowCol; ctx.shadowBlur = 25;
      ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ch, 0, 0);
      ctx.restore();
    }
    x += ws[i];
  });
}

/* ---------------- 메뉴 버튼 ---------------- */
const MENU_BTN = { x: 12, y: 12, w: 90, h: 30 };
function goMenu() { location.href = 'index.html'; }
function drawMenuBtn() {
  const b = MENU_BTN;
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(10,5,30,.7)'; ctx.strokeStyle = 'rgba(126,240,255,.7)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.rect(b.x, b.y, b.w, b.h); ctx.fill(); ctx.stroke();
  txt('◀ MENU', b.x + b.w / 2, b.y + b.h / 2 + 1, 12, '#7ef0ff', 'center', 700);
}
function hitMenuBtn(p) { const b = MENU_BTN; return p.x >= b.x && p.x <= b.x + b.w + 6 && p.y >= b.y && p.y <= b.y + b.h + 6; }

/* ---------------- 사운드 ---------------- */
let AC = null, master = null, muted = false, noiseBuf = null;
function initAudio() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = .32; master.connect(AC.destination);
  } catch (e) { AC = null; }
}
function tone(f, dur, type = 'square', vol = .2, slide = 0, delay = 0) {
  if (!AC || muted) return;
  const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .02);
}
function noise(dur, vol = .3, freq = 1500, type = 'lowpass') {
  if (!AC || muted) return;
  if (!noiseBuf) {
    noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = AC.currentTime, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = noiseBuf; f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (type === 'lowpass') f.frequency.exponentialRampToValueAtTime(60, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur);
}
function arp(freqs, step = .06, type = 'triangle', vol = .15, dur = .14) { freqs.forEach((f, i) => tone(f, dur, type, vol, 0, i * step)); }

/* ---------------- 이펙트 (파티클 · 링 · 팝업 텍스트 · 카메라) ---------------- */
let parts = [], rings = [], texts = [];
let shake = 0, flash = 0, flashCol = WH, hitstop = 0, timeScale = 1, slowT = 0;
function resetFX() { parts = []; rings = []; texts = []; shake = 0; flash = 0; hitstop = 0; timeScale = 1; slowT = 0; }
function P(o) { if (parts.length < 2200) parts.push(o); }
function sparks(x, y, n, c, s0, s1, life = .5, size = 2.5, g = 0) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU), s = rand(s0, s1), l = rand(life * .5, life);
    P({ type: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: l, max: l, c, size: rand(size * .6, size), drag: .9, g });
  }
}
function ring(x, y, r0, r1, dur, c, w = 6) { rings.push({ x, y, r0, r1, t: 0, dur, c, w }); }
function popText(x, y, text, c = WH, size = 18, dur = 1) { texts.push({ x, y, text: String(text), c, size, t: 0, dur }); }
function burst(x, y, r, c, opt = {}) {
  sparks(x, y, Math.floor(r * 1.2) + 8, c, 80, 240 + r * 8, .7, 3, opt.g || 0);
  sparks(x, y, Math.floor(r * .4) + 4, YE, 60, 180 + r * 5, .5, 2, opt.g || 0);
  for (let i = 0; i < r / 3 + 3; i++) {
    const a = rand(0, TAU), s = rand(10, r * 3.2), l = rand(.3, .6);
    P({ type: 'fire', x: x + rand(-r, r) * .3, y: y + rand(-r, r) * .3, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: l, max: l, size: rand(r * .5, r), drag: .88 });
  }
  for (let i = 0; i < r / 5 + 2; i++) {
    const a = rand(0, TAU), s = rand(30, 140), l = rand(.7, 1.4);
    P({ type: 'smoke', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, life: l, max: l, size: rand(r * .4, r * .8), drag: .93 });
  }
  P({ type: 'flash', x, y, life: .14, max: .14, size: r * 3.6 });
  ring(x, y, r * .4, r * 3, .45, c, r > 25 ? 8 : 5);
  shake = Math.max(shake, opt.shake !== undefined ? opt.shake : r * .35);
}
// 직사각형 조각 (중력)
function chips(x, y, w, h, n, c, spd = 260, g = 1100) {
  for (let i = 0; i < n; i++) {
    const l = rand(.7, 1.3);
    P({ type: 'chip', x: x + rand(-w / 2, w / 2), y: y + rand(-h / 2, h / 2), vx: rand(-spd, spd), vy: rand(-spd * 1.3, -spd * .2),
        w: rand(4, 11), h: rand(3, 8), rot: rand(0, TAU), vr: rand(-14, 14), c, life: l, max: l, g, drag: .99 });
  }
}
function updateFX(dt, rdt) {
  for (const p of parts) {
    p.life -= dt;
    const d = Math.pow(p.drag || 1, dt * 60);
    p.vx *= d; p.vy *= d;
    if (p.g) p.vy += p.g * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.rot !== undefined) p.rot += p.vr * dt;
  }
  parts = parts.filter(p => p.life > 0);
  for (const r of rings) r.t += dt;
  rings = rings.filter(r => r.t < r.dur);
  for (const t of texts) { t.t += rdt; t.y -= 45 * rdt * (1 - t.t / t.dur); }
  texts = texts.filter(t => t.t < t.dur);
  shake *= Math.pow(.004, rdt); if (shake < .2) shake = 0;
  flash = Math.max(0, flash - rdt * 1.8);
  if (slowT > 0) slowT -= rdt; else timeScale = lerp(timeScale, 1, Math.min(1, rdt * 4));
}
function drawFXBack() {
  for (const p of parts) {
    const k = p.life / p.max;
    if (p.type === 'smoke') {
      ctx.globalAlpha = k * .28; ctx.fillStyle = '#3a3050';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.6 - k * .6), 0, TAU); ctx.fill();
    } else if (p.type === 'chip') {
      ctx.globalAlpha = Math.min(1, k * 2.5);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = rgb(p.c); ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, 1.5);
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
}
function drawFXFront() {
  ctx.globalCompositeOperation = 'lighter';
  for (const p of parts) {
    const k = p.life / p.max;
    switch (p.type) {
      case 'spark':
        ctx.globalAlpha = k; ctx.strokeStyle = rgb(p.c); ctx.lineWidth = p.size * k + .5;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * .04, p.y - p.vy * .04); ctx.stroke();
        break;
      case 'fire': drawGlow(k > .6 ? YE : k > .3 ? OR : RD, p.x, p.y, p.size * (1.3 - k * .5), k * .9); break;
      case 'ember': drawGlow(p.c, p.x, p.y, p.size * k, k * .8); break;
      case 'flash': drawGlow(WH, p.x, p.y, p.size * (1.5 - k * .5), k); break;
      case 'trail': drawGlow(p.c, p.x, p.y, p.size * k, k * .6); break;
    }
  }
  for (const r of rings) {
    const k = r.t / r.dur;
    ctx.globalAlpha = 1 - k; ctx.strokeStyle = rgb(r.c); ctx.lineWidth = r.w * (1 - k) + .5;
    ctx.beginPath(); ctx.arc(r.x, r.y, lerp(r.r0, r.r1, easeOutCubic(k)), 0, TAU); ctx.stroke();
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
function drawTexts() {
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t of texts) {
    const k = t.t / t.dur;
    const s = k < .15 ? easeOutBack(k / .15) * 1.25 : lerp(1.25, 1, Math.min(1, (k - .15) * 4));
    ctx.globalAlpha = k > .7 ? 1 - (k - .7) / .3 : 1;
    ctx.save(); ctx.translate(t.x, t.y); ctx.scale(s, s);
    ctx.font = `900 ${t.size}px ${FONT}`;
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,0,30,.8)'; ctx.strokeText(t.text, 0, 0);
    ctx.fillStyle = rgb(t.c); ctx.fillText(t.text, 0, 0);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}
function drawFlash() { if (flash > 0) { ctx.fillStyle = rgb(flashCol, Math.min(.85, flash * .7)); ctx.fillRect(0, 0, W, H); } }

/* ---------------- 배너 (STAGE 1 등) ---------------- */
function drawBannerObj(b, y, col = CY) {
  if (!b || b.t < 0) return;
  const t = b.t, d = b.dur;
  let x = 0, a = 1;
  if (t < .5) x = lerp(-W, 0, easeOutBack(t / .5));
  else if (t > d - .4) { const k = (t - (d - .4)) / .4; x = lerp(0, W * 1.3, easeInCubic(k)); a = 1 - k; }
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(5,0,20,.6)'; ctx.fillRect(0, y - 48, W, 96);
  ctx.translate(x, 0);
  ctx.fillStyle = rgb(col); ctx.fillRect(0, y - 48, W, 2); ctx.fillRect(0, y + 46, W, 2);
  const sl = ((t * 700) % (W + 200)) - 100;
  ctx.globalCompositeOperation = 'lighter'; drawGlow(col, sl, y - 47, 60, .8); drawGlow(col, W - sl, y + 47, 60, .8);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = a;
  spacing(Math.max(0, 22 - t * 30) + 4);
  ctx.shadowColor = rgb(col); ctx.shadowBlur = 24;
  txt(b.text, W / 2, y - 8, 42, '#fff', 'center', 900);
  ctx.shadowBlur = 0;
  spacing(3);
  if (b.sub) txt(b.sub, W / 2, y + 28, 14, rgb(YE), 'center', 700);
  spacing(0);
  ctx.restore();
}

/* ---------------- 저장 ---------------- */
function loadBest(k) { try { return +localStorage.getItem(k) || 0; } catch (e) { return 0; } }
function saveBest(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }

/* ---------------- 메인 루프 ---------------- */
let T = 0, paused = false;
function runLoop(update, render, onHidden) {
  let last = performance.now();
  function frame(now) {
    let rdt = Math.min(.05, (now - last) / 1000); last = now;
    if (paused) rdt = 0;
    T += rdt;
    let dt = rdt;
    if (hitstop > 0) { hitstop -= rdt; dt = 0; }
    update(dt * timeScale, rdt);
    ctx.setTransform(K, 0, 0, K, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    render();
    requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden && onHidden) onHidden(); last = performance.now(); });
  addEventListener('blur', () => { if (onHidden) onHidden(); });
  requestAnimationFrame(frame);
}
