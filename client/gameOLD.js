const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const playButton = document.getElementById('playButton');
const titleScreen = document.getElementById('titleScreen');
const usernameInput = document.getElementById('username');
const socket = new WebSocket('ws://localhost:8080');
const titleCanvas = document.getElementById('titleCanvas');
const titleCtx = titleCanvas.getContext('2d');
const exitButton = document.getElementById('exitButton');
const settingsIcon = document.getElementById('settingsIcon');
const settingsPopup = document.getElementById('settingsPopup');
const popupCloseButton = document.getElementById('popupCloseButton');
const keyboardControlsToggle = document.getElementById('keyboardControlsToggle');
let rotorAngle = 0;

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


let useKeyboardControls = true; // On by default
let mouseX = 0;
let mouseY = 0;

playButton.addEventListener('click', startGame);

// Mouse movement listener
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left - canvas.width / 2;
    mouseY = e.clientY - rect.top - canvas.height / 2;
});

// Settings popup toggle
function toggleSettingsPopup() {
    if (settingsPopup.style.display === 'block') {
        settingsPopup.style.display = 'none';
    } else {
        settingsPopup.style.display = 'block';
    }
}

// Close popup when clicking outside
document.addEventListener('click', (e) => {
    if (settingsPopup.style.display === 'block' && 
        !settingsPopup.contains(e.target) && 
        e.target !== settingsIcon) {
        settingsPopup.style.display = 'none';
    }
});

// Toggle keyboard/mouse controls
keyboardControlsToggle.addEventListener('click', () => {
    useKeyboardControls = !useKeyboardControls;
    keyboardControlsToggle.classList.toggle('off', !useKeyboardControls);
});

// Event listeners for settings and close
settingsIcon.addEventListener('click', toggleSettingsPopup);
popupCloseButton.addEventListener('click', () => {
    settingsPopup.style.display = 'none';
});

// ESC key to toggle popup
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        toggleSettingsPopup();
    }
});


// Virtual world dimensions (fixed)
const WORLD_WIDTH = 8000; 
const WORLD_HEIGHT = 600;
const WALL_THICKNESS = 1;
const BACKGROUND_EXTENSION = 1000; // Extend background 1000px beyond walls
const walls = [
    { x: 0, y: 0, width: WORLD_WIDTH, height: WALL_THICKNESS },
    { x: 0, y: WORLD_HEIGHT - WALL_THICKNESS, width: WORLD_WIDTH, height: WALL_THICKNESS },
    { x: 0, y: 0, width: WALL_THICKNESS, height: WORLD_HEIGHT },
    { x: WORLD_WIDTH - WALL_THICKNESS, y: 0, width: WALL_THICKNESS, height: WORLD_HEIGHT }
];

const mapImage = new Image();
mapImage.src = 'assets/map.png';

let backgroundPattern = null;
mapImage.onload = function() {
    backgroundPattern = ctx.createPattern(mapImage, 'repeat');
    console.log('map.png loaded');
};
mapImage.onerror = function() {
    console.error('Failed to load map.png');
};

const playerImage = new Image();
playerImage.src = 'assets/copter v2.svg'; // Adjust path as needed
let playerImageLoaded = false;
playerImage.onload = function() {
    playerImageLoaded = true;
    console.log('copter v2.svg loaded');
};
playerImage.onerror = function() {
    console.error('Failed to load copter v2.svg');
};

