document.addEventListener('DOMContentLoaded', () => {
    
    // --- PART 1: WAKE LOCK (Keeps Screen On) ---
    let wakeLock = null;

    const requestWakeLock = async () => {
        if ('wakeLock' in navigator) {
            try {
                wakeLock = await navigator.wakeLock.request('screen');
                console.log('Wake Lock is active: Screen will not sleep.');
                
                // Re-acquire lock if visibility changes
                wakeLock.addEventListener('release', () => {
                    console.log('Wake Lock was released, re-acquiring...');
                    requestWakeLock();
                });

            } catch (err) {
                console.error(`Wake Lock failed: ${err.name}, ${err.message}`);
            }
        } else {
            console.warn('Wake Lock API is not supported on this browser.');
        }
    };

    // Request the lock when the page loads
    requestWakeLock();

    // Re-request the lock when the tab becomes visible again
    document.addEventListener('visibilitychange', () => {
        if (wakeLock !== null && document.visibilityState === 'visible') {
            requestWakeLock();
        }
    });

    // --- PART 2: LOUNGE STATUS & COUNTDOWN ---

    const statusElement = document.getElementById('lounge-status');
    const timerElement = document.getElementById('lounge-timer');

    // Define the lounge schedule
    // Times are in [hours, minutes]
    const schedule = {
        0: [], // Sunday
        1: [ [11, 0], [13, 45] ], // Monday
        2: [ [9, 0], [10, 30], [11, 0], [13, 45] ], // Tuesday
        3: [ [9, 0], [13, 45] ], // Wednesday
        4: [ [9, 0], [10, 30], [11, 0], [13, 45] ], // Thursday
        5: [ [9, 0], [10, 30], [11, 0], [13, 45] ], // Friday
        6: []  // Saturday
    };

    function updateLoungeStatus() {
        const now = new Date();
        const currentDay = now.getDay();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTimeInMinutes = currentHours * 60 + currentMinutes;

        const daySchedule = schedule[currentDay];
        let isOpen = false;
        let nextEventTime = null; // Time of next open or close

        // Check if currently open
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

        // Find next event if closed
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

        // If no more events today, find the next open day
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

    // --- PART 3: MENU LOADER ---

    // Function to get ISO week number
    function getWeekNumber(d) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return weekNo;
}

    async function loadMenu() {
        const today = new Date();
        // Manually set to Tuesday (Day 2) for testing
        // const currentDayIndex = 2; 
        const currentDayIndex = today.getDay(); // 0=Sunday, 1=Monday...
        
        // This is a "hack" to get the week number.
        // We set the date to Thursday (day 4) of this week to get the correct ISO week number.
        const currentWeekDate = new Date(today.getTime());
        currentWeekDate.setDate(today.getDate() + 4 - (today.getDay() || 7));
        const currentWeek = getWeekNumber(currentWeekDate);
        
        document.getElementById('week-number').textContent = currentWeek;

        try {
            const response = await fetch('menu.txt');
            if (!response.ok) {
                throw new Error('menu.txt file not found.');
            }
            const text = await response.text();
            parseMenu(text, currentWeek, currentDayIndex);
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
        
        const menuData = {
            MONDAY: '',
            TUESDAY: '',
            WEDNESDAY: '',
            THURSDAY: '',
            FRIDAY: ''
        };

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

        // Populate the HTML
        document.querySelector('#menu-monday .menu-content').textContent = menuData.MONDAY || 'Meny saknas';
        document.querySelector('#menu-tuesday .menu-content').textContent = menuData.TUESDAY || 'Meny saknas';
        document.querySelector('#menu-wednesday .menu-content').textContent = menuData.WEDNESDAY || 'Meny saknas';
        document.querySelector('#menu-thursday .menu-content').textContent = menuData.THURSDAY || 'Meny saknas';
        document.querySelector('#menu-friday .menu-content').textContent = menuData.FRIDAY || 'Meny saknas';

        // Highlight today
        if (currentDayIndex >= 1 && currentDayIndex <= 5) {
            const todayKey = days[currentDayIndex].toLowerCase();
            const todayElement = document.getElementById(`menu-${todayKey}`);
            if (todayElement) {
                todayElement.classList.add('today');
            }
        }
    }

    // --- PART 4: INITIALIZE AND UPDATE ---

    // Load the menu once
    loadMenu();

    // Update the lounge status immediately and then every second
    updateLoungeStatus();
    setInterval(updateLoungeStatus, 1000);
});
