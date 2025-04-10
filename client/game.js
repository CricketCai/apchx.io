import { canvas, ctx, playButton, titleScreen, usernameInput, socket, exitButton, walls, WORLD_WIDTH, WORLD_HEIGHT } from './setup.js';
import { useKeyboardControls, mouseX, mouseY, keysPressed } from './controls.js';
import { draw, drawPlayer, animateTitleGrid, stopTitleGridAnimation } from './render.js';

// Mouse and listener variables
let mouseLeftPressed = false;
let mouseRightPressed = false;
let keydownListener, keyupListener, mousedownListener, mouseupListener;
let animationFrameId = null;

// Healing variables
let lastHealTime = null;
let prevRotorAngle = 0;

// Test mob
export const mob = {
  x: 7950,
  y: 350,
  radius: 45,
  dx: 0,
  dy: 0,
  mass: 10,
  friction: 0.95
};

// Listener management
function addGameListeners() {
  keydownListener = (e) => {
    if (keysPressed.hasOwnProperty(e.key)) {
      keysPressed[e.key] = true;
    } else if (e.key === ' ') {
      keysPressed.Space = true;
      setRotorSpeed(0.1);
    } else if (e.key === 'Shift') {
      keysPressed.Shift = true;
      setRotorSpeed(0.025);
    }
  };

  keyupListener = (e) => {
    if (keysPressed.hasOwnProperty(e.key)) {
      keysPressed[e.key] = false;
    } else if (e.key === ' ') {
      keysPressed.Space = false;
    } else if (e.key === 'Shift') {
      keysPressed.Shift = false;
    }
    if (!keysPressed.Space && !keysPressed.Shift && !mouseLeftPressed && !mouseRightPressed) {
      setRotorSpeed(0.05);
    }
  };

  mousedownListener = (e) => {
    if (e.button === 0) {
      mouseLeftPressed = true;
      setRotorSpeed(0.1);
    } else if (e.button === 2) {
      mouseRightPressed = true;
      setRotorSpeed(0.025);
    }
  };

  mouseupListener = (e) => {
    if (e.button === 0) {
      mouseLeftPressed = false;
    } else if (e.button === 2) {
      mouseRightPressed = false;
    }
    if (!mouseLeftPressed && !mouseRightPressed && !keysPressed.Space && !keysPressed.Shift) {
      setRotorSpeed(0.05);
    }
  };

  document.addEventListener('keydown', keydownListener);
  document.addEventListener('keyup', keyupListener);
  canvas.addEventListener('mousedown', mousedownListener);
  canvas.addEventListener('mouseup', mouseupListener);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

function removeGameListeners() {
  document.removeEventListener('keydown', keydownListener);
  document.removeEventListener('keyup', keyupListener);
  canvas.removeEventListener('mousedown', mousedownListener);
  canvas.removeEventListener('mouseup', mouseupListener);
}

export const MOVE_SPEED = 1.5;
export let rotorAngle = 0;
export let rotorSpeed = 0.05;
export function setRotorSpeed(newSpeed) {
  rotorSpeed = newSpeed;
}
export let player = {
  screenX: window.innerWidth / 2,
  screenY: window.innerHeight / 2,
  worldX: 7900,
  worldY: 300,
  size: 20,
  color: '#' + Math.floor(Math.random() * 16777215).toString(16),
  username: '',
  angle: 0,
  lastDx: 0,
  lastDy: 0,
  hp: 100,
  maxHp: 100,
  mass: 5,
  rotorCount: 3,
  rotorLength: 20 * 6.3,
  rotorSize: 25 // Increased to ensure no phasing
};

playButton.addEventListener('click', startGame);
socket.onopen = () => console.log('Connected to server');
socket.onmessage = (event) => console.log('Message from server:', event.data);

export function resizeGameCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  player.screenX = canvas.width / 2;
  player.screenY = canvas.height / 2;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

resizeGameCanvas();
window.addEventListener('resize', resizeGameCanvas);

export function checkCollision(newWorldX, newWorldY) {
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

function checkMobCollisionWithPlayer() {
  const dx = player.worldX - mob.x;
  const dy = player.worldY - mob.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < (player.size + mob.radius);
}

function checkMobCollisionWithRotorSweep(startX, startY, endX, endY) {
  const dx = endX - startX;
  const dy = endY - startY;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return false;

  const dirX = dx / len;
  const dirY = dy / len;

  const toMobX = mob.x - startX;
  const toMobY = mob.y - startY;

  const dot = toMobX * dirX + toMobY * dirY;
  const closestX = startX + dirX * Math.max(0, Math.min(dot, len));
  const closestY = startY + dirY * Math.max(0, Math.min(dot, len));

  const distX = mob.x - closestX;
  const distY = mob.y - closestY;
  const distance = Math.sqrt(distX * distX + distY * distY);

  return distance < (player.rotorSize + mob.radius);
}

function checkMobWallCollision(newMobX, newMobY) {
  const mobLeft = newMobX - mob.radius;
  const mobRight = newMobX + mob.radius;
  const mobTop = newMobY - mob.radius;
  const mobBottom = newMobY + mob.radius;

  for (let wall of walls) {
    const wallLeft = wall.x;
    const wallRight = wall.x + wall.width;
    const wallTop = wall.y;
    const wallBottom = wall.y + wall.height;

    if (mobRight > wallLeft && 
        mobLeft < wallRight && 
        mobBottom > wallTop && 
        mobTop < wallBottom) {
      return true;
    }
  }
  return false;
}

function handleCollision(objX, objY, objDx, objDy, objMass, isPlayerBody = false) {
  const dx = mob.x - objX;
  const dy = mob.y - objY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const nx = distance > 0 ? dx / distance : 0;
  const ny = distance > 0 ? dy / distance : 0;

  const relativeVx = mob.dx - objDx;
  const relativeVy = mob.dy - objDy;
  const dotProduct = relativeVx * nx + relativeVy * ny;

  const impulse = (2 * dotProduct) / (objMass + mob.mass);
  const pushFactor = isPlayerBody ? 1 : 3; // Even stronger rotor push

  // Push along rotor velocity direction, not just normal
  const pushDirX = isPlayerBody ? nx : (objDx / Math.sqrt(objDx * objDx + objDy * objDy) || nx);
  const pushDirY = isPlayerBody ? ny : (objDy / Math.sqrt(objDx * objDx + objDy * objDy) || ny);

  mob.dx -= pushFactor * impulse * objMass * pushDirX;
  mob.dy -= pushFactor * impulse * objMass * pushDirY;

  const overlap = (isPlayerBody ? player.size : player.rotorSize) + mob.radius - distance;
  if (overlap > 0) {
    const mobPushX = mob.x + pushDirX * overlap * 2; // Stronger push to clear rotor
    const mobPushY = mob.y + pushDirY * overlap * 2;
    if (!checkMobWallCollision(mobPushX, mob.y)) mob.x = mobPushX;
    if (!checkMobWallCollision(mob.x, mobPushY)) mob.y = mobPushY;

    if (isPlayerBody) {
      const playerPushX = player.worldX - nx * overlap * 0.2;
      const playerPushY = player.worldY - ny * overlap * 0.2;
      if (!checkCollision(playerPushX, player.worldY)) player.worldX = playerPushX;
      if (!checkCollision(player.worldX, playerPushY)) player.worldY = playerPushY;
      if (player.hp > 0) player.hp -= 1;
    }
  }
}

function updateMob() {
  try {
    // Apply friction
    mob.dx *= mob.friction;
    mob.dy *= mob.friction;

    if (Math.abs(mob.dx) < 0.01) mob.dx = 0;
    if (Math.abs(mob.dy) < 0.01) mob.dy = 0;

    let newMobX = mob.x + mob.dx;
    let newMobY = mob.y + mob.dy;

    if (checkMobWallCollision(newMobX, mob.y)) {
      newMobX = mob.x;
      mob.dx = 0;
    }
    if (checkMobWallCollision(mob.x, newMobY)) {
      newMobY = mob.y;
      mob.dy = 0;
    }

    newMobX = Math.max(mob.radius, Math.min(WORLD_WIDTH - mob.radius, newMobX));
    newMobY = Math.max(mob.radius, Math.min(WORLD_HEIGHT - mob.radius, newMobY));

    mob.x = newMobX;
    mob.y = newMobY;

    // Check collision with player body
    if (checkMobCollisionWithPlayer()) {
      handleCollision(player.worldX, player.worldY, player.lastDx, player.lastDy, player.mass, true);
    }

    // Check collision with rotors
    for (let i = 0; i < player.rotorCount; i++) {
      const prevAngle = prevRotorAngle + (i * 2 * Math.PI / player.rotorCount);
      const currAngle = rotorAngle + (i * 2 * Math.PI / player.rotorCount);

      const startX = player.worldX + Math.cos(prevAngle) * player.rotorLength;
      const startY = player.worldY + Math.sin(prevAngle) * player.rotorLength;
      const endX = player.worldX + Math.cos(currAngle) * player.rotorLength;
      const endY = player.worldY + Math.sin(currAngle) * player.rotorLength;

      const rotorSpeedWorld = rotorSpeed * player.rotorLength;
      const rotorDx = -Math.sin(currAngle) * rotorSpeedWorld;
      const rotorDy = Math.cos(currAngle) * rotorSpeedWorld;

      if (checkMobCollisionWithRotorSweep(startX, startY, endX, endY)) {
        handleCollision(endX, endY, rotorDx, rotorDy, player.mass);
      }
    }
  } catch (error) {
    console.error('Error in updateMob:', error);
  }
}

function updateHealing(timestamp) {
  if (!lastHealTime) lastHealTime = timestamp;
  const elapsed = timestamp - lastHealTime;

  if (elapsed >= 1000) {
    if (player.hp < player.maxHp) {
      player.hp = Math.min(player.hp + 1, player.maxHp);
    }
    lastHealTime = timestamp;
  }
}

export function updatePosition(timestamp) {
  try {
    let dx = 0;
    let dy = 0;

    if (useKeyboardControls) {
      if (keysPressed.ArrowUp) dy -= MOVE_SPEED;
      if (keysPressed.ArrowDown) dy += MOVE_SPEED;
      if (keysPressed.ArrowLeft) dx -= MOVE_SPEED;
      if (keysPressed.ArrowRight) dx += MOVE_SPEED;
    } else {
      const distance = Math.sqrt(mouseX * mouseX + mouseY * mouseY);
      if (distance > 5) {
        dx = (mouseX / distance) * MOVE_SPEED;
        dy = (mouseY / distance) * MOVE_SPEED;
      }
    }

    let newWorldX = player.worldX;
    let newWorldY = player.worldY;

    if (dx !== 0 || dy !== 0) {
      const magnitude = Math.sqrt(dx * dx + dy * dy);
      const normalizedDx = (dx / magnitude) * MOVE_SPEED;
      const normalizedDy = (dy / magnitude) * MOVE_SPEED;

      newWorldX = player.worldX + normalizedDx;
      if (!checkCollision(newWorldX, player.worldY)) {
        player.worldX = newWorldX;
      } else {
        newWorldX = player.worldX;
      }

      newWorldY = player.worldY + normalizedDy;
      if (!checkCollision(player.worldX, newWorldY)) {
        player.worldY = newWorldY;
      } else {
        newWorldY = player.worldY;
      }

      player.lastDx = dx;
      player.lastDy = dy;
      player.angle = Math.atan2(player.lastDy, player.lastDx);
    }

    updateMob();
    updateHealing(timestamp);

    socket.send(JSON.stringify({ x: player.worldX, y: player.worldY, username: player.username, hp: player.hp }));

    prevRotorAngle = rotorAngle;
    rotorAngle += rotorSpeed;

    draw();
    animationFrameId = requestAnimationFrame(updatePosition);
  } catch (error) {
    console.error('Error in updatePosition:', error);
  }
}

export function startGame() {
  try {
    titleScreen.style.display = 'none';
    canvas.style.display = 'block';
    exitButton.style.display = 'block';
    player.username = usernameInput.value || 'Unnamed Copter';
    player.hp = player.maxHp;
    lastHealTime = null;
    mob.dx = 0;
    mob.dy = 0;
    prevRotorAngle = 0;
    socket.send(JSON.stringify({ x: player.worldX, y: player.worldY, username: player.username, hp: player.hp }));
    draw();

    addGameListeners();
    canvas.focus();

    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    stopTitleGridAnimation();
    animationFrameId = requestAnimationFrame(updatePosition);
  } catch (error) {
    console.error('Error in startGame:', error);
  }
}

export function exitGame() {
  try {
    canvas.style.display = 'none';
    exitButton.style.display = 'none';
    titleScreen.style.display = 'flex';
    removeGameListeners();
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    stopTitleGridAnimation();
    animateTitleGrid();
  } catch (error) {
    console.error('Error in exitGame:', error);
  }
}

exitButton.addEventListener('click', exitGame);