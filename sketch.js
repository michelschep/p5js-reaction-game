let grid = [];
let gridSize = 4;
let cellSize = 100;
let padding = 20;
let gameState = 'idle'; // idle, playing, finished
let currentTarget = null;
let targetCount = 0;
let maxTargets = 10;
let lightStartTime = 0;
let totalReactionTime = 0;
let rankings = [];
let nextLightDelay = 0;
let waitingForNextLight = false;

function setup() {
  let canvasWidth = gridSize * cellSize + padding * 2;
  let canvasHeight = gridSize * cellSize + padding * 2 + 200;
  createCanvas(canvasWidth, canvasHeight);
  
  // Initialize grid
  for (let i = 0; i < gridSize; i++) {
    grid[i] = [];
    for (let j = 0; j < gridSize; j++) {
      grid[i][j] = {
        x: padding + j * cellSize,
        y: padding + i * cellSize,
        active: false,
        row: i,
        col: j
      };
    }
  }
  
  loadRankings();
}

function draw() {
  background(40);
  
  // Draw grid
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      let cell = grid[i][j];
      
      if (cell.active) {
        fill(255, 50, 50);
        stroke(255, 100, 100);
      } else {
        fill(80);
        stroke(120);
      }
      
      strokeWeight(2);
      rect(cell.x, cell.y, cellSize, cellSize, 8);
    }
  }
  
  // Draw UI
  fill(255);
  textSize(24);
  textAlign(CENTER);
  
  if (gameState === 'idle') {
    text('REACTION SPEED GAME', width / 2, padding + gridSize * cellSize + 60);
    textSize(18);
    text('Click START to begin', width / 2, padding + gridSize * cellSize + 90);
    text('Hit 10 lights as fast as you can!', width / 2, padding + gridSize * cellSize + 115);
    
    // Draw start button
    drawButton('START', width / 2, padding + gridSize * cellSize + 150);
    
  } else if (gameState === 'playing') {
    text(`Target: ${targetCount + 1} / ${maxTargets}`, width / 2, padding + gridSize * cellSize + 60);
    
    if (waitingForNextLight) {
      textSize(16);
      text('Wait...', width / 2, padding + gridSize * cellSize + 90);
    }
    
  } else if (gameState === 'finished') {
    textSize(28);
    fill(100, 255, 100);
    text(`TIME: ${(totalReactionTime / 1000).toFixed(3)}s`, width / 2, padding + gridSize * cellSize + 60);
    
    textSize(18);
    fill(255);
    text('Click RESTART to play again', width / 2, padding + gridSize * cellSize + 95);
    
    // Draw restart button
    drawButton('RESTART', width / 2, padding + gridSize * cellSize + 130);
    
    // Show rankings
    textSize(16);
    text('TOP 5 TIMES', width / 2, padding + gridSize * cellSize + 170);
    textSize(14);
    textAlign(LEFT);
    for (let i = 0; i < min(5, rankings.length); i++) {
      text(`${i + 1}. ${(rankings[i] / 1000).toFixed(3)}s`, width / 2 - 80, padding + gridSize * cellSize + 195 + i * 20);
    }
  }
}

function drawButton(label, x, y) {
  let buttonWidth = 160;
  let buttonHeight = 40;
  
  // Check hover
  let hovering = mouseX > x - buttonWidth / 2 && mouseX < x + buttonWidth / 2 &&
                 mouseY > y - buttonHeight / 2 && mouseY < y + buttonHeight / 2;
  
  if (hovering) {
    fill(100, 200, 100);
  } else {
    fill(60, 150, 60);
  }
  
  stroke(255);
  strokeWeight(2);
  rect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight, 8);
  
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(18);
  text(label, x, y);
}

function mousePressed() {
  if (gameState === 'idle') {
    // Check if start button clicked
    let buttonY = padding + gridSize * cellSize + 150;
    if (mouseY > buttonY - 20 && mouseY < buttonY + 20) {
      startGame();
    }
  } else if (gameState === 'playing') {
    checkCellClick();
  } else if (gameState === 'finished') {
    // Check if restart button clicked
    let buttonY = padding + gridSize * cellSize + 130;
    if (mouseY > buttonY - 20 && mouseY < buttonY + 20) {
      resetGame();
    }
  }
}

function startGame() {
  gameState = 'playing';
  targetCount = 0;
  totalReactionTime = 0;
  waitingForNextLight = false;
  activateRandomCell();
}

function resetGame() {
  gameState = 'idle';
  currentTarget = null;
  targetCount = 0;
  totalReactionTime = 0;
  waitingForNextLight = false;
  
  // Clear all active cells
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      grid[i][j].active = false;
    }
  }
}

function activateRandomCell() {
  // Deactivate current
  if (currentTarget) {
    grid[currentTarget.row][currentTarget.col].active = false;
  }
  
  // Random delay before next light (200ms to 1000ms)
  if (targetCount > 0) {
    waitingForNextLight = true;
    nextLightDelay = random(200, 1000);
    setTimeout(() => {
      waitingForNextLight = false;
      showNextLight();
    }, nextLightDelay);
  } else {
    showNextLight();
  }
}

function showNextLight() {
  // Activate random cell
  let row = floor(random(gridSize));
  let col = floor(random(gridSize));
  grid[row][col].active = true;
  currentTarget = { row, col };
  lightStartTime = millis(); // Start timing when light appears
}

function checkCellClick() {
  if (waitingForNextLight) return;
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      let cell = grid[i][j];
      
      if (mouseX > cell.x && mouseX < cell.x + cellSize &&
          mouseY > cell.y && mouseY < cell.y + cellSize) {
        
        if (cell.active) {
          // Correct cell clicked
          let reactionTime = millis() - lightStartTime;
          totalReactionTime += reactionTime;
          targetCount++;
          
          if (targetCount >= maxTargets) {
            // Game finished
            gameState = 'finished';
            cell.active = false;
            saveRanking(totalReactionTime);
          } else {
            // Next target
            activateRandomCell();
          }
        }
        return;
      }
    }
  }
}

function saveRanking(time) {
  rankings.push(time);
  rankings.sort((a, b) => a - b);
  
  // Keep only top 10
  if (rankings.length > 10) {
    rankings = rankings.slice(0, 10);
  }
  
  // Save to localStorage
  storeItem('reactionGameRankings', JSON.stringify(rankings));
}

function loadRankings() {
  let stored = getItem('reactionGameRankings');
  if (stored) {
    rankings = JSON.parse(stored);
  }
}
