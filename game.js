const GRID_SIZE = 6;
const MAX_DRAWS = 12;
const BOARD_VALUES = Array.from({ length: 36 }, (_, index) => index + 1);

const boardElement = document.getElementById('board');
const drawBtn = document.getElementById('draw-btn');
const resetBtn = document.getElementById('reset-btn');
const messageEl = document.getElementById('message');
const drawCountEl = document.getElementById('draw-count');
const drawnListEl = document.getElementById('drawn-list');

const state = {
  boardNumbers: [],
  remainingNumbers: [],
  drawnNumbers: [],
  winningLine: [],
  completed: false,
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
  state.boardNumbers = shuffle(BOARD_VALUES);
  state.remainingNumbers = [...state.boardNumbers];
  state.drawnNumbers = [];
  state.winningLine = [];
  state.completed = false;

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
  drawCountEl.textContent = `${state.drawnNumbers.length} / ${MAX_DRAWS}`;
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

function drawNumber() {
  if (state.completed) {
    return;
  }

  if (state.drawnNumbers.length >= MAX_DRAWS) {
    setMessage('這一輪已經抽滿 12 次，請重新開始！', 'fail');
    return;
  }

  if (state.remainingNumbers.length === 0) {
    setMessage('全部數字都抽完了，請重置遊戲！', 'fail');
    return;
  }

  const randomIndex = Math.floor(Math.random() * state.remainingNumbers.length);
  const drawnValue = state.remainingNumbers.splice(randomIndex, 1)[0];
  state.drawnNumbers.push(drawnValue);

  const winningLine = checkForWinningLine();

  if (winningLine.length > 0) {
    state.winningLine = winningLine;
    state.completed = true;
    updateBoardVisuals();
    updateStatus();
    setMessage('中獎！已連成六個一線，恭喜你！', 'success');
    return;
  }

  if (state.drawnNumbers.length >= MAX_DRAWS) {
    state.completed = true;
    setMessage('本輪 12 次已用完，沒有連成六線，再試一次吧！', 'fail');
  } else {
    setMessage(`抽到 ${drawnValue}！繼續加油！`, 'normal');
  }

  updateBoardVisuals();
  updateStatus();
}

function resetGame() {
  buildBoard();
}

drawBtn.addEventListener('click', drawNumber);
resetBtn.addEventListener('click', resetGame);

buildBoard();
