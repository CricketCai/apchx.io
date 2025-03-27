const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const socket = new WebSocket('ws://localhost:8080');

let player = {
  x: 400,
  y: 300,
  size: 20,
  color: '#' + Math.floor(Math.random()*16777215).toString(16) // Random color
};

socket.onopen = () => {
  console.log('Connected to server');
};

socket.onmessage = (event) => {
  console.log('Message from server:', event.data);
};

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
  ctx.fillStyle = player.color;
  ctx.fill();
  ctx.closePath();
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp') player.y -= 10;
  if (e.key === 'ArrowDown') player.y += 10;
  if (e.key === 'ArrowLeft') player.x -= 10;
  if (e.key === 'ArrowRight') player.x += 10;
  socket.send(JSON.stringify(player)); // Send position to server
  draw();
});

draw(); // Initial draw