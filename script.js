// ═══════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════
const PASSAGES = {
  easy: [
    "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump.",
    "She sells seashells by the seashore. The rain in Spain stays mainly in the plain. Peter Piper picked a peck of pickled peppers.",
    "A big black bug bit a big black bear. Red lorry yellow lorry. Around the rugged rocks the ragged rascal ran.",
  ],
  medium: [
    "The mind is not a vessel to be filled, but a fire to be kindled. Knowledge is power, and Power comes from learning.",
    "In the beginning the Universe was created. This has made a lot of people very angry and been widely regarded as a bad move.",
    "Two roads diverged in a wood, and I took the one less traveled by. That has made all the difference in my journey.",
    "Not all those who wander are lost. The old that is strong does not wither. Deep roots are not reached by the frost.",
  ],
  hard: [
    "The asymmetry between success and failure is not a quirk of human psychology but a fundamental feature of complex adaptive systems in evolutionary biology.",
    "Quantum entanglement demonstrates that particles can instantaneously affect each other regardless of the distance separating them, challenging our classical understanding of locality.",
    "Cryptographic hash functions transform arbitrary-length data into fixed-length digests, ensuring both collision resistance and pre-image resistance in modern cryptosystems.",
    "Neuroplasticity refers to the brain's extraordinary ability to reorganize synaptic connections in response to learning, experience, and recovery from traumatic injury.",
  ]
};

const QUOTES_PASSAGES = [
  "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle.",
  "In the middle of every difficulty lies opportunity. Imagination is more important than knowledge. The measure of intelligence is the ability to change.",
  "It does not matter how slowly you go as long as you do not stop. Everything you can imagine is real.",
];

const CODE_PASSAGES = [
  "function fibonacci(n) { if (n <= 1) return n; return fibonacci(n - 1) + fibonacci(n - 2); }",
  "const arr = [1, 2, 3, 4, 5]; const doubled = arr.map(x => x * 2).filter(x => x > 4);",
  "class Node { constructor(val) { this.val = val; this.next = null; } }",
];

const PRACTICE_PASSAGES = {
  numbers: "The year 2024 marked a significant milestone. There were 1,337 participants in the event. Prices ranged from $9.99 to $249.50 per item. Call 1-800-555-0123 for more info.",
  common: "the be to of and a in that have it for not on with he as you do at this but his from they we say her she or an will my one all would there their what",
  code: CODE_PASSAGES[0],
  quotes: QUOTES_PASSAGES[0],
};

const LEADERBOARD_DATA = [
  { name: "keystroke_god", wpm: 148, acc: 99, err: 1, diff: "hard" },
  { name: "typingqueen",   wpm: 134, acc: 97, err: 3, diff: "hard" },
  { name: "velocity99",    wpm: 121, acc: 98, err: 2, diff: "medium" },
  { name: "flashfingers",  wpm: 115, acc: 96, err: 4, diff: "hard" },
  { name: "swiftkeys",     wpm: 108, acc: 99, err: 1, diff: "medium" },
  { name: "typematrix",    wpm: 99,  acc: 95, err: 6, diff: "medium" },
  { name: "wordsmith42",   wpm: 87,  acc: 98, err: 2, diff: "easy" },
];

// ═══════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════
let state = {
  passage: "",
  typed: "",
  started: false,
  finished: false,
  startTime: null,
  timerInterval: null,
  timeLimit: 30,
  elapsed: 0,
  wpm: 0,
  accuracy: 0,
  mistakes: 0,
  totalTyped: 0,
  difficulty: "medium",
  category: "random",
  settings: { showWpm: true, stopOnError: false, sound: false, smoothCursor: true, heatmap: true },
  history: [],
  totalCorrect: 0,
  totalWrong: 0,
  savedPassage: ""
};

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
function init() {
  loadPassage();
  renderLeaderboard();
  updateStatsTab();
}

