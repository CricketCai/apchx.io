import { canvas, ctx, playButton, titleScreen, usernameInput, socket, exitButton, walls } from './setup.js';
import { useKeyboardControls, mouseX, mouseY, keysPressed } from './controls.js';
import { draw, drawPlayer } from './render.js';

export const MOVE_SPEED = 1.5;
export let rotorAngle = 0;
export let rotorSpeed = 0.01; // Base speed, adjustable by input
export function setRotorSpeed(newSpeed) {
    rotorSpeed = newSpeed;
}
export let player = {
    screenX: window.innerWidth / 2,
    screenY: window.innerHeight / 2,
    worldX: 7900,
    worldY: 300,
    size: 20,
    color: '#' + Math.floor(Math.random()*16777215).toString(16),
    username: '',
    angle: 0,
    lastDx: 0,
    lastDy: 0
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

export function updatePosition() {
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
        newWorldY = player.worldY + normalizedDy;
        
        player.lastDx = dx;
        player.lastDy = dy;
        player.angle = Math.atan2(player.lastDy, player.lastDx);
    }

    if (!checkCollision(newWorldX, newWorldY)) {
        player.worldX = newWorldX;
        player.worldY = newWorldY;
        socket.send(JSON.stringify({ x: player.worldX, y: player.worldY, username: player.username }));
    }

    // Update rotor angle with dynamic speed
    rotorAngle += rotorSpeed;

    draw();
    requestAnimationFrame(updatePosition);
}

export function startGame() {
    titleScreen.style.display = 'none';
    canvas.style.display = 'block';
    exitButton.style.display = 'block';
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

export function exitGame() {
    canvas.style.display = 'none';
    exitButton.style.display = 'none';
    titleScreen.style.display = 'flex';
}

exitButton.addEventListener('click', exitGame);