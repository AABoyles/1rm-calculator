// Common lifts list
const COMMON_LIFTS = [
  'Back Squat',
  'Front Squat',
  'Goblet Squat',
  'Smith Machine Squat',
  'Leg Press',
  'Hack Squat',
  'V-Squat',
  'Belt Squat',
  'Sissy Squat',
  'Deadlift',
  'Sumo Deadlift',
  'Trap Bar Deadlift',
  'Romanian Deadlift',
  'Stiff Leg Deadlift',
  'Conventional Deadlift',
  'Deficit Deadlift',
  'Bench Press',
  'Incline Bench Press',
  'Decline Bench Press',
  'Dumbbell Bench Press',
  'Smith Machine Bench Press',
  'Floor Press',
  'Close Grip Bench Press',
  'Barbell Shoulder Press',
  'Dumbbell Shoulder Press',
  'Smith Machine Shoulder Press',
  'Military Press',
  'Push Press',
  'Barbell Rows',
  'Pendulum Row',
  'Smith Machine Row',
  'Seal Row',
  'T-Bar Row',
  'Machine Row',
  'Dumbbell Row',
  'Underhand Row',
  'Bent Over Row',
  'Yates Row',
  'Upright Row',
  'Barbell Curl',
  'Dumbbell Curl',
  'Machine Curl',
  'EZ Bar Curl',
  'Preacher Curl',
  'Cable Curl',
  'Close Grip Curl',
  'Skull Crusher',
  'Tricep Dips',
  'Machine Dips',
  'Barbell Pulldowns',
  'Machine Pulldown',
  'Assisted Pullup',
  'Lat Pulldown',
  'Weighted Pullup',
  'Pullup',
  'Chin-up',
  'Weighted Dips',
  'Leg Curl',
  'Leg Extension',
  'Calf Raise',
  'Leg Adductor',
  'Leg Abductor',
  'Pendulum Squat',
  'Chest Press',
  'Machine Chest Press',
  'Cable Chest Press'
];

// Strength standards — thresholds are [Novice, Intermediate, Advanced, Elite] BW multipliers.
// Below the first threshold = Beginner. At or above the last = Elite.
const STRENGTH_STANDARDS = {
  squat:    [0.75, 1.25, 1.75, 2.25],
  deadlift: [1.0,  1.5,  2.0,  2.5],
  bench:    [0.5,  0.75, 1.25, 1.5],
  press:    [0.35, 0.5,  0.75, 1.0],
  row:      [0.5,  0.75, 1.0,  1.5],
};

const LIFT_CATEGORY = {
  'Back Squat': 'squat', 'Front Squat': 'squat', 'Goblet Squat': 'squat',
  'Smith Machine Squat': 'squat', 'Belt Squat': 'squat',
  'Pendulum Squat': 'squat', 'Hack Squat': 'squat',
  'Deadlift': 'deadlift', 'Sumo Deadlift': 'deadlift', 'Trap Bar Deadlift': 'deadlift',
  'Romanian Deadlift': 'deadlift', 'Stiff Leg Deadlift': 'deadlift',
  'Conventional Deadlift': 'deadlift', 'Deficit Deadlift': 'deadlift',
  'Bench Press': 'bench', 'Incline Bench Press': 'bench', 'Decline Bench Press': 'bench',
  'Dumbbell Bench Press': 'bench', 'Smith Machine Bench Press': 'bench',
  'Floor Press': 'bench', 'Close Grip Bench Press': 'bench',
  'Chest Press': 'bench', 'Machine Chest Press': 'bench', 'Cable Chest Press': 'bench',
  'Barbell Shoulder Press': 'press', 'Dumbbell Shoulder Press': 'press',
  'Smith Machine Shoulder Press': 'press', 'Military Press': 'press', 'Push Press': 'press',
  'Barbell Rows': 'row', 'Pendulum Row': 'row', 'Smith Machine Row': 'row',
  'Seal Row': 'row', 'T-Bar Row': 'row', 'Machine Row': 'row',
  'Dumbbell Row': 'row', 'Underhand Row': 'row', 'Bent Over Row': 'row',
  'Yates Row': 'row', 'Upright Row': 'row',
};

