import { ctx, canvas, titleCtx, titleCanvas, WORLD_WIDTH, WORLD_HEIGHT, BACKGROUND_EXTENSION } from './setup.js';
import { player, rotorAngle, startGame, mob } from './game.js'; // Added mob import

const mapImage = new Image();
mapImage.src = 'assets/map.png';
let backgroundPattern = null;
mapImage.onload = () => {
  backgroundPattern = ctx.createPattern(mapImage, 'repeat');
  console.log('map.png loaded');
};
mapImage.onerror = () => console.error('Failed to load map.png');

const playerImage = new Image();
playerImage.src = 'assets/copter v2.svg';
let playerImageLoaded = false;
playerImage.onload = () => {
  playerImageLoaded = true;
  console.log('copter v2.svg loaded');
};
playerImage.onerror = () => console.error('Failed to load copter v2.svg');

const bearing = new Image();
bearing.src = 'assets/rotobearingOL.svg';
let bearingLoaded = false;
bearing.onload = () => {
  bearingLoaded = true;
  console.log('rotobearingOL.svg loaded');
};
bearing.onerror = () => console.error('Failed to load rotobearingOL.svg');

const GRID_SIZE = 25;
let gridOffsetX = 0;
let gridOffsetY = 0;
const GRID_SPEED = 0.25;
let titleAnimationFrameId = null;

export function drawTitleGrid() {
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

export function animateTitleGrid() {
  gridOffsetX += GRID_SPEED;
  gridOffsetY += GRID_SPEED;
  drawTitleGrid();
  if (titleCanvas.style.display !== 'none') {
    titleAnimationFrameId = requestAnimationFrame(animateTitleGrid);
  }
}

export function stopTitleGridAnimation() {
  if (titleAnimationFrameId) {
    cancelAnimationFrame(titleAnimationFrameId);
    titleAnimationFrameId = null;
  }
}

animateTitleGrid();

export function drawPlayer() {
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  
  ctx.beginPath();
  ctx.arc(0, 0, player.size, 0, Math.PI * 2);
  ctx.fillStyle = player.color;
  ctx.fill();
  ctx.closePath();
  
  if (playerImageLoaded) {
    ctx.save();
    ctx.rotate(player.angle);
    const imgWidth = playerImage.width;
    const imgHeight = playerImage.height;
    ctx.drawImage(playerImage, -imgWidth / 2, -imgHeight / 2);
    ctx.restore();
  }

  const rotorLength = player.size * 6.3;
  const rotorTopWidth = player.size * 0.4;
  const rotorBaseWidth = player.size * 0.6;
  const rotorCount = 3;
  
  ctx.save();
  for (let i = 0; i < rotorCount; i++) {
    ctx.save();
    ctx.rotate(rotorAngle + (i * 2 * Math.PI / rotorCount));
    
    ctx.beginPath();
    ctx.moveTo(player.size, -rotorBaseWidth / 4);
    ctx.lineTo(player.size, rotorBaseWidth / 4);
    ctx.lineTo(player.size * 1.7, rotorBaseWidth / 4);
    ctx.lineTo(player.size * 2.1, rotorBaseWidth);
    ctx.lineTo(player.size + rotorLength * 1.06, rotorTopWidth / 1.5);
    ctx.lineTo(player.size + rotorLength * 1.2, -rotorTopWidth / 2);
    ctx.lineTo(player.size, -rotorBaseWidth / 4);
    ctx.closePath();
    
    ctx.fillStyle = 'rgba(128, 128, 128, 0.7)';
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.restore();
  }
  ctx.restore();

  if (bearingLoaded) {
    ctx.save();
    const bearingSize = player.size * 2.5;
    ctx.drawImage(bearing, -bearingSize / 2, -bearingSize / 2, bearingSize, bearingSize);
    ctx.restore();
  }
  
  ctx.restore();
  
  const hpBarWidth = 50;
  const hpBarHeight = 5;
  const hpBarX = canvas.width / 2 - hpBarWidth / 2;
  const hpBarY = canvas.height / 2 + player.size * 2;
  const hpFillWidth = (player.hp / player.maxHp) * hpBarWidth;

  ctx.fillStyle = 'black';
  ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
  ctx.fillStyle = 'green';
  ctx.fillRect(hpBarX, hpBarY, hpFillWidth, hpBarHeight);

  ctx.font = '10px Ubuntu';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.strokeText(player.username, canvas.width / 2, canvas.height / 2 + player.size * 1.6);
  ctx.fillText(player.username, canvas.width / 2, canvas.height / 2 + player.size * 1.6);
}

export function draw() {
  try {
    console.log('draw called'); // Debug log
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const offsetX = (canvas.width / 2) - player.worldX;
    const offsetY = (canvas.height / 2) - player.worldY;

    if (backgroundPattern) {
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.fillStyle = backgroundPattern;
      const bgLeft = -BACKGROUND_EXTENSION;
      const bgTop = -BACKGROUND_EXTENSION;
      const bgWidth = WORLD_WIDTH + (2 * BACKGROUND_EXTENSION);
      const bgHeight = WORLD_HEIGHT + (2 * BACKGROUND_EXTENSION);
      ctx.fillRect(bgLeft, bgTop, bgWidth, bgHeight);
      ctx.restore();
    }

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(-BACKGROUND_EXTENSION, -BACKGROUND_EXTENSION, 
                 WORLD_WIDTH + (2 * BACKGROUND_EXTENSION), BACKGROUND_EXTENSION);
    ctx.fillRect(-BACKGROUND_EXTENSION, WORLD_HEIGHT, 
                 WORLD_WIDTH + (2 * BACKGROUND_EXTENSION), BACKGROUND_EXTENSION);
    ctx.fillRect(-BACKGROUND_EXTENSION, -0.1, 
                 BACKGROUND_EXTENSION, WORLD_HEIGHT + 0.2);
    ctx.fillRect(WORLD_WIDTH, -0.1, 
                 BACKGROUND_EXTENSION, WORLD_HEIGHT + 0.2);
    
    ctx.beginPath();
    ctx.arc(mob.x, mob.y, mob.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'red';
    ctx.fill();
    ctx.closePath();

    ctx.restore();

    drawPlayer();

    const largeHpBarWidth = 200;
    const largeHpBarHeight = 20;
    const largeHpBarX = 60;
    const largeHpBarY = 60;
    const largeHpFillWidth = (player.hp / player.maxHp) * largeHpBarWidth;

    ctx.fillStyle = 'black';
    ctx.fillRect(largeHpBarX, largeHpBarY, largeHpBarWidth, largeHpBarHeight);
    ctx.fillStyle = 'green';
    ctx.fillRect(largeHpBarX, largeHpBarY, largeHpFillWidth, largeHpBarHeight);

    ctx.font = '14px Ubuntu';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.strokeText(player.username, largeHpBarX + largeHpBarWidth / 2, largeHpBarY + 14);
    ctx.fillText(player.username, largeHpBarX + largeHpBarWidth / 2, largeHpBarY + 14);
  } catch (error) {
    console.error('Error in draw:', error);
  }
}