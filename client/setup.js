export const canvas = document.getElementById('gameCanvas');
export const ctx = canvas.getContext('2d');
export const playButton = document.getElementById('playButton');
export const titleScreen = document.getElementById('titleScreen');
export const usernameInput = document.getElementById('username');
export const socket = new WebSocket('ws://localhost:8080');
export const titleCanvas = document.getElementById('titleCanvas');
export const titleCtx = titleCanvas.getContext('2d');
export const exitButton = document.getElementById('exitButton');
export const settingsIcon = document.getElementById('settingsIcon');
export const settingsPopup = document.getElementById('settingsPopup');
export const popupCloseButton = document.getElementById('popupCloseButton');
export const keyboardControlsToggle = document.getElementById('keyboardControlsToggle');

// Set title canvas size to full window
titleCanvas.width = window.innerWidth;
titleCanvas.height = window.innerHeight;

export function resizeTitleCanvas() {
    titleCanvas.width = window.innerWidth;
    titleCanvas.height = window.innerHeight;
}

// Initial resize for title canvas
resizeTitleCanvas();

// Update title canvas size on window resize
window.addEventListener('resize', resizeTitleCanvas);

// World constants
export const WORLD_WIDTH = 8000;
export const WORLD_HEIGHT = 600;
export const WALL_THICKNESS = 1;
export const BACKGROUND_EXTENSION = 1000;
export const walls = [
    { x: 0, y: 0, width: WORLD_WIDTH, height: WALL_THICKNESS },
    { x: 0, y: WORLD_HEIGHT - WALL_THICKNESS, width: WORLD_WIDTH, height: WALL_THICKNESS },
    { x: 0, y: 0, width: WALL_THICKNESS, height: WORLD_HEIGHT },
    { x: WORLD_WIDTH - WALL_THICKNESS, y: 0, width: WALL_THICKNESS, height: WORLD_HEIGHT }
];