const STRENGTH_LEVELS = ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Elite'];

function classifyStrength(liftName, oneRM, bodyweight) {
  if (!oneRM || !bodyweight || bodyweight <= 0) return null;
  const category = LIFT_CATEGORY[liftName];
  const thresholds = category ? STRENGTH_STANDARDS[category] : null;
  const ratio = oneRM / bodyweight;
  let level = null;
  if (thresholds) {
    let idx = thresholds.length; // default to Elite
    for (let i = 0; i < thresholds.length; i++) {
      if (ratio < thresholds[i]) { idx = i; break; }
    }
    level = STRENGTH_LEVELS[idx];
  }
  return { ratio, level };
}

// State
let currentUnit = 'lbs'; // 'lbs' or 'kg'
let shouldRound = true;
let currentLift = '';

// Marzagao formula
function calculate1RM(weight, reps) {
  if (!weight || weight <= 0 || !reps || reps < 1) {
    return null;
  }

  // Formula: 1RM = w × (1 + (r − 1)^0.85 / (−2.55 + 4.58 × ln(w)))
  const numerator = Math.pow(reps - 1, 0.85);
  const denominator = -2.55 + 4.58 * Math.log(weight);

  // Denominator goes negative for very low weights (below ~1.75); formula undefined there
  if (denominator <= 0) return null;

  const factor = 1 + numerator / denominator;
  const oneRM = weight * factor;

  if (!isFinite(oneRM) || isNaN(oneRM)) return null;

  return oneRM;
}

// Step size for weight input given current state
function weightStep() {
  if (currentUnit === 'lbs') return shouldRound ? 5 : 1;
  return 0.5;
}

// Snap weight input value to current increment and update step attribute
function applyWeightStep() {
  const input = document.getElementById('weight');
  const step = weightStep();
  input.step = step;
  const val = parseFloat(input.value);
  if (shouldRound && val > 0) {
    const snapped = Math.round(val / step) * step;
    input.value = parseFloat(snapped.toFixed(currentUnit === 'kg' ? 1 : 0));
  }
}

// Rounding function — floors to nearest increment for the 1RM estimate
function roundValue(value, unit) {
  if (!shouldRound) return parseFloat(value.toFixed(1));

  if (unit === 'lbs') {
    return Math.floor(value / 5) * 5;
  } else {
    return Math.floor(value / 0.5) * 0.5;
  }
}

// Update bodyweight classification display (inside result box)
function updateBWClassification() {
  const el = document.getElementById('bwClassification');
  const bw = parseFloat(document.getElementById('bodyweight').value);
  const weight = parseFloat(document.getElementById('weight').value);
  const reps = parseInt(document.getElementById('reps').value);

  if (!weight || !reps) { el.hidden = true; return; }

  const oneRM = calculate1RM(weight, reps);
  if (oneRM === null) { el.hidden = true; return; }

  el.hidden = false;

  if (!bw || bw <= 0) {
    el.innerHTML = 'Set bodyweight &rarr;';
    return;
  }

  const result = classifyStrength(currentLift, oneRM, bw);
  if (!result) { el.innerHTML = 'Set bodyweight &rarr;'; return; }

  const ratioStr = result.ratio.toFixed(2) + '&times; BW';
  el.innerHTML = result.level
    ? `${ratioStr} &middot; <span class="bw-level">${result.level}</span>`
    : ratioStr;
}

