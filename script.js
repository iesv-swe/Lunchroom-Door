// --- v37 CACHE FIX: Ensures menu.txt is aggressively reloaded ---
// FIX: The robust cache bypass (cache: 'no-cache') for menu.txt is verified and remains active.
// FIX: The version number is updated to ensure the browser loads this new script.

document.addEventListener('DOMContentLoaded', () => {
    
    // --- CONFIGURATION ---
    // Fire event every 30 seconds (30,000ms).
    const JIGGLE_INTERVAL = 30000; 

    // --- PART 1: THE JIGGLE HACK (Keeps screen awake) ---
    function initJiggleHack() {
        console.log("Activating scroll simulation (v37) to prevent sleep...");

        function fireScroll() {
            const event = new Event('scroll', {
                bubbles: true, 
                cancelable: true
            });
            document.body.dispatchEvent(event);
        }

        // Start the jiggle loop, firing a scroll event every 30 seconds
        setInterval(fireScroll, JIGGLE_INTERVAL);
    }

    // Start the system
    initJiggleHack();

    // --- PART 2: CLOCK (Bottom Right) ---
    function updateClock() {
        const now = new Date();
        // Uses Swedish locale format for time (HH:MM)
        const timeString = now.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
        const clockEl = document.getElementById('bottom-right-clock');
        if (clockEl) clockEl.textContent = timeString;
    }
    // Update every second
    setInterval(updateClock, 1000);
    updateClock(); 

    // --- PART 3: LOUNGE OPEN/CLOSED STATUS ---
    const statusElement = document.getElementById('lounge-status');
    const timerElement = document.getElementById('lounge-timer');
    
    // Day schedules (Day: 0=Sunday, 1=Monday, ..., 5=Friday, 6=Saturday)
    // Times are [OpenHour, OpenMinute], [CloseHour, CloseMinute]
    const schedule = {
        0: [], // Sunday
        1: [[11,0],[13,45]], // Monday
        2: [[9,0],[10,30],[11,0],[13,45]], // Tuesday
        3: [[9,0],[13,45]], // Wednesday
        4: [[9,0],[10,30],[11,0],[13,45]], // Thursday
        5: [[9,0],[10,30],[11,0],[13,45]], // Friday
        6: [] // Saturday
    };

    function updateLoungeStatus() {
        const now = new Date();
        const currentDay = now.getDay();
        const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
        const daySchedule = schedule[currentDay];
        let isOpen = false;
        let nextEventTime = null;
        
        // 1. Check if currently open and find the next closing time
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
        
        // 2. If closed, find the next opening time for the current day
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
        
        // 3. If no more events today, find the next opening time on a subsequent day
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
        
        // Update DOM (Now using Swedish text for consistency)
        if (isOpen) {
            statusElement.textContent = 'Loungen är ÖPPEN';
            statusElement.className = 'open';
            timerElement.textContent = `Stänger om ${formatCountdown(nextEventTime)}`;
        } else {
            statusElement.textContent = 'Loungen är STÄNGD';
            statusElement.className = 'closed';
            if (nextEventTime) {
                timerElement.textContent = `Öppnar om ${formatCountdown(nextEventTime)}`;
            } else {
                timerElement.textContent = 'Stängt för helgen';
            }
        }
    }
    
    // Helper function to format the countdown time
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

    // --- PART 4: LUNCH DASHBOARD (Based on Lessons.txt) ---
    
    // Load Lessons.txt file
    async function safeLoadLessons() {
        try {
            // Use cache: 'no-cache' for robust reloading
            const response = await fetch(`Lessons.txt`, { cache: 'no-cache' });
            
            if (!response.ok) throw new Error('Lessons.txt not found (404/Network Error)');
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
        lunchSchedule = { 1: [], 2: [], 3: [], 4: [], 5: [] }; // Only Mon-Fri

        lines.forEach(line => {
            const cols = line.split('\t');
            if (cols.length < 7) return;
            const subject = cols[1];
            const dayStr = cols[2];
            const startTimeRaw = cols[3];
            const lengthRaw = cols[4];
            const group = cols[6];

            if (subject && subject.includes('Lunch') && dayMap[dayStr] >= 1 && dayMap[dayStr] <= 5) {
                const dayNum = dayMap[dayStr];
                const startMin = timeToMin(startTimeRaw);
                const endMin = startMin + parseInt(lengthRaw);
                
                // CHECK TO EXCLUDE 'SUPPORT' AND 'PRAO' CLASSES
                const normalizedGroup = group ? group.toLowerCase() : '';
                const isExcluded = normalizedGroup.includes('support') || normalizedGroup.includes('prao');

                if (group && !isExcluded) { 
                    lunchSchedule[dayNum].push({ group: group, start: startMin, end: endMin });
                }
            }
        });
        // Sorts lunch events by start time
        for (let d in lunchSchedule) lunchSchedule[d].sort((a, b) => a.start - b.start);
        updateLunchDashboard();
    }

    // Helper to convert HHMM to minutes since midnight
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

        // Hide dashboard if it's weekend
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
            // Check groups having lunch NOW
            if (nowMin >= event.start && nowMin < event.end) nowGroups.push(event.group);
            
            // Check groups having lunch NEXT
            if (nowMin < event.start) {
                if (nextStartTime === null || event.start === nextStartTime) {
                    nextStartTime = event.start;
                    nextGroups.push(event.group);
                }
            }
        });

        // Remove groups currently eating (nowGroups) from the "Next" list (nextGroups)
        const nowGroupSet = new Set(nowGroups);
        const filteredNextGroups = nextGroups.filter(group => !nowGroupSet.has(group));
        
        const timeToNext = nextStartTime ? nextStartTime - nowMin : 9999;
        // Show dashboard if lunch is happening now, or if the next lunch is within 5 minutes
        const shouldShow = (nowGroups.length > 0) || (timeToNext <= 5);

        if (shouldShow && dashboard) {
            dashboard.style.display = 'block';
            if(divider) divider.style.display = 'block'; 
            
            // Display 'NOW' groups
            document.getElementById('lunch-now-groups').textContent = nowGroups.length > 0 ? nowGroups.join(', ') : 'Förbereder...';
            
            // Display 'NEXT' groups (using filtered list)
            if (filteredNextGroups.length > 0 && nextStartTime) { 
                document.getElementById('lunch-next-groups').textContent = filteredNextGroups.join(', ');
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
    // Update dashboard every 5 seconds
    setInterval(updateLunchDashboard, 5000);

    // --- PART 5: MENU (Based on menu.txt) ---

    // Helper for Menu to get ISO week number
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
            
            // Use cache: 'no-cache' for robust reloading
            // This is the line that guarantees a fresh fetch of menu.txt
            const response = await fetch(`menu.txt`, { cache: 'no-cache' });
            
            if (!response.ok) throw new Error('menu.txt not found (404/Network Error)');
            const text = await response.text();
            parseMenu(text, currentWeek, today.getDay());
        } catch (error) {
            console.warn('Menu load failed:', error);
            // This is the fallback message in Swedish
            document.getElementById('menu-grid').innerHTML = 
                '<p style="color:white; font-size:3em;">❌ Meny kunde inte laddas.</p>' +
                '<p style="color:#00a0df; font-size:1.5em; margin-top: 10px;">Dubbelkolla att filen heter **menu.txt** och innehåller text för veckan.</p>';
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
            // Check for week tag, ignores case and trims whitespace
            if (trimmedLine.toUpperCase().startsWith('[WEEK')) {
                activeWeek = (trimmedLine.toUpperCase() === weekTag);
            } else if (activeWeek && trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
                // Check for day tag, ignores case and trims whitespace
                activeDay = trimmedLine.substring(1, trimmedLine.length - 1).toUpperCase();
            } else if (activeWeek && activeDay && menuData.hasOwnProperty(activeDay) && trimmedLine && !trimmedLine.startsWith('#')) {
                // Collect menu lines, ignoring empty lines and comments
                menuData[activeDay] += trimmedLine + '\n';
            }
        }
        
        // Populate menu content
        document.querySelector('#menu-monday .menu-content').textContent = menuData.MONDAY || 'Meny saknas';
        document.querySelector('#menu-tuesday .menu-content').textContent = menuData.TUESDAY || 'Meny saknas';
        document.querySelector('#menu-wednesday .menu-content').textContent = menuData.WEDNESDAY || 'Meny saknas';
        document.querySelector('#menu-thursday .menu-content').textContent = menuData.THURSDAY || 'Meny saknas';
        document.querySelector('#menu-friday .menu-content').textContent = menuData.FRIDAY || 'Meny saknas';
        
        // Highlight today's menu
        if (currentDayIndex >= 1 && currentDayIndex <= 5) {
            const todayKey = days[currentDayIndex].toLowerCase();
            const el = document.getElementById(`menu-${todayKey}`);
            if (el) el.classList.add('today');
        }
    }

    safeLoadLessons();
    safeLoadMenu();
});
