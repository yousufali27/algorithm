/* =========================================================
   DYNAMIC PROGRAMMING — 0/1 Knapsack + LCS
   ========================================================= */

(function () {
  const SECTION_ID = 'dp';

  let state = null;

  function init(root) {
    state = {
      algo: 'knapsack',
      playing: false,
      raf: null,
      speed: 5,
      lastStepAt: 0,
      gen: null
    };
    root.querySelectorAll('.dp-tab').forEach(t => {
      t.addEventListener('click', () => {
        if (state.playing) return;
        root.querySelectorAll('.dp-tab').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        state.algo = t.dataset.algo;
        setup(root);
      });
    });
    root.querySelector('#dp-speed').addEventListener('input', e => state.speed = parseInt(e.target.value));
    root.querySelector('#dp-play').addEventListener('click', () => togglePlay(root));
    root.querySelector('#dp-reset').addEventListener('click', () => { setup(root); });
    setup(root);
  }

  function setup(root) {
    cancelAnimationFrame(state.raf);
    state.playing = false;
    updatePlayBtn(root);
    if (state.algo === 'knapsack') setupKnapsack(root);
    else setupLCS(root);
  }

  // ---------- 0/1 Knapsack ----------
  function setupKnapsack(root) {
    const weights = [2, 3, 4, 5];
    const values  = [3, 4, 5, 6];
    const W = 5;
    const N = weights.length;
    state.dpData = { weights, values, W, N, table: Array.from({length: N + 1}, () => new Array(W + 1).fill(null)) };
    renderKnapsackTable(root);
    renderCodeKnapsack(root);
    state.gen = knapsackGen();
  }

  function* knapsackGen() {
    const { weights, values, W, N, table } = state.dpData;
    // base row
    for (let w = 0; w <= W; w++) { table[0][w] = 0; yield { type: 'fill', i: 0, j: w, line: 7 }; }
    for (let i = 1; i <= N; i++) {
      for (let w = 0; w <= W; w++) {
        yield { type: 'consider', i, w, line: 9 };
        if (weights[i - 1] <= w) {
          const include = values[i - 1] + table[i - 1][w - weights[i - 1]];
          const exclude = table[i - 1][w];
          yield { type: 'compare', i, w, a: include, b: exclude, line: 11 };
          table[i][w] = Math.max(include, exclude);
        } else {
          table[i][w] = table[i - 1][w];
        }
        yield { type: 'fill', i, w, value: table[i][w], line: 13 };
      }
    }
    yield { type: 'done', value: table[N][W] };
  }

  function renderKnapsackTable(root) {
    const { W, N, weights, values } = state.dpData;
    const wrap = root.querySelector('.dp-table-wrap');
    let html = '<table class="dp-table"><thead><tr><th></th>';
    for (let w = 0; w <= W; w++) html += `<th>${w}</th>`;
    html += '</tr></thead><tbody>';
    html += `<tr><th>—</th>` + new Array(W + 1).fill('<td>0</td>').join('') + '</tr>';
    for (let i = 1; i <= N; i++) {
      html += `<tr><th>i=${i} (w=${weights[i-1]},v=${values[i-1]})</th>`;
      for (let w = 0; w <= W; w++) html += `<td data-i="${i}" data-j="${w}"></td>`;
      html += '</tr>';
    }
    html += '</tbody></table>';
    wrap.innerHTML = html;
  }

  function renderCodeKnapsack(root) {
    const code = [
      'int knapsack(int W, vector<int>& wt, vector<int>& val) {',
      '    int n = wt.size();',
      '    vector<vector<int>> dp(n + 1, vector<int>(W + 1, 0));',
      '    for (int i = 1; i <= n; i++)',
      '        for (int w = 0; w <= W; w++)',
      '            if (wt[i - 1] <= w)',
      '                dp[i][w] = max(dp[i-1][w],',
      '                                val[i - 1] + dp[i-1][w - wt[i - 1]]);',
      '            else',
      '                dp[i][w] = dp[i-1][w];',
      '    return dp[n][W];',
      '}'
    ];
    const pre = root.querySelector('.code-panel pre');
    pre.innerHTML = code.map((l, idx) => {
      const ln = idx + 1;
      return `<span class="line" data-line="${ln}">${hl(l) || '&nbsp;'}</span>`;
    }).join('');
  }

  // ---------- LCS ----------
  function setupLCS(root) {
    const s1 = 'ABCBDAB', s2 = 'BDCABA';
    state.dpData = {
      s1, s2,
      table: Array.from({length: s1.length + 1}, () => new Array(s2.length + 1).fill(0))
    };
    renderLCSTable(root);
    renderCodeLCS(root);
    state.gen = lcsGen();
  }

  function* lcsGen() {
    const { s1, s2, table } = state.dpData;
    const m = s1.length, n = s2.length;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        yield { type: 'consider', i, j, line: 4 };
        if (s1[i - 1] === s2[j - 1]) {
          table[i][j] = table[i - 1][j - 1] + 1;
        } else {
          table[i][j] = Math.max(table[i - 1][j], table[i][j - 1]);
        }
        yield { type: 'fill', i, j, value: table[i][j], line: 7 };
      }
    }
    yield { type: 'done', value: table[m][n] };
  }

  function renderLCSTable(root) {
    const { s1, s2 } = state.dpData;
    const wrap = root.querySelector('.dp-table-wrap');
    let html = '<table class="dp-table"><thead><tr><th></th><th></th>';
    for (let c of s2) html += `<th>${c}</th>`;
    html += '</tr></thead><tbody>';
    html += `<tr><th></th><th>—</th>` + new Array(s2.length + 1).fill(0).map((_, j) => `<td>0</td>`).join('') + '</tr>';
    for (let i = 1; i <= s1.length; i++) {
      html += `<tr><th>${s1[i - 1]}</th><th>i=${i}</th>`;
      for (let j = 0; j <= s2.length; j++) html += `<td data-i="${i}" data-j="${j}"></td>`;
      html += '</tr>';
    }
    html += '</tbody></table>';
    wrap.innerHTML = html;
  }

  function renderCodeLCS(root) {
    const code = [
      'int lcs(string& a, string& b) {',
      '    int m = a.size(), n = b.size();',
      '    vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));',
      '    for (int i = 1; i <= m; i++)',
      '        for (int j = 1; j <= n; j++)',
      '            if (a[i - 1] == b[j - 1])',
      '                dp[i][j] = dp[i - 1][j - 1] + 1;',
      '            else',
      '                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);',
      '    return dp[m][n];',
      '}'
    ];
    const pre = root.querySelector('.code-panel pre');
    pre.innerHTML = code.map((l, idx) => {
      const ln = idx + 1;
      return `<span class="line" data-line="${ln}">${hl(l) || '&nbsp;'}</span>`;
    }).join('');
  }

  function hl(line) {
    return line
      .replace(/(int|if|else|for|return|while)/g, '<span class="kw">$1</span>')
      .replace(/(string|vector|size|max)/g, '<span class="fn">$1</span>')
      .replace(/(\b\d+\b)/g, '<span class="num">$1</span>');
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
    loop(root);
  }

  function loop(root) {
    if (!state.playing) return;
    const delay = 800 - state.speed * 77;
    const now = performance.now();
    if (now - state.lastStepAt >= delay) {
      state.lastStepAt = now;
      const next = state.gen.next();
      if (!next.done) {
        applyStep(root, next.value);
      } else {
        applyStep(root, next.value);
        state.playing = false;
        updatePlayBtn(root);
        return;
      }
    }
    state.raf = requestAnimationFrame(() => loop(root));
  }

  function applyStep(root, step) {
    if (step.type === 'fill' || step.type === 'consider') {
      const td = root.querySelector(`.dp-table td[data-i="${step.i}"][data-j="${step.j}"]`);
      if (td) {
        td.textContent = step.value !== undefined ? step.value : '';
        td.classList.add('active');
        setTimeout(() => td.classList.remove('active'), 200);
      }
    } else if (step.type === 'done') {
      // flash all
      root.querySelectorAll('.dp-table td').forEach(td => td.classList.add('active'));
    }
    root.querySelectorAll('.code-panel .line.active').forEach(l => l.classList.remove('active'));
    const line = root.querySelector(`.code-panel [data-line="${step.line}"]`);
    if (line) line.classList.add('active');
  }

  function updatePlayBtn(root) {
    root.querySelector('#dp-play').textContent = state.playing ? '⏸ Pause' : '▶ Play';
  }

  window.AlgoRegistry = window.AlgoRegistry || {};
  window.AlgoRegistry[SECTION_ID] = init;
})();