import { ctx, canvas, titleCtx, titleCanvas, WORLD_WIDTH, WORLD_HEIGHT, BACKGROUND_EXTENSION } from './setup.js';
import { player, rotorAngle, startGame } from './game.js'; // Added rotorAngle

const mapImage = new Image();
mapImage.src = 'assets/map.png';
let backgroundPattern = null;
mapImage.onload = () => {
    backgroundPattern = ctx.createPattern(mapImage, 'repeat');
    console.log('map.png loaded');
};
mapImage.onerror = () => console.error('Failed to load map.png');

const playerImage = new Image();
playerImage.src = 'assets/copter v2.svg'; // main copter
let playerImageLoaded = false;
playerImage.onload = () => {
    playerImageLoaded = true;
    console.log('copter v2.svg loaded');
};
playerImage.onerror = () => console.error('Failed to load copter v2.svg');

const bearing = new Image();
bearing.src = 'assets/rotobearingOL.svg'; // copter overlay
let bearingLoaded = false;
bearing.onload = () => {
    bearingLoaded = true;
    console.log('rotobearingOL.svg loaded');
};
bearing.onerror = () => console.error('Failed to load copter v2.svg');

const GRID_SIZE = 25;
let gridOffsetX = 0;
let gridOffsetY = 0;
const GRID_SPEED = 0.25;

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
        requestAnimationFrame(animateTitleGrid);
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
        ctx.drawImage(playerImage, -imgWidth/2, -imgHeight/2);
        ctx.restore();
    }


    

    const rotorLength = player.size * 6.3;
    const rotorWidth = player.size * 0.4;
    const rotorTopWidth = player.size * 0.4; 
    const rotorBaseWidth = player.size * 0.6;
    const rotorCount = 3;
    
    ctx.save();
    for (let i = 0; i < rotorCount; i++) {
        ctx.save();
        ctx.rotate(rotorAngle + (i * 2 * Math.PI / rotorCount)); // Now using imported rotorAngle
        
        ctx.beginPath();
        ctx.moveTo(player.size, -rotorBaseWidth / 4);           // Bottom left (near center)
        ctx.lineTo(player.size, rotorBaseWidth / 4);            // Bottom right (near center)
        ctx.lineTo(player.size*1.7, rotorBaseWidth / 4); 
        ctx.lineTo(player.size*2.1, rotorBaseWidth);   //topright x val is coefficient of tr.
        ctx.lineTo(player.size + rotorLength*1.06, rotorTopWidth / 1.5);  // Top left (further out)
        ctx.lineTo(player.size + rotorLength*1.2, -rotorTopWidth / 2); 
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
        const bearingSize = player.size * 2.5; // Adjust size relative to player
        ctx.drawImage(bearing, -bearingSize / 2, -bearingSize / 2, bearingSize, bearingSize);
        ctx.restore();
    }
    
    ctx.restore();
    
    ctx.font = '10px Ubuntu';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.strokeText(player.username, canvas.width / 2, canvas.height / 2 + player.size * 1.6);
    ctx.fillText(player.username, canvas.width / 2, canvas.height / 2 + player.size * 1.6);
}

export function draw() {
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
                 BACKGROUND_EXTENSION, WORLD_HEIGHT+0.2);
    ctx.fillRect(WORLD_WIDTH, -0.1, 
                 BACKGROUND_EXTENSION, WORLD_HEIGHT+0.2);
    ctx.restore();

    drawPlayer();
}