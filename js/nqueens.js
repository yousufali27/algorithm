/* =========================================================
   N-QUEENS VISUALIZER
   Generator-based stepper for clean play/pause/step control.
   ========================================================= */

(function () {
  const SECTION_ID = 'nqueens';

  // Precomputed solution counts for N=4..14
  const SOLUTION_COUNTS = {
    4: 2, 5: 10, 6: 4, 7: 40, 8: 92, 9: 352, 10: 724,
    11: 2680, 12: 14200, 13: 73712, 14: 365596
  };

  // C++ source mirrored as data so we can highlight lines
  const NQUEENS_CPP_LINES = [
    '#include <bits/stdc++.h>',
    'using namespace std;',
    '',
    'int N;                       // board size',
    'vector<int> col, diag1, diag2;',
    'long long solutions = 0;',
    '',
    'bool isSafe(int r, int c) {',
    '    return !col[c] && !diag1[r - c + N] && !diag2[r + c];',
    '}',
    '',
    'void solve(int r) {',
    '    if (r == N) {',
    '        solutions++;',
    '        return;',
    '    }',
    '    for (int c = 0; c < N; c++) {',
    '        if (isSafe(r, c)) {',
    '            col[c] = diag1[r - c + N] = diag2[r + c] = 1;',
    '            solve(r + 1);',
    '            col[c] = diag1[r - c + N] = diag2[r + c] = 0;',
    '        }',
    '    }',
    '}',
    '',
    'int main(int argc, char** argv) {',
    '    N = (argc > 1) ? atoi(argv[1]) : 8;',
    '    col.assign(N, 0); diag1.assign(2*N, 0); diag2.assign(2*N, 0);',
    '    solve(0);',
    '    cout << "Solutions for N=" << N << ": " << solutions << endl;',
    '    return 0;',
    '}'
  ];

  let state = null;
  let animFrame = null;
  let lastStepAt = 0;
  let runningSolutionGen = null;   // generator for current single solution
  let allSolutionsCache = [];      // when "show all" mode is on

  function init(root) {
    state = {
      N: 8,
      speed: 5,        // 1..10
      playing: false,
      stepMode: true,  // true = single solution, false = all
      currentRow: 0,
      board: [],       // length N, -1 = empty
      col: [], diag1: [], diag2: [],
      steps: 0,
      backtracks: 0,
      solutionIndex: 1,
      showAll: false,
      activeCells: new Set(),
      attackCells: new Set(),
      tryingCell: null
    };

    buildBoard(root);
    renderCodePanel(root);
    attachControls(root);
    resetSimulation(root);
  }

  function buildBoard(root) {
    const board = root.querySelector('.board');
    board.innerHTML = '';
    setBoardSize(root);
  }

  function setBoardSize(root) {
    const board = root.querySelector('.board');
    board.style.gridTemplateColumns = `repeat(${state.N}, 1fr)`;
    board.innerHTML = '';
    for (let i = 0; i < state.N * state.N; i++) {
      const r = Math.floor(i / state.N);
      const c = i % state.N;
      const cell = document.createElement('div');
      cell.className = 'cell ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
      cell.dataset.r = r; cell.dataset.c = c;
      board.appendChild(cell);
    }
  }

  function renderCodePanel(root) {
    const panel = root.querySelector('.code-panel pre');
    panel.innerHTML = NQUEENS_CPP_LINES.map((line, idx) => {
      const ln = idx + 1;
      const safe = line.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const cls = highlightLine(safe);
      return `<span class="line" data-line="${ln}">${cls || '&nbsp;'}</span>`;
    }).join('');
  }

  function highlightLine(line) {
    return line
      .replace(/(#include|using|return|if|for|void|bool|int|long|vector|char|main)/g, '<span class="kw">$1</span>')
      .replace(/(cout|endl|assign|atoi|argv|argc|printf|scanf)/g, '<span class="fn">$1</span>')
      .replace(/(\/\/.*)/g, '<span class="cm">$1</span>')
      .replace(/(["'][^"']*["'])/g, '<span class="st">$1</span>')
      .replace(/(0x[0-9a-fA-F]+|\b\d+\b)/g, '<span class="num">$1</span>')
      .replace(/(#include &lt;.*&gt;)/g, '<span class="pp">$1</span>');
  }

  function attachControls(root) {
    const $ = (s) => root.querySelector(s);

    $('#nq-n').addEventListener('change', e => {
      state.N = parseInt(e.target.value);
      resetSimulation(root);
    });

    $('#nq-speed').addEventListener('input', e => {
      state.speed = parseInt(e.target.value);
    });

    $('#nq-play').addEventListener('click', () => togglePlay(root));
    $('#nq-step').addEventListener('click', () => stepOnce(root));
    $('#nq-reset').addEventListener('click', () => resetSimulation(root));
    $('#nq-show-all').addEventListener('change', e => {
      state.showAll = e.target.checked;
      resetSimulation(root);
    });
    $('#nq-solution-idx').addEventListener('input', e => {
      state.solutionIndex = parseInt(e.target.value) || 1;
      $('#nq-solution-idx-label').textContent = state.solutionIndex;
    });
  }

  function resetSimulation(root) {
    state.playing = false;
    cancelAnimationFrame(animFrame);
    state.board = new Array(state.N).fill(-1);
    state.col = new Array(state.N).fill(false);
    state.diag1 = new Array(2 * state.N).fill(false);
    state.diag2 = new Array(2 * state.N).fill(false);
    state.steps = 0;
    state.backtracks = 0;
    state.currentRow = 0;
    state.activeCells.clear();
    state.attackCells.clear();
    state.tryingCell = null;
    allSolutionsCache = [];

    setBoardSize(root);
    clearCodeHighlight(root);
    updateStats(root);

    if (state.showAll) {
      // Pre-compute all solutions for current N
      allSolutionsCache = computeAllSolutions(state.N);
      root.querySelector('#nq-solution-idx').max = Math.max(1, allSolutionsCache.length);
      root.querySelector('#nq-solution-idx-label').textContent = state.solutionIndex;
      if (allSolutionsCache.length > 0) {
        renderSolutionOnBoard(root, allSolutionsCache[state.solutionIndex - 1]);
      }
    } else {
      runningSolutionGen = singleSolutionGenerator();
    }
  }

  // Returns array of board configurations (each is array of length N)
  function computeAllSolutions(N) {
    const all = [];
    const board = new Array(N).fill(-1);
    const col = new Array(N).fill(false);
    const diag1 = new Array(2 * N).fill(false);
    const diag2 = new Array(2 * N).fill(false);

    function backtrack(r) {
      if (r === N) {
        all.push([...board]);
        return;
      }
      for (let c = 0; c < N; c++) {
        if (!col[c] && !diag1[r - c + N] && !diag2[r + c]) {
          col[c] = diag1[r - c + N] = diag2[r + c] = true;
          board[r] = c;
          backtrack(r + 1);
          col[c] = diag1[r - c + N] = diag2[r + c] = false;
          board[r] = -1;
        }
      }
    }
    backtrack(0);
    return all;
  }

  // Generator that yields each conceptual step of finding ONE solution.
  function* singleSolutionGenerator() {
    const N = state.N;
    const board = new Array(N).fill(-1);
    const col = new Array(N).fill(false);
    const diag1 = new Array(2 * N).fill(false);
    const diag2 = new Array(2 * N).fill(false);

    function* solve(row) {
      if (row === N) { return; }
      for (let c = 0; c < N; c++) {
        // Step: trying this column
        yield { type: 'try', row, col: c };
        if (!col[c] && !diag1[row - c + N] && !diag2[row + c]) {
          // Step: place queen
          col[c] = diag1[row - c + N] = diag2[row + c] = true;
          board[row] = c;
          yield { type: 'place', row, col: c, board: [...board] };
          yield* solve(row + 1);
          if (row === N - 1 && board[row] !== -1) {
            yield { type: 'done', board: [...board] };
            return;
          }
          // Step: backtrack
          col[c] = diag1[row - c + N] = diag2[row + c] = false;
          board[row] = -1;
          yield { type: 'backtrack', row, col: c, board: [...board] };
        } else {
          yield { type: 'attack', row, col: c };
        }
      }
    }

    yield* solve(0);
  }

  // Renders a final board state (used for "show all" mode and after completion)
  function renderSolutionOnBoard(root, board) {
    const cells = root.querySelectorAll('.board .cell');
    cells.forEach(cell => {
      cell.classList.remove('under-attack', 'trying', 'safe', 'queen-fading');
      cell.innerHTML = '';
    });
    board.forEach((c, r) => {
      const idx = r * state.N + c;
      if (cells[idx]) {
        cells[idx].innerHTML = '<span class="queen">♛</span>';
      }
    });
    computeAndShowAttacks(root, board);
  }

  function computeAndShowAttacks(root, board) {
    const cells = root.querySelectorAll('.board .cell');
    const N = state.N;
    for (let r = 0; r < N; r++) {
      const c = board[r];
      if (c === -1) continue;
      for (let i = 0; i < N; i++) {
        if (i !== c) cells[r * N + i]?.classList.add('under-attack');
        if (i !== r) cells[i * N + c]?.classList.add('under-attack');
        const r2 = r + (c - i);
        if (r2 !== r && r2 >= 0 && r2 < N && r2 !== r) cells[r2 * N + i]?.classList.add('under-attack');
      }
    }
  }

  function applyStep(root, step) {
    const N = state.N;
    const cells = root.querySelectorAll('.board .cell');

    // Clear transient markers (keep under-attack only if it was already placed)
    cells.forEach(cell => cell.classList.remove('trying', 'safe'));

    if (step.type === 'try') {
      const idx = step.row * N + step.col;
      cells[idx]?.classList.add('trying');
      setCodeHighlight(root, 21); // for loop
    } else if (step.type === 'attack') {
      const idx = step.row * N + step.col;
      cells[idx]?.classList.add('under-attack');
      setCodeHighlight(root, 21);
    } else if (step.type === 'place') {
      // Clear all previous transient, render board
      cells.forEach(cell => {
        cell.classList.remove('under-attack', 'trying', 'safe', 'queen-fading');
        cell.innerHTML = '';
      });
      step.board.forEach((c, r) => {
        if (c !== -1) {
          cells[r * N + c].innerHTML = '<span class="queen">♛</span>';
        }
      });
      computeAndShowAttacks(root, step.board);
      state.board = [...step.board];
      state.steps++;
      setCodeHighlight(root, 23); // recursive call
    } else if (step.type === 'backtrack') {
      cells.forEach(cell => {
        cell.classList.remove('under-attack', 'trying', 'safe', 'queen-fading');
        cell.innerHTML = '';
      });
      step.board.forEach((c, r) => {
        if (c !== -1) {
          cells[r * N + c].innerHTML = '<span class="queen">♛</span>';
        }
      });
      state.board = [...step.board];
      state.backtracks++;
      setCodeHighlight(root, 24); // unmark
    } else if (step.type === 'done') {
      cells.forEach(cell => {
        cell.classList.remove('under-attack', 'trying', 'safe', 'queen-fading');
        cell.innerHTML = '';
      });
      step.board.forEach((c, r) => {
        if (c !== -1) cells[r * N + c].innerHTML = '<span class="queen">♛</span>';
      });
      state.board = [...step.board];
      setCodeHighlight(root, 14); // if (r == N)
      state.playing = false;
      updateStats(root);
      updatePlayButton(root);
      return true; // done
    }

    updateStats(root);
    return false;
  }

  function setCodeHighlight(root, lineNum) {
    clearCodeHighlight(root);
    const line = root.querySelector(`.code-panel [data-line="${lineNum}"]`);
    if (line) line.classList.add('active');
  }

  function clearCodeHighlight(root) {
    root.querySelectorAll('.code-panel .line.active')
      .forEach(el => el.classList.remove('active'));
  }

  function updateStats(root) {
    root.querySelector('#nq-steps').textContent = state.steps;
    root.querySelector('#nq-backtracks').textContent = state.backtracks;
    const total = SOLUTION_COUNTS[state.N] || '?';
    root.querySelector('#nq-total').textContent = state.showAll
      ? `${state.solutionIndex} / ${total}`
      : `? / ${total}`;
  }

  function updatePlayButton(root) {
    const btn = root.querySelector('#nq-play');
    btn.textContent = state.playing ? '⏸ Pause' : '▶ Play';
  }

  function togglePlay(root) {
    if (state.showAll) return; // no animation in show-all mode
    state.playing = !state.playing;
    updatePlayButton(root);
    if (state.playing) {
      lastStepAt = performance.now();
      loop(root);
    }
  }

  function loop(root) {
    if (!state.playing) return;
    const delay = 800 - state.speed * 77;  // speed 1..10 → 723..30 ms
    const now = performance.now();
    if (now - lastStepAt >= delay) {
      lastStepAt = now;
      const finished = stepOnce(root);
      if (finished) return;
    }
    animFrame = requestAnimationFrame(() => loop(root));
  }

  function stepOnce(root) {
    if (state.showAll) return true;
    const next = runningSolutionGen.next();
    if (next.done) {
      state.playing = false;
      updatePlayButton(root);
      return true;
    }
    return applyStep(root, next.value);
  }

  // Public API: register init function
  window.AlgoRegistry = window.AlgoRegistry || {};
  window.AlgoRegistry[SECTION_ID] = init;
})();
