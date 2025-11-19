/**
 * Diagnostic Script v21-B (BYPASS MODE)
 * Ignores external files to test screen rendering and Wake Lock
 */

// --- CONFIGURATION ---
const WAKE_LOCK_DELAY = 5000; 
const ROTATION_INTERVAL = 10000; 

// HARDCODED DATA (Bypassing file loading for testing)
const MOCK_MENU = `
MÅNDAG: Köttbullar med potatismos
TISDAG: Fiskgratäng
ONSDAG: Korvstroganoff
TORSDAG: Ärtsoppa & Pannkakor
FREDAG: Tacos
`;

const MOCK_LESSONS = `
08:30 - 09:15  Matematik (Sal 3B)
09:30 - 10:15  Engelska  (Sal 4A)
10:30 - 11:30  Svenska   (Sal 2C)
13:00 - 14:00  Idrott    (Gympasalen)
`;

// --- DIAGNOSTIC LOGGER ---
function log(msg) {
    const logContainer = document.getElementById('log-entries');
    const time = new Date().toLocaleTimeString();
    const entry = `[${time}] ${msg}`;
    console.log(entry);
    
    if(logContainer) {
        const div = document.createElement('div');
        div.textContent = entry;
        logContainer.appendChild(div);
        // Auto-scroll
        const consoleBox = document.getElementById('debug-console');
        if(consoleBox) consoleBox.scrollTop = consoleBox.scrollHeight;
    }
}

// --- CLOCK FUNCTION ---
function startClock() {
    log('Starting Clock...');
    setInterval(() => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('sv-SE', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        const clockEl = document.getElementById('clock');
        if(clockEl) clockEl.textContent = timeString;
    }, 1000);
}

// --- WAKE LOCK ---
function initWakeLock() {
    log(`Waiting ${WAKE_LOCK_DELAY}ms before requesting Wake Lock...`);
    setTimeout(async () => {
        try {
            if ('wakeLock' in navigator) {
                await navigator.wakeLock.request('screen');
                log('SUCCESS: Wake Lock active.');
            } else {
                log('WARNING: Wake Lock API not supported.');
            }
        } catch (err) {
            log(`ERROR: Wake Lock failed: ${err.message}`);
        }
    }, WAKE_LOCK_DELAY);
}

// --- CONTENT DISPLAY ---
function startDisplayLoop() {
    log('Starting Display Loop (Using Internal Data)...');
    const contentDiv = document.getElementById('content');
    
    // Remove loading screen immediately since we have data
    const loader = document.getElementById('loading-screen');
    if(loader) loader.style.display = 'none';

    let showMenu = true;

    const updateDisplay = () => {
        contentDiv.innerHTML = ''; 
        const wrapper = document.createElement('div');
        
        if (showMenu) {
            wrapper.innerHTML = `<h2>Veckans Meny</h2><pre>${MOCK_MENU}</pre>`;
            log('Switched to: Menu');
        } else {
            wrapper.innerHTML = `<h2>Dagens Lektioner</h2><pre>${MOCK_LESSONS}</pre>`;
            log('Switched to: Lessons');
        }
        
        contentDiv.appendChild(wrapper);
        showMenu = !showMenu;
    };

    // Initial run
    updateDisplay();
    
    // Loop
    setInterval(updateDisplay, ROTATION_INTERVAL);
}

// --- INIT ---
window.addEventListener('DOMContentLoaded', () => {
    log('v21-Bypass Started.');
    startClock();
    initWakeLock(); // Will attempt lock after 5s
    startDisplayLoop(); // Will show text immediately
});