function loadPassage(forcePassage) {
  if (forcePassage) {
    state.passage = forcePassage;
  } else {
    let pool;
    if (state.category === 'quotes') pool = QUOTES_PASSAGES;
    else if (state.category === 'code') pool = CODE_PASSAGES;
    else pool = PASSAGES[state.difficulty];
    state.passage = pool[Math.floor(Math.random() * pool.length)];
  }
  state.savedPassage = state.passage;
  renderPassage();
}

function renderPassage() {
  const el = document.getElementById('passage-text');
  el.innerHTML = state.passage.split('').map((ch, i) =>
    `<span class="char${i === 0 ? ' cursor' : ''}" id="c${i}">${ch === ' ' ? '&nbsp;' : ch}</span>`
  ).join('');
}

// ═══════════════════════════════════════════
// GAME LOGIC
// ═══════════════════════════════════════════
function startTyping() {
  document.getElementById('start-overlay').classList.add('hidden');
  document.getElementById('hidden-input').focus();
  document.getElementById('typing-box').classList.add('active');
  document.getElementById('result-panel').classList.remove('show');
}

function focusInput() {
  if (!state.finished) document.getElementById('hidden-input').focus();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('hidden-input').addEventListener('keydown', (e) => {
    if (state.finished) return;

    if (!state.started) {
      state.started = true;
      state.startTime = Date.now();
      startTimer();
    }

    const key = e.key;
    const pos = state.typed.length;
    const expected = state.passage[pos];

    if (key === 'Backspace') {
      e.preventDefault();
      if (state.typed.length > 0) {
        state.typed = state.typed.slice(0, -1);
        updateDisplay();
      }
      return;
    }

    if (key.length !== 1) return;
    e.preventDefault();

    const isCorrect = key === expected;

    if (state.settings.stopOnError && !isCorrect) {
      shakeCurrent();
      return;
    }

    if (!isCorrect) {
      state.mistakes++;
      state.totalWrong++;
      document.getElementById('err-display').textContent = state.mistakes;
    } else {
      state.totalCorrect++;
    }

    state.typed += key;
    state.totalTyped++;
    updateDisplay();

    if (state.typed.length === state.passage.length) {
      endGame();
    }
  });

  init();
});

function updateDisplay() {
  const pos = state.typed.length;
  for (let i = 0; i < state.passage.length; i++) {
    const el = document.getElementById(`c${i}`);
    if (!el) continue;
    el.className = 'char';
    if (i < pos) {
      el.classList.add(state.typed[i] === state.passage[i] ? 'correct' : 'wrong');
    } else if (i === pos) {
      el.classList.add('cursor');
    }
  }
  calcStats();
}

function calcStats() {
  if (!state.startTime) return;
  const elapsed = (Date.now() - state.startTime) / 1000 / 60;
  const words = state.typed.trim().split(/\s+/).filter(w => w).length;
  state.wpm = elapsed > 0 ? Math.round(words / elapsed) : 0;
  const correctChars = [...state.typed].filter((ch, i) => ch === state.passage[i]).length;
  state.accuracy = state.totalTyped > 0 ? Math.round((correctChars / state.typed.length) * 100) : 0;
  if (state.settings.showWpm) document.getElementById('wpm-display').textContent = state.wpm;
  document.getElementById('acc-display').textContent = state.typed.length ? state.accuracy : '—';
}

function startTimer() {
  state.elapsed = 0;
  state.timerInterval = setInterval(() => {
    state.elapsed++;
    const m = Math.floor(state.elapsed / 60).toString().padStart(1, '0');
    const s = (state.elapsed % 60).toString().padStart(2, '0');
    document.getElementById('timer-display').textContent = `${m}:${s}`;
    if (state.timeLimit > 0) {
      const pct = Math.max(0, ((state.timeLimit - state.elapsed) / state.timeLimit) * 100);
      document.getElementById('timer-bar').style.width = pct + '%';
      if (pct < 30) document.getElementById('timer-bar').style.background = 'linear-gradient(90deg,var(--accent),#ff7a00)';
      if (state.elapsed >= state.timeLimit) endGame();
    }
  }, 1000);
}

