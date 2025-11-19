/* Basic setup */
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background-color: #102d69;
    color: #dbdad8;
    padding: 20px;
    height: 100vh;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    text-align: center;
    position: relative; /* Essential for corner positioning */
    overflow: hidden; /* Prevents scrollbars if content gets too tall */
}

.container {
    width: 95%;
    max-width: 1400px;
    margin: 0 auto;
    /* Push content up slightly so it doesn't hit the footer logo/clock */
    padding-bottom: 120px; 
    display: flex;
    flex-direction: column;
    justify-content: flex-start; /* Align towards top */
}

/* --- STATUS STYLING --- */
#status-container {
    margin-top: 20px;
}

#lounge-status {
    font-size: 6em;
    font-weight: bold;
    margin: 0;
    text-transform: uppercase;
    line-height: 1.1;
}

#lounge-timer {
    font-size: 3.5em;
    color: #9a9b9d;
    margin-top: 10px;
    margin-bottom: 20px;
}

#lounge-status.open { color: #4CAF50; }
#lounge-status.closed { color: #F44336; }


/* --- LUNCH DASHBOARD (Now/Next) --- */
#lunch-dashboard {
    display: none; /* Hidden by default */
    margin: 10px auto 30px auto;
    width: 90%;
    max-width: 1000px;
    background-color: #1f408a;
    border: 2px solid #00a0df;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}

.lunch-row {
    display: flex;
    justify-content: space-around;
    text-align: center;
}

.lunch-col {
    flex: 1;
    padding: 10px;
}

.lunch-label {
    font-size: 1.8em;
    font-weight: bold;
    color: #9a9b9d;
    margin-bottom: 10px;
    display: block;
}

.lunch-groups {
    font-size: 3em;
    font-weight: bold;
    color: #ffffff;
    display: block;
}

#lunch-next-timer {
    font-size: 1.2em;
    color: #F44336; /* Red countdown */
    font-weight: bold;
    display: block;
    margin-top: 5px;
}


/* --- MENU STYLING --- */
hr {
    border: 1px solid #9a9b9d;
    margin: 20px 0;
    width: 100%;
}

#menu-container h1 { display: none; }

#menu-grid {
    display: flex;
    justify-content: center; 
    width: 100%;
}

.menu-day {
    display: none; 
    background-color: #1f408a;
    border-radius: 8px;
    padding: 30px;
    flex-basis: 100%;
    max-width: 1100px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.menu-day.today {
    display: block;
    border: 3px solid #00a0df;
    background-color: rgba(0, 160, 223, 0.1);
}

.menu-day h3 {
    font-size: 4.5em;
    color: #00a0df;
    margin-top: 0;
    margin-bottom: 30px;
}

.menu-content {
    font-family: inherit; 
    font-size: 2.8em;
    line-height: 1.5;
    color: #dbdad8;
    text-align: left;
    white-space: pre-wrap;
    margin: 0;
}

/* --- FOOTER ELEMENTS (Absolute Positioning) --- */

/* LOGO: Bottom Left */
#school-logo {
    position: absolute;
    bottom: 25px;
    left: 30px;
    max-height: 130px;
    width: auto;
    /* Ensure it sits on top if window is small */
    z-index: 10; 
}

/* CLOCK: Bottom Right */
#clock-display {
    position: absolute;
    bottom: 25px;
    right: 30px;
    text-align: right;
    color: #dbdad8;
    line-height: 1.2;
    z-index: 10;
}

#clock-time {
    font-size: 4.5em;
    font-weight: bold;
    color: white;
    display: block;
}

#clock-date {
    font-size: 1.8em;
    color: #9a9b9d;
    display: block;
    margin-top: 5px;
}
