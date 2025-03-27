const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const playButton = document.getElementById('playButton');
const titleScreen = document.getElementById('titleScreen');
const usernameInput = document.getElementById('username');
const socket = new WebSocket('ws://localhost:8080');

// Canvas dimensions
const WIDTH = 800;
const HEIGHT = 600;

// Wall properties
const WALL_THICKNESS = 20;
const walls = [
  { x: 0, y: 0, width: WIDTH, height: WALL_THICKNESS }, // Top
  { x: 0, y: HEIGHT - WALL_THICKNESS, width: WIDTH, height: WALL_THICKNESS }, // Bottom
  { x: 0, y: 0, width: WALL_THICKNESS, height: HEIGHT }, // Left
  { x: WIDTH - WALL_THICKNESS, y: 0, width: WALL_THICKNESS, height: HEIGHT } // Right
];

let player = {
  x: WIDTH / 2,  // Center of canvas
  y: HEIGHT / 2, // Center of canvas
  size: 20,
  color: '#' + Math.floor(Math.random()*16777215).toString(16),
  username: ''
};

playButton.addEventListener('click', startGame);

socket.onopen = () => {
  console.log('Connected to server');
};

socket.onmessage = (event) => {
  console.log('Message from server:', event.data);
};

function drawWalls() {
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  walls.forEach(wall => {
    ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
  });
}

function drawPlayer() {
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
  ctx.fillStyle = player.color;
  ctx.fill();
  ctx.closePath();

  // Draw username below player
  ctx.fillStyle = 'white';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(player.username, player.x, player.y + player.size + 20);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawWalls();
  drawPlayer();
}

// Check collision with walls
function checkCollision(newX, newY) {
  const playerLeft = newX - player.size;
  const playerRight = newX + player.size;
  const playerTop = newY - player.size;
  const playerBottom = newY + player.size;

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

function startGame() {
  titleScreen.style.display = 'none';
  canvas.style.display = 'block';
  
  player.username = usernameInput.value || 'Player';
  socket.send(JSON.stringify(player));
  draw();

  document.addEventListener('keydown', (e) => {
    let newX = player.x;
    let newY = player.y;

    if (e.key === 'ArrowUp') newY -= 10;
    if (e.key === 'ArrowDown') newY += 10;
    if (e.key === 'ArrowLeft') newX -= 10;
    if (e.key === 'ArrowRight') newX += 10;

    // Only update position if no collision
    if (!checkCollision(newX, newY)) {
      player.x = newX;
      player.y = newY;
      socket.send(JSON.stringify(player));
      draw();
    }
  });
}