function endGame() {
  clearInterval(state.timerInterval);
  state.finished = true;
  document.getElementById('typing-box').classList.remove('active');

  const elapsed = (Date.now() - state.startTime) / 1000 / 60;
  const words = state.typed.trim().split(/\s+/).filter(w => w).length;
  const finalWpm = elapsed > 0 ? Math.round(words / elapsed) : 0;
  const correctChars = [...state.typed].filter((ch, i) => ch === state.passage[i]).length;
  const finalAcc = state.typed.length > 0 ? Math.round((correctChars / state.typed.length) * 100) : 0;

  document.getElementById('res-wpm').textContent = finalWpm;
  document.getElementById('res-acc').textContent = finalAcc + '%';
  document.getElementById('res-time').textContent = Math.floor(state.elapsed) + 's';
  document.getElementById('res-err').textContent = state.mistakes;
  document.getElementById('res-rating').textContent = getRating(finalWpm);

  document.getElementById('result-panel').classList.add('show');

  state.history.push({ wpm: finalWpm, acc: finalAcc, err: state.mistakes });
  updateStatsTab();
}

function getRating(wpm) {
  if (wpm >= 120) return '🏆 Legendary Typist';
  if (wpm >= 90)  return '⚡ Speed Demon';
  if (wpm >= 70)  return '🚀 Expert';
  if (wpm >= 50)  return '💪 Proficient';
  if (wpm >= 30)  return '✊ Learning';
  return '🌱 Beginner';
}

function shakeCurrent() {
  const pos = state.typed.length;
  const el = document.getElementById(`c${pos}`);
  if (!el) return;
  el.style.animation = 'shake 0.2s';
  setTimeout(() => el.style.animation = '', 200);
}

function resetGame(retry) {
  clearInterval(state.timerInterval);
  state.typed = '';
  state.started = false;
  state.finished = false;
  state.startTime = null;
  state.elapsed = 0;
  state.wpm = 0;
  state.accuracy = 0;
  state.mistakes = 0;
  state.totalTyped = 0;
  document.getElementById('hidden-input').value = '';
  document.getElementById('timer-display').textContent = '0:00';
  document.getElementById('timer-bar').style.width = '100%';
  document.getElementById('timer-bar').style.background = 'linear-gradient(90deg,var(--accent2),var(--accent3))';
  document.getElementById('wpm-display').textContent = '0';
  document.getElementById('acc-display').textContent = '—';
  document.getElementById('err-display').textContent = '0';
  document.getElementById('result-panel').classList.remove('show');
  document.getElementById('typing-box').classList.remove('active');
  document.getElementById('start-overlay').classList.remove('hidden');
  if (retry) loadPassage(state.savedPassage);
  else loadPassage();
}

