/* =========================================================
   M-COLORING GRAPH VISUALIZER — full edition
   - Glowing canvas, pulsing current vertex, smooth transitions
   - Live step-by-step narration (try / conflict / place / backtrack / solution)
   - Toggleable adjacency matrix (colored by row vertex)
   - Chromatic-number badge (smallest M with a solution)
   - Solution gallery: chips for every coloring found, clickable to apply
   ========================================================= */

(function () {
  const SECTION_ID = 'mcoloring';

  // ----------------------------------------------------------
  //  Sample graphs
  // ----------------------------------------------------------
  const GRAPHS = {
    triangle: {
      label: 'Triangle K₃',
      desc: 'Complete graph on 3 vertices — needs 3 colors (χ = 3).',
      nodes: [
        { id: 1, x: 0.20, y: 0.25, label: '1' },
        { id: 2, x: 0.80, y: 0.25, label: '2' },
        { id: 3, x: 0.50, y: 0.78, label: '3' }
      ],
      edges: [[1, 2], [2, 3], [1, 3]],
      defaultM: 3
    },
    square: {
      label: '4-Cycle C₄',
      desc: 'Bipartite — 2 colors suffice (χ = 2).',
      nodes: [
        { id: 1, x: 0.25, y: 0.25, label: '1' },
        { id: 2, x: 0.75, y: 0.25, label: '2' },
        { id: 3, x: 0.75, y: 0.78, label: '3' },
        { id: 4, x: 0.25, y: 0.78, label: '4' }
      ],
      edges: [[1, 2], [2, 3], [3, 4], [4, 1]],
      defaultM: 2
    },
    pentagon: {
      label: 'Pentagon C₅',
      desc: 'Odd cycle — needs 3 colors (χ = 3).',
      nodes: [
        { id: 1, x: 0.50, y: 0.18, label: '1' },
        { id: 2, x: 0.85, y: 0.45, label: '2' },
        { id: 3, x: 0.72, y: 0.85, label: '3' },
        { id: 4, x: 0.28, y: 0.85, label: '4' },
        { id: 5, x: 0.15, y: 0.45, label: '5' }
      ],
      edges: [[1, 2], [2, 3], [3, 4], [4, 5], [5, 1]],
      defaultM: 3
    },
    star: {
      label: 'Star K₁,₄',
      desc: 'Center + 4 leaves — only the center touches anyone, so χ = 2.',
      nodes: [
        { id: 1, x: 0.50, y: 0.50, label: '1' },
        { id: 2, x: 0.18, y: 0.18, label: '2' },
        { id: 3, x: 0.82, y: 0.18, label: '3' },
        { id: 4, x: 0.82, y: 0.82, label: '4' },
        { id: 5, x: 0.18, y: 0.82, label: '5' }
      ],
      edges: [[1, 2], [1, 3], [1, 4], [1, 5]],
      defaultM: 2
    },
    complete5: {
      label: 'K₅ (Complete)',
      desc: 'Every vertex connects to every other — needs 5 colors (χ = 5).',
      nodes: [
        { id: 1, x: 0.50, y: 0.16, label: '1' },
        { id: 2, x: 0.85, y: 0.40, label: '2' },
        { id: 3, x: 0.70, y: 0.84, label: '3' },
        { id: 4, x: 0.30, y: 0.84, label: '4' },
        { id: 5, x: 0.15, y: 0.40, label: '5' }
      ],
      edges: [
        [1, 2], [1, 3], [1, 4], [1, 5],
        [2, 3], [2, 4], [2, 5],
        [3, 4], [3, 5], [4, 5]
      ],
      defaultM: 5
    },
    petersen: {
      label: 'Petersen-like',
      desc: 'Outer pentagon + inner pentagram — needs 3 colors (χ = 3).',
      nodes: [
        { id: 1, x: 0.50, y: 0.12, label: '1' },
        { id: 2, x: 0.82, y: 0.34, label: '2' },
        { id: 3, x: 0.68, y: 0.78, label: '3' },
        { id: 4, x: 0.32, y: 0.78, label: '4' },
        { id: 5, x: 0.18, y: 0.34, label: '5' },
        { id: 6, x: 0.50, y: 0.30, label: '6' },
        { id: 7, x: 0.66, y: 0.50, label: '7' },
        { id: 8, x: 0.58, y: 0.68, label: '8' },
        { id: 9, x: 0.42, y: 0.68, label: '9' },
        { id: 10,x: 0.34, y: 0.50, label: '10' }
      ],
      edges: [
        [1, 2], [2, 3], [3, 4], [4, 5], [5, 1],
        [1, 6], [2, 7], [3, 8], [4, 9], [5, 10],
        [6, 8], [8, 10], [10, 7], [7, 9], [9, 6]
      ],
      defaultM: 3
    }
  };

  // ----------------------------------------------------------
  //  C++ source
  // ----------------------------------------------------------
  const MCOLORING_CPP_LINES = [
    '#include <bits/stdc++.h>',
    'using namespace std;',
    '',
    'int N, M;                       // N vertices, M colors',
    'vector<vector<int>> adj;',
    'vector<int> color;             // 0 = uncolored',
    'long long solutions = 0;',
    '',
    'bool isSafe(int v, int c) {',
    '    for (int nb : adj[v])',
    '        if (color[nb] == c) return false;',
    '    return true;',
    '}',
    '',
    'void mColoring(int v) {',
    '    if (v > N) {                 // all vertices assigned',
    '        ++solutions;             // found a valid coloring',
    '        return;',
    '    }',
    '    for (int c = 1; c <= M; ++c) {',
    '        if (isSafe(v, c)) {',
    '            color[v] = c;        // assign color c',
    '            mColoring(v + 1);    // recurse',
    '            color[v] = 0;        // backtrack',
    '        }',
    '    }',
    '}',
    '',
    'int main() {',
    '    cin >> N >> M;',
    '    adj.assign(N + 1, {}); color.assign(N + 1, 0);',
    '    int u, v; while (cin >> u >> v && (u || v))',
    '        adj[u].push_back(v), adj[v].push_back(u);',
    '    mColoring(1);',
    '    cout << "Solutions: " << solutions << endl;',
    '    return 0;',
    '}'
  ];

  // ----------------------------------------------------------
  //  Palette (HSL-spaced, vibrant on dark)
  // ----------------------------------------------------------
  const PALETTE = [
    { hex: '#ff4d6d', name: 'Crimson' },
    { hex: '#06d6a0', name: 'Mint'    },
    { hex: '#118ab2', name: 'Sky'     },
    { hex: '#ffd166', name: 'Sunshine'},
    { hex: '#9b5de5', name: 'Lavender'},
    { hex: '#00bbf9', name: 'Aqua'    },
    { hex: '#f15bb5', name: 'Rose'    },
    { hex: '#84cc16', name: 'Lime'    }
  ];

  // ----------------------------------------------------------
  //  State
  // ----------------------------------------------------------
  let state = null;
  let gen = null;
  let chromaticCache = {};   // graphKey -> χ

  function init(root) {
    state = {
      graphKey: 'pentagon',
      M: 3,
      speed: 5,
      playing: false,
      raf: null,
      lastStepAt: 0,
      steps: 0,
      backtracks: 0,
      solutions: 0,
      solutionsFound: [],
      galleryIdx: 0,
      currentVertex: null,
      tryingColor: null,
      conflictColor: null,
      activeEdges: new Set(),
      color: {},
      matrixVisible: true,
      autoscroll: true
    };
    loadGraph(root, state.graphKey, true);
    renderCode(root);
    renderMatrix(root);
    renderSolutionGallery(root);
    attachControls(root);
    draw(root);
    updateStats(root);
    updateChromatic(root);
  }

  // ----------------------------------------------------------
  //  Graph / state setup
  // ----------------------------------------------------------
  function loadGraph(root, key, reset) {
    if (reset) cancelAnimationFrame(state.raf);
    state.graphKey = key;
    const g = GRAPHS[key];
    state.nodes = g.nodes.map(n => ({ ...n }));
    state.edges = g.edges.slice();
    state.N = state.nodes.length;

    if (state.M < g.defaultM) state.M = g.defaultM;
    const mSel = root.querySelector('#mc-m');
    if (mSel) mSel.value = state.M;

    state.color = {};
    state.nodes.forEach(n => state.color[n.id] = 0);
    state.currentVertex = null;
    state.tryingColor = null;
    state.conflictColor = null;
    state.activeEdges.clear();
    state.steps = 0;
    state.backtracks = 0;
    state.solutions = 0;
    state.solutionsFound = [];
    state.galleryIdx = 0;
    state.playing = false;
    gen = makeStepGenerator();
    updatePlayBtn(root);
    clearNarration(root);
    renderMatrix(root);
    renderSolutionGallery(root);
    updateChromatic(root);
  }

  // ----------------------------------------------------------
  //  Controls
  // ----------------------------------------------------------
  function attachControls(root) {
    const $ = (s) => root.querySelector(s);

    root.querySelectorAll('.mc-tab').forEach(t => {
      t.addEventListener('click', () => {
        if (state.playing) return;
        root.querySelectorAll('.mc-tab').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        loadGraph(root, t.dataset.graph, true);
        draw(root); renderCode(root); updateStats(root);
      });
    });

    $('#mc-m').addEventListener('change', e => {
      state.M = parseInt(e.target.value);
      loadGraph(root, state.graphKey, true);
      draw(root); updateStats(root);
    });

    $('#mc-speed').addEventListener('input', e => { state.speed = parseInt(e.target.value); });

    $('#mc-play').addEventListener('click', () => togglePlay(root));
    $('#mc-step').addEventListener('click', () => stepOnce(root));
    $('#mc-reset').addEventListener('click', () => {
      loadGraph(root, state.graphKey, true);
      draw(root); updateStats(root);
    });

    $('#mc-matrix-toggle').addEventListener('click', () => {
      state.matrixVisible = !state.matrixVisible;
      root.querySelector('#mc-matrix-panel').classList.toggle('hidden', !state.matrixVisible);
    });

    $('#mc-gallery-prev').addEventListener('click', () => cycleSolution(root, -1));
    $('#mc-gallery-next').addEventListener('click', () => cycleSolution(root, +1));

    $('#mc-autoscroll').addEventListener('change', e => { state.autoscroll = e.target.checked; });

    // Solved-step redraw on resize
    window.addEventListener('resize', () => draw(root));
  }

  function updatePlayBtn(root) {
    const btn = root.querySelector('#mc-play');
    if (btn) btn.textContent = state.playing ? '⏸ Pause' : '▶ Play';
  }

  function updateStats(root) {
    root.querySelector('#mc-steps').textContent = state.steps;
    root.querySelector('#mc-backtracks').textContent = state.backtracks;
    root.querySelector('#mc-solutions').textContent = state.solutions;
  }

  // ----------------------------------------------------------
  //  Chromatic number (smallest M with any solution)
  // ----------------------------------------------------------
  function chromaticNumber(key) {
    if (chromaticCache[key] !== undefined) return chromaticCache[key];
    const g = GRAPHS[key];
    const N = g.nodes.length;
    const edges = g.edges;
    const adj = buildAdjLocal(N, edges);
    const order = g.nodes.map(n => n.id);

    // Try M = 1..N; smallest M with any solution is χ(G).
    function solvesWith(M) {
      const col = {};
      order.forEach(v => { col[v] = -1; });
      // Use colors 0..M-1 internally for simplicity.
      function bt(k) {
        if (k === order.length) return true;
        const v = order[k];
        for (let c = 0; c < M; c++) {
          let ok = true;
          for (let nb of adj[v]) if (col[nb] === c) { ok = false; break; }
          if (ok) { col[v] = c; if (bt(k + 1)) return true; col[v] = -1; }
        }
        return false;
      }
      return bt(0);
    }

    for (let m = 1; m <= N; m++) {
      if (solvesWith(m)) { chromaticCache[key] = m; return m; }
    }
    chromaticCache[key] = N; // worst case (shouldn't normally reach here)
    return N;
  }

  function buildAdjLocal(N, edges) {
    const adj = {};
    for (let i = 1; i <= N; i++) adj[i] = [];
    edges.forEach(([u, v]) => { adj[u].push(v); adj[v].push(u); });
    return adj;
  }

  function updateChromatic(root) {
    const chi = chromaticNumber(state.graphKey);
    const el = root.querySelector('#mc-chromatic');
    if (!el) return;
    el.textContent = `χ(G) = ${chi}`;
    el.classList.remove('badge-violet', 'badge-cyan', 'badge-green');
    if (state.M < chi)      el.classList.add('badge-violet');
    else if (state.M === chi) el.classList.add('badge-green');
    else                     el.classList.add('badge-cyan');
  }

  // ----------------------------------------------------------
  //  Step generator — yields one frame at a time
  // ----------------------------------------------------------
  function makeStepGenerator() {
    const adj = buildAdjLocal(state.N, state.edges);
    const color = state.color;
    const M = state.M;
    const order = state.nodes.map(n => n.id);

    function* tryVertex(v) {
      if (v > state.N) {
        state.solutions += 1;
        // Snapshot the coloring
        const snap = { ...color };
        state.solutionsFound.push(snap);
        yield { type: 'solution', color: snap };
        return;
      }

      state.currentVertex = v;
      yield { type: 'enter', v };

      for (let c = 1; c <= M; ++c) {
        state.tryingColor = c;
        state.activeEdges.clear();
        const conflicts = [];
        for (let nb of adj[v]) {
          const key = edgeKey(v, nb);
          state.activeEdges.add(key);
          if (color[nb] === c) conflicts.push(nb);
        }
        yield { type: 'try', v, c, conflicts: [...conflicts] };

        if (conflicts.length === 0) {
          color[v] = c;
          state.tryingColor = null;
          state.conflictColor = null;
          yield { type: 'place', v, c };
          yield* tryVertex(v + 1);
          color[v] = 0;
          state.backtracks += 1;
          yield { type: 'backtrack', v, c };
        } else {
          state.conflictColor = c;
          yield { type: 'conflict', v, c, conflicts: [...conflicts] };
          state.conflictColor = null;
        }
      }
      state.currentVertex = null;
      state.activeEdges.clear();
      yield { type: 'leave', v };
    }
    return tryVertex(order[0]);
  }

  function edgeKey(u, v) {
    return `${Math.min(u, v)}-${Math.max(u, v)}`;
  }

  // ----------------------------------------------------------
  //  Play / Step loop
  // ----------------------------------------------------------
  function togglePlay(root) {
    state.playing = !state.playing;
    updatePlayBtn(root);
    if (state.playing) {
      state.lastStepAt = 0;
      state.raf = requestAnimationFrame(() => loop(root));
    } else {
      cancelAnimationFrame(state.raf);
    }
  }

  function stepOnce(root) {
    if (state.playing) { state.playing = false; updatePlayBtn(root); }
    advance(root);
  }

  function loop(root) {
    if (!state.playing) return;
    const delay = 800 - state.speed * 77;
    const now = performance.now();
    if (now - state.lastStepAt >= delay) {
      state.lastStepAt = now;
      const more = advance(root);
      if (!more) {
        state.playing = false;
        updatePlayBtn(root);
        return;
      }
    }
    state.raf = requestAnimationFrame(() => loop(root));
  }

  function advance(root) {
    const next = gen.next();
    if (next.done) { draw(root); return false; }
    state.steps += 1;
    applyCodeHighlight(root, lineForType(next.value.type));
    handleNarration(root, next.value);
    draw(root);
    if (next.value.type === 'place' || next.value.type === 'backtrack') renderMatrix(root);
    if (next.value.type === 'solution') renderSolutionGallery(root);
    updateStats(root);
    return true;
  }

  function lineForType(t) {
    switch (t) {
      case 'enter':     return 16;
      case 'try':       return 21;
      case 'place':     return 23;
      case 'conflict':  return 22;
      case 'backtrack': return 25;
      case 'solution':  return 18;
      case 'leave':     return 27;
      default:          return null;
    }
  }

  // ----------------------------------------------------------
  //  Step narration log
  // ----------------------------------------------------------
  function clearNarration(root) {
    const log = root.querySelector('#mc-narration-log');
    if (!log) return;
    log.innerHTML = '<div class="mc-log-empty">Press <strong>▶ Play</strong> or <strong>⏭ Step</strong> to start the algorithm.</div>';
  }

  function handleNarration(root, ev) {
    const log = root.querySelector('#mc-narration-log');
    if (!log) return;

    // First line — replace the empty placeholder
    if (log.querySelector('.mc-log-empty')) log.innerHTML = '';

    let tag = '', html = '';
    switch (ev.type) {
      case 'enter':
        tag = '→'; html = `Considering <b>V${ev.v}</b> — try colors 1..${state.M}`;
        break;
      case 'try':
        tag = '→'; html = `Trying <b>color ${ev.c}</b> on <b>V${ev.v}</b>`
                       + (ev.conflicts.length
                          ? ` — conflict with <b>V${ev.conflicts.join(', V')}</b>`
                          : ` — safe so far ✓`);
        break;
      case 'place':
        tag = '✓'; html = `Placed: <b>V${ev.v} = color ${ev.c}</b> (${colorName(ev.c)})`;
        break;
      case 'conflict':
        tag = '✗'; html = `Conflict — <b>V${ev.v}</b> can't use color ${ev.c} (neighbors ${ev.conflicts.join(', V')} already have it)`;
        break;
      case 'backtrack':
        tag = '↶'; html = `Backtrack: <b>V${ev.v}</b> reset to uncolored`;
        break;
      case 'solution':
        tag = '🎉'; html = `Solution #${state.solutions} found: ${ev.color ? formatColoring(ev.color) : ''}`;
        break;
      case 'leave':
        tag = '·'; html = `Done with <b>V${ev.v}</b>`;
        break;
      default:
        return;
    }

    const cls = 'mc-log-' + ({
      try: 'try', conflict: 'conflict', place: 'place',
      backtrack: 'backtrack', solution: 'sol', enter: 'try', leave: 'try'
    })[ev.type] || 'try';

    const line = document.createElement('div');
    line.className = `mc-log-line mc-log-${cls}`;
    line.innerHTML = `<span class="mc-log-tag">${tag}</span><span class="mc-log-text">${html}</span>`;
    log.appendChild(line);

    // Cap the log at 400 lines to keep DOM small
    const lines = log.querySelectorAll('.mc-log-line');
    if (lines.length > 400) lines[0].remove();

    if (state.autoscroll) log.scrollTop = log.scrollHeight;
  }

  function colorName(c) {
    return PALETTE[(c - 1) % PALETTE.length].name;
  }
  function colorHex(c) {
    return PALETTE[(c - 1) % PALETTE.length].hex;
  }

  function formatColoring(color) {
    return Object.keys(color).sort((a, b) => a - b).map(v => `V${v}=${color[v]}`).join(' ');
  }

  // ----------------------------------------------------------
  //  Code panel
  // ----------------------------------------------------------
  function renderCode(root) {
    const pre = root.querySelector('.code-panel pre');
    pre.innerHTML = MCOLORING_CPP_LINES.map((line, idx) => {
      const ln = idx + 1;
      const safe = line.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const cls = highlightLine(safe);
      return `<span class="line" data-line="${ln}">${cls || '&nbsp;'}</span>`;
    }).join('');
  }

  function highlightLine(line) {
    return line
      .replace(/(#include|using|return|if|for|void|bool|int|long|vector|char|main|while|do)/g, '<span class="kw">$1</span>')
      .replace(/(adj|color|solutions|N|M|nb|isSafe|mColoring|cin|cout|endl|push_back|assign)/g, '<span class="fn">$1</span>')
      .replace(/(\/\/.*)/g, '<span class="cm">$1</span>')
      .replace(/(["'][^"']*["'])/g, '<span class="st">$1</span>')
      .replace(/(\b\d+\b)/g, '<span class="num">$1</span>')
      .replace(/(#include &lt;.*&gt;)/g, '<span class="pp">$1</span>');
  }

  function applyCodeHighlight(root, line) {
    if (!line) return;
    root.querySelectorAll('.code-panel .line.active').forEach(l => l.classList.remove('active'));
    const el = root.querySelector(`.code-panel [data-line="${line}"]`);
    if (el) el.classList.add('active');
  }

  // ----------------------------------------------------------
  //  Adjacency Matrix
  // ----------------------------------------------------------
  function renderMatrix(root) {
    const wrap = root.querySelector('#mc-matrix');
    if (!wrap) return;

    const N = state.N;
    const edgesSet = new Set(state.edges.map(([u, v]) => edgeKey(u, v)));

    // Total grid = (N+1) cols × (N+1) rows (header row + header col)
    wrap.style.gridTemplateColumns = `36px repeat(${N}, 36px)`;
    wrap.style.gridTemplateRows    = `36px repeat(${N}, 36px)`;
    wrap.innerHTML = '';

    // Top-left empty cell
    wrap.appendChild(makeMatrixCell('', 'mc-matrix-header'));
    // Top header row
    for (let j = 1; j <= N; j++) wrap.appendChild(makeMatrixCell(String(j), 'mc-matrix-header'));

    for (let i = 1; i <= N; i++) {
      // Left header
      const rowColor = colorHex(state.color[i]) || 'var(--violet)';
      const hc = makeMatrixCell(String(i), 'mc-matrix-header');
      hc.style.color = state.color[i] ? colorHex(state.color[i]) : 'var(--text-faint)';
      wrap.appendChild(hc);

      for (let j = 1; j <= N; j++) {
        if (i === j) {
          wrap.appendChild(makeMatrixCell('·', 'mc-matrix-cell diag'));
        } else {
          const key = edgeKey(i, j);
          const isEdge = edgesSet.has(key);
          const cell = makeMatrixCell(isEdge ? '1' : '·', 'mc-matrix-cell' + (isEdge ? ' is-edge' : ''));
          if (isEdge) cell.style.setProperty('--mc-cell-color', rowColor);
          wrap.appendChild(cell);
        }
      }
    }
  }

  function makeMatrixCell(text, klass) {
    const div = document.createElement('div');
    div.className = klass;
    div.textContent = text;
    return div;
  }

  // ----------------------------------------------------------
  //  Solution gallery
  // ----------------------------------------------------------
  function renderSolutionGallery(root) {
    const list = root.querySelector('#mc-solutions-list');
    const count = root.querySelector('#mc-gallery-count');
    if (!list) return;

    if (!state.solutionsFound.length) {
      list.innerHTML = '<div class="mc-empty-gallery">No solutions yet — press Play!</div>';
      if (count) count.textContent = '0 found';
      return;
    }

    if (count) count.textContent = `${state.solutionsFound.length} found`;

    // Build incrementally to avoid full re-render thrash on each solution
    const currentCount = list.querySelectorAll('.mc-solution-chip').length;
    for (let i = currentCount; i < state.solutionsFound.length; i++) {
      const chip = document.createElement('div');
      chip.className = 'mc-solution-chip';
      chip.dataset.idx = i;
      chip.addEventListener('click', () => applySolution(root, i));
      chip.innerHTML = `
        <div class="mc-chip-label">Solution #${i + 1}</div>
        <div class="mc-chip-swatches"></div>`;
      const swatchBox = chip.querySelector('.mc-chip-swatches');
      const snap = state.solutionsFound[i];
      Object.keys(snap).sort((a, b) => a - b).forEach(v => {
        const c = snap[v];
        const sw = document.createElement('div');
        sw.className = 'sw';
        sw.style.background = colorHex(c);
        sw.textContent = c;
        swatchBox.appendChild(sw);
      });
      list.appendChild(chip);
    }

    updateGalleryActive(root);
  }

  function updateGalleryActive(root) {
    const list = root.querySelector('#mc-solutions-list');
    if (!list) return;
    list.querySelectorAll('.mc-solution-chip').forEach((c, idx) => {
      c.classList.toggle('active', idx === state.galleryIdx);
    });
    // Scroll active chip into view
    const active = list.querySelector('.mc-solution-chip.active');
    if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }

  function cycleSolution(root, dir) {
    if (!state.solutionsFound.length) return;
    state.galleryIdx = (state.galleryIdx + dir + state.solutionsFound.length) % state.solutionsFound.length;
    applySolution(root, state.galleryIdx);
  }

  function applySolution(root, idx) {
    if (idx < 0 || idx >= state.solutionsFound.length) return;
    state.galleryIdx = idx;
    state.color = { ...state.solutionsFound[idx] };
    draw(root);
    renderMatrix(root);
    updateGalleryActive(root);
  }

  // ----------------------------------------------------------
  //  Canvas drawing — vertex glow, current vertex pulse
  // ----------------------------------------------------------
  function draw(root) {
    const canvas = root.querySelector('#mc-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const W = rect.width, H = rect.height;

    // Subtle radial bg glow
    const bg = ctx.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.45, Math.max(W, H));
    bg.addColorStop(0, 'rgba(124, 58, 237, 0.10)');
    bg.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const pos = {};
    state.nodes.forEach(n => {
      pos[n.id] = { x: n.x * W, y: n.y * H };
    });

    const now = performance.now();
    const pulse = 4 * Math.sin(now / 200);

    // ----- Edges -----
    state.edges.forEach(([u, v]) => {
      const pu = pos[u], pv = pos[v];
      const key = edgeKey(u, v);
      const cu = state.color[u], cv = state.color[v];
      const active = state.activeEdges.has(key);

      let stroke, width, glow = false;
      if (cu !== 0 && cv !== 0) {
        if (cu === cv) { stroke = '#ef4444'; width = 3.5; glow = true; }
        else           { stroke = '#10b981'; width = 2.5; glow = true; }
      } else if (active) {
        stroke = '#fbbf24'; width = 2.5; glow = true;
      } else {
        stroke = 'rgba(255,255,255,0.16)'; width = 1.5;
      }

      // Glow
      if (glow) {
        ctx.save();
        ctx.shadowColor = stroke;
        ctx.shadowBlur = 14;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(pu.x, pu.y); ctx.lineTo(pv.x, pv.y);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(pu.x, pu.y); ctx.lineTo(pv.x, pv.y);
        ctx.stroke();
      }

      // Edge midpoint label (tiny u,v)
      const mx = (pu.x + pv.x) / 2, my = (pu.y + pv.y) / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      const label = `${u},${v}`;
      ctx.font = '10px JetBrains Mono';
      const tw = ctx.measureText(label).width + 8;
      ctx.fillRect(mx - tw / 2, my - 8, tw, 14);
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText(label, mx, my + 3);
    });

    // ----- Nodes -----
    state.nodes.forEach(n => {
      const p = pos[n.id];
      const c = state.color[n.id];
      const isCurrent = state.currentVertex === n.id;

      // Current-vertex pulse halo
      if (isCurrent) {
        const r = 38 + pulse;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        grad.addColorStop(0, 'rgba(124, 58, 237, 0.6)');
        grad.addColorStop(1, 'rgba(124, 58, 237, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      const fillColor = c !== 0
        ? colorHex(c)
        : (isCurrent && state.tryingColor ? colorHex(state.tryingColor) : '#1f2937');

      // Per-vertex colored glow halo (only when colored)
      if (c !== 0) {
        const haloR = 32;
        const grad = ctx.createRadialGradient(p.x, p.y, 6, p.x, p.y, haloR);
        grad.addColorStop(0, fillColor + '99'); // 60% alpha
        grad.addColorStop(1, fillColor + '00');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, haloR, 0, Math.PI * 2);
        ctx.fill();
      }

      // Body
      ctx.lineWidth = isCurrent ? 3 : 2;
      ctx.fillStyle = fillColor;
      ctx.strokeStyle = isCurrent ? '#ffffff' : (c !== 0 ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.3)');
      ctx.beginPath();
      ctx.arc(p.x, p.y, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Vertex label
      ctx.fillStyle = (c !== 0) ? '#ffffff' : '#cbd5e1';
      ctx.font = 'bold 14px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(n.label, p.x, p.y + 5);

      // Color chip + name under vertex
      ctx.font = '10px JetBrains Mono';
      if (c !== 0) {
        ctx.fillStyle = '#fff';
        ctx.fillText(`${colorName(c)} (${c})`, p.x, p.y + 42);
      } else {
        ctx.fillStyle = '#6b7280';
        ctx.fillText('uncolored', p.x, p.y + 42);
      }
    });

    // ----- Status banner (top) -----
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(8, 8, W - 16, 30);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px JetBrains Mono';
    ctx.textAlign = 'left';
    ctx.fillText(`M = ${state.M}    |    ${GRAPHS[state.graphKey].label}    |    ${state.solutions} solution(s) so far`, 16, 27);

    if (state.currentVertex !== null) {
      const msg = state.tryingColor
        ? (state.conflictColor
            ? `✗ Color ${state.tryingColor} conflicts on V${state.currentVertex}`
            : `Trying color ${state.tryingColor} on V${state.currentVertex}…`)
        : `Backtracking from V${state.currentVertex}…`;
      ctx.fillStyle = state.conflictColor ? '#ef4444' : '#fbbf24';
      ctx.textAlign = 'right';
      ctx.fillText(msg, W - 16, 27);
    }
  }

  // ----------------------------------------------------------
  //  Registry
  // ----------------------------------------------------------
  window.AlgoRegistry = window.AlgoRegistry || {};
  window.AlgoRegistry[SECTION_ID] = init;
})();
