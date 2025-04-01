import { canvas, settingsPopup, settingsIcon, popupCloseButton, keyboardControlsToggle } from './setup.js';
import { rotorSpeed, setRotorSpeed } from './game.js';

export let useKeyboardControls = true;
export let mouseX = 0;
export let mouseY = 0;
export const keysPressed = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false,
    Shift: false
};
let mouseLeftPressed = false;
let mouseRightPressed = false;

// Mouse movement listener
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left - canvas.width / 2;
    mouseY = e.clientY - rect.top - canvas.height / 2;
});

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
        mouseLeftPressed = true;
        setRotorSpeed(0.1); // Faster speed
    } else if (e.button === 2) {
        mouseRightPressed = true;
        setRotorSpeed(0.025); // Slower speed
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
        mouseLeftPressed = false;
    } else if (e.button === 2) {
        mouseRightPressed = false;
    }
    if (!mouseLeftPressed && !mouseRightPressed && !keysPressed.Space && !keysPressed.Shift) {
        setRotorSpeed(0.05); // Reset to base speed
    }
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Settings popup toggle
export function toggleSettingsPopup() {
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

document.addEventListener('keyup', (e) => {
    if (e.key === ' ') {
        keysPressed.Space = false;
    } else if (e.key === 'Shift') {
        keysPressed.Shift = false;
    }
    if (!keysPressed.Space && !keysPressed.Shift && !mouseLeftPressed && !mouseRightPressed) {
        setRotorSpeed(0.05); // Reset to base speed
    }
});
// ESC key to toggle popup
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        toggleSettingsPopup();
    } else if (e.key === ' ') {
        keysPressed.Space = true;
        setRotorSpeed(0.1); // Faster speed
    } else if (e.key === 'Shift') {
        keysPressed.Shift = true;
        setRotorSpeed(0.025); // Slower speed
    }
});