function setTime(secs, btn) {
  state.timeLimit = secs;
  document.querySelectorAll('.mode-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  resetGame();
}

function saveScore() {
  alert('Score saved to leaderboard!');
  renderLeaderboard();
}

// ═══════════════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════════════
function renderLeaderboard() {
  const body = document.getElementById('lb-body');
  body.innerHTML = LEADERBOARD_DATA.map((row, i) => `
    <div class="lb-row">
      <div class="lb-rank">${i + 1}</div>
      <div class="lb-name">${row.name} ${i === 0 ? '<span class="lb-badge badge-you">👑 Top</span>' : ''}</div>
      <div class="lb-wpm">${row.wpm}</div>
      <div class="lb-acc">${row.acc}%</div>
      <div class="lb-err">${row.err}</div>
      <div class="lb-diff"><span class="difficulty-badge diff-${row.diff}">${row.diff}</span></div>
    </div>
  `).join('');
}

// ═══════════════════════════════════════════
// STATS TAB
// ═══════════════════════════════════════════
function updateStatsTab() {
  const h = state.history;
  if (h.length === 0) return;
  const avgWpm  = Math.round(h.reduce((a, x) => a + x.wpm, 0) / h.length);
  const bestWpm = Math.max(...h.map(x => x.wpm));
  const avgAcc  = Math.round(h.reduce((a, x) => a + x.acc, 0) / h.length);
  const totalErr = h.reduce((a, x) => a + x.err, 0);

  document.getElementById('avg-wpm-stat').textContent  = avgWpm;
  document.getElementById('best-wpm-stat').textContent = bestWpm;
  document.getElementById('avg-acc-stat').textContent  = avgAcc + '%';
  document.getElementById('total-err-stat').textContent = totalErr;
  document.getElementById('avg-wpm-sub').textContent   = `Over ${h.length} test${h.length > 1 ? 's' : ''}`;
  document.getElementById('best-wpm-sub').textContent  = 'Personal record';
  document.getElementById('tests-count').textContent   = `${h.length} test${h.length > 1 ? 's' : ''} completed`;

  // Bar chart
  const chart  = document.getElementById('wpm-history-chart');
  const last7  = h.slice(-7);
  const maxWpm = Math.max(...last7.map(x => x.wpm), 1);
  chart.innerHTML = last7.map(x => `
    <div class="bar-wrap">
      <div class="bar" style="height:${Math.round((x.wpm / maxWpm) * 90)}px"></div>
      <div class="bar-label">${x.wpm}</div>
    </div>
  `).join('');

  // Accuracy breakdown
  const totalT = state.totalCorrect + state.totalWrong;
  if (totalT > 0) {
    const accPct = Math.round((state.totalCorrect / totalT) * 100);
    document.getElementById('pr-correct').textContent = state.totalCorrect;
    document.getElementById('pr-wrong').textContent   = state.totalWrong;
    document.getElementById('pr-acc').textContent     = accPct + '%';
    setTimeout(() => {
      document.getElementById('pf-correct').style.width = Math.round((state.totalCorrect / totalT) * 100) + '%';
      document.getElementById('pf-wrong').style.width   = Math.round((state.totalWrong   / totalT) * 100) + '%';
      document.getElementById('pf-acc').style.width     = accPct + '%';
    }, 100);
  }
}

// ═══════════════════════════════════════════
// PRACTICE
// ═══════════════════════════════════════════
function loadPractice(type) {
  switchTab('battle');
  resetGame();
  setTimeout(() => loadPassage(PRACTICE_PASSAGES[type]), 50);
}

// ═══════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════
function toggleSetting(el, key) {
  el.classList.toggle('on');
  state.settings[key] = el.classList.contains('on');
}

function setDifficulty(d, btn) {
  state.difficulty = d;
  document.querySelectorAll('[id^="diff-"]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const badge = document.getElementById('diff-badge');
  badge.className   = `difficulty-badge diff-${d}`;
  badge.textContent = d.charAt(0).toUpperCase() + d.slice(1);
  resetGame();
}

function setCategory(c, btn) {
  state.category = c;
  document.querySelectorAll('[id^="cat-"]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  resetGame();
}

function setFontSize(size, btn) {
  document.querySelectorAll('.sel-btn').forEach(b => {
    if (['S', 'M', 'L'].includes(b.textContent)) b.classList.remove('active');
  });
  btn.classList.add('active');
  document.getElementById('passage-text').style.fontSize = size;
}

// ═══════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════
function switchTab(id) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  const panels = ['battle', 'practice', 'leaderboard', 'mystats', 'settings'];
  const idx = panels.indexOf(id);
  document.querySelectorAll('.tab')[idx].classList.add('active');
  document.getElementById(`tab-${id}`).classList.add('active');
  if (id === 'mystats') setTimeout(updateStatsTab, 50);
}