// Update result display
function updateResult() {
  const weight = parseFloat(document.getElementById('weight').value);
  const reps = parseInt(document.getElementById('reps').value);

  const resultEl = document.getElementById('result');
  const resultActions = document.getElementById('resultActions');

  const bwEl = document.getElementById('bwClassification');

  if (!weight || weight <= 0 || !reps || reps < 1) {
    resultEl.textContent = '—';
    resultActions.hidden = true;
    bwEl.hidden = true;
    return;
  }

  const oneRM = calculate1RM(weight, reps);
  if (oneRM === null) {
    resultEl.textContent = '—';
    resultActions.hidden = true;
    bwEl.hidden = true;
    return;
  }
  const rounded = roundValue(oneRM, currentUnit);

  // When rounding, lbs shows whole numbers; when not rounding, show 1 decimal for both
  const decimals = shouldRound && currentUnit === 'lbs' ? 0 : 1;
  resultEl.textContent = rounded.toFixed(decimals);
  resultActions.hidden = false;
  updateBWClassification();
}

// Load state from URL hash (e.g. #lift=Back+Squat&weight=275&reps=5&unit=lbs)
function loadFromURL() {
  const hash = location.hash.slice(1);
  if (!hash) return false;
  const params = new URLSearchParams(hash);
  const lift = params.get('lift');
  const weight = params.get('weight');
  const reps = params.get('reps');
  const unit = params.get('unit');

  if (lift) { document.getElementById('liftType').value = lift; currentLift = lift; }
  if (weight) document.getElementById('weight').value = weight;
  if (reps) document.getElementById('reps').value = reps;
  if (unit && (unit === 'lbs' || unit === 'kg')) {
    currentUnit = unit;
    document.querySelectorAll('#unitToggle .toggle-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.value === unit);
    });
  }
  history.replaceState(null, '', location.pathname);
  return true;
}

// Build a shareable URL encoding the current calculator state
function buildShareURL() {
  const lift = document.getElementById('liftType').value;
  const weight = document.getElementById('weight').value;
  const reps = document.getElementById('reps').value;
  const params = new URLSearchParams();
  if (lift) params.set('lift', lift);
  if (weight) params.set('weight', weight);
  if (reps) params.set('reps', reps);
  params.set('unit', currentUnit);
  return `${location.origin}${location.pathname}#${params.toString()}`;
}

// Load from localStorage
function loadState() {
  const saved = localStorage.getItem('1rmCalcState');
  if (!saved) return;
  try {
    const state = JSON.parse(saved);
    if (state.liftType) {
      document.getElementById('liftType').value = state.liftType;
      currentLift = state.liftType;
    }
    if (state.weight) {
      document.getElementById('weight').value = state.weight;
    }
    if (state.reps) {
      document.getElementById('reps').value = state.reps;
    }
    if (state.unit) {
      currentUnit = state.unit;
      document.querySelectorAll('#unitToggle .toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === state.unit);
      });
    }
    if (state.shouldRound !== undefined) {
      shouldRound = state.shouldRound;
      document.querySelectorAll('#roundToggle .toggle-btn').forEach(btn => {
        btn.classList.toggle('active', (btn.dataset.value === 'round') === shouldRound);
      });
    }
    if (state.bodyweight) {
      document.getElementById('bodyweight').value = state.bodyweight;
    }
  } catch (e) {
    console.error('Error loading state:', e);
  }
}

// Save to localStorage
function saveState() {
  const state = {
    liftType: document.getElementById('liftType').value,
    weight: document.getElementById('weight').value,
    reps: document.getElementById('reps').value,
    bodyweight: document.getElementById('bodyweight').value,
    unit: currentUnit,
    shouldRound: shouldRound
  };
  localStorage.setItem('1rmCalcState', JSON.stringify(state));
}

// Per-lift localStorage helpers
// Data format: { liftName: [{weight, reps, unit, date}, ...], ... }
// Migrates legacy single-object format on read.
function getLifts() {
  const raw = JSON.parse(localStorage.getItem('1rmLifts') || '{}');
  const migrated = {};
  for (const [name, data] of Object.entries(raw)) {
    migrated[name] = Array.isArray(data) ? data : [data];
  }
  return migrated;
}

function saveLifts(lifts) {
  localStorage.setItem('1rmLifts', JSON.stringify(lifts));
}

