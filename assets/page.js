(function () {
  let score = 0;
  let done = 0;
  let attempts = 0;
  let mistakes = 0;
  const maxScore = Number(document.body.dataset.maxScore || 6);
  const storageKey = document.body.dataset.storageKey || 'morphology-default';

  function saveStats() {
    const payload = { score, done, attempts, mistakes, maxScore };
    localStorage.setItem(storageKey, JSON.stringify(payload));
  }

  function loadStats() {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      score = Number(data.score || 0);
      done = Number(data.done || 0);
      attempts = Number(data.attempts || 0);
      mistakes = Number(data.mistakes || 0);
      document.querySelectorAll('.task').forEach(task => {
        if (task.dataset.persistentId && task.dataset.solvedIds?.split(',').includes(task.dataset.persistentId)) {
          task.dataset.done = 'true';
        }
      });
    } catch (e) {}
  }

  function updateStats() {
    const accuracy = attempts ? Math.round((score / (attempts * 2)) * 100) : 0;
    const level = Math.max(1, Math.floor(score / 6) + 1);
    const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
    setText('scoreValue', score);
    setText('doneValue', done);
    setText('levelValue', level);
    setText('accuracyValue', accuracy + '%');
    setText('stickyText', `${score} / ${maxScore} очков`);
    setText('mistakeValue', mistakes);
    const fill = document.getElementById('progressFill');
    if (fill) fill.style.width = `${(score / maxScore) * 100}%`;
    saveStats();
  }

  function markTaskSolved(task) {
    if (!task.dataset.done) {
      task.dataset.done = 'true';
      score += Number(task.dataset.points || 1);
      done += 1;
    }
    updateStats();
  }

  document.querySelectorAll('.multi-select .option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('selected');
      btn.style.background = btn.classList.contains('selected') ? '#dbeafe' : 'white';
      btn.style.borderColor = btn.classList.contains('selected') ? '#60a5fa' : '#d8e3ff';
    });
  });

  document.querySelectorAll('.check-multi').forEach(button => {
    button.addEventListener('click', () => {
      const task = button.closest('.task');
      const wrap = task.querySelector('.multi-select');
      const result = task.querySelector('.result');
      const selected = [...wrap.querySelectorAll('.selected')].map(el => el.textContent.trim()).sort();
      const answer = wrap.dataset.answer.split(',').map(s => s.trim()).sort();
      attempts += 1;
      const ok = JSON.stringify(selected) === JSON.stringify(answer);
      if (ok) {
        result.textContent = 'Верно. Здесь действительно выбраны все нужные слова.';
        result.className = 'result good';
        markTaskSolved(task);
      } else {
        mistakes += 1;
        result.textContent = 'Не совсем. Проверь смысл слов ещё раз.';
        result.className = 'result bad';
        updateStats();
      }
    });
  });

  document.querySelectorAll('.single-select').forEach(taskWrap => {
    taskWrap.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (taskWrap.dataset.locked) return;
        const task = taskWrap.closest('.task');
        const result = task.querySelector('.result');
        const answer = taskWrap.dataset.answer.trim().toLowerCase();
        const value = btn.textContent.trim().toLowerCase();
        attempts += 1;
        taskWrap.dataset.locked = 'true';
        if (value === answer) {
          result.textContent = 'Верно. Это слово относится к другой части речи.';
          result.className = 'result good';
          markTaskSolved(task);
        } else {
          mistakes += 1;
          result.textContent = 'Неверно. Подумай, на какой вопрос отвечает слово.';
          result.className = 'result bad';
          updateStats();
        }
      });
    });
  });

  document.querySelectorAll('.check-input').forEach(button => {
    button.addEventListener('click', () => {
      const task = button.closest('.task');
      const input = task.querySelector('.free-input');
      const result = task.querySelector('.result');
      const answer = input.dataset.answer.trim().toLowerCase();
      const value = input.value.trim().toLowerCase();
      attempts += 1;
      const ok = value.includes(answer);
      if (ok) {
        result.textContent = 'Верно.';
        result.className = 'result good';
        markTaskSolved(task);
      } else {
        mistakes += 1;
        result.textContent = 'Неверно. Посмотри на правило и попробуй ещё раз.';
        result.className = 'result bad';
        updateStats();
      }
    });
  });

  let draggedChip = null;
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('dragstart', () => { draggedChip = chip; });
  });

  document.querySelectorAll('.dropzone').forEach(zone => {
    zone.addEventListener('dragover', e => e.preventDefault());
    zone.addEventListener('drop', e => {
      e.preventDefault();
      if (draggedChip) zone.appendChild(draggedChip);
    });
  });

  document.querySelectorAll('.check-drag').forEach(button => {
    button.addEventListener('click', () => {
      const task = button.closest('.task');
      const zone = task.querySelector('.dropzone');
      const result = task.querySelector('.result');
      const answer = zone.dataset.accept.split(',').map(s => s.trim()).sort();
      const dropped = [...zone.querySelectorAll('.chip')].map(el => el.textContent.trim()).sort();
      attempts += 1;
      const ok = JSON.stringify(answer) === JSON.stringify(dropped);
      if (ok) {
        result.textContent = 'Верно. В зоне оказались только нужные слова.';
        result.className = 'result good';
        markTaskSolved(task);
      } else {
        mistakes += 1;
        result.textContent = 'Пока не совпало. Ещё раз проверь вопросы к словам.';
        result.className = 'result bad';
        updateStats();
      }
    });
  });

  loadStats();
  updateStats();
})();
