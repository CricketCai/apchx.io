import { canvas, settingsPopup, settingsIcon, popupCloseButton, keyboardControlsToggle } from './setup.js';

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

// Mouse movement listener
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left - canvas.width / 2;
    mouseY = e.clientY - rect.top - canvas.height / 2;
});

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

// ESC key to toggle popup
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        toggleSettingsPopup();
    }
});