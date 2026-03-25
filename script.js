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

// Update result display
function updateResult() {
  const weight = parseFloat(document.getElementById('weight').value);
  const reps = parseInt(document.getElementById('reps').value);

  const resultEl = document.getElementById('result');
  const shareBtn = document.getElementById('shareBtn');

  if (!weight || weight <= 0 || !reps || reps < 1) {
    resultEl.textContent = '—';
    shareBtn.hidden = true;
    return;
  }

  const oneRM = calculate1RM(weight, reps);
  if (oneRM === null) {
    resultEl.textContent = '—';
    shareBtn.hidden = true;
    return;
  }
  const rounded = roundValue(oneRM, currentUnit);

  // When rounding, lbs shows whole numbers; when not rounding, show 1 decimal for both
  const decimals = shouldRound && currentUnit === 'lbs' ? 0 : 1;
  resultEl.textContent = rounded.toFixed(decimals);
  shareBtn.hidden = false;
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
    unit: currentUnit,
    shouldRound: shouldRound
  };
  localStorage.setItem('1rmCalcState', JSON.stringify(state));
}

// Per-lift localStorage helpers
function saveLiftData() {
  if (!currentLift) return;
  const weight = document.getElementById('weight').value;
  const reps = document.getElementById('reps').value;
  if (!weight) return;
  const lifts = JSON.parse(localStorage.getItem('1rmLifts') || '{}');
  lifts[currentLift] = { weight, reps, unit: currentUnit, date: new Date().toISOString() };
  localStorage.setItem('1rmLifts', JSON.stringify(lifts));
}

function loadLiftData(liftName) {
  const lifts = JSON.parse(localStorage.getItem('1rmLifts') || '{}');
  const data = lifts[liftName];
  if (!data) return;
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
  const percentages = [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];

  let html = `<div class="percentage-view-header">${liftLabel}</div>`;
  html += '<table class="percentage-table"><thead><tr><th>%</th><th>Weight</th></tr></thead><tbody>';
  for (const pct of percentages) {
    const pctWeight = oneRM * (pct / 100);
    const rounded = roundValue(pctWeight, currentUnit);
    const decimals = shouldRound && currentUnit === 'lbs' ? 0 : 1;
    html += `<tr><td>${pct}%</td><td>${rounded.toFixed(decimals)} ${currentUnit}</td></tr>`;
  }
  html += '</tbody></table>';
  el.innerHTML = html;
}

// ─── History view ───────────────────────────────────────────────────
function formatHistoryDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderHistory() {
  const lifts = JSON.parse(localStorage.getItem('1rmLifts') || '{}');
  const entries = Object.entries(lifts).sort(([a], [b]) => a.localeCompare(b));
  const el = document.getElementById('historyView');

  if (entries.length === 0) {
    el.innerHTML = '<div class="history-empty">No lifts recorded yet</div>';
    return;
  }

  el.innerHTML = entries.map(([liftName, data]) => {
    let weight = parseFloat(data.weight);
    const storedUnit = data.unit || 'lbs';
    if (storedUnit !== currentUnit) {
      weight = currentUnit === 'kg' ? weight / 2.20462 : weight * 2.20462;
    }
    const oneRM = calculate1RM(weight, parseInt(data.reps));
    const display = oneRM !== null
      ? roundValue(oneRM, currentUnit).toFixed(shouldRound && currentUnit === 'lbs' ? 0 : 1) + ' ' + currentUnit
      : '—';
    const date = formatHistoryDate(data.date);

    return `<button class="history-item" data-lift="${liftName.replace(/"/g, '&quot;')}">
      <span class="history-lift">${liftName}</span>
      <span class="history-right">
        <span class="history-1rm">${display}</span>
        <span class="history-date">${date}</span>
      </span>
    </button>`;
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
    const existing = parseFloat(weightInput.value);
    document.querySelectorAll('#unitToggle .toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentUnit = btn.dataset.value;
    if (existing > 0) {
      const converted = currentUnit === 'kg' ? existing / 2.20462 : existing * 2.20462;
      weightInput.value = parseFloat(converted.toFixed(1));
    }
    document.getElementById('weightUnit').textContent = currentUnit;
    document.getElementById('unitDisplay').textContent = currentUnit;
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
  saveLiftData();
  if (currentView === 'percentageView') renderPercentageView();
});

document.getElementById('reps').addEventListener('input', () => {
  updateResult();
  saveState();
  saveLiftData();
  if (currentView === 'percentageView') renderPercentageView();
});

document.getElementById('liftType').addEventListener('change', () => {
  currentLift = document.getElementById('liftType').value;
  loadLiftData(currentLift);
  saveState();
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
