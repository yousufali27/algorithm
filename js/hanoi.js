/* =========================================================
   TOWER OF HANOI
   ========================================================= */

(function () {
  const SECTION_ID = 'hanoi';

  const PEG_NAMES = ['A (Source)', 'B (Auxiliary)', 'C (Target)'];

  let state = null;

  function init(root) {
    state = {
      n: 5,
      speed: 5,
      playing: false,
      raf: null,
      lastStepAt: 0,
      pegs: [[], [], []],
      moves: 0
    };
    for (let i = state.n; i >= 1; i--) state.pegs[0].push(i);
    buildPegs(root);
    attach(root);
    renderCode(root);
    update(root);
  }

  function buildPegs(root) {
    const stage = root.querySelector('.hanoi-stage');
    stage.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const peg = document.createElement('div');
      peg.className = 'peg';
      peg.dataset.idx = i;
      peg.innerHTML = `<div class="peg-rod"></div><div class="peg-base"></div>`;
      stage.appendChild(peg);
    }
    renderDisks(root);
  }

  function renderDisks(root) {
    const pegs = root.querySelectorAll('.peg');
    pegs.forEach((peg, i) => {
      // remove all existing disks
      peg.querySelectorAll('.disk').forEach(d => d.remove());
      // add disks bottom to top
      state.pegs[i].forEach((size, idx) => {
        const disk = document.createElement('div');
        disk.className = 'disk';
        const width = 30 + size * 16;
        disk.style.width = width + 'px';
        disk.textContent = size;
        disk.dataset.size = size;
        // insert before rod
        const rod = peg.querySelector('.peg-rod');
        peg.insertBefore(disk, rod);
      });
    });
  }

  function renderCode(root) {
    const code = [
      'void hanoi(int n, char src, char aux, char tgt) {',
      '    if (n == 1) {',
      '        move(src, tgt);',
      '        return;',
      '    }',
      '    hanoi(n - 1, src, tgt, aux);',
      '    move(src, tgt);',
      '    hanoi(n - 1, aux, src, tgt);',
      '}'
    ];
    const pre = root.querySelector('.code-panel pre');
    pre.innerHTML = code.map((l, idx) => {
      const ln = idx + 1;
      const safe = l.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<span class="line" data-line="${ln}">${hl(safe) || '&nbsp;'}</span>`;
    }).join('');
  }

  function hl(line) {
    return line
      .replace(/(void|if|return)/g, '<span class="kw">$1</span>')
      .replace(/(hanoi|move)/g, '<span class="fn">$1</span>')
      .replace(/(\b\d+\b)/g, '<span class="num">$1</span>')
      .replace(/(['].['])/g, '<span class="st">$1</span>');
  }

  function attach(root) {
    root.querySelector('#hanoi-n').addEventListener('input', e => {
      if (state.playing) return;
      state.n = parseInt(e.target.value);
      root.querySelector('#hanoi-n-label').textContent = state.n;
      reset(root);
    });
    root.querySelector('#hanoi-speed').addEventListener('input', e => state.speed = parseInt(e.target.value));
    root.querySelector('#hanoi-play').addEventListener('click', () => togglePlay(root));
    root.querySelector('#hanoi-reset').addEventListener('click', () => { reset(root); });
  }

  function reset(root) {
    cancelAnimationFrame(state.raf);
    state.pegs = [[], [], []];
    for (let i = state.n; i >= 1; i--) state.pegs[0].push(i);
    state.moves = 0;
    state.playing = false;
    updatePlayBtn(root);
    buildPegs(root);
    update(root);
    state.gen = makeGen();
  }

  function updatePlayBtn(root) {
    root.querySelector('#hanoi-play').textContent = state.playing ? '⏸ Pause' : '▶ Play';
  }

  function update(root) {
    root.querySelector('#hanoi-moves').textContent = state.moves;
    root.querySelector('#hanoi-formula').textContent = `${Math.pow(2, state.n) - 1}`;
  }

  function* makeGen() {
    const N = state.n;
    function* hanoi(n, src, aux, tgt) {
      if (n === 1) {
        yield { from: src, to: tgt, line: 3 };
        return;
      }
      yield* hanoi(n - 1, src, tgt, aux);
      yield { from: src, to: tgt, line: 7 };
      yield* hanoi(n - 1, aux, src, tgt);
    }
    yield* hanoi(N, 0, 1, 2);
  }

  function togglePlay(root) {
    if (state.playing) {
      state.playing = false;
      cancelAnimationFrame(state.raf);
      updatePlayBtn(root);
      return;
    }
    state.playing = true;
    if (!state.gen || state.genDone) state.gen = makeGen();
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
        const { from, to, line } = next.value;
        const disk = state.pegs[from].pop();
        state.pegs[to].push(disk);
        state.moves++;
        renderDisks(root);
        update(root);
        // highlight line
        root.querySelectorAll('.code-panel .line.active').forEach(l => l.classList.remove('active'));
        const el = root.querySelector(`.code-panel [data-line="${line}"]`);
        if (el) el.classList.add('active');
      } else {
        state.genDone = true;
        state.playing = false;
        updatePlayBtn(root);
        return;
      }
    }
    state.raf = requestAnimationFrame(() => loop(root));
  }

  window.AlgoRegistry = window.AlgoRegistry || {};
  window.AlgoRegistry[SECTION_ID] = init;
})();