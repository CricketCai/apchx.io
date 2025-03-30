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

// Initial resize for title canvas
resizeTitleCanvas();

// Update title canvas size on window resize
window.addEventListener('resize', resizeTitleCanvas);

// Virtual world dimensions (fixed)
const WORLD_WIDTH = 800;
const WORLD_HEIGHT = 600;
const WALL_THICKNESS = 20;
const walls = [
  { x: 0, y: 0, width: WORLD_WIDTH, height: WALL_THICKNESS },
  { x: 0, y: WORLD_HEIGHT - WALL_THICKNESS, width: WORLD_WIDTH, height: WALL_THICKNESS },
  { x: 0, y: 0, width: WALL_THICKNESS, height: WORLD_HEIGHT },
  { x: WORLD_WIDTH - WALL_THICKNESS, y: 0, width: WALL_THICKNESS, height: WORLD_HEIGHT }
];

let player = {
  screenX: 0, // Will be set by resize function
  screenY: 0, // Will be set by resize function
  worldX: WORLD_WIDTH / 2,
  worldY: WORLD_HEIGHT / 2,
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
  titleCtx.clearRect(0, 0, titleCanvas.width, titleCanvas.height);
  titleCtx.strokeStyle = '#00e043';
  titleCtx.lineWidth = 1;

  const startX = gridOffsetX % GRID_SIZE - GRID_SIZE;
  const startY = gridOffsetY % GRID_SIZE - GRID_SIZE;

  for (let x = startX; x < titleCanvas.width + GRID_SIZE; x += GRID_SIZE) {
    titleCtx.beginPath();
    titleCtx.moveTo(x, 0);
    titleCtx.lineTo(x, titleCanvas.height);
    titleCtx.stroke();
  }

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

// Function to resize game canvas and adjust scaling
function resizeGameCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Calculate scale to fit world in canvas while preserving aspect ratio
  const scaleX = canvas.width / WORLD_WIDTH;
  const scaleY = canvas.height / WORLD_HEIGHT;
  const scale = Math.min(scaleX, scaleY);

  // Center the scaled world in the canvas
  const offsetX = (canvas.width - WORLD_WIDTH * scale) / 2;
  const offsetY = (canvas.height - WORLD_HEIGHT * scale) / 2;

  // Set player screen position (always centered in world coordinates)
  player.screenX = offsetX + (WORLD_WIDTH / 2) * scale;
  player.screenY = offsetY + (WORLD_HEIGHT / 2) * scale;

  // Apply scaling transformation
  ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
}

// Initial resize and add resize listener for game canvas
resizeGameCanvas();
window.addEventListener('resize', resizeGameCanvas);

function drawWalls() {
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2 / Math.min(canvas.width / WORLD_WIDTH, canvas.height / WORLD_HEIGHT);
  const offsetX = (WORLD_WIDTH / 2) - player.worldX;
  const offsetY = (WORLD_HEIGHT / 2) - player.worldY;
  walls.forEach(wall => {
    ctx.strokeRect(wall.x + offsetX, wall.y + offsetY, wall.width, wall.height);
  });
}

function drawPlayer() {
    ctx.beginPath();
    ctx.arc(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, player.size, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.closePath();
  
    const scaleFactor = Math.min(canvas.width / WORLD_WIDTH, canvas.height / WORLD_HEIGHT);
    ctx.font = `10px Ubuntu`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white'; // Fill color
    ctx.strokeStyle = 'black'; // Outline color
    ctx.lineWidth = '2px'; // Outline thickness, scaled appropriately
    ctx.strokeText(player.username, WORLD_WIDTH / 2, WORLD_HEIGHT / 2 + player.size * 1.6); // Draw outline
    ctx.fillText(player.username, WORLD_WIDTH / 2, WORLD_HEIGHT / 2 + player.size * 1.6); // Draw fill
  }

function draw() {
  // Clear the entire physical canvas to match body background
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to identity for full clear
  ctx.fillStyle = '#f0f0f0'; // Match body background-color
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  // Draw game elements in scaled world coordinates
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
  
  player.username = usernameInput.value || 'Unnamed Copter';
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