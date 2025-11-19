// --- v26 HYBRID SCRIPT ---
// Strategy: Try MP4 Video (No Bar). If fails, fallback to API (White Bar).
// Goal: 100% Uptime Guarantee.

document.addEventListener('DOMContentLoaded', () => {
    
    // --- CONFIG ---
    const ENABLE_DEBUG_DOT = true; // Set to false to hide the dot once verified

    // --- GLOBAL ERROR HANDLER ---
    window.onerror = function(message) { console.error("Global Error:", message); };

    // --- PART 1: VIDEO WAKE LOCK (Attempt 1 - The "Silent" Way) ---
    function initWakeLockSystem() {
        console.log('Initializing Wake Lock System...');
        
        // 1. Setup Debug Dot
        let dot = null;
        if (ENABLE_DEBUG_DOT) {
            dot = document.createElement('div');
            dot.id = 'debug-dot';
            // Style is handled in CSS
            document.body.appendChild(dot); 
        }

        // 2. Create Invisible Video (MP4 format this time)
        const video = document.createElement('video');
        
        // Tiny 1x1 pixel MP4 (More compatible than WebM)
        video.src = "data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMQAAAAAmo21vb3YAAABsbXZoAAAAAAAAAAEABgAAAAABAAABAAAAAQAAAAAAAAAZdHJhawAAAFx0a2hkAAAAAQAAAAEAAAAAAAAAAAAAAQAAAAAAAAABAAAAAAABAAAAAQAAAAAAAgAAABBtZGlhAAAAIG1kaGQAAAAAAAAAAQAAAAEAAAAAAAEAAAAAAQAAAAAAIWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAAB2aWRlAAAAAG1pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAA5zdGJsAAAACmN0dHMAAAAAAAAMc3RzZAAAAAAAAAABAAAANGF2YzEAAAAAAAAAAQABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAABAAAAAQAAAAAAAABhYXZjQwAAAAAACEBzdHNjAAAAAAAAAAEAAAABAAAAAQAAAAEAAAAQc3RzegAAAAAAAAABAAAAFHN0Y28AAAAAAAAAAQAAAAwAAAAYbWRhdAAAAAAAAAAB";
        
        video.playsInline = true;
        video.loop = true;
        video.muted = true; // Critical
        
        // Visual Hiding
        video.style.position = 'fixed';
        video.style.zIndex = '-9999';
        video.style.opacity = '0.01';
        video.style.pointerEvents = 'none';
        
        document.body.appendChild(video);

        // 3. Attempt Play
        const playPromise = video.play();

        if (playPromise !== undefined) {
            playPromise.then(() => {
                // --- SUCCESS (Green Dot) ---
                console.log('SUCCESS: MP4 Video playing. Screen locked via Video Hack.');
                if(dot) dot.style.backgroundColor = '#00ff00'; // Green
                // We do NOT activate the API lock here, so No White Bar!
            }).catch(error => {
                // --- FAILURE (Orange Dot) -> ACTIVATE FALLBACK ---
                console.warn('WARNING: Video Autoplay failed. Switching to API Backup.', error);
                if(dot) dot.style.backgroundColor = 'orange'; // Orange
                
                // ACTIVATE BACKUP (The Standard Wake Lock)
                activateBackupWakeLock();
            });
        }
    }

    // --- BACKUP: STANDARD API WAKE LOCK (If video fails) ---
    let apiWakeLock = null;
    async function activateBackupWakeLock() {
        console.log('Activating Backup API Wake Lock...');
        try {
            if ('wakeLock' in navigator) {
                apiWakeLock = await navigator.wakeLock.request('screen');
                console.log('Backup Lock: ACTIVE');
                
                // Re-acquire on visibility change
                document.addEventListener('visibilitychange', async () => {
                    if (document.visibilityState === 'visible' && apiWakeLock === null) {
                        apiWakeLock = await navigator.wakeLock.request('screen');
                    }
                });
            }
        } catch (err) {
            console.error('Backup Lock Failed:', err);
            // If dot exists, turn it RED to show total failure
            const dot = document.getElementById('debug-dot');
            if(dot) dot.style.backgroundColor = 'red'; 
        }
    }

    // Start the System
    initWakeLockSystem();


    // --- PART 2: CLOCK (Bottom Right) ---
    function updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
        const clockEl = document.getElementById('bottom-right-clock');
        if (clockEl) clockEl.textContent = timeString;
    }
    setInterval(updateClock, 1000);
    updateClock(); 

    // --- PART 3: STATUS & MENU ---
    const statusElement = document.getElementById('lounge-status');
    const timerElement = document.getElementById('lounge-timer');
    
    const schedule = {
        0: [], 1: [[11,0],[13,45]], 2: [[9,0],[10,30],[11,0],[13,45]], 
        3: [[9,0],[13,45]], 4: [[9,0],[10,30],[11,0],[13,45]], 
        5: [[9,0],[10,30],[11,0],[13,45]], 6: []
    };

    function updateLoungeStatus() {
        const now = new Date();
        const currentDay = now.getDay();
        const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
        const daySchedule = schedule[currentDay];
        let isOpen = false;
        let nextEventTime = null;
        
        for (let i = 0; i < daySchedule.length; i += 2) {
            const openTime = daySchedule[i][0] * 60 + daySchedule[i][1];
            const closeTime = daySchedule[i + 1][0] * 60 + daySchedule[i + 1][1];
            if (currentTimeInMinutes >= openTime && currentTimeInMinutes < closeTime) {
                isOpen = true;
                nextEventTime = new Date(now);
                nextEventTime.setHours(daySchedule[i + 1][0], daySchedule[i + 1][1], 0, 0);
                break;
            }
        }
        if (!isOpen) {
            for (let i = 0; i < daySchedule.length; i += 2) {
                const openTime = daySchedule[i][0] * 60 + daySchedule[i][1];
                if (currentTimeInMinutes < openTime) {
                    nextEventTime = new Date(now);
                    nextEventTime.setHours(daySchedule[i][0], daySchedule[i][1], 0, 0);
                    break;
                }
            }
        }
        if (nextEventTime === null) {
            let nextDay = (currentDay + 1) % 7;
            let daysToAdd = 1;
            while (schedule[nextDay].length === 0 && daysToAdd <= 7) {
                nextDay = (nextDay + 1) % 7;
                daysToAdd++;
            }
            if (daysToAdd <= 7 && schedule[nextDay].length > 0) {
                const nextOpenTime = schedule[nextDay][0];
                nextEventTime = new Date(now);
                nextEventTime.setDate(now.getDate() + daysToAdd);
                nextEventTime.setHours(nextOpenTime[0], nextOpenTime[1], 0, 0);
            }
        }
        
        if (isOpen) {
            statusElement.textContent = 'The Lounge is OPEN';
            statusElement.className = 'open';
            timerElement.textContent = `Stänger om ${formatCountdown(nextEventTime)}`;
        } else {
            statusElement.textContent = 'The Lounge is CLOSED';
            statusElement.className = 'closed';
            if (nextEventTime) {
                timerElement.textContent = `Öppnar om ${formatCountdown(nextEventTime)}`;
            } else {
                timerElement.textContent = 'Stängt för helgen';
            }
        }
    }
    
    function formatCountdown(targetTime) {
        const now = new Date();
        const diff = targetTime.getTime() - now.getTime();
        let seconds = Math.max(0, Math.floor(diff / 1000));
        let minutes = Math.floor(seconds / 60);
        let hours = Math.floor(minutes / 60);
        seconds = seconds % 60;
        minutes = minutes % 60;
        if (hours > 0) {
            return `${String(hours).padStart(2, '0')}H:${String(minutes).padStart(2, '0')}M:${String(seconds).padStart(2, '0')}S`;
        } else {
            return `${String(minutes).padStart(2, '0')}M:${String(seconds).padStart(2, '0')}S`;
        }
    }

    updateLoungeStatus();
    setInterval(updateLoungeStatus, 1000);

    // --- PART 4: FILE LOADING ---
    
    async function safeLoadLessons() {
        try {
            const response = await fetch('Lessons.txt');
            if (!response.ok) throw new Error('Lessons.txt not found');
            const text = await response.text();
            parseLessons(text);
        } catch (error) {
            console.warn('Lesson load failed, hiding dashboard:', error);
            const dashboard = document.getElementById('lunch-dashboard');
            if(dashboard) dashboard.style.display = 'none';
        }
    }

    let lunchSchedule = {};
    function parseLessons(text) {
        const lines = text.split('\n');
        const dayMap = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thur': 4, 'Fri': 5, 'Sat': 6, 'Sun': 0 };
        lunchSchedule = { 1: [], 2: [], 3: [], 4: [], 5: [] };

        lines.forEach(line => {
            const cols = line.split('\t');
            if (cols.length < 7) return;
            const subject = cols[1];
            const dayStr = cols[2];
            const startTimeRaw = cols[3];
            const lengthRaw = cols[4];
            const group = cols[6];

            if (subject && subject.includes('Lunch') && dayMap[dayStr]) {
                const dayNum = dayMap[dayStr];
                const startMin = timeToMin(startTimeRaw);
                const endMin = startMin + parseInt(lengthRaw);
                if (group) {
                    lunchSchedule[dayNum].push({ group: group, start: startMin, end: endMin });
                }
            }
        });
        for (let d in lunchSchedule) lunchSchedule[d].sort((a, b) => a.start - b.start);
        updateLunchDashboard();
    }

    function timeToMin(timeStr) {
        const t = parseInt(timeStr);
        return Math.floor(t / 100) * 60 + (t % 100);
    }

    function updateLunchDashboard() {
        const now = new Date();
        const currentDay = now.getDay();
        const nowMin = now.getHours() * 60 + now.getMinutes();
        const dashboard = document.getElementById('lunch-dashboard');
        const divider = document.getElementById('divider-bar'); 

        if (!lunchSchedule[currentDay]) { 
            if(dashboard) dashboard.style.display = 'none'; 
            if(divider) divider.style.display = 'none';
            return; 
        }

        const todaysLunches = lunchSchedule[currentDay];
        const nowGroups = [];
        let nextGroups = [];
        let nextStartTime = null;

        todaysLunches.forEach(event => {
            if (nowMin >= event.start && nowMin < event.end) nowGroups.push(event.group);
            if (nowMin < event.start) {
                if (nextStartTime === null || event.start === nextStartTime) {
                    nextStartTime = event.start;
                    nextGroups.push(event.group);
                }
            }
        });

        const timeToNext = nextStartTime ? nextStartTime - nowMin : 9999;
        const shouldShow = (nowGroups.length > 0) || (timeToNext <= 5);

        if (shouldShow && dashboard) {
            dashboard.style.display = 'block';
            if(divider) divider.style.display = 'block'; 
            document.getElementById('lunch-now-groups').textContent = nowGroups.length > 0 ? nowGroups.join(', ') : 'Förbereder...';
            if (nextGroups.length > 0 && nextStartTime) {
                document.getElementById('lunch-next-groups').textContent = nextGroups.join(', ');
                document.getElementById('lunch-next-timer').textContent = `Startar om ${timeToNext} min`;
            } else {
                document.getElementById('lunch-next-groups').textContent = '-';
                document.getElementById('lunch-next-timer').textContent = '';
            }
        } else if (dashboard) {
            dashboard.style.display = 'none';
            if(divider) divider.style.display = 'none'; 
        }
    }
    setInterval(updateLunchDashboard, 5000);

    // Helper for Menu
    function getWeekNumber(d) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    async function safeLoadMenu() {
        try {
            const today = new Date();
            const currentWeek = getWeekNumber(today);
            document.getElementById('week-number').textContent = currentWeek;
            
            const response = await fetch('menu.txt');
            if (!response.ok) throw new Error('menu.txt not found');
            const text = await response.text();
            parseMenu(text, currentWeek, today.getDay());
        } catch (error) {
            console.warn('Menu load failed:', error);
            document.getElementById('menu-grid').innerHTML = '<p style="color:white">Meny kunde inte laddas.</p>';
        }
    }

    function parseMenu(text, currentWeek, currentDayIndex) {
        const lines = text.split('\n');
        let activeWeek = false;
        let activeDay = '';
        const weekTag = `[WEEK ${currentWeek}]`;
        const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        const menuData = { MONDAY: '', TUESDAY: '', WEDNESDAY: '', THURSDAY: '', FRIDAY: '' };
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('[WEEK')) {
                activeWeek = (trimmedLine.toUpperCase() === weekTag);
            } else if (activeWeek && trimmedLine.startsWith('[')) {
                activeDay = trimmedLine.substring(1, trimmedLine.length - 1).toUpperCase();
            } else if (activeWeek && activeDay && menuData.hasOwnProperty(activeDay) && trimmedLine) {
                menuData[activeDay] += trimmedLine + '\n';
            }
        }
        document.querySelector('#menu-monday .menu-content').textContent = menuData.MONDAY || 'Meny saknas';
        document.querySelector('#menu-tuesday .menu-content').textContent = menuData.TUESDAY || 'Meny saknas';
        document.querySelector('#menu-wednesday .menu-content').textContent = menuData.WEDNESDAY || 'Meny saknas';
        document.querySelector('#menu-thursday .menu-content').textContent = menuData.THURSDAY || 'Meny saknas';
        document.querySelector('#menu-friday .menu-content').textContent = menuData.FRIDAY || 'Meny saknas';
        if (currentDayIndex >= 1 && currentDayIndex <= 5) {
            const todayKey = days[currentDayIndex].toLowerCase();
            const el = document.getElementById(`menu-${todayKey}`);
            if (el) el.classList.add('today');
        }
    }

    safeLoadLessons();
    safeLoadMenu();
});
