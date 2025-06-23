let size = 8;
let mineCount = 10;
let board = [];
let gameOver = false;
let ferramenta = "pa"; // "pa" ou "bandeira"
let bandeirasRestantes = mineCount;
updateBandeirasRestantes();

const game = document.getElementById("game");
const statusText = document.getElementById("status");

// Seleção de ferramenta
const btnPa = document.getElementById('btn-pa');
const btnBandeira = document.getElementById('btn-bandeira');

btnPa.addEventListener('click', () => {
  ferramenta = "pa";
  btnPa.classList.add('selecionada');
  btnBandeira.classList.remove('selecionada');
});
btnBandeira.addEventListener('click', () => {
  ferramenta = "bandeira";
  btnBandeira.classList.add('selecionada');
  btnPa.classList.remove('selecionada');
});

function createBoard() {
  board = [];
  game.innerHTML = "";
  statusText.textContent = "";
  gameOver = false;
  bandeirasRestantes = mineCount;
  updateBandeirasRestantes();

  // Inicializa células
  for (let i = 0; i < size * size; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.dataset.index = i;
    cell.addEventListener("click", handleClick);
    cell.addEventListener("contextmenu", handleRightClick); // Para clique direito
    game.appendChild(cell);
    board.push({ hasMine: false, revealed: false, adjacentMines: 0, flagged: false });
  }

  // Coloca minas
  let minesPlaced = 0;
  while (minesPlaced < mineCount) {
    const index = Math.floor(Math.random() * size * size);
    if (!board[index].hasMine) {
      board[index].hasMine = true;
      minesPlaced++;
    }
  }

  // Calcula minas adjacentes
  for (let i = 0; i < size * size; i++) {
    const { x, y } = getXY(i);
    board[i].adjacentMines = countAdjacentMines(x, y);
  }

  // Ajusta o grid para o tamanho correto
  game.style.gridTemplateColumns = `repeat(${size}, 32px)`;
}

// Nova função para clique direito (alternar bandeira)
function handleRightClick(e) {
  e.preventDefault();
  if (gameOver) return;
  const index = parseInt(e.target.dataset.index);
  const cell = board[index];
  if (cell.revealed) return;

  // Ao colocar uma bandeira:
  if (!cell.flagged && bandeirasRestantes > 0) {
    cell.flagged = true;
    bandeirasRestantes--;
    e.target.textContent = "🚩";
    somFlagOn.currentTime = 0;
    somFlagOn.play();
  } 
  // Ao remover uma bandeira:
  else if (cell.flagged) {
    cell.flagged = false;
    bandeirasRestantes++;
    e.target.textContent = "";
    somFlagOff.currentTime = 0;
    somFlagOff.play();
  }
  updateBandeirasRestantes();
}

function getXY(index) {
  return { x: index % size, y: Math.floor(index / size) };
}

function getIndex(x, y) {
  return y * size + x;
}

function countAdjacentMines(x, y) {
  let count = 0;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
        if (board[getIndex(nx, ny)].hasMine) count++;
      }
    }
  }
  return count;
}

function handleClick(e) {
  if (gameOver) return;
  const index = parseInt(e.target.dataset.index);
  const cell = board[index];
  const domCell = game.children[index];

  if (ferramenta === "bandeira") {
    if (cell.revealed) return;
    // Só permite colocar bandeira se ainda houver bandeiras restantes
    if (!cell.flagged && bandeirasRestantes > 0) {
      cell.flagged = true;
      domCell.textContent = "🚩";
      domCell.classList.add('flagged');
      bandeirasRestantes--;
      somFlagOn.currentTime = 0;
      somFlagOn.play();
      updateBandeirasRestantes();
    } else if (cell.flagged) {
      cell.flagged = false;
      domCell.textContent = "";
      domCell.classList.remove('flagged');
      bandeirasRestantes++;
      somFlagOff.currentTime = 0;
      somFlagOff.play();
      updateBandeirasRestantes();
    }
    return;
  }

  // Ferramenta pá (revelar)
  if (cell.revealed || cell.flagged) return;

  cell.revealed = true;
  domCell.classList.add("revealed");
  somEscavar.play();

  if (cell.hasMine) {
    domCell.textContent = "💣";
    domCell.classList.add("mine");
    gameOver = true;
    statusText.textContent = "💥 Game Over!";
    somBomba.play();
    revealAll();
    return;
  }

  // Se não for mina, toca o som de escavar
  somEscavar.currentTime = 0;
  somEscavar.play();

  if (cell.adjacentMines > 0) {
    domCell.textContent = cell.adjacentMines;
    domCell.setAttribute('data-number', cell.adjacentMines);
  } else {
    revealEmpty(getXY(index).x, getXY(index).y);
  }

  checkWin();
}

