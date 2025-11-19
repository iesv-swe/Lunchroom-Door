// --- v44 FINAL ---
// Layout: CSS is now embedded in HTML to prevent layout breakage.
// Logic: Wake Lock API, Support/Prao Filters, Robust File Loading.

document.addEventListener('DOMContentLoaded', () => {
    
    // --- PART 1: OFFICIAL WAKE LOCK API ---
    let wakeLock = null;

    const requestWakeLock = async () => {
        try {
            if ('wakeLock' in navigator) {
                wakeLock = await navigator.wakeLock.request('screen');
                console.log('Wake Lock: ACTIVE');
                
                wakeLock.addEventListener('release', () => {
                    console.log('Wake Lock: RELEASED');
                    wakeLock = null;
                });
            }
        } catch (err) {
            console.error(`Wake Lock Error: ${err.name}, ${err.message}`);
        }
    };

    // Re-acquire lock
    document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible' && wakeLock === null) {
            await requestWakeLock();
        }
    });

    requestWakeLock();

    // --- PART 2: CLOCK ---
    function updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
        const clockEl = document.getElementById('bottom-right-clock');
        if (clockEl) clockEl.textContent = timeString;
    }
    setInterval(updateClock, 1000);
    updateClock(); 

    // --- PART 3: LOUNGE STATUS ---
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
            timerElement.textContent = `Closes in ${formatCountdown(nextEventTime)}`;
        } else {
            statusElement.textContent = 'The Lounge is CLOSED';
            statusElement.className = 'closed';
            if (nextEventTime) {
                timerElement.textContent = `Opens in ${formatCountdown(nextEventTime)}`;
            } else {
                timerElement.textContent = 'Closed for the weekend';
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

    // --- PART 4: LUNCH DASHBOARD ---
    async function safeLoadLessons() {
        try {
            const cb = Date.now();
            const response = await fetch(`Lessons.txt?t=${cb}`);
            
            if (!response.ok) throw new Error('Lessons.txt not found');
            const text = await response.text();
            parseLessons(text);
        } catch (error) {
            console.warn('Lesson load failed:', error);
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

            if (subject && subject.includes('Lunch') && dayMap[dayStr] >= 1 && dayMap[dayStr] <= 5) {
                const dayNum = dayMap[dayStr];
                const startMin = timeToMin(startTimeRaw);
                const endMin = startMin + parseInt(lengthRaw);
                
                // Filter Logic
                const normalizedGroup = group ? group.toLowerCase() : '';
                const isExcluded = normalizedGroup.includes('support') || normalizedGroup.includes('prao');

                if (group && !isExcluded) { 
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

        const nowGroupSet = new Set(nowGroups);
        const filteredNextGroups = nextGroups.filter(group => !nowGroupSet.has(group));
        const timeToNext = nextStartTime ? nextStartTime - nowMin : 9999;
        const shouldShow = (nowGroups.length > 0) || (timeToNext <= 5);

        if (shouldShow && dashboard) {
            dashboard.style.display = 'block';
            if(divider) divider.style.display = 'block'; 
            
            document.getElementById('lunch-now-groups').textContent = nowGroups.length > 0 ? nowGroups.join(', ') : 'Förbereder...';
            
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
    setInterval(updateLunchDashboard, 5000);

    // --- PART 5: MENU ---
    function getWeekNumber(d) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1)); 
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    async function safeLoadMenu() {
        const cb = Date.now();
        const currentWeek = getWeekNumber(new Date());
        document.getElementById('week-number').textContent = currentWeek;

        try {
            const response = await fetch(`menu.txt?t=${cb}`);
            if (!response.ok) throw new Error('menu.txt not found');
            const text = await response.text();
            parseMenu(text, currentWeek, new Date().getDay());
        } catch (error) {
            console.warn('Menu load failed:', error);
            document.getElementById('menu-grid').innerHTML = 
                `<p style="color:white; font-size:2em;">❌ Meny kunde inte laddas.<br><span style="font-size:0.6em; color:#aaa;">Söker efter: [WEEK ${currentWeek}] i menu.txt</span></p>`;
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
            if (trimmedLine.toUpperCase().startsWith('[WEEK')) {
                activeWeek = (trimmedLine.toUpperCase() === weekTag);
            } else if (activeWeek && trimmedLine.startsWith('[')) {
                activeDay = trimmedLine.substring(1, trimmedLine.length - 1).toUpperCase();
            } else if (activeWeek && activeDay && menuData.hasOwnProperty(activeDay) && trimmedLine && !trimmedLine.startsWith('#')) {
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
