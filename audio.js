/* 俠客守江山 – procedural wuxia soundtrack v2 (Web Audio, no assets) */
(function () {
  let ctx = null;
  let master = null;
  let musicGain = null;
  let sfxGain = null;
  let musicTimer = null;
  let musicOn = true;
  let sfxOn = true;
  let started = false;

  // C minor pentatonic (C Eb F G Bb) — classic wuxia/Chinese feel
  // Degrees offsets in semitones from C
  const PENT = [0, 3, 5, 7, 10];

  // A real 16-bar melody composed on the pentatonic, expressed as
  // [degreeIndex (0..4 in PENT), octaveOffset (in 12s), beats]
  // 4 beats per bar.
  const MELODY = [
    // Phrase A — calm opening (bars 1-4)
    [0, 0, 1], [2, 0, 1], [3, 0, 2],
    [4, 0, 1], [3, 0, 1], [2, 0, 2],
    [1, 0, 1], [2, 0, 1], [3, 0, 1], [2, 0, 1],
    [0, 0, 4],

    // Phrase B — rising (bars 5-8)
    [2, 0, 1], [3, 0, 1], [4, 0, 2],
    [4, 0, 1], [3, 0, 1], [2, 12, 2],
    [4, 0, 1], [3, 0, 1], [4, 0, 1], [2, 12, 1],
    [3, 0, 2], [2, 0, 2],

    // Phrase C — high ornament (bars 9-12)
    [0, 12, 1], [2, 12, 1], [4, 0, 2],
    [3, 12, 1], [2, 12, 1], [0, 12, 2],
    [4, 0, 1], [3, 0, 1], [2, 0, 1], [1, 0, 1],
    [0, 0, 4],

    // Phrase D — descent & return (bars 13-16)
    [4, -12, 2], [0, 0, 2],
    [2, 0, 1], [1, 0, 1], [0, 0, 2],
    [3, -12, 1], [4, -12, 1], [0, 0, 2],
    [0, 0, 4],
  ];

  // Bass line by bar (in semitones above C2). One root per bar.
  const BASS = [
    -24, -19, -22, -24,   // i  v  VII i
    -22, -17, -19, -24,
    -19, -22, -17, -19,
    -22, -24, -19, -24,
  ];

  const BASE_C = 60; // MIDI C4

  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function ensureCtx() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);

    // gentle hall reverb via convolution (synthetic noise impulse)
    const conv = ctx.createConvolver();
    const len = ctx.sampleRate * 1.6;
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4);
      }
    }
    conv.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = 0.22;
    conv.connect(wet).connect(master);

    musicGain = ctx.createGain();
    musicGain.gain.value = 0.34;
    musicGain.connect(master);
    musicGain.connect(conv);

    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.55;
    sfxGain.connect(master);
  }

  // Pluck — dizi/guzheng-ish: a bright triangle + sine octave, fast attack, long decay
  function pluck(freq, when, dur = 1.0, vel = 0.8, out, opts = {}) {
    const o1 = ctx.createOscillator();
    o1.type = opts.type1 || "triangle";
    o1.frequency.value = freq;

    const o2 = ctx.createOscillator();
    o2.type = "sine";
    o2.frequency.value = freq * (opts.partial || 2);

    // subtle vibrato for sustained notes
    if (dur > 0.6) {
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 4.5;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = freq * 0.005;
      lfo.connect(lfoGain).connect(o1.frequency);
      lfo.start(when + 0.15);
      lfo.stop(when + dur);
    }

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 4200;
    filter.Q.value = 0.6;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.36 * vel, when + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);

    const g2 = ctx.createGain();
    g2.gain.value = 0.28;
    o2.connect(g2).connect(g);
    o1.connect(g);
    g.connect(filter).connect(out || musicGain);

    o1.start(when); o2.start(when);
    o1.stop(when + dur + 0.05);
    o2.stop(when + dur + 0.05);
  }

  // Guzheng-ish bass note (deeper, longer)
  function bassNote(freq, when, dur, vel = 0.75) {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = freq;
    const o2 = ctx.createOscillator();
    o2.type = "triangle";
    o2.frequency.value = freq * 2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.32 * vel, when + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    const g2 = ctx.createGain();
    g2.gain.value = 0.22;
    o2.connect(g2).connect(g);
    o.connect(g);
    g.connect(musicGain);
    o.start(when); o2.start(when);
    o.stop(when + dur + 0.05);
    o2.stop(when + dur + 0.05);
  }

  // Soft taiko-style drum
  function drum(when, vel = 0.6) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(160, when);
    osc.frequency.exponentialRampToValueAtTime(46, when + 0.2);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.5 * vel, when + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.34);
    osc.connect(g).connect(musicGain);
    osc.start(when); osc.stop(when + 0.36);

    // little click for attack
    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, 0.04 * ctx.sampleRate, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
    noise.buffer = buf;
    const ng = ctx.createGain();
    ng.gain.value = 0.18 * vel;
    noise.connect(ng).connect(musicGain);
    noise.start(when);
  }

  // Schedule one full pass of the melody (16 bars).
  // Returns total duration in seconds.
  function scheduleSong(startAt) {
    const bpm = 78;
    const beat = 60 / bpm;
    const barDur = beat * 4;

    // Bass + drum per bar
    for (let b = 0; b < BASS.length; b++) {
      const t0 = startAt + b * barDur;
      bassNote(mtof(BASE_C + BASS[b]), t0, barDur * 1.05, 0.7);
      // Drum pattern: dum on 1 (strong), tick on 3 (light)
      drum(t0, 0.6);
      drum(t0 + beat * 2, 0.4);
    }

    // Melody — flow notes by accumulated beats
    let beatPos = 0;
    for (let i = 0; i < MELODY.length; i++) {
      const [deg, oct, beats] = MELODY[i];
      const t = startAt + beatPos * beat;
      const midi = BASE_C + 12 + PENT[deg] + oct;
      const dur = Math.max(0.45, beats * beat * 1.05);
      pluck(mtof(midi), t, dur, 0.55 + Math.random() * 0.1);
      beatPos += beats;
    }

    // Top harmony: parallel high pluck on bar downbeats (3rds above)
    for (let b = 0; b < 16; b += 2) {
      const t0 = startAt + b * barDur + beat * 2; // beat 3 of bar
      const deg = (b * 2) % PENT.length;
      const midi = BASE_C + 24 + PENT[deg];
      pluck(mtof(midi), t0, beat * 1.4, 0.32, musicGain, { partial: 1.5 });
    }

    return BASS.length * barDur;
  }

  let nextSongAt = 0;
  function tickMusic() {
    if (!musicOn || !ctx) return;
    const ahead = ctx.currentTime + 1.2;
    while (nextSongAt < ahead) {
      const dur = scheduleSong(nextSongAt);
      nextSongAt += dur;
    }
  }

  function startMusic() {
    if (!ctx || !musicOn) return;
    if (musicTimer) return;
    nextSongAt = ctx.currentTime + 0.15;
    tickMusic();
    musicTimer = setInterval(tickMusic, 800);
  }

  function stopMusic() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    nextSongAt = 0;
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
      drum(t, 0.95); drum(t + 0.18, 0.95); drum(t + 0.36, 0.95);
    } else if (kind === "drumroll") {
      // 擊鼓開戰：一連串鼓聲，由疏到密再爆
      const beats = [0, 0.40, 0.78, 1.10, 1.36, 1.58, 1.76, 1.92, 2.05, 2.16, 2.25, 2.34, 2.43, 2.55, 2.72];
      const vels =  [0.7, 0.78, 0.82, 0.85, 0.9, 0.92, 0.94, 0.96, 0.98, 1.0, 1.0, 1.0, 1.0, 1.05, 1.1];
      beats.forEach((b, i) => drum(t + b, vels[i]));
    } else if (kind === "win") {
      [60,64,67,72].forEach((m,i) => pluck(mtof(m), t + i*0.14, 0.9, 0.9, sfxGain));
    } else if (kind === "lose") {
      [72,68,63,58].forEach((m,i) => pluck(mtof(m), t + i*0.2, 1.0, 0.7, sfxGain));
    } else if (kind === "hit") {
      // 近戰命中：刀劍互擊的金屬聲——短促帶噪聲的 metallic clang
      const o = ctx.createOscillator();
      o.type = "square";
      o.frequency.setValueAtTime(820, t);
      o.frequency.exponentialRampToValueAtTime(380, t + 0.08);
      const f = ctx.createBiquadFilter();
      f.type = "bandpass"; f.frequency.value = 1600; f.Q.value = 4;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.5, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(f).connect(g).connect(sfxGain);
      o.start(t); o.stop(t + 0.2);
      // 噪聲層 — 物理撞擊感
      const n = ctx.createBufferSource();
      const buf = ctx.createBuffer(1, 0.12 * ctx.sampleRate, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
      n.buffer = buf;
      const nf = ctx.createBiquadFilter();
      nf.type = "highpass"; nf.frequency.value = 1200;
      const ng = ctx.createGain();
      ng.gain.value = 0.28;
      n.connect(nf).connect(ng).connect(sfxGain);
      n.start(t);
    } else if (kind === "shoot") {
      // 箭/暗器命中：短促的 thunk + 高頻碎裂
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.setValueAtTime(560, t);
      o.frequency.exponentialRampToValueAtTime(180, t + 0.07);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.42, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      o.connect(g).connect(sfxGain);
      o.start(t); o.stop(t + 0.16);
    } else if (kind === "explode") {
      // 爆炸/符火/砲擊命中：低頻 boom + 寬頻噪聲
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(140, t);
      o.frequency.exponentialRampToValueAtTime(40, t + 0.25);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.6, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      o.connect(g).connect(sfxGain);
      o.start(t); o.stop(t + 0.5);
      const n = ctx.createBufferSource();
      const buf = ctx.createBuffer(1, 0.35 * ctx.sampleRate, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
      n.buffer = buf;
      const ng = ctx.createGain();
      ng.gain.value = 0.4;
      n.connect(ng).connect(sfxGain);
      n.start(t);
    }
  }

  // 節流：避免同時 N 個敵人被打、音效堆疊變雜訊
  const lastSfxAt = {};
  function sfxThrottled(kind, minGap = 0.04) {
    if (!ctx) return;
    const now = ctx.currentTime;
    if (lastSfxAt[kind] && now - lastSfxAt[kind] < minGap) return;
    lastSfxAt[kind] = now;
    sfx(kind);
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

  function bootOnce() {
    start();
    window.removeEventListener("click", bootOnce);
    window.removeEventListener("keydown", bootOnce);
    window.removeEventListener("pointerdown", bootOnce);
  }
  window.addEventListener("click", bootOnce);
  window.addEventListener("keydown", bootOnce);
  window.addEventListener("pointerdown", bootOnce);

  window.__audio = { start, sfx, sfxThrottled, setMusic, setSfx, isMusicOn, isSfxOn };
})();