function revealEmpty(x, y) {
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
        const idx = getIndex(nx, ny);
        const cell = board[idx];
        if (!cell.revealed && !cell.hasMine) {
          cell.revealed = true;
          const domCell = game.children[idx];
          domCell.classList.add("revealed");
          if (cell.adjacentMines > 0) {
            domCell.textContent = cell.adjacentMines;
            domCell.setAttribute('data-number', cell.adjacentMines); // Para colorir pelo CSS
          } else {
            revealEmpty(nx, ny);
          }
        }
      }
    }
  }
}

function revealAll() {
  board.forEach((cell, i) => {
    const domCell = game.children[i];
    if (cell.hasMine) {
      domCell.textContent = "💣";
      domCell.classList.add("mine");
    }
    domCell.classList.add("revealed");
  });
}

function checkWin() {
  const unrevealed = board.filter(cell => !cell.revealed).length;
  if (unrevealed === mineCount && !gameOver) {
    statusText.textContent = "🎉 Você venceu!";
    gameOver = true;
    somVitoria.play();
  }
}

document.getElementById('btn-reiniciar').addEventListener('click', function() {
  createBoard();
});

// Níveis de dificuldade
const dificuldadeBtns = document.querySelectorAll('#dificuldades button');
function selecionarDificuldade(btnSelecionado) {
  dificuldadeBtns.forEach(btn => btn.classList.remove('selecionada'));
  btnSelecionado.classList.add('selecionada');
}

function selecionarBtnPorDificuldade(classeNeon) {
  const btn = {
    'facil': dificuldadeBtns[0],
    'medio': dificuldadeBtns[1],
    'dificil': dificuldadeBtns[2],
    'desumano': dificuldadeBtns[3]
  }[classeNeon];
  if (btn) selecionarDificuldade(btn);
}

// Botão de dificuldade clicado
dificuldadeBtns.forEach(btn => {
  btn.addEventListener('click', function() {
    size = parseInt(btn.getAttribute('data-size'));
    mineCount = parseInt(btn.getAttribute('data-mines'));
    // Detecta a dificuldade pela mina/tamanho
    let classeNeon = 'facil';
    if (size === 12) classeNeon = 'medio';
    else if (size === 16) classeNeon = 'dificil';
    else if (size === 20) classeNeon = 'desumano';
    setNeonClass(classeNeon);
    selecionarDificuldade(btn);
    createBoard();
  });
});

// Atalhos de teclado: "r" reinicia, "b" bandeira, "p" pá, "1-4" níveis de dificuldade
document.addEventListener('keydown', (e) => {
  if (e.key === 'e' || e.key === 'E') {
    createBoard();
  }
  if (e.key === 'w' || e.key === 'W') {
    ferramenta = "bandeira";
    btnBandeira.classList.add('selecionada');
    btnPa.classList.remove('selecionada');
  }
  if (e.key === 'q' || e.key === 'Q') {
    ferramenta = "pa";
    btnPa.classList.add('selecionada');
    btnBandeira.classList.remove('selecionada');
  }
  if (e.key === '1') {
    setNeonClass('facil');
    selecionarBtnPorDificuldade('facil');
    size = 8; mineCount = 10; createBoard();
  }
  if (e.key === '2') {
    setNeonClass('medio');
    selecionarBtnPorDificuldade('medio');
    size = 12; mineCount = 20; createBoard();
  }
  if (e.key === '3') {
    setNeonClass('dificil');
    selecionarBtnPorDificuldade('dificil');
    size = 16; mineCount = 40; createBoard();
  }
  if (e.key === '4') {
    setNeonClass('desumano');
    selecionarBtnPorDificuldade('desumano');
    size = 20; mineCount = 99; createBoard();
  }
});

// Atualiza o contador de bandeiras restantes
function updateBandeirasRestantes() {
  document.getElementById('bandeiras-restantes').textContent =
    `🚩 Bandeiras restantes: ${bandeirasRestantes}`;
}

// Inicializa o tabuleiro ao carregar a página
createBoard();

const somBomba = new Audio('sons/explosion-fx-343683.mp3');
const somFlagOn = new Audio('sons/mouse-click-104737.mp3');
const somFlagOff = new Audio('sons/keyboard-click-327728.mp3');
const somVitoria = new Audio('sons/you-win-sequence-1-183948.mp3');
const somEscavar = new Audio('sons/dig.mp3');
somBomba.volume = 1;
somFlagOn.volume = 1;
somFlagOff.volume = 1;
somVitoria.volume = 1;
somEscavar.volume = 1;

function setNeonClass(dificuldade) {
  document.body.classList.remove('neon-facil', 'neon-medio', 'neon-dificil', 'neon-desumano');
  document.body.classList.add('neon-' + dificuldade);
}