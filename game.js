const GRID_SIZE = 6;
const BOARD_VALUES = Array.from({ length: 36 }, (_, index) => index + 1);

const boardElement = document.getElementById('board');
const drawBtn = document.getElementById('draw-btn');
const resetBtn = document.getElementById('reset-btn');
const messageEl = document.getElementById('message');
const drawCountEl = document.getElementById('draw-count');
const drawnListEl = document.getElementById('drawn-list');
const drawLimitSelect = document.getElementById('draw-limit-select');
const extraDrawBtn = document.getElementById('extra-draw-btn');

const state = {
  boardNumbers: [],
  remainingNumbers: [],
  drawnNumbers: [],
  winningLine: [],
  completed: false,
  maxDraws: Number(drawLimitSelect.value) || 12,
  extraAvailable: false,
  extraUsed: false,
};

function shuffle(array) {
  const clone = [...array];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function buildBoard() {
  state.maxDraws = Number(drawLimitSelect.value) || 12;
  state.boardNumbers = shuffle(BOARD_VALUES);
  state.remainingNumbers = [...state.boardNumbers];
  state.drawnNumbers = [];
  state.winningLine = [];
  state.completed = false;
  state.extraAvailable = false;
  state.extraUsed = false;

  boardElement.innerHTML = '';

  state.boardNumbers.forEach((value) => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.number = String(value);
    cell.textContent = value;
    boardElement.appendChild(cell);
  });

  updateBoardVisuals();
  updateStatus();
  setMessage('開始抽牌，看看能不能連成一線！', 'normal');
  extraDrawBtn.hidden = true;
}

function updateBoardVisuals() {
  const cells = boardElement.querySelectorAll('.cell');
  const drawnSet = new Set(state.drawnNumbers);
  const winSet = new Set(state.winningLine.map(([row, col]) => state.boardNumbers[row * GRID_SIZE + col]));

  cells.forEach((cell) => {
    const value = Number(cell.dataset.number);
    const isDrawn = drawnSet.has(value);
    const isWin = winSet.has(value);

    cell.classList.toggle('drawn', isDrawn);
    cell.classList.toggle('win', isWin);
  });
}

function setMessage(text, type = 'normal') {
  messageEl.textContent = text;
  messageEl.classList.remove('success', 'fail');

  if (type === 'success') {
    messageEl.classList.add('success');
  }

  if (type === 'fail') {
    messageEl.classList.add('fail');
  }
}

function updateStatus() {
  drawCountEl.textContent = `${state.drawnNumbers.length} / ${state.maxDraws}`;
  drawnListEl.textContent = state.drawnNumbers.length === 0
    ? '尚未抽牌'
    : state.drawnNumbers.join('、');
}

function getCellIndex(value) {
  return state.boardNumbers.indexOf(value);
}

function getBoardCoordinates(value) {
  const index = getCellIndex(value);
  const row = Math.floor(index / GRID_SIZE);
  const col = index % GRID_SIZE;
  return [row, col];
}

function getWinningLines() {
  const lines = [];

  for (let row = 0; row < GRID_SIZE; row += 1) {
    const line = [];
    for (let col = 0; col < GRID_SIZE; col += 1) {
      line.push([row, col]);
    }
    lines.push(line);
  }

  for (let col = 0; col < GRID_SIZE; col += 1) {
    const line = [];
    for (let row = 0; row < GRID_SIZE; row += 1) {
      line.push([row, col]);
    }
    lines.push(line);
  }

  const mainDiagonal = [];
  for (let i = 0; i < GRID_SIZE; i += 1) {
    mainDiagonal.push([i, i]);
  }
  lines.push(mainDiagonal);

  const antiDiagonal = [];
  for (let i = 0; i < GRID_SIZE; i += 1) {
    antiDiagonal.push([i, GRID_SIZE - 1 - i]);
  }
  lines.push(antiDiagonal);

  return lines;
}

function checkForWinningLine() {
  const drawnSet = new Set(state.drawnNumbers);
  const lines = getWinningLines();

  for (const line of lines) {
    const allMatch = line.every(([row, col]) => {
      const value = state.boardNumbers[row * GRID_SIZE + col];
      return drawnSet.has(value);
    });

    if (allMatch) {
      return line;
    }
  }

  return [];
}