function saveLiftData() {
  if (!currentLift) return;
  const weight = document.getElementById('weight').value;
  const reps = document.getElementById('reps').value;
  if (!weight) return;
  const lifts = getLifts();
  if (!lifts[currentLift]) lifts[currentLift] = [];
  lifts[currentLift].push({ weight, reps, unit: currentUnit, date: new Date().toISOString() });
  saveLifts(lifts);
}

function loadLiftData(liftName) {
  const lifts = getLifts();
  const entries = lifts[liftName];
  if (!entries || entries.length === 0) return;
  const data = entries[entries.length - 1]; // most recent
  let weight = parseFloat(data.weight);
  if (data.unit && data.unit !== currentUnit) {
    weight = currentUnit === 'kg' ? weight / 2.20462 : weight * 2.20462;
    weight = parseFloat(weight.toFixed(1));
  }
  document.getElementById('weight').value = weight;
  document.getElementById('reps').value = data.reps;
  applyWeightStep();
  updateResult();
}

// Intensity zones for the percentage table
const PCT_ZONES = [
  { zone: 'Recovery',    rows: [{pct: 50, reps: '20+'}, {pct: 55, reps: '15–20'}] },
  { zone: 'Volume',      rows: [{pct: 60, reps: '12–15'}, {pct: 65, reps: '10–12'}] },
  { zone: 'Hypertrophy', rows: [{pct: 70, reps: '8–10'}, {pct: 75, reps: '6–8'}] },
  { zone: 'Str-Hyp',     rows: [{pct: 80, reps: '4–6'}] },
  { zone: 'Strength',    rows: [{pct: 85, reps: '3–5'}, {pct: 90, reps: '2–3'}] },
  { zone: 'Near-Max',    rows: [{pct: 95, reps: '1–2'}] },
  { zone: '1RM',         rows: [{pct: 100, reps: '1'}] },
];

// ─── View system ───────────────────────────────────────────────────
const VIEWS = ['calculatorView', 'percentageView', 'historyView'];
let currentView = 'calculatorView';
let lockedViewHeight = null;

function lockHeight(targetId) {
  if (lockedViewHeight === null) {
    const calcView = document.getElementById('calculatorView');
    const tabBar = document.querySelector('.tab-bar');
    lockedViewHeight = tabBar.getBoundingClientRect().top - calcView.getBoundingClientRect().top;
  }
  document.getElementById(targetId).style.height = lockedViewHeight + 'px';
}

function showView(id) {
  if (id === currentView) return;
  if (id !== 'calculatorView') lockHeight(id);
  VIEWS.forEach(v => { document.getElementById(v).hidden = v !== id; });
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === id);
  });
  currentView = id;
  if (id === 'historyView') renderHistory();
  if (id === 'percentageView') renderPercentageView();
}

// ─── Percentage view ────────────────────────────────────────────────
function renderPercentageView() {
  const el = document.getElementById('percentageView');
  const weight = parseFloat(document.getElementById('weight').value);
  const reps = parseInt(document.getElementById('reps').value);

  if (!weight || weight <= 0 || !reps || reps < 1) {
    el.innerHTML = '<div class="percentage-view-empty">Enter weight and reps in the Calculator tab first</div>';
    return;
  }

  const oneRM = calculate1RM(weight, reps);
  if (oneRM === null) {
    el.innerHTML = '<div class="percentage-view-empty">Weight too low to calculate</div>';
    return;
  }

  const liftLabel = currentLift || 'Exercise';
  const decimals = shouldRound && currentUnit === 'lbs' ? 0 : 1;

  let html = `<div class="percentage-view-header">${liftLabel}</div>`;
  html += '<table class="percentage-table"><thead><tr><th>%</th><th>Weight</th><th>Reps</th></tr></thead><tbody>';
  for (const { zone, rows } of PCT_ZONES) {
    html += `<tr class="zone-group"><td colspan="3">${zone}</td></tr>`;
    for (const { pct, reps } of rows) {
      const pctWeight = oneRM * (pct / 100);
      const rounded = roundValue(pctWeight, currentUnit);
      html += `<tr><td>${pct}%</td><td>${rounded.toFixed(decimals)} ${currentUnit}</td><td>${reps}</td></tr>`;
    }
  }
  html += '</tbody></table>';
  el.innerHTML = html;
}

