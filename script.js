/**
 * Diagnostic Script v21
 * Feature: 5s Wake Lock Delay, Error Logging, Clock, Logo
 */

// --- CONFIGURATION ---
const WAKE_LOCK_DELAY = 5000; // 5 seconds
const ROTATION_INTERVAL = 10000; // Switch content every 10 seconds
const DATA_FILES = {
    menu: 'menu.txt',
    lessons: 'Lessons.txt'
};

// --- DIAGNOSTIC LOGGER ---
function log(msg) {
    const logContainer = document.getElementById('log-entries');
    const time = new Date().toLocaleTimeString();
    const entry = `[${time}] ${msg}`;
    
    console.log(entry);
    
    // Create log element
    const div = document.createElement('div');
    div.textContent = entry;
    logContainer.appendChild(div);
    
    // Auto-scroll to bottom
    const consoleBox = document.getElementById('debug-console');
    consoleBox.scrollTop = consoleBox.scrollHeight;

    // Update loading text if visible
    const loader = document.getElementById('loading-status');
    if(loader) loader.textContent = msg;
}

// --- CLOCK FUNCTION ---
function startClock() {
    log('Starting Clock...');
    setInterval(() => {
        const now = new Date();
        // Format: HH:MM
        const timeString = now.toLocaleTimeString('sv-SE', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        document.getElementById('clock').textContent = timeString;
    }, 1000);
}

// --- WAKE LOCK (DELAYED) ---
function initWakeLock() {
    log(`Waiting ${WAKE_LOCK_DELAY}ms before requesting Wake Lock...`);
    
    setTimeout(async () => {
        try {
            if ('wakeLock' in navigator) {
                const wakeLock = await navigator.wakeLock.request('screen');
                log('SUCCESS: Wake Lock is active (Screen will stay on).');
                
                // Re-acquire if visibility changes
                document.addEventListener('visibilitychange', async () => {
                    if (document.visibilityState === 'visible') {
                        await navigator.wakeLock.request('screen');
                        log('Wake Lock re-acquired after visibility change.');
                    }
                });
            } else {
                log('WARNING: Wake Lock API not supported in this browser.');
            }
        } catch (err) {
            log(`ERROR: Wake Lock failed: ${err.name}, ${err.message}`);
        }
    }, WAKE_LOCK_DELAY);
}

// --- CONTENT LOADER ---
async function loadContent() {
    log('Attempting to fetch data files...');
    const contentDiv = document.getElementById('content');

    try {
        // 1. Fetch Menu
        log(`Fetching ${DATA_FILES.menu}...`);
        const menuResponse = await fetch(DATA_FILES.menu);
        if (!menuResponse.ok) throw new Error(`Failed to load ${DATA_FILES.menu}`);
        const menuText = await menuResponse.text();
        log('Menu loaded successfully.');

        // 2. Fetch Lessons
        log(`Fetching ${DATA_FILES.lessons}...`);
        const lessonsResponse = await fetch(DATA_FILES.lessons);
        if (!lessonsResponse.ok) throw new Error(`Failed to load ${DATA_FILES.lessons}`);
        const lessonsText = await lessonsResponse.text();
        log('Lessons loaded successfully.');

        // 3. Display Logic (Simple Toggling)
        // Note: This is a basic rotation. Adjust parsing logic as needed.
        let showMenu = true;
        
        const updateDisplay = () => {
            contentDiv.innerHTML = ''; // Clear current
            const wrapper = document.createElement('div');
            
            if (showMenu) {
                wrapper.innerHTML = `<h2>Menu</h2><pre>${menuText}</pre>`;
                log('Displaying Menu');
            } else {
                wrapper.innerHTML = `<h2>Upcoming Lessons</h2><pre>${lessonsText}</pre>`;
                log('Displaying Lessons');
            }
            
            contentDiv.appendChild(wrapper);
            showMenu = !showMenu;
        };

        // Initial run
        updateDisplay();
        
        // Set interval
        setInterval(updateDisplay, ROTATION_INTERVAL);
        
        // Hide Loading Screen
        log('Initialization Complete. Removing Loading Screen.');
        document.getElementById('loading-screen').style.display = 'none';

    } catch (error) {
        log(`CRITICAL ERROR: ${error.message}`);
        // Even on error, remove loading screen so we can see the debug log
        document.getElementById('loading-screen').style.display = 'none';
        contentDiv.innerHTML = `<h2 style="color:red">System Error</h2><p>Check Debug Log above.</p>`;
    }
}

// --- MASTER INIT ---
window.addEventListener('DOMContentLoaded', () => {
    log('DOM Content Loaded. Script v21 starting.');
    
    // 1. Start Clock
    startClock();

    // 2. Load Data
    loadContent();

    // 3. Attempt Wake Lock (Delayed)
    initWakeLock();
});
