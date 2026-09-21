/* =========================================================
   GRAPH ALGORITHMS — BFS / DFS / Dijkstra
   Renders on canvas. Graph is hard-coded sample of 8 nodes.
   ========================================================= */

(function () {
  const SECTION_ID = 'graph';

  // Sample weighted undirected graph (8 nodes)
  const NODES = [
    { id: 0, x: 100, y: 100, label: 'A' },
    { id: 1, x: 240, y: 60,  label: 'B' },
    { id: 2, x: 380, y: 100, label: 'C' },
    { id: 3, x: 130, y: 240, label: 'D' },
    { id: 4, x: 280, y: 250, label: 'E' },
    { id: 5, x: 380, y: 300, label: 'F' },
    { id: 6, x: 80,  y: 360, label: 'G' },
    { id: 7, x: 240, y: 380, label: 'H' }
  ];
  const EDGES = [
    [0, 1, 4], [0, 3, 2], [1, 2, 3], [1, 3, 5], [2, 4, 6],
    [3, 4, 1], [3, 6, 7], [4, 5, 2], [4, 7, 8], [5, 7, 4], [6, 7, 1]
  ];

  const ALGOS = {
    bfs: {
      title: 'Breadth-First Search',
      complexity: 'O(V + E)',
      code: [
        'void bfs(int start) {',
        '    queue<int> q;',
        '    q.push(start); visited[start] = true;',
        '    while (!q.empty()) {',
        '        int u = q.front(); q.pop();',
        '        for (int v : adj[u])',
        '            if (!visited[v]) {',
        '                visited[v] = true;',
        '                q.push(v);',
        '            }',
        '    }',
        '}'
      ]
    },
    dfs: {
      title: 'Depth-First Search',
      complexity: 'O(V + E)',
      code: [
        'void dfs(int u) {',
        '    visited[u] = true;',
        '    for (int v : adj[u])',
        '        if (!visited[v]) dfs(v);',
        '}',
        '',
        'void run(int start) {',
        '    dfs(start);',
        '}'
      ]
    },
    dijkstra: {
      title: 'Dijkstra Shortest Path',
      complexity: 'O((V+E) log V)',
      code: [
        'void dijkstra(int src) {',
        '    dist.assign(N, INF); dist[src] = 0;',
        '    priority_queue<pair<int,int>> pq;',
        '    pq.push({0, src});',
        '    while (!pq.empty()) {',
        '        auto [d, u] = pq.top(); pq.pop();',
        '        if (d > dist[u]) continue;',
        '        for (auto [v, w] : adj[u])',
        '            if (dist[u] + w < dist[v]) {',
        '                dist[v] = dist[u] + w;',
        '                pq.push({dist[v], v});',
        '            }',
        '    }',
        '}'
      ]
    }
  };

  let state = null;

  function init(root) {
    state = {
      algo: 'bfs',
      playing: false,
      raf: null,
      lastStepAt: 0,
      speed: 5,
      visited: new Set(),
      frontier: [],
      currentNode: null,
      edgeHighlights: new Set(),
      dist: {},
      settled: new Set(),
      startNode: 0
    };
    root.querySelectorAll('.graph-tab').forEach(t => {
      t.addEventListener('click', () => {
        if (state.playing) return;
        root.querySelectorAll('.graph-tab').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        state.algo = t.dataset.algo;
        reset(root); renderCode(root); drawGraph(root);
      });
    });
    root.querySelector('#graph-speed').addEventListener('input', e => state.speed = parseInt(e.target.value));
    root.querySelector('#graph-play').addEventListener('click', () => togglePlay(root));
    root.querySelector('#graph-reset').addEventListener('click', () => { reset(root); drawGraph(root); });
    root.querySelector('#graph-start').addEventListener('change', e => {
      state.startNode = parseInt(e.target.value);
      reset(root); drawGraph(root);
    });
    renderCode(root);
    drawGraph(root);
  }

  function reset(root) {
    cancelAnimationFrame(state.raf);
    state.playing = false;
    state.visited.clear();
    state.frontier = [];
    state.currentNode = null;
    state.edgeHighlights.clear();
    state.dist = {};
    state.settled.clear();
    updatePlayBtn(root);
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
      .replace(/(void|int|if|while|return|for|auto|bool|assign|push|pop|empty|front|top)/g, '<span class="kw">$1</span>')
      .replace(/(bfs|dfs|dijkstra|queue|priority_queue|pair|vector|adj|dist|visited|INF|N)/g, '<span class="fn">$1</span>')
      .replace(/(\b\d+\b)/g, '<span class="num">$1</span>');
  }

  function drawGraph(root, highlightEdge = null) {
    const canvas = root.querySelector('#graph-canvas');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = 'rgba(15, 20, 36, 0)';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Edges
    EDGES.forEach(([a, b, w]) => {
      const na = NODES[a], nb = NODES[b];
      const key = `${Math.min(a,b)}-${Math.max(a,b)}`;
      const inPath = state.edgeHighlights.has(key);
      ctx.strokeStyle = inPath ? '#ec4899' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = inPath ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(na.x, na.y);
      ctx.lineTo(nb.x, nb.y);
      ctx.stroke();
      // weight
      const mx = (na.x + nb.x) / 2, my = (na.y + nb.y) / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(mx - 10, my - 9, 20, 16);
      ctx.fillStyle = '#06b6d4';
      ctx.font = '11px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(w, mx, my + 4);
    });

    // Nodes
    NODES.forEach(n => {
      const isVisited = state.visited.has(n.id);
      const isFrontier = state.frontier.includes(n.id);
      const isCurrent = state.currentNode === n.id;
      const isStart = n.id === state.startNode;

      // Halo
      if (isCurrent || isFrontier) {
        ctx.fillStyle = isCurrent ? 'rgba(124,58,237,0.4)' : 'rgba(6,182,212,0.3)';
        ctx.beginPath();
        ctx.arc(n.x, n.y, 28, 0, Math.PI * 2);
        ctx.fill();
      }
      // Body
      let grad = ctx.createLinearGradient(n.x - 20, n.y - 20, n.x + 20, n.y + 20);
      if (isVisited) {
        grad.addColorStop(0, '#10b981');
        grad.addColorStop(1, '#06b6d4');
      } else if (isStart) {
        grad.addColorStop(0, '#7c3aed');
        grad.addColorStop(1, '#ec4899');
      } else {
        grad.addColorStop(0, '#374151');
        grad.addColorStop(1, '#1f2937');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 22, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(n.label, n.x, n.y + 5);

      // Distance (for Dijkstra)
      if (state.algo === 'dijkstra' && state.dist[n.id] !== undefined) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = '11px JetBrains Mono';
        ctx.fillText(state.dist[n.id] === Infinity ? '∞' : state.dist[n.id], n.x, n.y + 38);
      }
    });
  }

  function togglePlay(root) {
    if (state.playing) {
      state.playing = false;
      cancelAnimationFrame(state.raf);
      updatePlayBtn(root);
      return;
    }
    state.playing = true;
    updatePlayBtn(root);
    state.lastStepAt = performance.now();
    state.gen = makeGen();
    loop(root);
  }

  function makeGen() {
    if (state.algo === 'bfs') return bfsGen();
    if (state.algo === 'dfs') return dfsGen();
    return dijkstraGen();
  }

  function* bfsGen() {
    const visited = new Set([state.startNode]);
    const queue = [state.startNode];
    state.frontier = [state.startNode];
    yield { line: 3, type: 'visit', node: state.startNode };
    while (queue.length) {
      const u = queue.shift();
      state.currentNode = u;
      yield { line: 5, type: 'pop', node: u };
      for (const [a, b] of EDGES) {
        let v = null;
        if (a === u) v = b;
        else if (b === u) v = a;
        if (v === null) continue;
        state.edgeHighlights.add(`${Math.min(u,v)}-${Math.max(u,v)}`);
        yield { line: 6, type: 'consider', node: v };
        if (!visited.has(v)) {
          visited.add(v);
          queue.push(v);
          state.frontier = [...queue];
          yield { line: 8, type: 'visit', node: v };
        }
      }
      state.edgeHighlights.clear();
    }
    state.currentNode = null;
    state.frontier = [];
    yield { line: 9, type: 'done' };
  }

  function* dfsGen() {
    const visited = new Set();
    const adj = buildAdj();
    function* go(u) {
      visited.add(u);
      state.currentNode = u;
      yield { line: 2, type: 'visit', node: u };
      for (const v of adj[u]) {
        state.edgeHighlights.add(`${Math.min(u,v)}-${Math.max(u,v)}`);
        yield { line: 3, type: 'consider', node: v };
        if (!visited.has(v)) {
          yield* go(v);
        }
      }
      state.edgeHighlights.clear();
    }
    yield* go(state.startNode);
    state.currentNode = null;
    yield { line: 8, type: 'done' };
  }

  function* dijkstraGen() {
    const adj = buildAdj();
    const dist = new Array(NODES.length).fill(Infinity);
    dist[state.startNode] = 0;
    state.dist = { ...dist };
    const settled = new Set();
    // naive approach: pick min unvisited each step
    while (settled.size < NODES.length) {
      let u = -1;
      for (let i = 0; i < NODES.length; i++) {
        if (!settled.has(i) && (u === -1 || dist[i] < dist[u])) u = i;
      }
      if (u === -1 || dist[u] === Infinity) break;
      settled.add(u);
      state.settled = new Set(settled);
      state.currentNode = u;
      yield { line: 7, type: 'settle', node: u };
      for (const [a, b, w] of EDGES) {
        let v = -1;
        if (a === u) v = b;
        else if (b === u) v = a;
        if (v === -1 || settled.has(v)) continue;
        const nd = dist[u] + w;
        state.edgeHighlights.add(`${Math.min(u,v)}-${Math.max(u,v)}`);
        yield { line: 10, type: 'consider', node: v };
        if (nd < dist[v]) {
          dist[v] = nd;
          state.dist = { ...dist };
          yield { line: 12, type: 'update', node: v };
        }
      }
      state.edgeHighlights.clear();
    }
    state.currentNode = null;
    yield { line: 14, type: 'done' };
  }

  function buildAdj() {
    const adj = NODES.map(() => []);
    EDGES.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); });
    return adj;
  }

  function loop(root) {
    if (!state.playing) return;
    const delay = 800 - state.speed * 77;
    const now = performance.now();
    if (now - state.lastStepAt >= delay) {
      state.lastStepAt = now;
      const next = state.gen.next();
      applyCodeHighlight(root, next.value?.line);
      // Sync visited set
      state.visited = collectVisited();
      if (!next.done) {
        drawGraph(root);
      } else {
        drawGraph(root);
        state.playing = false;
        updatePlayBtn(root);
        return;
      }
    }
    state.raf = requestAnimationFrame(() => loop(root));
  }

  // Helper: not strictly needed — kept for clarity
  function collectVisited() {
    if (state.algo === 'bfs') return state.settled; // unused
    return state.visited;
  }

  function applyCodeHighlight(root, line) {
    if (!line) return;
    root.querySelectorAll('.code-panel .line.active').forEach(l => l.classList.remove('active'));
    const el = root.querySelector(`.code-panel [data-line="${line}"]`);
    if (el) el.classList.add('active');
  }

  function updatePlayBtn(root) {
    root.querySelector('#graph-play').textContent = state.playing ? '⏸ Pause' : '▶ Play';
  }

  window.AlgoRegistry = window.AlgoRegistry || {};
  window.AlgoRegistry[SECTION_ID] = init;
})();