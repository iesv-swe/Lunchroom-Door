/**
 * Student Lounge Script v22
 * Design Restoration + Wake Lock Fix
 */

// --- CONFIGURATION ---
const USE_MOCK_DATA = true; // <--- SET TO FALSE TO LOAD REAL FILES LATER
const WAKE_LOCK_DELAY = 5000; 
const ROTATION_INTERVAL = 10000; 

// --- DATA MOCKS (Used if USE_MOCK_DATA is true) ---
const MOCK_MENU = `
MÅNDAG: Köttbullar med potatismos & lingon
TISDAG: Panerad fisk med remouladsås
ONSDAG: Korvstroganoff med ris
TORSDAG: Ärtsoppa & Pannkakor
FREDAG: Tacosbuffé
`;

const MOCK_LESSONS = `
08:30 - 09:15  Matematik  (Sal 3B)
09:30 - 10:15  Engelska   (Sal 4A)
10:30 - 11:30  Svenska    (Sal 2C)
13:00 - 14:00  Idrott     (Gympasalen)
14:15 - 15:00  Bild       (Ateljén)
`;

// --- LOGGING ---
function log(msg) {
    const logContainer = document.getElementById('log-entries');
    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] ${msg}`);
    if(logContainer) {
        const span = document.createElement('div');
        span.textContent = `> ${msg}`;
        logContainer.appendChild(span);
        logContainer.parentElement.scrollTop = logContainer.parentElement.scrollHeight;
    }
}

// --- CLOCK ---
function startClock() {
    setInterval(() => {
        const now = new Date();
        document.getElementById('clock').textContent = now.toLocaleTimeString('sv-SE', { 
            hour: '2-digit', minute: '2-digit' 
        });
    }, 1000);
}

// --- WAKE LOCK ---
function initWakeLock() {
    log(`Wake Lock: Waiting ${WAKE_LOCK_DELAY}ms...`);
    setTimeout(async () => {
        try {
            if ('wakeLock' in navigator) {
                await navigator.wakeLock.request('screen');
                log('SUCCESS: Wake Lock Active');
            }
        } catch (err) {
            log(`Wake Lock Error: ${err.message}`);
        }
    }, WAKE_LOCK_DELAY);
}

// --- CONTENT ENGINE ---
async function startContentLoop() {
    const card = document.getElementById('content-card');
    let showingMenu = true;
    let menuText = "";
    let lessonsText = "";

    if (USE_MOCK_DATA) {
        log('Mode: MOCK DATA (Ignoring files)');
        menuText = MOCK_MENU;
        lessonsText = MOCK_LESSONS;
        runLoop();
    } else {
        log('Mode: LIVE FILES (Fetching...)');
        try {
            const mRes = await fetch('menu.txt');
            if(!mRes.ok) throw new Error('menu.txt missing');
            menuText = await mRes.text();

            const lRes = await fetch('Lessons.txt');
            if(!lRes.ok) throw new Error('Lessons.txt missing');
            lessonsText = await lRes.text();
            
            log('Files loaded. Starting loop.');
            runLoop();
        } catch (e) {
            log(`FILE ERROR: ${e.message}`);
            card.innerHTML = `<h2 style="color:red">Data Error</h2><p>${e.message}</p><p>Check file names match exactly (case sensitive).</p>`;
        }
    }

    function runLoop() {
        const update = () => {
            card.innerHTML = ''; // Clear
            const content = document.createElement('div');
            
            if (showingMenu) {
                content.innerHTML = `<h2>Veckans Meny</h2><pre>${menuText}</pre>`;
            } else {
                content.innerHTML = `<h2>Kommande Lektioner</h2><pre>${lessonsText}</pre>`;
            }
            
            card.appendChild(content);
            showingMenu = !showingMenu;
        };

        update(); // Immediate show
        setInterval(update, ROTATION_INTERVAL);
    }
}

// --- INIT ---
window.addEventListener('DOMContentLoaded', () => {
    startClock();
    initWakeLock();
    startContentLoop();
});
