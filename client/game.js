const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const playButton = document.getElementById('playButton');
const titleScreen = document.getElementById('titleScreen');
const usernameInput = document.getElementById('username');
const socket = new WebSocket('ws://localhost:8080');
const titleCanvas = document.getElementById('titleCanvas');
const titleCtx = titleCanvas.getContext('2d');

// Set title canvas size to full window
titleCanvas.width = window.innerWidth;
titleCanvas.height = window.innerHeight;

function resizeTitleCanvas() {
    titleCanvas.width = window.innerWidth;
    titleCanvas.height = window.innerHeight;
  }
  
  // Initial resize
  resizeTitleCanvas();
  
  // Update canvas size on window resize
  window.addEventListener('resize', resizeTitleCanvas);

const WIDTH = 800;
const HEIGHT = 600;
const WALL_THICKNESS = 20;
const walls = [
  { x: 0, y: 0, width: WIDTH, height: WALL_THICKNESS },
  { x: 0, y: HEIGHT - WALL_THICKNESS, width: WIDTH, height: WALL_THICKNESS },
  { x: 0, y: 0, width: WALL_THICKNESS, height: HEIGHT },
  { x: WIDTH - WALL_THICKNESS, y: 0, width: WALL_THICKNESS, height: HEIGHT }
];

let player = {
  screenX: WIDTH / 2,
  screenY: HEIGHT / 2,
  worldX: WIDTH / 2,
  worldY: HEIGHT / 2,
  size: 20,
  color: '#' + Math.floor(Math.random()*16777215).toString(16),
  username: ''
};

const keysPressed = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false
};

const MOVE_SPEED = 1.5;

const GRID_SIZE = 25;
let gridOffsetX = 0;
let gridOffsetY = 0;
const GRID_SPEED = 0.25;

playButton.addEventListener('click', startGame);

socket.onopen = () => {
  console.log('Connected to server');
};

socket.onmessage = (event) => {
  console.log('Message from server:', event.data);
};

function drawTitleGrid() {
  // Clear the entire canvas with a transparent background
  titleCtx.clearRect(0, 0, titleCanvas.width, titleCanvas.height);

  titleCtx.strokeStyle = '#00e043';
  titleCtx.lineWidth = 1;

  // Calculate starting points based on offset
  const startX = gridOffsetX % GRID_SIZE - GRID_SIZE;
  const startY = gridOffsetY % GRID_SIZE - GRID_SIZE;

  // Draw vertical lines
  for (let x = startX; x < titleCanvas.width + GRID_SIZE; x += GRID_SIZE) {
    titleCtx.beginPath();
    titleCtx.moveTo(x, 0);
    titleCtx.lineTo(x, titleCanvas.height);
    titleCtx.stroke();
  }

  // Draw horizontal lines
  for (let y = startY; y < titleCanvas.height + GRID_SIZE; y += GRID_SIZE) {
    titleCtx.beginPath();
    titleCtx.moveTo(0, y);
    titleCtx.lineTo(titleCanvas.width, y);
    titleCtx.stroke();
  }
}

function animateTitleGrid() {
  gridOffsetX += GRID_SPEED;
  gridOffsetY += GRID_SPEED;
  drawTitleGrid();
  if (titleScreen.style.display !== 'none') {
    requestAnimationFrame(animateTitleGrid);
  }
}

animateTitleGrid();

function drawWalls() {
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  const offsetX = player.screenX - player.worldX;
  const offsetY = player.screenY - player.worldY;
  walls.forEach(wall => {
    ctx.strokeRect(wall.x + offsetX, wall.y + offsetY, wall.width, wall.height);
  });
}

function drawPlayer() {
  ctx.beginPath();
  ctx.arc(player.screenX, player.screenY, player.size, 0, Math.PI * 2);
  ctx.fillStyle = player.color;
  ctx.fill();
  ctx.closePath();

  ctx.fillStyle = 'white';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(player.username, player.screenX, player.screenY + player.size + 20);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawWalls();
  drawPlayer();
}

function checkCollision(newWorldX, newWorldY) {
  const playerLeft = newWorldX - player.size;
  const playerRight = newWorldX + player.size;
  const playerTop = newWorldY - player.size;
  const playerBottom = newWorldY + player.size;

  for (let wall of walls) {
    const wallLeft = wall.x;
    const wallRight = wall.x + wall.width;
    const wallTop = wall.y;
    const wallBottom = wall.y + wall.height;

    if (playerRight > wallLeft && 
        playerLeft < wallRight && 
        playerBottom > wallTop && 
        playerTop < wallBottom) {
      return true;
    }
  }
  return false;
}

function updatePosition() {
  let dx = 0;
  let dy = 0;

  if (keysPressed.ArrowUp) dy -= MOVE_SPEED;
  if (keysPressed.ArrowDown) dy += MOVE_SPEED;
  if (keysPressed.ArrowLeft) dx -= MOVE_SPEED;
  if (keysPressed.ArrowRight) dx += MOVE_SPEED;

  let newWorldX = player.worldX;
  let newWorldY = player.worldY;
  if (dx !== 0 || dy !== 0) {
    const magnitude = Math.sqrt(dx * dx + dy * dy);
    const normalizedDx = (dx / magnitude) * MOVE_SPEED;
    const normalizedDy = (dy / magnitude) * MOVE_SPEED;
    
    newWorldX = player.worldX + normalizedDx;
    newWorldY = player.worldY + normalizedDy;
  }

  if (!checkCollision(newWorldX, newWorldY)) {
    player.worldX = newWorldX;
    player.worldY = newWorldY;
    socket.send(JSON.stringify({ x: player.worldX, y: player.worldY, username: player.username }));
  }

  draw();
  requestAnimationFrame(updatePosition);
}

function startGame() {
  titleScreen.style.display = 'none';
  canvas.style.display = 'block';
  
  player.username = usernameInput.value || 'Player';
  socket.send(JSON.stringify({ x: player.worldX, y: player.worldY, username: player.username }));
  draw();

  document.addEventListener('keydown', (e) => {
    if (keysPressed.hasOwnProperty(e.key)) {
      keysPressed[e.key] = true;
    }
  });

  document.addEventListener('keyup', (e) => {
    if (keysPressed.hasOwnProperty(e.key)) {
      keysPressed[e.key] = false;
    }
  });

  requestAnimationFrame(updatePosition);
}