let player = {
    screenX: window.innerWidth / 2,
    screenY: window.innerHeight / 2,
    worldX: WORLD_WIDTH - (WORLD_WIDTH - 100),
    worldY: WORLD_HEIGHT / 2,
    size: 20, //strangely scales proportionately with speed 
    color: '#' + Math.floor(Math.random()*16777215).toString(16),
    username: '',
    angle: 0, // Add angle property to track direction
    lastDx: 0, // Track last movement direction
    lastDy: 0
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

function resizeGameCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    player.screenX = canvas.width / 2;
    player.screenY = canvas.height / 2;
    
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

resizeGameCanvas();
window.addEventListener('resize', resizeGameCanvas);

// Removed drawWalls function since walls are now invisible

function drawPlayer() {
    ctx.save();
    
    // Center the context on the player
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    // Draw the circle (base layer) first
    ctx.beginPath();
    ctx.arc(0, 0, player.size, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.closePath();
    
    // Draw the SVG image over the circle with rotation
    if (playerImageLoaded) {
        ctx.save();
        ctx.rotate(player.angle);
        const imgWidth = playerImage.width;
        const imgHeight = playerImage.height;
        ctx.drawImage(playerImage, -imgWidth/2, -imgHeight/2);
        ctx.restore();
    }
    
    // Draw rectangular rotors
    const rotorLength = player.size * 3;
    const rotorWidth = player.size * 0.4;
    const rotorCount = 3;
    
    ctx.save();
    for (let i = 0; i < rotorCount; i++) {
        ctx.save();
        ctx.rotate(rotorAngle + (i * 2 * Math.PI / rotorCount));
        
        // Draw simple rectangle
        ctx.fillStyle = 'rgba(128, 128, 128, 0.7)';
        ctx.fillRect(0, -rotorWidth/2, rotorLength, rotorWidth);
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, -rotorWidth/2, rotorLength, rotorWidth);
        
        ctx.restore();
    }
    ctx.restore();
    
    ctx.restore();
    
    // Draw username last (unrotated)
    ctx.font = '10px Ubuntu';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.strokeText(player.username, canvas.width / 2, canvas.height / 2 + player.size * 1.6);
    ctx.fillText(player.username, canvas.width / 2, canvas.height / 2 + player.size * 1.6);
}   



function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const offsetX = (canvas.width / 2) - player.worldX;
    const offsetY = (canvas.height / 2) - player.worldY;

    // Draw extended background pattern across entire visible area
    if (backgroundPattern) {
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.fillStyle = backgroundPattern;
        
        // Extend background 1000px beyond world boundaries
        const bgLeft = -BACKGROUND_EXTENSION;
        const bgTop = -BACKGROUND_EXTENSION;
        const bgWidth = WORLD_WIDTH + (2 * BACKGROUND_EXTENSION);
        const bgHeight = WORLD_HEIGHT + (2 * BACKGROUND_EXTENSION);
        
        ctx.fillRect(bgLeft, bgTop, bgWidth, bgHeight);
        ctx.restore();
    }

    // Draw overlay only outside the playable area
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';

    // Top overlay (above playable area)
    ctx.fillRect(-BACKGROUND_EXTENSION, -BACKGROUND_EXTENSION, 
                 WORLD_WIDTH + (2 * BACKGROUND_EXTENSION), BACKGROUND_EXTENSION);

    // Bottom overlay (below playable area)
    ctx.fillRect(-BACKGROUND_EXTENSION, WORLD_HEIGHT, 
                 WORLD_WIDTH + (2 * BACKGROUND_EXTENSION), BACKGROUND_EXTENSION);

    // Left overlay (left of playable area)
    ctx.fillRect(-BACKGROUND_EXTENSION, -0.1, 
                 BACKGROUND_EXTENSION, WORLD_HEIGHT+0.2);

    // Right overlay (right of playable area)
    ctx.fillRect(WORLD_WIDTH, -0.1, 
                 BACKGROUND_EXTENSION, WORLD_HEIGHT+0.2);

    ctx.restore();

    drawPlayer();
}
function checkCollision(newWorldX, newWorldY) {
    // Adjust collision to stop at the original walls (before translucent area)
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

    // Update rotor angle for animation
    const rotorSpeed = 0.05;
    rotorAngle += rotorSpeed; // Increment angle each frame
    
    draw();
    requestAnimationFrame(updatePosition);
}

function startGame() {
    titleScreen.style.display = 'none';
    canvas.style.display = 'block';
    exitButton.style.display = 'block'; // Show exit button
    
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

function exitGame() {
    canvas.style.display = 'none';
    exitButton.style.display = 'none'; // Hide exit button
    titleScreen.style.display = 'flex'; // Show title screen again
    animateTitleGrid(); // Restart title animation
}

// Add event listeners
exitButton.addEventListener('click', exitGame);