// ─── History view ───────────────────────────────────────────────────
const expandedLifts = new Set();

function formatHistoryDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatShortDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function renderSparkline(entries) {
  const values = entries.map(e => {
    let w = parseFloat(e.weight);
    if (e.unit && e.unit !== currentUnit) {
      w = currentUnit === 'kg' ? w / 2.20462 : w * 2.20462;
    }
    return calculate1RM(w, parseInt(e.reps));
  }).filter(v => v !== null && v > 0);

  if (values.length < 2) return '';

  const W = 64, H = 20, pad = 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (W - 2 * pad);
    const y = (H - pad) - ((v - min) / range) * (H - 2 * pad);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return `<svg class="sparkline" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true"><polyline points="${points}" fill="none" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}

function renderHistory() {
  const lifts = getLifts();
  const liftList = Object.entries(lifts).sort(([a], [b]) => a.localeCompare(b));
  const el = document.getElementById('historyView');

  if (liftList.length === 0) {
    el.innerHTML = '<div class="history-empty">No lifts logged yet — hit Log after a set</div>';
    return;
  }

  const decimals = shouldRound && currentUnit === 'lbs' ? 0 : 1;

  el.innerHTML = liftList.map(([liftName, entries]) => {
    const latest = entries[entries.length - 1];
    let w = parseFloat(latest.weight);
    if (latest.unit && latest.unit !== currentUnit) {
      w = currentUnit === 'kg' ? w / 2.20462 : w * 2.20462;
    }
    const oneRM = calculate1RM(w, parseInt(latest.reps));
    const display = oneRM !== null
      ? roundValue(oneRM, currentUnit).toFixed(decimals) + ' ' + currentUnit
      : '—';
    const date = formatHistoryDate(latest.date);
    const escaped = liftName.replace(/"/g, '&quot;');
    const multi = entries.length > 1;
    const isExpanded = expandedLifts.has(liftName);

    const sparkline = multi ? renderSparkline(entries) : '';

    let entriesHtml = '';
    if (isExpanded) {
      entriesHtml = '<div class="history-entries">' +
        [...entries].reverse().map((entry, revIdx) => {
          const origIdx = entries.length - 1 - revIdx;
          let ew = parseFloat(entry.weight);
          if (entry.unit && entry.unit !== currentUnit) {
            ew = currentUnit === 'kg' ? ew / 2.20462 : ew * 2.20462;
          }
          const erm = calculate1RM(ew, parseInt(entry.reps));
          const ermDisplay = erm !== null
            ? roundValue(erm, currentUnit).toFixed(decimals) + ' ' + currentUnit
            : '—';
          const wDisplay = currentUnit === 'kg' ? ew.toFixed(1) : Math.round(ew).toString();
          return `<div class="history-entry">
            <span class="entry-set">${wDisplay} × ${entry.reps}</span>
            <span class="entry-rm">→ ${ermDisplay}</span>
            <span class="entry-date">${formatShortDate(entry.date)}</span>
            <button class="delete-entry-btn" data-lift="${escaped}" data-index="${origIdx}" aria-label="Delete">&times;</button>
          </div>`;
        }).join('') +
        '</div>';
    }

    return `<div class="history-lift-card">
      <div class="history-row">
        <button class="history-item" data-lift="${escaped}">
          <span class="history-lift">${liftName}</span>
          <span class="history-right">
            <span class="history-1rm">${display}</span>
            <span class="history-date">${date}</span>
          </span>
        </button>
        ${multi ? `<div class="history-sparkline-area">${sparkline}</div>
        <button class="history-expand-btn${isExpanded ? ' expanded' : ''}" data-lift="${escaped}" aria-label="Toggle entries">${entries.length}</button>` : ''}
      </div>
      ${entriesHtml}
    </div>`;
  }).join('');

  el.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      const liftName = item.dataset.lift;
      document.getElementById('liftType').value = liftName;
      currentLift = liftName;
      loadLiftData(liftName);
      showView('calculatorView');
    });
  });

  el.querySelectorAll('.history-expand-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const liftName = btn.dataset.lift;
      if (expandedLifts.has(liftName)) expandedLifts.delete(liftName);
      else expandedLifts.add(liftName);
      renderHistory();
    });
  });

  el.querySelectorAll('.delete-entry-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const liftName = btn.dataset.lift;
      const idx = parseInt(btn.dataset.index);
      const lifts = getLifts();
      if (!lifts[liftName]) return;
      lifts[liftName].splice(idx, 1);
      if (lifts[liftName].length === 0) {
        delete lifts[liftName];
        expandedLifts.delete(liftName);
      }
      saveLifts(lifts);
      renderHistory();
    });
  });
}

// Autocomplete
function setupAutocomplete() {
  const input = document.getElementById('liftType');
  const list = document.getElementById('autocompleteList');

  input.addEventListener('input', (e) => {
    const value = e.target.value.toLowerCase();
    currentLift = e.target.value;

    if (value.length === 0) {
      list.classList.remove('active');
      return;
    }

    const filtered = COMMON_LIFTS.filter(lift =>
      lift.toLowerCase().includes(value)
    );

    if (filtered.length === 0) {
      list.classList.remove('active');
      return;
    }

    list.innerHTML = filtered.map((lift, index) =>
      `<div class="autocomplete-item" data-index="${index}">${lift}</div>`
    ).join('');

    list.classList.add('active');

    // Add click handlers
    document.querySelectorAll('.autocomplete-item').forEach(item => {
      item.addEventListener('click', () => {
        input.value = item.textContent;
        currentLift = item.textContent;
        list.classList.remove('active');
        loadLiftData(currentLift);
        saveState();
      });
    });
  });

  // Keyboard navigation
  input.addEventListener('keydown', (e) => {
    const items = Array.from(document.querySelectorAll('.autocomplete-item'));
    if (items.length === 0) return;

    const selectedIndex = items.findIndex(item => item.classList.contains('selected'));

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = selectedIndex < items.length - 1 ? selectedIndex + 1 : 0;
      items.forEach(i => i.classList.remove('selected'));
      items[next].classList.add('selected');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = selectedIndex > 0 ? selectedIndex - 1 : items.length - 1;
      items.forEach(i => i.classList.remove('selected'));
      items[prev].classList.add('selected');
    } else if (e.key === 'Escape') {
      list.classList.remove('active');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = document.querySelector('.autocomplete-item.selected');
      if (selected) {
        input.value = selected.textContent;
        currentLift = selected.textContent;
        list.classList.remove('active');
        loadLiftData(currentLift);
        saveState();
      }
    }
  });

  // Close autocomplete on blur
  input.addEventListener('blur', () => {
    setTimeout(() => {
      list.classList.remove('active');
    }, 200);
  });
}


// Unit toggle buttons
document.querySelectorAll('#unitToggle .toggle-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.classList.contains('active')) return;
    const weightInput = document.getElementById('weight');
    const bwInput = document.getElementById('bodyweight');
    const existing = parseFloat(weightInput.value);
    const existingBW = parseFloat(bwInput.value);
    document.querySelectorAll('#unitToggle .toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentUnit = btn.dataset.value;
    if (existing > 0) {
      const converted = currentUnit === 'kg' ? existing / 2.20462 : existing * 2.20462;
      weightInput.value = parseFloat(converted.toFixed(1));
    }
    if (existingBW > 0) {
      const convertedBW = currentUnit === 'kg' ? existingBW / 2.20462 : existingBW * 2.20462;
      bwInput.value = parseFloat(convertedBW.toFixed(1));
    }
    document.getElementById('weightUnit').textContent = currentUnit;
    document.getElementById('unitDisplay').textContent = currentUnit;
    document.getElementById('bwUnit').textContent = currentUnit;
    applyWeightStep();
    updateResult();
    if (currentView === 'historyView') renderHistory();
    if (currentView === 'percentageView') renderPercentageView();
    saveState();
  });
});

// Round toggle buttons
document.querySelectorAll('#roundToggle .toggle-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.classList.contains('active')) return;
    document.querySelectorAll('#roundToggle .toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    shouldRound = btn.dataset.value === 'round';
    applyWeightStep();
    updateResult();
    if (currentView === 'historyView') renderHistory();
    if (currentView === 'percentageView') renderPercentageView();
    saveState();
  });
});

// Input listeners
document.getElementById('weight').addEventListener('input', () => {
  updateResult();
  saveState();
  if (currentView === 'percentageView') renderPercentageView();
});

document.getElementById('reps').addEventListener('input', () => {
  updateResult();
  saveState();
  if (currentView === 'percentageView') renderPercentageView();
});

document.getElementById('liftType').addEventListener('change', () => {
  currentLift = document.getElementById('liftType').value;
  loadLiftData(currentLift);
  saveState();
});

document.getElementById('bodyweight').addEventListener('input', () => {
  updateBWClassification();
  saveState();
});

// Log button
document.getElementById('logBtn').addEventListener('click', () => {
  saveLiftData();
  const btn = document.getElementById('logBtn');
  btn.textContent = 'Logged!';
  setTimeout(() => { btn.textContent = 'Log'; }, 1500);
});

// Share button
document.getElementById('shareBtn').addEventListener('click', () => {
  const url = buildShareURL();
  const lift = currentLift || 'Exercise';
  const weight = document.getElementById('weight').value;
  const reps = document.getElementById('reps').value;
  const oneRM = document.getElementById('result').textContent;

  if (navigator.share) {
    navigator.share({
      title: '1RM Calculator',
      text: `${lift} 1RM: ${oneRM} ${currentUnit} (from ${weight} × ${reps})`,
      url,
    });
  } else {
    navigator.clipboard.writeText(url).then(() => {
      const btn = document.getElementById('shareBtn');
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Share'; }, 1500);
    });
  }
});

// BW modal
document.getElementById('bwClassification').addEventListener('click', () => {
  document.getElementById('bwModal').classList.add('active');
  document.getElementById('bodyweight').focus();
});

document.getElementById('closeBWModal').addEventListener('click', () => {
  document.getElementById('bwModal').classList.remove('active');
});

document.getElementById('bwModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('bwModal')) {
    document.getElementById('bwModal').classList.remove('active');
  }
});

// Info modal
document.getElementById('infoBtn').addEventListener('click', () => {
  document.getElementById('infoModal').classList.add('active');
});

document.getElementById('closeInfoModal').addEventListener('click', () => {
  document.getElementById('infoModal').classList.remove('active');
});

document.getElementById('infoModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('infoModal')) {
    document.getElementById('infoModal').classList.remove('active');
  }
});

// Formula modal
document.getElementById('formulaBtn').addEventListener('click', () => {
  document.getElementById('formulaModal').classList.add('active');
});

document.getElementById('closeFormulaModal').addEventListener('click', () => {
  document.getElementById('formulaModal').classList.remove('active');
});

document.getElementById('formulaModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('formulaModal')) {
    document.getElementById('formulaModal').classList.remove('active');
  }
});

// Tab buttons
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => showView(btn.dataset.view));
});

// Initialize
setupAutocomplete();
if (!loadFromURL()) loadState();
applyWeightStep();
updateResult();

// Initial UI updates
document.getElementById('weightUnit').textContent = currentUnit;
document.getElementById('unitDisplay').textContent = currentUnit;
document.getElementById('bwUnit').textContent = currentUnit;
