/* =========================================================
   SORTING VISUALIZER — Bubble / Quick / Merge
   ========================================================= */

(function () {
  const SECTION_ID = 'sorting';

  const ALGOS = {
    bubble: {
      name: 'Bubble Sort',
      complexity: 'O(n²)',
      code: [
          'void bubbleSort(vector<int>& a) {',
          '    int n = a.size();',
          '    for (int i = 0; i < n - 1; i++)',
          '        for (int j = 0; j < n - i - 1; j++)',
          '            if (a[j] > a[j + 1])',
          '                swap(a[j], a[j + 1]);',
          '}'
        ]
    },
    quick: {
      name: 'Quick Sort',
      complexity: 'O(n log n) avg',
      code: [
          'void quickSort(vector<int>& a, int lo, int hi) {',
          '    if (lo >= hi) return;',
          '    int p = partition(a, lo, hi);',
          '    quickSort(a, lo, p - 1);',
          '    quickSort(a, p + 1, hi);',
          '}',
          'int partition(vector<int>& a, int lo, int hi) {',
          '    int pivot = a[hi]; int i = lo - 1;',
          '    for (int j = lo; j < hi; j++)',
          '        if (a[j] < pivot) swap(a[++i], a[j]);',
          '    swap(a[i + 1], a[hi]);',
          '    return i + 1;',
          '}'
        ]
    },
    merge: {
      name: 'Merge Sort',
      complexity: 'O(n log n)',
      code: [
          'void mergeSort(vector<int>& a, int l, int r) {',
          '    if (l >= r) return;',
          '    int m = (l + r) / 2;',
          '    mergeSort(a, l, m);',
          '    mergeSort(a, m + 1, r);',
          '    merge(a, l, m, r);',
          '}',
          'void merge(vector<int>& a, int l, int m, int r) {',
          '    vector<int> tmp(r - l + 1);',
          '    int i = l, k = 0, j = m + 1;',
          '    while (i <= m && j <= r)',
          '        tmp[k++] = (a[i] < a[j]) ? a[i++] : a[j++];',
          '    while (i <= m) tmp[k++] = a[i++];',
          '    while (j <= r) tmp[k++] = a[j++];',
          '    for (k = 0; k < tmp.size(); k++) a[l + k] = tmp[k];',
          '}'
        ]
    }
  };

  let state = null;
  let gen = null;

  function init(root) {
    state = {
      algo: 'bubble',
      size: 24,
      speed: 5,
      arr: [],
      playing: false,
      raf: null,
      lastStepAt: 0
    };
    generateArray();
    renderBars(root);
    renderCode(root);
    attachControls(root);
  }

  function generateArray() {
    state.arr = Array.from({ length: state.size }, () => Math.floor(Math.random() * 95) + 5);
  }

  function renderBars(root) {
    const container = root.querySelector('.bars');
    container.innerHTML = '';
    state.arr.forEach((v, i) => {
      const bar = document.createElement('div');
      bar.className = 'bar';
      bar.style.height = v + '%';
      bar.textContent = state.size <= 16 ? v : '';
      container.appendChild(bar);
    });
  }

  function renderCode(root) {
    const pre = root.querySelector('.code-panel pre');
    const lines = ALGOS[state.algo].code;
    pre.innerHTML = lines.map((line, idx) => {
      const ln = idx + 1;
      const safe = line.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<span class="line" data-line="${ln}">${highlight(safe) || '&nbsp;'}</span>`;
    }).join('');
  }

  function highlight(line) {
    return line
      .replace(/(void|int|if|while|return|for)/g, '<span class="kw">$1</span>')
      .replace(/(swap|partition|mergeSort|merge|quickSort|bubbleSort|vector|size)/g, '<span class="fn">$1</span>')
      .replace(/(\b\d+\b)/g, '<span class="num">$1</span>');
  }

  function attachControls(root) {
    root.querySelectorAll('.sort-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        if (state.playing) return;
        root.querySelectorAll('.sort-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.algo = tab.dataset.algo;
        renderCode(root);
        renderBars(root);
      });
    });
    root.querySelector('#sort-size').addEventListener('input', e => {
      state.size = parseInt(e.target.value);
      root.querySelector('#sort-size-label').textContent = state.size;
      generateArray(); renderBars(root);
    });
    root.querySelector('#sort-speed').addEventListener('input', e => { state.speed = parseInt(e.target.value); });
    root.querySelector('#sort-shuffle').addEventListener('click', () => {
      if (state.playing) return;
      generateArray(); renderBars(root);
    });
    root.querySelector('#sort-play').addEventListener('click', () => togglePlay(root));
    root.querySelector('#sort-reset').addEventListener('click', () => {
      cancelAnimationFrame(state.raf);
      state.playing = false;
      updatePlayBtn(root);
      generateArray(); renderBars(root);
    });
  }

  function updateBars(root, compareIdxs = [], swap = false, sortedIdxs = []) {
    const bars = root.querySelectorAll('.bar');
    state.arr.forEach((v, i) => {
      const bar = bars[i];
      bar.className = 'bar';
      bar.style.height = v + '%';
      bar.textContent = state.size <= 16 ? v : '';
      if (compareIdxs.includes(i)) bar.classList.add('compare');
      if (swap && compareIdxs.includes(i)) bar.classList.add('swapping');
      if (sortedIdxs.includes(i)) bar.classList.add('sorted');
    });
  }

  function* bubble() {
    const a = state.arr;
    const n = a.length;
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        yield { type: 'compare', idxs: [j, j + 1], line: 5 };
        if (a[j] > a[j + 1]) {
          [a[j], a[j + 1]] = [a[j + 1], a[j]];
          yield { type: 'swap', idxs: [j, j + 1], line: 6 };
        }
      }
      yield { type: 'sorted', idxs: [n - i - 1] };
    }
    yield { type: 'sorted', idxs: [0] };
  }

  function* quick() {
    const a = state.arr;
    function* qs(lo, hi) {
      if (lo >= hi) {
        if (lo === hi) yield { type: 'sorted', idxs: [lo] };
        return;
      }
      const pivot = a[hi];
      let i = lo - 1;
      for (let j = lo; j < hi; j++) {
        yield { type: 'compare', idxs: [j, hi], line: 11 };
        if (a[j] < pivot) {
          i++;
          if (i !== j) {
            [a[i], a[j]] = [a[j], a[i]];
            yield { type: 'swap', idxs: [i, j], line: 12 };
          }
        }
      }
      [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
      yield { type: 'swap', idxs: [i + 1, hi], line: 13 };
      const p = i + 1;
      yield* qs(lo, p - 1);
      yield* qs(p + 1, hi);
    }
    yield* qs(0, a.length - 1);
    yield { type: 'sorted', idxs: a.map((_, i) => i) };
  }

  function* merge() {
    const a = state.arr;
    function* ms(l, r) {
      if (l >= r) return;
      const m = Math.floor((l + r) / 2);
      yield* ms(l, m);
      yield* ms(m + 1, r);
      yield* mergeArrays(l, m, r);
    }
    function* mergeArrays(l, m, r) {
      const tmp = [];
      let i = l, j = m + 1;
      while (i <= m && j <= r) {
        yield { type: 'compare', idxs: [i, j], line: 12 };
        if (a[i] < a[j]) tmp.push(a[i++]);
        else tmp.push(a[j++]);
      }
      while (i <= m) tmp.push(a[i++]);
      while (j <= r) tmp.push(a[j++]);
      for (let k = 0; k < tmp.length; k++) {
        a[l + k] = tmp[k];
        yield { type: 'swap', idxs: [l + k], line: 16 };
      }
    }
    yield* ms(0, a.length - 1);
    yield { type: 'sorted', idxs: a.map((_, i) => i) };
  }

  function togglePlay(root) {
    if (state.playing) {
      state.playing = false;
      cancelAnimationFrame(state.raf);
      updatePlayBtn(root);
      return;
    }
    state.playing = true;
    if (!gen) gen = makeGen();
    updatePlayBtn(root);
    state.lastStepAt = performance.now();
    loop(root);
  }

  function makeGen() {
    if (state.algo === 'bubble') return bubble();
    if (state.algo === 'quick')  return quick();
    if (state.algo === 'merge')  return merge();
  }

  function loop(root) {
    if (!state.playing) return;
    const delay = 800 - state.speed * 77;
    const now = performance.now();
    if (now - state.lastStepAt >= delay) {
      state.lastStepAt = now;
      const next = gen.next();
      if (!next.done) applyStep(root, next.value);
      else {
        updateBars(root, [], false, state.arr.map((_, i) => i));
        clearCode(root);
        state.playing = false; updatePlayBtn(root); gen = null; return;
      }
    }
    state.raf = requestAnimationFrame(() => loop(root));
  }

  function applyStep(root, step) {
    if (step.type === 'compare') {
      updateBars(root, step.idxs, false);
    } else if (step.type === 'swap') {
      updateBars(root, step.idxs, true);
    } else if (step.type === 'sorted') {
      updateBars(root, [], false, step.idxs);
    }
    clearCode(root);
    const line = root.querySelector(`.code-panel [data-line="${step.line}"]`);
    if (line) line.classList.add('active');
  }

  function clearCode(root) {
    root.querySelectorAll('.code-panel .line.active').forEach(l => l.classList.remove('active'));
  }

  function updatePlayBtn(root) {
    const b = root.querySelector('#sort-play');
    b.textContent = state.playing ? '⏸ Pause' : '▶ Play';
  }

  window.AlgoRegistry = window.AlgoRegistry || {};
  window.AlgoRegistry[SECTION_ID] = init;
})();