// 回傳第一條差一格的線的缺少格（回傳 {line, missingValue, missingCoord} 或 null）
function checkForOneAwayLine() {
  const drawnSet = new Set(state.drawnNumbers);
  const lines = getWinningLines();

  for (const line of lines) {
    let drawnCount = 0;
    let missing = null;
    for (const [row, col] of line) {
      const value = state.boardNumbers[row * GRID_SIZE + col];
      if (drawnSet.has(value)) drawnCount += 1;
      else missing = { value, coord: [row, col] };
    }

    if (drawnCount === GRID_SIZE - 1 && missing) {
      return { line, missingValue: missing.value, missingCoord: missing.coord };
    }
  }

  return null;
}

function drawNumber(isExtra = false) {
  if (state.completed && !isExtra) {
    return;
  }

  // normal draw: respect max draws; extra draw bypasses the max (if allowed)
  if (!isExtra && state.drawnNumbers.length >= state.maxDraws) {
    setMessage('這一輪已經抽滿，判斷是否有海底撈月補抽資格...', 'fail');
    // 判斷是否有海底撈月資格
    handlePostDrawChecks();
    return;
  }

  if (state.remainingNumbers.length === 0) {
    setMessage('全部數字都抽完了，請重置遊戲！', 'fail');
    return;
  }

  // 若是補抽，檢查是否有資格
  if (isExtra) {
    if (!state.extraAvailable || state.extraUsed) {
      setMessage('沒有補抽資格或補抽已使用過。', 'fail');
      return;
    }
  }

  const randomIndex = Math.floor(Math.random() * state.remainingNumbers.length);
  const drawnValue = state.remainingNumbers.splice(randomIndex, 1)[0];
  state.drawnNumbers.push(drawnValue);

  const winningLine = checkForWinningLine();

  if (winningLine.length > 0) {
    state.winningLine = winningLine;
    state.completed = true;
    state.extraAvailable = false;
    state.extraUsed = false;
    updateBoardVisuals();
    updateStatus();
    setMessage('中獎！已連成六個一線，恭喜你！', 'success');
    extraDrawBtn.hidden = true;
    return;
  }

  // 更新狀態
  updateBoardVisuals();
  updateStatus();

  // 如果剛好達到上限，檢查是否有海底撈月
  if (!isExtra && state.drawnNumbers.length >= state.maxDraws) {
    handlePostDrawChecks();
    return;
  }

  if (isExtra) {
    state.extraUsed = true;
    state.extraAvailable = false;
    extraDrawBtn.hidden = true;
    // 補抽之後再檢查是否中獎
    const postWin = checkForWinningLine();
    if (postWin.length > 0) {
      state.winningLine = postWin;
      state.completed = true;
      updateBoardVisuals();
      updateStatus();
      setMessage('補抽中獎！恭喜你海底撈月成功！', 'success');
      return;
    }

    // 補抽後若仍未中獎，結束本輪
    state.completed = true;
    setMessage('補抽後仍未中獎，本輪結束。', 'fail');
    return;
  }

  setMessage(`抽到 ${drawnValue}！繼續加油！`, 'normal');
}

function handlePostDrawChecks() {
  // 當普通抽牌達到上限時，檢查是否有差一格可以連線
  const oneAway = checkForOneAwayLine();
  if (oneAway && !state.extraUsed) {
    state.extraAvailable = true;
    extraDrawBtn.hidden = false;
    setMessage(`海底撈月！只差 ${oneAway.missingValue} 就能連線，點「海底撈月・補抽」試試手氣！`, 'normal');
  } else {
    state.completed = true;
    state.extraAvailable = false;
    extraDrawBtn.hidden = true;
    setMessage('本輪 12 次（或所選上限）已用完，沒有連成六線，再試一次吧！', 'fail');
  }
}

function resetGame() {
  buildBoard();
}

// 當改變抽牌上限時，僅在尚未抽牌的情況下生效（為避免 mid-game 的複雜性）
drawLimitSelect.addEventListener('change', () => {
  if (state.drawnNumbers.length === 0) {
    buildBoard();
  } else {
    setMessage('請先重置遊戲以更改抽牌上限', 'fail');
    // 回復 select 顯示為目前設定
    drawLimitSelect.value = String(state.maxDraws);
  }
});

drawBtn.addEventListener('click', () => drawNumber(false));
extraDrawBtn.addEventListener('click', () => drawNumber(true));
resetBtn.addEventListener('click', resetGame);

buildBoard();
