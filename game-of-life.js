// Game of Life Algorithm
const DEAD = 0;
const ALIVE = 1;
const GRID_SIZE = 30;

class ConwayGameOfLife {
  constructor(width = GRID_SIZE, height = GRID_SIZE) {
    this.width = width;
    this.height = height;
  }

  neighbours(cell) {
    const offsets = [-1, 0, 1];
    return offsets
      .flatMap(dRow => offsets.map(dCol => ({ 
        row: cell.row + dRow, 
        col: cell.col + dCol 
      })))
      .filter(c => c.row !== cell.row || c.col !== cell.col);
  }

  isAlive(state, neighbourCount) {
    if (state === ALIVE && neighbourCount >= 2 && neighbourCount <= 3) {
      return ALIVE;
    }
    if (state === DEAD && neighbourCount === 3) {
      return ALIVE;
    }
    return DEAD;
  }

  cellToKey(cell) {
    return `${cell.row},${cell.col}`;
  }

  keyToCell(key) {
    const [row, col] = key.split(',').map(Number);
    return { row, col };
  }

  nextGeneration(livingCells) {
    const candidates = livingCells
      .flatMap(cell => this.neighbours(cell))
      .concat(livingCells)
      .filter(cell => 
        cell.row >= 0 && cell.row < this.height && 
        cell.col >= 0 && cell.col < this.width
      );
    
    const livingSet = new Set(livingCells.map(cell => this.cellToKey(cell)));
    const candidatesSet = new Set(candidates.map(cell => this.cellToKey(cell)));
    const nextGeneration = [];
    
    candidatesSet.forEach(cellKey => {
      const cell = this.keyToCell(cellKey);
      const isCurrentlyAlive = livingSet.has(cellKey);
      
      const neighborCount = this.neighbours(cell).filter(neighbor =>
        livingSet.has(this.cellToKey(neighbor))
      ).length;
      
      const newState = this.isAlive(
        isCurrentlyAlive ? ALIVE : DEAD, 
        neighborCount
      );
      
      if (newState === ALIVE) {
        nextGeneration.push(cell);
      }
    });
    
    return nextGeneration;
  }

  createGrid(livingCells) {
    const grid = Array(this.height)
      .fill(null)
      .map(() => Array(this.width).fill(DEAD));
    
    livingCells.forEach(({ row, col }) => {
      if (row >= 0 && row < this.height && col >= 0 && col < this.width) {
        grid[row][col] = ALIVE;
      }
    });
    
    return grid;
  }
}

// Game State
let game, currentCells, generation, isRunning, intervalId;
let speed = 550;

function initializeGame() {
  game = new ConwayGameOfLife();
  currentCells = [
    // Glider pattern
    { row: 10, col: 11 },
    { row: 11, col: 12 },
    { row: 12, col: 10 },
    { row: 12, col: 11 },
    { row: 12, col: 12 }
  ];
  generation = 0;
  isRunning = false;
  intervalId = null;
}

// DOM Elements (will be available when popup is opened)
let gridElement, playPauseBtn, nextBtn, resetBtn, generationDisplay, livingCellsDisplay, speedSlider;

// Initialize Grid
function initializeGrid() {
  gridElement = document.getElementById('grid');
  playPauseBtn = document.getElementById('playPauseBtn');
  nextBtn = document.getElementById('nextBtn');
  resetBtn = document.getElementById('resetBtn');
  generationDisplay = document.getElementById('generation');
  livingCellsDisplay = document.getElementById('livingCells');
  speedSlider = document.getElementById('speedSlider');
  
  if (!gridElement) return;
  
  gridElement.innerHTML = '';
  
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = row;
      cell.dataset.col = col;
      
      cell.addEventListener('click', () => {
        if (!isRunning) {
          toggleCell(row, col);
        }
      });
      
      gridElement.appendChild(cell);
    }
  }
  
  // Add event listeners
  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', () => {
      if (isRunning) {
        stopGame();
      } else {
        startGame();
      }
    });
  }
  
  if (nextBtn) nextBtn.addEventListener('click', nextGeneration);
  if (resetBtn) resetBtn.addEventListener('click', resetGame);
  if (speedSlider) speedSlider.addEventListener('input', updateSpeed);
  
  updateDisplay();
  updateSpeed();
}

// Toggle Cell State
function toggleCell(row, col) {
  const cellIndex = currentCells.findIndex(cell => 
    cell.row === row && cell.col === col
  );
  
  if (cellIndex > -1) {
    currentCells.splice(cellIndex, 1);
  } else {
    currentCells.push({ row, col });
  }
  
  updateDisplay();
}

// Update Visual Display
function updateDisplay() {
  if (!gridElement) return;
  
  const grid = game.createGrid(currentCells);
  const cells = gridElement.querySelectorAll('.cell');
  
  cells.forEach(cell => {
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    const isAlive = grid[row] && grid[row][col] === ALIVE;
    
    cell.classList.toggle('alive', isAlive);
  });
  
  if (generationDisplay) generationDisplay.textContent = generation;
  if (livingCellsDisplay) livingCellsDisplay.textContent = currentCells.length;
}

// Game Controls
function nextGeneration() {
  currentCells = game.nextGeneration(currentCells);
  generation++;
  updateDisplay();
  
  // Auto-stop if no living cells
  if (currentCells.length === 0 && isRunning) {
    stopGame();
  }
}

function startGame() {
  if (isRunning) return;
  
  isRunning = true;
  if (playPauseBtn) playPauseBtn.textContent = '⏸️ Pause';
  if (nextBtn) nextBtn.disabled = true;
  
  intervalId = setInterval(nextGeneration, speed);
}

function stopGame() {
  if (!isRunning) return;
  
  isRunning = false;
  if (playPauseBtn) playPauseBtn.textContent = '▶️ Start';
  if (nextBtn) nextBtn.disabled = false;
  
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function resetGame() {
  stopGame();
  
  // Reset to glider pattern
  currentCells = [
    { row: 10, col: 11 },
    { row: 11, col: 12 },
    { row: 12, col: 10 },
    { row: 12, col: 11 },
    { row: 12, col: 12 }
  ];
  generation = 0;
  updateDisplay();
}

function updateSpeed() {
  if (!speedSlider) return;
  
  const sliderValue = parseInt(speedSlider.value);
  // Convert slider value (1-20) to speed (1000-50ms)
  // Higher slider value = faster = lower ms
  speed = 1050 - (sliderValue * 50);
  
  const speedDisplay = document.querySelector('.speed-display');
  if (speedDisplay) {
    speedDisplay.textContent = `${speed}ms per Generation`;
  }
  
  // Restart with new speed if currently running
  if (isRunning) {
    stopGame();
    startGame();
  }
}

// Initialize when DOM is loaded
function initializeGameOfLife() {
  initializeGame();
  
  // Setup popup initialization
  const originalTogglePopup = window.togglePopup;
  window.togglePopup = function() {
    originalTogglePopup();
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      if (document.getElementById('gameOfLife').style.display === 'block') {
        initializeGrid();
      }
    }, 10);
  };
}