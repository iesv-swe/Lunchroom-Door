// --- RESTORED SCRIPT (Based on v19) ---
// Feature: Clock Bottom Center
// Feature: Lunch Dashboard (Only shows "Lunch" subjects)
// Feature: Smart Wake Lock (Business Hours) with 5s Safety Delay

document.addEventListener('DOMContentLoaded', () => {

    // --- PART 1: SMART WAKE LOCK (Fixed for Kiosk) ---
    let wakeLock = null;
    
    // We delay the initial lock by 5 seconds to let the browser stabilize
    setTimeout(() => {
        const managePower = async () => {
            const now = new Date();
            const currentHour = now.getHours();
            const isBusinessHours = currentHour >= 6 && currentHour < 18;

            if (isBusinessHours) {
                if (!wakeLock && 'wakeLock' in navigator) {
                    try {
                        wakeLock = await navigator.wakeLock.request('screen');
                        console.log('Wake Lock ACTIVE');
                    } catch (err) { console.error('Wake Lock failed:', err); }
                }
            } else {
                if (wakeLock) {
                    await wakeLock.release();
                    wakeLock = null;
                    console.log('Wake Lock RELEASED (Sleep Mode)');
                }
            }
        };
        
        managePower();
        setInterval(managePower, 60000);
    }, 5000); // <--- 5 second delay added here

    // --- PART 2: CLOCK & DATE ---
    function updateClock() {
        const now = new Date();
        const dateString = now.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });
        const timeString = now.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
        
        const formattedDate = dateString.charAt(0).toUpperCase() + dateString.slice(1);

        const timeEl = document.getElementById('clock-time');
        const dateEl = document.getElementById('clock-date');
        
        if (timeEl) timeEl.textContent = timeString;
        if (dateEl) dateEl.textContent = formattedDate;
    }
    setInterval(updateClock, 1000);
    updateClock();

    // --- PART 3: LUNCH SCHEDULE PARSER ---
    let lunchSchedule = {};

    async function loadLessons() {
        try {
            // Note: Case Sensitive! Ensure file is named 'Lessons.txt'
            const response = await fetch('Lessons.txt');
            if (!response.ok) throw new Error('Lessons.txt not found');
            const text = await response.text();
            parseLessons(text);
        } catch (error) {
            console.error('Error loading lessons:', error);
            // We do not show an error on screen, we just hide the lunch dashboard
            const dashboard = document.getElementById('lunch-dashboard');
            if(dashboard) dashboard.style.display = 'none';
        }
    }

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

            // FILTER: ONLY SHOW SUBJECTS CONTAINING "Lunch"
            if (subject && subject.includes('Lunch') && dayMap[dayStr]) {
                const dayNum = dayMap[dayStr];
                const startMin = timeToMin(startTimeRaw);
                const endMin = startMin + parseInt(lengthRaw);

                if (group) {
                    lunchSchedule[dayNum].push({
                        group: group,
                        start: startMin,
                        end: endMin
                    });
                }
            }
        });
        
        for (let d in lunchSchedule) {
            lunchSchedule[d].sort((a, b) => a.start - b.start);
        }
        updateLunchDashboard();
    }

    function timeToMin(timeStr) {
        const t = parseInt(timeStr);
        const hours = Math.floor(t / 100);
        const minutes = t % 100;
        return hours * 60 + minutes;
    }

    // --- PART 4: LUNCH DASHBOARD ---
    function updateLunchDashboard() {
        const now = new Date();
        const currentDay = now.getDay();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const nowMin = currentHours * 60 + currentMinutes;

        const dashboard = document.getElementById('lunch-dashboard');
        const nowContainer = document.getElementById('lunch-now-groups');
        const nextContainer = document.getElementById('lunch-next-groups');
        const nextTimer = document.getElementById('lunch-next-timer');

        if (!lunchSchedule[currentDay]) {
            if(dashboard) dashboard.style.display = 'none';
            return;
        }

        const todaysLunches = lunchSchedule[currentDay];
        
        const nowGroups = [];
        let nextGroups = [];
        let nextStartTime = null;

        todaysLunches.forEach(event => {
            if (nowMin >= event.start && nowMin < event.end) {
                nowGroups.push(event.group);
            }
            if (nowMin < event.start) {
                if (nextStartTime === null || event.start === nextStartTime) {
                    nextStartTime = event.start;
                    nextGroups.push(event.group);
                }
            }
        });

        const timeToNext = nextStartTime ? nextStartTime - nowMin : 9999;
        // Show if eating NOW, or starts in <= 5 mins
        const shouldShow = (nowGroups.length > 0) || (timeToNext <= 5);

        if (shouldShow) {
            dashboard.style.display = 'block';
            
            if (nowGroups.length > 0) {
                nowContainer.textContent = nowGroups.join(', ');
            } else {
                nowContainer.textContent = 'Förbereder...';
            }

            if (nextGroups.length > 0 && nextStartTime) {
                nextContainer.textContent = nextGroups.join(', ');
                nextTimer.textContent = `Startar om ${timeToNext} min`;
            } else {
                nextContainer.textContent = '-';
                nextTimer.textContent = '';
            }
        } else {
            dashboard.style.display = 'none';
        }
    }
    setInterval(updateLunchDashboard, 5000);

    // --- PART 5: STATUS & MENU ---
    const statusElement = document.getElementById('lounge-status');
    const timerElement = document.getElementById('lounge-timer');
    
    // Schedule (Format: [OpenHour, OpenMin], [CloseHour, CloseMin])
    const schedule = {
        0: [], 1: [[11,0],[13,45]], 2: [[9,0],[10,30],[11,0],[13,45]], 
        3: [[9,0],[13,45]], 4: [[9,0],[10,30],[11,0],[13,45]], 
        5: [[9,0],[10,30],[11,0],[13,45]], 6: []
    };

    function updateLoungeStatus() {
        const now = new Date();
        const currentDay = now.getDay();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTimeInMinutes = currentHours * 60 + currentMinutes;
        const daySchedule = schedule[currentDay];
        let isOpen = false;
        let nextEventTime = null;
        
        // Determine Open/Closed Status
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
        
        // Update DOM
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
    
    function getWeekNumber(d) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return weekNo;
    }
    
    async function loadMenu() {
        const today = new Date();
        const currentWeek = getWeekNumber(today);
        const currentDayIndex = today.getDay();
        document.getElementById('week-number').textContent = currentWeek;
        try {
            const response = await fetch('menu.txt');
            if (!response.ok) { throw new Error('menu.txt file not found.'); }
            const text = await response.text();
            parseMenu(text, currentWeek, currentDayIndex);
        } catch (error) {
            console.error('Error loading menu:', error);
            document.getElementById('menu-grid').innerHTML = '<p style="color:white; font-size: 1.5em;">Laddar meny...</p>';
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
            const todayElement = document.getElementById(`menu-${todayKey}`);
            if (todayElement) { todayElement.classList.add('today'); }
        }
    }

    // INIT
    loadLessons(); 
    loadMenu();
    updateLoungeStatus();
    setInterval(updateLoungeStatus, 1000);
});
