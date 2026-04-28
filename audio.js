/* 俠客守江山 – procedural wuxia soundtrack (Web Audio, no assets) */
(function () {
  let ctx = null;
  let master = null;
  let musicGain = null;
  let sfxGain = null;
  let musicTimer = null;
  let musicOn = true;
  let sfxOn = true;
  let started = false;

  // Pentatonic scale (C minor pentatonic-ish, oriental flavor): C D Eb G Bb
  const SCALE = [0, 2, 3, 7, 10];
  const BASE = 48; // C3 midi

  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function ensureCtx() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.6;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.32;
    musicGain.connect(master);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.5;
    sfxGain.connect(master);
  }

  // Pluck-like tone (guqin/pipa feel): sine + triangle with fast decay + subtle detune
  function pluck(freq, when, dur = 1.2, vel = 0.8, out) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.35 * vel, when + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);

    const o1 = ctx.createOscillator();
    o1.type = "triangle";
    o1.frequency.value = freq;
    const o2 = ctx.createOscillator();
    o2.type = "sine";
    o2.frequency.value = freq * 2;

    const g2 = ctx.createGain();
    g2.gain.value = 0.3;
    o2.connect(g2).connect(g);
    o1.connect(g);
    g.connect(out || musicGain);

    o1.start(when); o2.start(when);
    o1.stop(when + dur + 0.05);
    o2.stop(when + dur + 0.05);
  }

  // Soft drum
  function drum(when, vel = 0.6) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, when);
    osc.frequency.exponentialRampToValueAtTime(40, when + 0.2);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.5 * vel, when + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.3);
    osc.connect(g).connect(musicGain);
    osc.start(when); osc.stop(when + 0.32);
  }

  // Compose a melodic bar (4 beats), returns bar length in seconds
  function scheduleBar(startAt, barDur) {
    const beat = barDur / 4;
    // Drum on 1 and 3
    drum(startAt, 0.55);
    drum(startAt + beat * 2, 0.45);

    // Melody: 6 notes per bar, random walk on pentatonic
    for (let i = 0; i < 6; i++) {
      const t = startAt + (i * barDur / 6) + (Math.random() - 0.5) * 0.02;
      const octave = Math.random() < 0.25 ? 12 : 0;
      const deg = SCALE[Math.floor(Math.random() * SCALE.length)];
      const midi = BASE + 12 + deg + octave;
      const dur = 0.4 + Math.random() * 0.8;
      pluck(mtof(midi), t, dur, 0.5 + Math.random() * 0.4);
    }
    // Bass drone on 1
    pluck(mtof(BASE - 12), startAt, barDur * 1.1, 0.7);
    // Occasional high ornament
    if (Math.random() < 0.5) {
      pluck(mtof(BASE + 24 + SCALE[Math.floor(Math.random()*SCALE.length)]),
            startAt + barDur * 0.75, 0.6, 0.35);
    }
    return barDur;
  }

  function startMusic() {
    if (!ctx || !musicOn) return;
    if (musicTimer) return;
    const barDur = 3.2; // seconds
    let next = ctx.currentTime + 0.05;
    const loop = () => {
      if (!musicOn) return;
      while (next < ctx.currentTime + 1.5) {
        scheduleBar(next, barDur);
        next += barDur;
      }
    };
    loop();
    musicTimer = setInterval(loop, 500);
  }

  function stopMusic() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  }

  // SFX
  function sfx(kind) {
    if (!ctx || !sfxOn) return;
    const t = ctx.currentTime;
    if (kind === "click") {
      pluck(mtof(72), t, 0.25, 0.8, sfxGain);
    } else if (kind === "place") {
      pluck(mtof(67), t, 0.4, 0.9, sfxGain);
      pluck(mtof(74), t + 0.08, 0.35, 0.7, sfxGain);
    } else if (kind === "qi") {
      pluck(mtof(79), t, 0.5, 0.8, sfxGain);
      pluck(mtof(83), t + 0.06, 0.4, 0.6, sfxGain);
    } else if (kind === "wave") {
      drum(t, 0.9); drum(t + 0.18, 0.9); drum(t + 0.36, 0.9);
    } else if (kind === "win") {
      [60,64,67,72].forEach((m,i) => pluck(mtof(m), t + i*0.14, 0.9, 0.9, sfxGain));
    } else if (kind === "lose") {
      [72,68,63,58].forEach((m,i) => pluck(mtof(m), t + i*0.2, 1.0, 0.7, sfxGain));
    }
  }

  function start() {
    if (started) return;
    started = true;
    ensureCtx();
    if (ctx.state === "suspended") ctx.resume();
    startMusic();
  }
  function setMusic(on) {
    musicOn = on;
    if (on) { ensureCtx(); if (ctx.state === "suspended") ctx.resume(); startMusic(); }
    else stopMusic();
  }
  function setSfx(on) { sfxOn = on; }
  function isMusicOn() { return musicOn; }
  function isSfxOn() { return sfxOn; }

  // Auto-start on first user interaction (browser autoplay policy)
  function bootOnce() {
    start();
    window.removeEventListener("click", bootOnce);
    window.removeEventListener("keydown", bootOnce);
    window.removeEventListener("pointerdown", bootOnce);
  }
  window.addEventListener("click", bootOnce);
  window.addEventListener("keydown", bootOnce);
  window.addEventListener("pointerdown", bootOnce);

  window.__audio = { start, sfx, setMusic, setSfx, isMusicOn, isSfxOn };
})();
