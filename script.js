document.addEventListener('DOMContentLoaded', () => {
    
    // --- PART 1: WAKE LOCK (Keeps Screen On) ---
    // We will pre-grant permission for this in the Admin Console
    let wakeLock = null;

    const requestWakeLock = async () => {
        if ('wakeLock' in navigator) {
            try {
                wakeLock = await navigator.wakeLock.request('screen');
                console.log('Wake Lock is active: Screen will not sleep.');
                
                wakeLock.addEventListener('release', () => {
                    console.log('Wake Lock was released.');
                });

            } catch (err) {
                console.error(`Wake Lock failed: ${err.name}, ${err.message}`);
            }
        } else {
            console.warn('Wake Lock API is not supported on this browser.');
        }
    };

    requestWakeLock(); // Request on load
    document.addEventListener('visibilitychange', () => {
        if (wakeLock !== null && document.visibilityState === 'visible') {
            requestWakeLock(); // Re-request when tab becomes visible
        }
    });

    // --- PART 2: LOUNGE STATUS & COUNTDOWN ---

    const statusElement = document.getElementById('lounge-status');
    const timerElement = document.getElementById('lounge-timer');

    // THIS IS THE SCHEDULE
    const schedule = {
        0: [], // Sunday
        1: [ [11, 0], [13, 45] ], // Monday: 11:00-13:45
        2: [ [9, 0], [10, 30], [11, 0], [13, 45] ], // Tuesday: 9:00-10:30, 11:00-13:45
        3: [ [9, 0], [13, 45] ], // Wednesday: 9:00-13:45
        4: [ [9, 0], [10, 30], [11, 0], [13, 45] ], // Thursday: 9:00-10:30, 11:00-13:45
        5: [ [9, 0], [10, 30], [11, 0], [13, 45] ], // Friday: 9:00-10:30, 11:00-13:45
        6: []  // Saturday
    };

    // (All the rest of the timer and menu logic is below)
    // ... (The rest of the file is identical to the one you just had) ...

    function updateLoungeStatus() {
        const now = new Date();
        const currentDay = now.getDay();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTimeInMinutes = currentHours * 60 + currentMinutes;
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
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        } else {
            return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} min`;
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
            if (!response.ok) {
                throw new Error('menu.txt file not found.');
            }
            const text = await response.text();
            parseMenu(text, currentWeek,. currentDayIndex);
        } catch (error) {
            console.error('Error loading menu:', error);
            document.getElementById('menu-grid').innerHTML = '<p style="color:red; font-size: 1.5em;">Kunde inte ladda menyn. Kontrollera att filen menu.txt finns och har rätt namn.</p>';
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
            if (todayElement) {
                todayElement.classList.add('today');
            }
        }
    }
    loadMenu();
    updateLoungeStatus();
    setInterval(updateLoungeStatus, 1000);
});
