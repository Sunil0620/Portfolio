/* ===================================================================
   macOS Portfolio — script.js  (Fully Upgraded v2)
   Boot · Login · Cursor · Screensaver · MusicPlayer · VSCode Clone
   Terminal Easter Eggs · ControlCenter · NotifCenter · DynamicWallpaper
   =================================================================== */

'use strict';

let zIndex = 100;
let locked = true;
let missionControlActive = false;
let masterVolume = 0.7;
let brightnessLevel = 1.0;
let focusModeOn = false;
let dockBase = parseInt(localStorage.getItem('mac-dock-size') || '48');

/* ==================== CUSTOM CURSOR ==================== */
(function initCursor() {
    const dot  = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    let mx = -100, my = -100, rx = -100, ry = -100;
    let rAF;

    document.addEventListener('mousemove', e => {
        mx = e.clientX; my = e.clientY;
    });

    function loop() {
        rx += (mx - rx) * 0.14;
        ry += (my - ry) * 0.14;
        dot.style.left  = mx + 'px';
        dot.style.top   = my + 'px';
        ring.style.left = rx + 'px';
        ring.style.top  = ry + 'px';
        rAF = requestAnimationFrame(loop);
    }
    loop();

    document.addEventListener('mousedown', () => ring.classList.add('clicking'));
    document.addEventListener('mouseup',   () => ring.classList.remove('clicking'));

    document.addEventListener('mouseover', e => {
        const el = e.target;
        if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'INPUT'  ||
            el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' ||
            el.classList.contains('dock-item') || el.classList.contains('ctrl') ||
            el.classList.contains('project-card') || el.classList.contains('tag') ||
            el.classList.contains('playlist-item') || el.classList.contains('cc-tile') ||
            el.closest('.dock-item') || el.closest('.ctrl')) {
            ring.classList.add('hovering');
        } else {
            ring.classList.remove('hovering');
        }
    });
})();

/* ==================== BOOT SEQUENCE ==================== */
document.addEventListener('DOMContentLoaded', () => {
    const bootScreen  = document.getElementById('boot-screen');
    const loginScreen = document.getElementById('login-screen');
    const bootLog     = document.getElementById('boot-log');
    const bootLabel   = document.getElementById('boot-label');
    const arcFill     = document.getElementById('boot-arc-fill');
    let progress = 0;

    /* ---- Aurora canvas ---- */
    initAuroraCanvas();

    /* ---- Typewriter for "Portfolio OS" ---- */
    const labelText = 'Portfolio OS';
    let labelIdx = 0;
    const labelInterval = setInterval(() => {
        if (labelIdx <= labelText.length) {
            if (bootLabel) bootLabel.textContent = labelText.slice(0, labelIdx);
            labelIdx++;
        } else {
            clearInterval(labelInterval);
        }
    }, 80);

    /* ---- Kernel boot messages ---- */
    const bootMessages = [
        { ts: '0.001', msg: 'IOKit: Starting IOPlatformExpertDevice…' },
        { ts: '0.042', msg: 'Kernel extensions loaded' },
        { ts: '0.118', msg: 'Initializing network stack…' },
        { ts: '0.203', msg: 'Loading audio subsystem…' },
        { ts: '0.341', msg: 'Mounting filesystems…' },
        { ts: '0.489', msg: 'Starting WindowServer…' },
        { ts: '0.612', msg: 'Launching Dock.app…' },
        { ts: '0.798', msg: 'portfolio: ready  ✓' },
    ];
    let msgIdx = 0;

    function addBootMsg() {
        if (msgIdx >= bootMessages.length || !bootLog) return;
        const { ts, msg } = bootMessages[msgIdx++];
        const p = document.createElement('p');
        const isLast = msg.includes('✓');
        p.innerHTML = `<span class="log-ts">[${ts}]</span><span class="${isLast ? 'log-ok' : 'log-txt'}"> ${msg}</span>`;
        bootLog.appendChild(p);
        if (bootLog.children.length > 4) bootLog.removeChild(bootLog.firstChild);
    }
    const msgInterval = setInterval(addBootMsg, 280);

    /* ---- Arc progress ---- */
    const ARC_CIRCUMFERENCE = 339.3; // 2π × 54
    function setArcProgress(pct) {
        if (!arcFill) return;
        arcFill.style.strokeDashoffset = ARC_CIRCUMFERENCE * (1 - pct / 100);
    }

    const bootInterval = setInterval(() => {
        progress += Math.random() * 7 + 2;
        if (progress >= 100) {
            progress = 100;
            clearInterval(bootInterval);
            clearInterval(msgInterval);
            clearInterval(labelInterval);
            setArcProgress(100);
            /* Complete log */
            if (bootLabel) bootLabel.textContent = 'Portfolio OS ◆';
            /* Play chime then transition */
            playBootChime();
            setTimeout(() => {
                bootScreen.classList.add('hidden');
                loginScreen.classList.remove('hidden');
                const pi = document.getElementById('password-input');
                if (pi) pi.focus();
            }, 700);
        }
        setArcProgress(progress);
    }, 130);

    /* ---- Clocks ---- */
    updateLoginClock();
    setInterval(updateLoginClock, 1000);
    updateMenuClock();
    setInterval(updateMenuClock, 1000);

    /* Terminal timestamp */
    const tt = document.getElementById('term-time');
    if (tt) tt.textContent = new Date().toUTCString();

    /* Login handlers */
    const loginBtn      = document.getElementById('login-btn');
    const passwordInput = document.getElementById('password-input');
    if (loginBtn)      loginBtn.addEventListener('click', doLogin);
    if (passwordInput) passwordInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

    /* Restore saved settings */
    restoreSettings();

    /* Init dynamic wallpaper */
    applyDynamicWallpaper();

    /* Init all window controls */
    document.querySelectorAll('.window').forEach(win => {
        const hdr = win.querySelector('.window-header');
        if (hdr) makeDraggable(hdr, win);
    });
    document.querySelectorAll('.resize-handle').forEach(makeResizable);
    document.querySelectorAll('.resize-handle-left').forEach(makeResizableLeft);

    /* Right-click context menu */
    document.getElementById('desktop').addEventListener('contextmenu', e => {
        if (e.target.closest('.window') || e.target.closest('#dock-wrapper') || e.target.closest('#menu-bar')) return;
        e.preventDefault();
        showContextMenu(e.clientX, e.clientY);
    });
    document.addEventListener('click', e => {
        if (!e.target.closest('#context-menu'))                         hideContextMenu();
        if (!e.target.closest('#spotlight') && !e.target.closest('.spotlight-btn')) hideSpotlight();
        if (!e.target.closest('#control-center') && !e.target.closest('.cc-trigger')) hideControlCenter();
        if (!e.target.closest('#notif-center') && !e.target.closest('.menu-clock'))   hideNotifCenter();
        if (!e.target.closest('.menu-dropdown'))                        closeAllDropdowns();
    });

    /* Keyboard shortcuts */
    document.addEventListener('keydown', e => {
        if (locked) return;
        resetIdleTimer();
        const isMeta = e.metaKey || e.ctrlKey;
        if ((isMeta && e.key === ' ') || e.key === 'F4') { e.preventDefault(); toggleSpotlight(); return; }
        if (e.key === 'F3') { e.preventDefault(); triggerMissionControl(); return; }
        if (isMeta && e.key === 'q') { e.preventDefault(); lockScreen(); return; }
        if (e.key === 'Escape') {
            hideSpotlight(); hideControlCenter(); hideNotifCenter();
            if (missionControlActive) triggerMissionControl();
        }
    });

    /* Window click — bring to front */
    document.querySelectorAll('.window').forEach(win => {
        win.addEventListener('mousedown', () => bringFront(win));
    });

    /* Init dock */
    initDock();

    /* Spotlight input */
    const slInput = document.getElementById('spotlight-input');
    if (slInput) {
        slInput.addEventListener('input', () => renderSpotlightResults(slInput.value.trim()));
        slInput.addEventListener('keydown', handleSpotlightKey);
    }

    /* Menu dropdowns */
    document.querySelectorAll('.menu-dropdown').forEach(dd => {
        const btn   = dd.querySelector('.menu-btn');
        const panel = dd.querySelector('.dropdown-panel');
        if (!btn || !panel) return;
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const wasOpen = panel.classList.contains('open');
            closeAllDropdowns();
            if (!wasOpen) { panel.classList.add('open'); btn.classList.add('open'); }
        });
    });

    /* Idle / screensaver timer */
    startIdleTimer();

    /* Init VS Code */
    buildVSCode();

    /* Notification Centre date */
    updateNCDate();

    /* Tab visibility easter egg */
    document.addEventListener('visibilitychange', () => {
        document.title = document.hidden
            ? '👀 Come back...'
            : 'Portfolio — macOS Sonoma';
    });

    /* Desktop mouse parallax */
    initParallax();
});

/* ==================== KONAMI CODE EASTER EGG ==================== */
(function initKonami() {
    const seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let idx = 0;
    document.addEventListener('keydown', e => {
        if (e.key === seq[idx]) { idx++; } else { idx = e.key === seq[0] ? 1 : 0; }
        if (idx === seq.length) {
            idx = 0;
            openWindow('window-skills');
            setTimeout(() => {
                const ti = document.getElementById('terminal-input');
                if (ti) { ti.value = 'fortune'; ti.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); }
            }, 400);
        }
    });
})();

/* ==================== AURORA CANVAS (Boot) ==================== */
function initAuroraCanvas() {
    const canvas = document.getElementById('boot-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = canvas.width  = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    const bands = [
        { hue: 260, x: 0.2,  y: 0.3, r: 0.55, speed: 0.0003, amp: 0.08 },
        { hue: 190, x: 0.7,  y: 0.4, r: 0.50, speed: 0.0004, amp: 0.07 },
        { hue: 150, x: 0.45, y: 0.6, r: 0.45, speed: 0.0002, amp: 0.06 },
        { hue: 300, x: 0.85, y: 0.25,r: 0.40, speed: 0.0005, amp: 0.05 },
    ];

    let t = 0, auroraId;
    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);

        bands.forEach(b => {
            const cx = (b.x + Math.sin(t * b.speed * 0.7) * b.amp) * W;
            const cy = (b.y + Math.cos(t * b.speed)      * b.amp) * H;
            const r  = b.r * Math.min(W, H);
            const hue = (b.hue + t * 0.02) % 360;

            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            grad.addColorStop(0,   `hsla(${hue},70%,55%,0.18)`);
            grad.addColorStop(0.4, `hsla(${hue},60%,45%,0.09)`);
            grad.addColorStop(1,   `hsla(${hue},50%,30%,0)`);

            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
        });

        auroraId = requestAnimationFrame(draw);
    }
    draw();

    /* Stop aurora when boot screen hides */
    const bs = document.getElementById('boot-screen');
    if (bs) {
        new MutationObserver(() => {
            if (bs.classList.contains('hidden')) cancelAnimationFrame(auroraId);
        }).observe(bs, { attributes: true, attributeFilter: ['class'] });
    }
    window.addEventListener('resize', () => {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    });
}

/* ==================== BOOT CHIME (Web Audio) ==================== */
function playBootChime() {
    try {
        const ctx  = new (window.AudioContext || window.webkitAudioContext)();
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);
        gain.connect(ctx.destination);

        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 — major chord
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
            osc.connect(gain);
            osc.start(ctx.currentTime + i * 0.08);
            osc.stop(ctx.currentTime + 1.6);
        });
    } catch (e) { /* silently skip if audio not available */ }
}

/* ==================== PARALLAX WALLPAPER ==================== */
function initParallax() {
    document.addEventListener('mousemove', e => {
        if (locked) return;
        const xPct = (e.clientX / window.innerWidth  - 0.5) * 2; // -1 to 1
        const yPct = (e.clientY / window.innerHeight - 0.5) * 2;
        const depth = 8;
        document.body.style.setProperty('--parallax-x', `${xPct * depth}px`);
        document.body.style.setProperty('--parallax-y', `${yPct * depth}px`);
    });
}

/* ==================== DESKTOP OVERLAY ==================== */
let openWindowCount = 0;
function showDesktopOverlay() {
    openWindowCount++;
    document.getElementById('desktop-overlay')?.classList.add('active');
}
function hideDesktopOverlay() {
    openWindowCount = Math.max(0, openWindowCount - 1);
    if (openWindowCount === 0) document.getElementById('desktop-overlay')?.classList.remove('active');
}
function applyDynamicWallpaper() {
    const saved = localStorage.getItem('mac-wall');
    if (saved) { setWallpaper(saved, false); return; }
    const hr = new Date().getHours();
    if      (hr >= 5  && hr < 8)  setWallpaper('img3', false);  // dawn  — ocean
    else if (hr >= 8  && hr < 12) setWallpaper('img1', false);  // morning — mountain
    else if (hr >= 12 && hr < 17) setWallpaper('img4', false);  // afternoon — valley
    else if (hr >= 17 && hr < 20) setWallpaper('img5', false);  // evening — desert
    else                          setWallpaper('img2', false);  // night — abstract
}

/* ==================== IDLE / SCREEN SAVER ==================== */
let idleTimer = null;
const IDLE_SECS = 90;

function startIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(activateScreensaver, IDLE_SECS * 1000);
}
function resetIdleTimer() {
    if (!locked) startIdleTimer();
}
['mousemove','mousedown','keydown','touchstart'].forEach(ev =>
    document.addEventListener(ev, resetIdleTimer, { passive: true })
);

let saverAnimId = null;

function activateScreensaver() {
    if (locked) return;
    const ss = document.getElementById('screen-saver');
    if (!ss) return;
    ss.classList.remove('hidden');
    startSaverAnimation();

    function dismiss(e) {
        if (e) e.preventDefault();
        ss.classList.add('hidden');
        cancelAnimationFrame(saverAnimId);
        ss.removeEventListener('click', dismiss);
        ss.removeEventListener('keydown', dismiss);
        document.removeEventListener('keydown', dismiss);
        resetIdleTimer();
    }
    ss.addEventListener('click', dismiss);
    document.addEventListener('keydown', dismiss);
}

function startSaverAnimation() {
    const canvas = document.getElementById('saver-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const circles = Array.from({ length: 60 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 80 + 20,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        hue: Math.random() * 360,
        alpha: Math.random() * 0.15 + 0.05,
    }));

    let frame = 0;
    function draw() {
        frame++;
        ctx.fillStyle = 'rgba(0,0,0,0.03)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        circles.forEach(c => {
            c.x += c.vx; c.y += c.vy;
            c.hue = (c.hue + 0.2) % 360;
            if (c.x < -c.r)  c.x = canvas.width  + c.r;
            if (c.x > canvas.width  + c.r) c.x = -c.r;
            if (c.y < -c.r)  c.y = canvas.height + c.r;
            if (c.y > canvas.height + c.r) c.y = -c.r;

            const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
            grad.addColorStop(0, `hsla(${c.hue},80%,60%,${c.alpha})`);
            grad.addColorStop(1, `hsla(${c.hue},80%,60%,0)`);
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
        });
        saverAnimId = requestAnimationFrame(draw);
    }
    draw();
}

/* ==================== LOGIN CLOCK ==================== */
function updateLoginClock() {
    const now = new Date();
    const el = document.getElementById('login-time');
    const de = document.getElementById('login-date');
    if (el) el.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    if (de) {
        de.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }
}

/* ==================== MENU CLOCK ==================== */
function updateMenuClock() {
    const el = document.getElementById('menu-clock');
    if (!el) return;
    const now = new Date();
    const opts = { weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', hour12: false, timeZone: 'UTC' };
    el.textContent = now.toLocaleString('en-US', opts).replace(',','') + ' (UTC)';
}

/* ==================== NOTIF CENTRE DATE ==================== */
function updateNCDate() {
    const bigDate = document.getElementById('nc-big-date');
    const bigDay  = document.getElementById('nc-big-day');
    if (!bigDate || !bigDay) return;
    const now = new Date();
    bigDate.textContent = now.toLocaleDateString('en-US', { weekday: 'long' });
    bigDay.textContent  = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

/* ==================== UNLOCK ==================== */
function doLogin() {
    const pi   = document.getElementById('password-input');
    const wrap = document.getElementById('password-field-wrap');
    const hint = document.getElementById('login-hint-text');

    /* Require at least something typed — otherwise shake */
    if (pi && pi.value.trim() === '') {
        if (wrap) {
            wrap.classList.remove('shake');
            void wrap.offsetWidth; /* force reflow to restart animation */
            wrap.classList.add('shake');
            setTimeout(() => wrap.classList.remove('shake'), 600);
        }
        if (hint) {
            hint.textContent = 'Password required';
            hint.classList.add('wrong');
            setTimeout(() => { hint.textContent = 'Enter any password to continue'; hint.classList.remove('wrong'); }, 1800);
        }
        return;
    }

    const ls      = document.getElementById('login-screen');
    const desktop = document.getElementById('desktop');
    ls.classList.add('unlocking');
    setTimeout(() => {
        ls.classList.add('hidden');
        ls.classList.remove('unlocking');
        desktop.classList.remove('hidden');
        locked = false;
        onDesktopReady();
    }, 600);
}

function onDesktopReady() {
    setTimeout(() => toggleWindow('window-about'), 500);
    setTimeout(() => showNotification('Welcome! Explore via dock or ⌘Space for Spotlight'), 1200);
    resetIdleTimer();
}

/* ==================== LOCK SCREEN ==================== */
function lockScreen() {
    const ls = document.getElementById('login-screen');
    const desktop = document.getElementById('desktop');
    locked = true;
    desktop.classList.add('hidden');
    ls.classList.remove('hidden');
    const pi = document.getElementById('password-input');
    if (pi) { pi.value = ''; pi.focus(); }
    clearTimeout(idleTimer);
}

/* ==================== CONTROL CENTER ==================== */
function toggleControlCenter() {
    const cc = document.getElementById('control-center');
    const nc = document.getElementById('notif-center');
    nc.classList.add('hidden');
    cc.classList.toggle('hidden');
    updateCCState();
}
function hideControlCenter() {
    const el = document.getElementById('control-center');
    if (!el || el.classList.contains('hidden')) return;
    el.style.animation = 'ccOut 0.15s ease-in forwards';
    setTimeout(() => { el.classList.add('hidden'); el.style.animation = ''; }, 150);
}
function updateCCState() {
    const darkTile = document.getElementById('cc-dark-tile');
    const focusTile= document.getElementById('cc-focus-tile');
    const mode = localStorage.getItem('mac-appearance') || 'dark';
    if (darkTile) darkTile.classList.toggle('active', mode === 'dark');
    if (focusTile) focusTile.classList.toggle('active', focusModeOn);
}
function ccToggleDark() {
    const mode = localStorage.getItem('mac-appearance') || 'dark';
    const newMode = mode === 'dark' ? 'light' : 'dark';
    setAppearanceMode(newMode, null);
    /* sync toggle buttons in settings */
    document.querySelectorAll('.toggle-btn').forEach(b => {
        if (b.textContent.trim().toLowerCase() === newMode) b.classList.add('active');
        else b.classList.remove('active');
    });
    updateCCState();
}
function ccToggleFocus() {
    focusModeOn = !focusModeOn;
    updateCCState();
    showNotification(focusModeOn ? 'Focus mode ON — notifications silenced' : 'Focus mode OFF');
}
function ccBrightness(val) {
    brightnessLevel = val / 100;
    document.getElementById('desktop').style.filter = `brightness(${brightnessLevel})`;
}
function ccVolume(val) {
    masterVolume = val / 100;
    if (musicGainNode) musicGainNode.gain.setTargetAtTime(masterVolume * 0.3, audioCtx.currentTime, 0.05);
}

/* ==================== NOTIFICATION CENTER ==================== */
function toggleNotifCenter() {
    const nc = document.getElementById('notif-center');
    const cc = document.getElementById('control-center');
    cc.classList.add('hidden');
    nc.classList.toggle('hidden');
}
function hideNotifCenter() {
    const el = document.getElementById('notif-center');
    if (!el || el.classList.contains('hidden')) return;
    el.style.animation = 'ccOut 0.15s ease-in forwards';
    setTimeout(() => { el.classList.add('hidden'); el.style.animation = ''; }, 150);
}

/* ==================== NOTIFICATION TOAST ==================== */
function showNotification(msg) {
    if (focusModeOn) return;
    const n = document.getElementById('notification');
    if (!n) return;
    n.querySelector('.notif-body p').textContent = msg;
    n.classList.remove('hidden', 'hiding');
    clearTimeout(n._t);
    n._t = setTimeout(() => {
        n.classList.add('hiding');
        setTimeout(() => n.classList.add('hidden'), 300);
    }, 3500);
}

/* ==================== SPOTLIGHT ==================== */
const SPOTLIGHT_INDEX = [
    { label:'About Me',         type:'App',     icon:'🗂️',  action:() => toggleWindow('window-about') },
    { label:'Terminal',         type:'App',     icon:'💻',  action:() => toggleWindow('window-skills') },
    { label:'Projects',         type:'App',     icon:'🧭',  action:() => toggleWindow('window-projects') },
    { label:'Contact',          type:'App',     icon:'📝',  action:() => toggleWindow('window-contact') },
    { label:'Music',            type:'App',     icon:'🎵',  action:() => toggleWindow('window-music') },
    { label:'VS Code',          type:'App',     icon:'💙',  action:() => toggleWindow('window-vscode') },
    { label:'System Settings',  type:'System',  icon:'⚙️',  action:() => toggleWindow('window-settings') },
    { label:'Lock Screen',      type:'System',  icon:'🔒',  action:() => lockScreen() },
    { label:'Python',           type:'Skill',   icon:'🐍',  action:() => toggleWindow('window-skills') },
    { label:'JavaScript',       type:'Skill',   icon:'🟨',  action:() => toggleWindow('window-skills') },
    { label:'Django',           type:'Skill',   icon:'🟢',  action:() => toggleWindow('window-skills') },
    { label:'React',            type:'Skill',   icon:'⚛️',  action:() => toggleWindow('window-skills') },
    { label:'Docker',           type:'Skill',   icon:'🐳',  action:() => toggleWindow('window-skills') },
    { label:'AI Code Agent',    type:'Project', icon:'🤖',  action:() => { toggleWindow('window-projects'); } },
    { label:'Email: sunilsaini5652@gmail.com', type:'Contact', icon:'📧', action:() => window.open('mailto:sunilsaini5652@gmail.com') },
    { label:'GitHub: Sunil0620',type:'Social',  icon:'🐙',  action:() => window.open('https://github.com/Sunil0620','_blank') },
];

let slActive = -1;

function toggleSpotlight() {
    const sl = document.getElementById('spotlight');
    const input = document.getElementById('spotlight-input');
    if (sl.classList.contains('hidden')) {
        sl.classList.remove('hidden');
        input.value = '';
        document.getElementById('spotlight-results').innerHTML = '';
        slActive = -1;
        setTimeout(() => input.focus(), 50);
    } else {
        hideSpotlight();
    }
}
function hideSpotlight() {
    const el = document.getElementById('spotlight');
    if (!el || el.classList.contains('hidden')) return;
    el.style.animation = 'ccOut 0.15s ease-in forwards';
    setTimeout(() => { el.classList.add('hidden'); el.style.animation = ''; }, 150);
}

function renderSpotlightResults(q) {
    const box = document.getElementById('spotlight-results');
    if (!q) { box.innerHTML = ''; slActive = -1; return; }
    const results = SPOTLIGHT_INDEX.filter(item =>
        item.label.toLowerCase().includes(q.toLowerCase()) ||
        item.type.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 6);
    box.innerHTML = results.map((r, i) => `
        <div class="sl-item${i === slActive ? ' active' : ''}" data-idx="${i}" onclick="execSpotlight(${i})">
            <span class="sl-icon">${r.icon}</span>
            <span class="sl-label">${r.label}</span>
            <span class="sl-type">${r.type}</span>
        </div>`).join('');
    box._results = results;
}

function handleSpotlightKey(e) {
    const box = document.getElementById('spotlight-results');
    const items = box.querySelectorAll('.sl-item');
    if (e.key === 'ArrowDown')  { e.preventDefault(); slActive = Math.min(slActive + 1, items.length - 1); }
    if (e.key === 'ArrowUp')    { e.preventDefault(); slActive = Math.max(slActive - 1, 0); }
    if (e.key === 'Enter')      { e.preventDefault(); if (slActive >= 0) execSpotlight(slActive); else if (items.length) execSpotlight(0); }
    if (e.key === 'Escape')     { hideSpotlight(); }
    items.forEach((it, i) => it.classList.toggle('active', i === slActive));
}

function execSpotlight(idx) {
    const box = document.getElementById('spotlight-results');
    const r = box._results?.[idx];
    if (r) { r.action(); hideSpotlight(); }
}

/* ==================== CONTEXT MENU ==================== */
function showContextMenu(x, y) {
    const cm = document.getElementById('context-menu');
    cm.style.left = Math.min(x, window.innerWidth  - 220) + 'px';
    cm.style.top  = Math.min(y, window.innerHeight - 280) + 'px';
    cm.classList.remove('hidden');
}
function hideContextMenu() {
    document.getElementById('context-menu')?.classList.add('hidden');
}

/* ==================== DROPDOWN MENUS ==================== */
function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-panel.open').forEach(p => p.classList.remove('open'));
    document.querySelectorAll('.menu-btn.open').forEach(b => b.classList.remove('open'));
}

/* ==================== ABOUT MAC ==================== */
function openAboutMac() {
    closeAllDropdowns();
    toggleWindow('window-about-mac');
}

/* ==================== WINDOW MANAGEMENT ==================== */
function bringFront(win) {
    win.style.zIndex = ++zIndex;
    const id = win.id.replace('window-', '');
    document.getElementById('menu-app-name').textContent = {
        about: 'Finder', projects: 'Safari', skills: 'Terminal',
        contact: 'Notes', settings: 'System Settings', music: 'Music',
        vscode: 'Code', readme: 'TextEdit', nodemodules: 'Finder', todo: 'Notes',
    }[id] || 'Finder';
}

function toggleWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    if (win.style.display === 'none' || !win.style.display) {
        openWindow(win);
    } else if (win.classList.contains('minimized')) {
        restoreWindow(win);
    } else {
        bringFront(win);
    }
}

function openWindow(win) {
    win.style.display = 'flex';
    win.classList.remove('minimized');
    if (!win.style.left || win.style.left === '0px') {
        const w = win.offsetWidth  || parseInt(win.style.width)  || 600;
        const h = win.offsetHeight || parseInt(win.style.height) || 400;
        win.style.left = Math.max(20, (window.innerWidth  - w) / 2 + (Math.random()-0.5)*60) + 'px';
        win.style.top  = Math.max(40, (window.innerHeight - h) / 4 + (Math.random()-0.5)*40) + 'px';
    }
    bringFront(win);
    showDesktopOverlay();
    /* Bounce dock icon */
    const dot = document.getElementById('dot-' + win.id);
    if (dot) dot.classList.add('visible');
    const dockItem = document.querySelector(`.dock-item[data-app="${win.id}"]`);
    if (dockItem) {
        const art = dockItem.querySelector('.dock-icon-art');
        if (art) { art.classList.add('bouncing'); setTimeout(() => art.classList.remove('bouncing'), 700); }
    }
    if (win.id === 'window-music') initMusicVisualizer();
    if (win.id === 'window-vscode') buildVSCode();
    if (win.id === 'window-about-mac') {
        const ramEl = win.querySelector('.about-mac-ram');
        if (ramEl && !ramEl.dataset.animating) {
            ramEl.dataset.animating = '1';
            let gb = 127.9;
            const t = setInterval(() => { gb = Math.min(gb + 0.1, 142); ramEl.textContent = gb.toFixed(1) + ' GB'; if (gb >= 142) clearInterval(t); }, 300);
        }
    }
}

function closeWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    if (win.id === 'window-readme' && win.dataset.readmeContent) {
        win.querySelector('.header-title').textContent = win.dataset.readmeTitle;
        win.querySelector('.textedit-content').innerHTML = win.dataset.readmeContent;
    }
    win.classList.add('closing');
    setTimeout(() => { win.classList.remove('closing'); win.style.display = 'none'; }, 180);
    win.classList.remove('minimized');
    const dot = document.getElementById('dot-' + id);
    if (dot) dot.classList.remove('visible');
    hideDesktopOverlay();
}

function minimizeWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    win.style.transform = 'scale(0.3) translateY(100%)';
    win.style.opacity   = '0';
    win.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    setTimeout(() => {
        win.style.display = 'none';
        win.style.transform = '';
        win.style.opacity   = '';
        win.style.transition = '';
        win.classList.add('minimized');
    }, 300);
}

function restoreWindow(win) {
    win.style.display = 'flex';
    win.classList.remove('minimized');
    bringFront(win);
}

let maxState = {};
function maximizeWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    if (win.dataset.maximized === '1') {
        const s = maxState[id];
        if (s) { win.style.width=s.w; win.style.height=s.h; win.style.left=s.l; win.style.top=s.t; }
        win.dataset.maximized = '0';
    } else {
        maxState[id] = { w: win.style.width, h: win.style.height, l: win.style.left, t: win.style.top };
        win.style.left  = '0px';
        win.style.top   = '28px';
        win.style.width  = window.innerWidth  + 'px';
        win.style.height = (window.innerHeight - 28) + 'px';
        win.dataset.maximized = '1';
    }
    bringFront(win);
}

function closeAllWindows() {
    document.querySelectorAll('.window').forEach(w => closeWindow(w.id));
}
function showAllWindows() {
    document.querySelectorAll('.window').forEach(w => {
        if (w.classList.contains('minimized')) restoreWindow(w);
    });
}

/* ==================== MISSION CONTROL ==================== */
function triggerMissionControl() {
    const desktop = document.getElementById('desktop');
    missionControlActive = !missionControlActive;
    if (missionControlActive) {
        const wins = document.querySelectorAll('.window');
        const total = wins.length;
        const cols  = Math.ceil(Math.sqrt(total));
        const rows  = Math.ceil(total / cols);
        const W = window.innerWidth, H = window.innerHeight - 28;
        const padX = 60, padY = 60;
        const cellW = (W - padX * 2) / cols;
        const cellH = (H - padY * 2) / rows;
        wins.forEach((win, i) => {
            if (win.style.display === 'none') return;
            const col = i % cols, row = Math.floor(i / cols);
            win._mc = { l: win.style.left, t: win.style.top, w: win.style.width, h: win.style.height, z: win.style.zIndex };
            const scale = 0.46;
            const tw = cellW * scale, th = cellH * scale;
            win.style.transition = 'width 0.4s, height 0.4s, left 0.4s, top 0.4s, opacity 0.4s cubic-bezier(0.4,0,0.2,1)';
            win.style.left   = (padX + col * cellW + (cellW - tw)/2) + 'px';
            win.style.top    = (padY + 28 + row * cellH + (cellH - th)/2) + 'px';
            win.style.width  = tw + 'px';
            win.style.height = th + 'px';
            win.style.zIndex = 3000 + i;
        });
        document.getElementById('menu-app-name').textContent = 'Mission Control';
        wins.forEach(win => {
            if (win.style.display === 'none') return;
            win.onclick = function() {
                if (missionControlActive) { triggerMissionControl(); bringFront(win); }
            };
        });
    } else {
        document.querySelectorAll('.window').forEach(win => {
            if (!win._mc) return;
            win.style.transition = 'width 0.4s, height 0.4s, left 0.4s, top 0.4s, opacity 0.4s cubic-bezier(0.4,0,0.2,1)';
            win.style.left   = win._mc.l;
            win.style.top    = win._mc.t;
            win.style.width  = win._mc.w;
            win.style.height = win._mc.h;
            win.style.zIndex = win._mc.z;
            setTimeout(() => { win.style.transition = ''; win.onclick = null; }, 400);
            delete win._mc;
        });
    }
}

/* ==================== DRAGGABLE ==================== */
function makeDraggable(header, el) {
    header.addEventListener('mousedown', start);
    function start(e) {
        if (e.target.closest('.window-controls') || e.target.closest('.url-bar')) return;
        e.preventDefault();
        bringFront(el);
        const ox = el.offsetLeft, oy = el.offsetTop;
        const sx = e.clientX, sy = e.clientY;
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', stop);
        function move(ev) {
            let nx = ox + (ev.clientX - sx);
            let ny = oy + (ev.clientY - sy);
            if (ny < 0) ny = 0;
            el.style.left = nx + 'px';
            el.style.top  = ny + 'px';
        }
        function stop() {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', stop);
        }
    }
}

/* ==================== RESIZABLE ==================== */
function makeResizable(handle) {
    const win = document.getElementById(handle.dataset.win);
    if (!win) return;
    handle.addEventListener('mousedown', e => {
        e.preventDefault(); e.stopPropagation(); bringFront(win);
        const sx = e.clientX, sy = e.clientY;
        const sw = win.offsetWidth, sh = win.offsetHeight;
        const onMove = ev => {
            win.style.width  = Math.max(300, sw + (ev.clientX - sx)) + 'px';
            win.style.height = Math.max(200, sh + (ev.clientY - sy)) + 'px';
        };
        const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    });
}
function makeResizableLeft(handle) {
    const win = document.getElementById(handle.dataset.win);
    if (!win) return;
    handle.addEventListener('mousedown', e => {
        e.preventDefault(); e.stopPropagation(); bringFront(win);
        const sx = e.clientX, sy = e.clientY;
        const sw = win.offsetWidth, sh = win.offsetHeight, sl = win.offsetLeft;
        const onMove = ev => {
            const dx = ev.clientX - sx;
            const nw = Math.max(300, sw - dx);
            win.style.width  = nw + 'px';
            win.style.height = Math.max(200, sh + (ev.clientY - sy)) + 'px';
            win.style.left   = (sl + (sw - nw)) + 'px';
        };
        const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    });
}

/* ==================== DOCK MAGNIFICATION ==================== */
function initDock() {
    const wrapper = document.getElementById('dock-wrapper');
    const items   = document.querySelectorAll('.dock-item');
    const MAX_EXTRA = 28;
    const RANGE = 140;

    /* Apply correct initial sizes */
    applyDockSize(dockBase);

    wrapper.addEventListener('mousemove', e => {
        const BASE = dockBase;
        const MAX  = BASE + MAX_EXTRA;
        items.forEach(item => {
            const rect = item.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const dist = Math.abs(e.clientX - cx);
            let w = BASE;
            if (dist < RANGE) {
                const ratio = 1 - dist / RANGE;
                const ease  = (Math.cos(Math.PI * (1 - ratio)) + 1) / 2;
                w = BASE + (MAX - BASE) * ease;
            }
            item.style.width  = w + 'px';
            item.style.height = w + 'px';
        });
    });
    wrapper.addEventListener('mouseleave', () => {
        items.forEach(item => {
            item.style.width  = dockBase + 'px';
            item.style.height = dockBase + 'px';
        });
    });
    items.forEach(item => {
        item.addEventListener('click', () => {
            const app = item.getAttribute('data-app');
            if (app === 'trash') {
                showNotification('Trash is empty — unlike your node_modules');
                return;
            }
            if (app) toggleWindow(app);
        });
    });
}

/* Apply dock size visually (called on init and slider change) */
function applyDockSize(size) {
    size = parseInt(size);
    const artSize = Math.round(size * 0.875);
    document.querySelectorAll('.dock-item').forEach(item => {
        item.style.width  = size + 'px';
        item.style.height = size + 'px';
    });
    document.querySelectorAll('.dock-icon-art').forEach(art => {
        art.style.width  = artSize + 'px';
        art.style.height = artSize + 'px';
    });
    const dock = document.getElementById('dock');
    if (dock) dock.style.minHeight = (size + 4) + 'px';
}

/* ==================== WALLPAPER ==================== */
function setWallpaper(name, save = true) {
    const num = name.replace('img', '');
    document.body.style.background = `url('img/${num}.jpg') center/cover no-repeat`;
    document.body.style.animation  = 'none';
    if (save) localStorage.setItem('mac-wall', name);
    document.querySelectorAll('.wallpaper-opt').forEach(opt =>
        opt.classList.toggle('active', opt.dataset.wall === name)
    );
}

/* ==================== SETTINGS ==================== */
function switchSettingsPane(pane) {
    document.querySelectorAll('.settings-item').forEach(i => i.classList.toggle('active', i.dataset.pane === pane));
    document.querySelectorAll('.settings-pane').forEach(p => p.classList.add('hidden'));
    document.getElementById('pane-' + pane)?.classList.remove('hidden');
}

function setAppearanceMode(mode, btn, save = true) {
    if (btn) {
        document.querySelectorAll('.toggle-btn').forEach(b => {
            if (b.parentNode === btn.parentNode) b.classList.remove('active');
        });
        btn.classList.add('active');
    }
    if (save) localStorage.setItem('mac-appearance', mode);
    const root = document.documentElement;
    if (mode === 'light') {
        root.classList.add('light-mode');
        root.style.setProperty('--win-bg',           'rgba(245,245,247,0.92)');
        root.style.setProperty('--win-shadow',       '0 22px 70px rgba(0,0,0,0.15), 0 0 0 0.5px rgba(0,0,0,0.05)');
        root.style.setProperty('--text-primary',     'rgba(0,0,0,0.85)');
        root.style.setProperty('--text-secondary',   'rgba(0,0,0,0.55)');
        root.style.setProperty('--text-tertiary',    'rgba(0,0,0,0.35)');
        root.style.setProperty('--surface',          'rgba(0,0,0,0.04)');
        root.style.setProperty('--surface-hover',    'rgba(0,0,0,0.06)');
        root.style.setProperty('--border-subtle',    'rgba(0,0,0,0.08)');
        root.style.setProperty('--glass-bg',         'rgba(0,0,0,0.04)');
        root.style.setProperty('--glass-border',     'rgba(0,0,0,0.1)');
    } else {
        root.classList.remove('light-mode');
        root.style.setProperty('--win-bg',           'rgba(28,28,30,0.82)');
        root.style.setProperty('--win-shadow',       '0 32px 100px rgba(0,0,0,0.6), 0 8px 32px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.08)');
        root.style.setProperty('--text-primary',     'rgba(255,255,255,0.92)');
        root.style.setProperty('--text-secondary',   'rgba(255,255,255,0.55)');
        root.style.setProperty('--text-tertiary',    'rgba(255,255,255,0.35)');
        root.style.setProperty('--surface',          'rgba(255,255,255,0.06)');
        root.style.setProperty('--surface-hover',    'rgba(255,255,255,0.1)');
        root.style.setProperty('--border-subtle',    'rgba(255,255,255,0.08)');
        root.style.setProperty('--glass-bg',         'rgba(255,255,255,0.06)');
        root.style.setProperty('--glass-border',     'rgba(255,255,255,0.12)');
    }
}

function setAccentColor(color, dot, save = true) {
    document.documentElement.style.setProperty('--accent', color);
    document.querySelectorAll('.accent-dot').forEach(d => d.classList.remove('active'));
    if (dot) dot.classList.add('active');
    if (save) localStorage.setItem('mac-accent', color);
}

function setDockSize(size, save = true) {
    dockBase = parseInt(size);
    applyDockSize(dockBase);
    if (save) localStorage.setItem('mac-dock-size', dockBase);
}

function updateDevName(name) {
    const el = document.querySelector('.login-username');
    if (el) el.textContent = name || 'Guest User';
    localStorage.setItem('mac-dev-name', name || 'Guest User');
}

function restoreSettings() {
    const wall    = localStorage.getItem('mac-wall');
    const mode    = localStorage.getItem('mac-appearance') || 'dark';
    const accent  = localStorage.getItem('mac-accent')     || '#007aff';
    const dockSz  = parseInt(localStorage.getItem('mac-dock-size')  || '48');
    const devName = localStorage.getItem('mac-dev-name')   || 'SUN 🌗 :ツ';

    if (wall) setWallpaper(wall, false);
    setAppearanceMode(mode, null, false);
    document.documentElement.style.setProperty('--accent', accent);
    const accentDot = document.querySelector(`.accent-dot[style*="${accent}"]`);
    if (accentDot) accentDot.classList.add('active');
    /* Dock size */
    dockBase = dockSz;
    applyDockSize(dockSz);
    const devInput = document.getElementById('dev-name-input');
    if (devInput) devInput.value = devName;
    const lu = document.querySelector('.login-username');
    if (lu) lu.textContent = devName;
    const rangeEl = document.querySelector('.settings-range');
    if (rangeEl) rangeEl.value = dockSz;
    /* Sync appearance toggle buttons */
    document.querySelectorAll('.toggle-btn').forEach(b => {
        b.classList.toggle('active', b.textContent.trim().toLowerCase() === mode);
    });
}

/* ==================== DESKTOP FILE DOUBLE-CLICK ==================== */
function openDesktopFile(file) {
    switch(file) {
        case 'readme':      toggleWindow('window-readme');      break;
        case 'gitignore':   openGitignoreWindow();              break;
        case 'nodemodules': toggleWindow('window-nodemodules'); break;
        case 'todo':        toggleWindow('window-todo');        break;
    }
}

function openGitignoreWindow() {
    /* Reuse readme window content but with .gitignore content */
    const win = document.getElementById('window-readme');
    if (!win) return;
    if (!win.dataset.readmeTitle) {
        win.dataset.readmeTitle = win.querySelector('.header-title').textContent;
        win.dataset.readmeContent = win.querySelector('.textedit-content').innerHTML;
    }
    win.querySelector('.header-title').textContent = '.gitignore — TextEdit';
    win.querySelector('.textedit-content').innerHTML = `
        <h1 class="te-h1">⚙️ .gitignore</h1><br>
        <pre style="font-family:var(--mono);font-size:13px;color:#555;line-height:1.8">
# macOS
.DS_Store
.DS_Store?
._*

# Node
node_modules/
npm-debug.log

# Build
dist/
build/
.next/

# IDE
.vscode/settings.json
.idea/

# Environment
.env
.env.local
*.env

# Logs
*.log
logs/

# Claude Code skills (oops, already committed)
my-skill/
</pre>`;
    toggleWindow('window-readme');
}

/* ==================== NOTES SIDEBAR ==================== */
function switchNote(note, row) {
    document.querySelectorAll('.note-row').forEach(r => r.classList.remove('active'));
    document.querySelectorAll('.note-pane').forEach(p => { p.classList.remove('active-pane'); p.classList.add('hidden'); });
    row.classList.add('active');
    const pane = document.getElementById('note-' + note);
    if (pane) { pane.classList.add('active-pane'); pane.classList.remove('hidden'); }
}

/* ==================== CONTACT FORM ==================== */
function handleContactForm(e) {
    e.preventDefault();
    const form = e.target;
    const btn  = form.querySelector('.form-submit');
    btn.textContent = 'Send Message ✉️';
    btn.textContent = 'Sending…';
    btn.disabled = true;

    fetch('https://formspree.io/f/mdawoakn', {
        method:  'POST',
        headers: { 'Accept': 'application/json' },
        body:    new FormData(form),
    })
    .then(res => {
        if (res.ok) {
            btn.textContent = 'Message Sent! ✅';
            showNotification('Message sent! Sunil will reply soon 🚀');
            form.reset();
            setTimeout(() => { btn.textContent = 'Send Message ✉️'; btn.disabled = false; }, 3000);
        } else {
            return res.json().then(data => { throw new Error(data?.errors?.[0]?.message || 'Send failed'); });
        }
    })
    .catch(err => {
        btn.textContent = 'Failed — try email directly';
        btn.disabled = false;
        showNotification('Could not send — email sunilsaini5652@gmail.com directly');
        console.error('Formspree error:', err);
    });
}

/* ==================== INTERACTIVE TERMINAL ==================== */
let matrixActive  = false;
let matrixAnimId  = null;
let termHistory   = [];
let termHistIdx   = -1;

const termInput = document.getElementById('terminal-input');
if (termInput) {
    termInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const cmd = termInput.value.trim();
            if (cmd) { termHistory.unshift(cmd); termHistIdx = -1; }
            execTerminal(cmd);
            termInput.value = '';
        }
        if (e.key === 'ArrowUp')   { e.preventDefault(); termHistIdx = Math.min(termHistIdx+1, termHistory.length-1); termInput.value = termHistory[termHistIdx] || ''; }
        if (e.key === 'ArrowDown') { e.preventDefault(); termHistIdx = Math.max(termHistIdx-1, -1); termInput.value = termHistIdx === -1 ? '' : termHistory[termHistIdx]; }
        if (e.key === 'Tab')       { e.preventDefault(); handleTabComplete(termInput.value); }
        if (matrixActive && e.key) { stopMatrix(); }
        if (e.ctrlKey && e.key === 'l') { e.preventDefault(); clearTerminal(); termInput.value = ''; }
        if (e.ctrlKey && e.key === 'c') {
            e.preventDefault();
            const out = document.getElementById('terminal-output');
            const body = document.getElementById('terminal-body');
            termInput.value = '';
            const d = document.createElement('div');
            d.innerHTML = '<span style="opacity:0.5">^C</span>';
            out?.appendChild(d);
            scrollTerm(body);
        }
    });
}

const TERM_COMMANDS = {
    help:    () => `<span class="g">Available commands:</span>
  <span class="term-cmd">about</span>       — Who I am
  <span class="term-cmd">skills</span>      — My tech stack (JSON)
  <span class="term-cmd">projects</span>    — What I've built
  <span class="term-cmd">contact</span>     — How to reach me
  <span class="term-cmd">whoami</span>      — Identity
  <span class="term-cmd">neofetch</span>    — System info (aesthetic)
  <span class="term-cmd">date</span>        — Current UTC time
  <span class="term-cmd">matrix</span>      — Enter the Matrix 🟩
  <span class="term-cmd">hack</span>        — Totally hacking 💻
  <span class="term-cmd">cowsay [text]</span> — Wise words from a cow
  <span class="term-cmd">sl</span>          — 🚂 Steam locomotive
  <span class="term-cmd">weather</span>     — ASCII weather report
  <span class="term-cmd">sudo make me a sandwich</span> — Classic
  <span class="term-cmd">clear</span>       — Clear the terminal`,

    about:   () => `<span class="g">Sunil Saini</span> — Developer &amp; ML Enthusiast
  Full-stack developer focused on <span class="term-cmd">Django</span> + <span class="term-cmd">React</span>
  Building AI-powered tools and beautiful UIs
  Open to: freelance, internships, open source
  \"The best code is the code that never needed to be written\"`,

    skills:  () => `<pre>{
  "languages":  ["Python", "JavaScript", "TypeScript", "HTML/CSS"],
  "frameworks": ["React", "Next.js", "Django", "Node.js", "Express"],
  "tools":      ["Git", "Docker", "Figma", "Webpack", "Vite"],
  "databases":  ["PostgreSQL", "MongoDB", "Redis"],
  "cloud":      ["AWS", "Vercel", "Cloudflare"],
  "superpower": "Building aesthetic, buttery-smooth UIs ✨"
}</pre>`,

    projects: () => `<span class="g">My Projects:</span>
  🤖  <span class="term-cmd">AI Code Agent</span>       — Python, LLM, GPT-4
  🛒  <span class="term-cmd">E-Commerce Platform</span> — Next.js, Stripe, Prisma
  🖥️  <span class="term-cmd">This Portfolio</span>      — HTML, CSS, JS (Zero deps)
  📊  <span class="term-cmd">Analytics Dashboard</span> — React, D3.js, WebSockets

  → <a class="term-link" href="https://github.com/Sunil0620" target="_blank">github.com/Sunil0620</a>`,

    contact: () => `<span class="g">Get in touch:</span>
  📧  Email:  <a class="term-link" href="mailto:sunilsaini5652@gmail.com">sunilsaini5652@gmail.com</a>
  🐙  GitHub: <a class="term-link" href="https://github.com/Sunil0620" target="_blank">github.com/Sunil0620</a>
  ✉️  Or use the Contact window (Notes icon in dock)`,

    whoami:  () => `guest@portfolio — <span class="g">Developer &amp; ML Enthusiast</span>
  uid=1000(sunil) gid=1000(dev) groups=1000(dev),sudo,coffee-addicts`,

    date:    () => `<span class="g">${new Date().toUTCString()}</span>`,

    neofetch: () => `<pre class="g">
  ██████╗  ██████╗ ██████╗ ████████╗
  ██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝
  ██████╔╝██║   ██║██████╔╝   ██║
  ██╔═══╝ ██║   ██║██╔══██╗   ██║
  ██║     ╚██████╔╝██║  ██║   ██║
  ╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝</pre>
  <span class="term-cmd">guest</span>@<span class="g">portfolio</span>
  ──────────────────────
  <span class="b">OS:</span>      macOS Portfolio 14.0 Sonoma
  <span class="b">Host:</span>    MacBook Pro "Reality Distortion Field"
  <span class="b">Kernel:</span>  CSS3 + ES2024
  <span class="b">Uptime:</span>  Since first coffee ☕
  <span class="b">Shell:</span>   zsh (this one's fake but impressive)
  <span class="b">DE:</span>      macOS Sonoma (hand-crafted)
  <span class="b">WM:</span>      Portfolio WM (0 dependencies)
  <span class="b">Theme:</span>   Dracula [GTK3]
  <span class="b">Icons:</span>   Pure CSS Art
  <span class="b">CPU:</span>     Apple M3 Ultra Max Pro Plus
  <span class="b">Memory:</span>  128 GB / ∞ (Chrome using all of it)
  <span class="b">Disk:</span>    47.3 GB / 47.3 GB (all node_modules)`,

    clear:   () => { clearTerminal(); return null; },

    weather: () => `<pre class="b">
  ╔══════════════════════════╗
  ║  📍 Dev Cave, Earth      ║
  ║  🌙  Night  •  22°C     ║
  ║  💨  Wind: 0 mph         ║
  ║  (AC is on, as always)   ║
  ╚══════════════════════════╝
  Humidity: 100% (from the hot takes)
  Forecast: More coding, chance of bugs</pre>`,

    sl:      () => {
        doSL();
        return `<span class="term-dim">🚂 Here comes the train…</span>`;
    },
    matrix:  () => { startMatrix(); return `<span class="g">Entering the Matrix…</span><br><span class="term-dim">Press any key to exit.</span>`; },
    hack:    () => { doHack(); return `<span class="g">Initialising hack sequence…</span>`; },
    'sudo make me a sandwich': () => `<span class="g">🥪 Here you go!</span>
  <span class="term-dim">(Because you said sudo)</span>`,
    'sudo':  () => `sudo: nice try — this isn't that kind of terminal`,
    'rm -rf /': () => `<span style="color:#ff5f57">rm: refusing to remove '/' directory (thank goodness)</span>`,
    'git status': () => `On branch main
Changes not staged for commit:
  (use "git add" to stage)
  <span style="color:#ff5f57">modified:    script.js  (very modified)</span>
  <span style="color:#ff5f57">modified:    style.css  (absolutely destroyed)</span>
nothing to commit on 'main' (push it anyway)`,
    'git push': () => `Pushing to origin/main…
remote: I can't believe you actually push to main
remote: No CI/CD will save you now
To github.com:Sunil0620/Portfolio.git
   833765f..now  main -> main`,
    fortune: () => {
        const quotes = [
            '"Any fool can write code that a computer can understand. Good programmers write code that humans can understand." — Martin Fowler',
            '"First, solve the problem. Then, write the code." — John Johnson',
            '"It works on my machine." — Every developer, ever',
            '"The best error message is the one that never shows up." — Thomas Fuchs',
            '"Code is like humor. When you have to explain it, it\'s bad." — Cory House',
            '"Debugging is twice as hard as writing the code in the first place." — Brian Kernighan',
            '"In order to be irreplaceable, one must always be different." — Coco Chanel',
            '"The most disruptive thing you can do is ship." — Unknown',
        ];
        const q = quotes[Math.floor(Math.random() * quotes.length)];
        return `<span style="color:var(--maximize);font-style:italic">${q.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>`;
    },
};

function execTerminal(cmd) {
    if (!cmd) return;
    const out  = document.getElementById('terminal-output');
    const body = document.getElementById('terminal-body');

    /* Echo the command */
    const echo = document.createElement('p');
    echo.innerHTML = `<span class="g">guest@portfolio</span> <span class="b">~</span> % <span>${escHtml(cmd)}</span>`;
    out.appendChild(echo);

    /* Special cowsay */
    const cowMatch = cmd.match(/^cowsay\s+(.*)/);
    if (cowMatch) {
        const text  = escHtml(cowMatch[1]);
        const line  = '-'.repeat(text.length + 2);
        const result = document.createElement('div');
        result.innerHTML = `<pre> ${line}
| ${text} |
 ${line}
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||</pre>`;
        out.appendChild(result);
        scrollTerm(body);
        return;
    }

    const handler = TERM_COMMANDS[cmd.toLowerCase()];
    if (handler) {
        const response = handler();
        if (response !== null && response !== undefined) {
            const div = document.createElement('div');
            div.innerHTML = response;
            div.querySelectorAll('.term-link').forEach(a => { a.style.cursor = 'pointer'; });
            out.appendChild(div);
        }
    } else {
        const div = document.createElement('div');
        div.innerHTML = `<span style="color:#ff5f57">zsh: command not found: ${escHtml(cmd)}</span><br><span class="term-dim">Type <span class="term-cmd">help</span> for available commands</span>`;
        out.appendChild(div);
    }
    scrollTerm(body);
}

function clearTerminal() {
    const out = document.getElementById('terminal-output');
    if (out) out.innerHTML = '';
}
function scrollTerm(body) {
    if (body) setTimeout(() => { body.scrollTop = body.scrollHeight; }, 10);
}
function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function handleTabComplete(val) {
    if (!val) return;
    const matches = Object.keys(TERM_COMMANDS).filter(k => k.startsWith(val));
    if (matches.length === 1 && termInput) {
        termInput.value = matches[0];
    } else if (matches.length > 1) {
        const out  = document.getElementById('terminal-output');
        const body = document.getElementById('terminal-body');
        const d = document.createElement('div');
        d.innerHTML = '<span style="opacity:0.6">' + matches.join('  ') + '</span>';
        out?.appendChild(d);
        scrollTerm(body);
    }
}

/* ==================== MATRIX EFFECT ==================== */
function startMatrix() {
    matrixActive = true;
    const canvas = document.getElementById('matrix-canvas');
    if (!canvas) return;
    canvas.style.display = 'block';
    const termBody = document.getElementById('terminal-body');
    canvas.width  = termBody?.offsetWidth  || 600;
    canvas.height = termBody?.offsetHeight || 400;
    const ctx = canvas.getContext('2d');
    const cols = Math.floor(canvas.width / 16);
    const drops = Array(cols).fill(1);
    const chars  = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';

    function draw() {
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0f0'; ctx.font = '14px monospace';
        drops.forEach((y, i) => {
            const ch = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillStyle = Math.random() > 0.95 ? '#fff' : '#0f0';
            ctx.fillText(ch, i * 16, y * 16);
            if (y * 16 > canvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        });
        if (matrixActive) matrixAnimId = requestAnimationFrame(draw);
    }
    draw();
}

function stopMatrix() {
    matrixActive = false;
    cancelAnimationFrame(matrixAnimId);
    const canvas = document.getElementById('matrix-canvas');
    if (canvas) canvas.style.display = 'none';
    const out = document.getElementById('terminal-output');
    const body = document.getElementById('terminal-body');
    const p = document.createElement('p');
    p.innerHTML = `<span class="g">Exited the Matrix. Welcome back, Neo.</span>`;
    out?.appendChild(p);
    scrollTerm(body);
}

/* ==================== FAKE HACK SEQUENCE ==================== */
function doHack() {
    const out  = document.getElementById('terminal-output');
    const body = document.getElementById('terminal-body');
    const lines = [
        '<span class="g">Accessing mainframe…</span>',
        'Bypassing firewall [██████░░░░] 60%…',
        'Bypassing firewall [██████████] 100% ✓',
        '<span class="b">Decrypting RSA-2048 key…</span>',
        '> 0x7f3a9c2d1b0e4f8a…',
        '> 0x1a2b3c4d5e6f7890…',
        '<span class="g">Key decrypted ✓</span>',
        'Injecting payload into <span class="term-cmd">portfolio.js</span>…',
        'SQL DROP TABLE users; — <span style="color:#ff5f57">ERROR: table "users" doesn\'t exist (no backend)</span>',
        'Scanning for vulnerabilities…',
        '<span class="g">Vulnerabilities found: 0</span> (told you zero dependencies was a good idea)',
        '<span class="g">Access granted to: your heart 💚</span>',
        '<span class="term-dim">hack complete. just kidding, hire me instead.</span>',
    ];
    let i = 0;
    function addLine() {
        if (i >= lines.length) return;
        const div = document.createElement('div');
        div.innerHTML = lines[i++];
        out?.appendChild(div);
        scrollTerm(body);
        setTimeout(addLine, 220 + Math.random() * 180);
    }
    addLine();
}

/* ==================== ASCII TRAIN SL ==================== */
function doSL() {
    const out  = document.getElementById('terminal-output');
    const body = document.getElementById('terminal-body');
    const train = `<pre><span class="g">      ====        ________                ___________
  _D _|  |_______/        \\__I_I_____===__|_________|
   |(_)---  |   H\\________/ |   |        =|___ ___|
   /     |  |   H  |  |     |   |         ||_| |_||
  |      |  |   H  |__--------------------| [___] |
  | ________|___H__/__|_____/[][]~\\_______|       |
  |/ |   |-----------I_____I [][] []  D   |=======|__
__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__
 |/-=|___|=O=====O=====O=====O   |_____/~\\___/
  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/</span></pre>`;
    const div = document.createElement('div');
    div.innerHTML = train + `<p class="term-dim">🚂 Choo choo! (sl — the classic punishment for typing 'sl' instead of 'ls')</p>`;
    out?.appendChild(div);
    scrollTerm(body);
}

/* ==================== PARTICLES (login screen) ==================== */
(function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H;
    let mouse = { x: -9999, y: -9999, active: false };
    let prevMouse = { x: -9999, y: -9999 };
    let particles = [];
    let animId = null;
    let frame = 0;
    const COUNT = 120;
    const CONNECT_DIST = 180;
    const MOUSE_RADIUS = 220;
    const MOUSE_CONNECT_DIST = 280;
    const PALETTE = [
        {r:110,g:90,b:255},{r:0,g:210,b:255},{r:255,g:60,b:120},
        {r:255,g:160,b:40},{r:80,g:255,b:160},{r:180,g:120,b:255},
    ];

    function resize() { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; }
    function pickColor() { return PALETTE[Math.floor(Math.random() * PALETTE.length)]; }

    class Particle {
        constructor(x, y, isBurst = false) {
            this.x = x !== undefined ? x : Math.random() * W;
            this.y = y !== undefined ? y : Math.random() * H;
            this.baseR = isBurst ? Math.random() * 3 + 2 : Math.random() * 2.5 + 1;
            this.r = this.baseR;
            this.color = pickColor();
            this.pulseOffset = Math.random() * Math.PI * 2;
            this.pulseSpeed  = 0.02 + Math.random() * 0.02;
            this.life = isBurst ? 1.0 : Infinity;
            this.isBurst = isBurst;
            if (isBurst) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 8 + 3;
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed;
            } else {
                this.vx = (Math.random() - 0.5) * 0.6;
                this.vy = (Math.random() - 0.5) * 0.6;
            }
            this.alpha = isBurst ? 1.0 : Math.random() * 0.6 + 0.3;
        }
        update() {
            const dx = this.x - mouse.x, dy = this.y - mouse.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (mouse.active && dist < MOUSE_RADIUS && dist > 0) {
                const angle = Math.atan2(dy, dx);
                if (dist < 80) { const f = (80-dist)/80; this.vx += Math.cos(angle)*f*2.5; this.vy += Math.sin(angle)*f*2.5; }
                else { const f = (MOUSE_RADIUS-dist)/MOUSE_RADIUS*0.15; this.vx -= Math.cos(angle)*f; this.vy -= Math.sin(angle)*f; }
            }
            this.vx *= 0.97; this.vy *= 0.97;
            this.x += this.vx; this.y += this.vy;
            this.r = this.baseR + Math.sin(frame * this.pulseSpeed + this.pulseOffset) * 0.6;
            if (this.isBurst) { this.life -= 0.012; this.alpha = Math.max(0, this.life); this.r = this.baseR * this.life; }
            if (this.x < -30) this.x = W+20; if (this.x > W+30) this.x = -20;
            if (this.y < -30) this.y = H+20; if (this.y > H+30) this.y = -20;
        }
        draw() {
            if (this.alpha <= 0 || this.r <= 0) return;
            const {r,g,b} = this.color;
            ctx.beginPath(); ctx.arc(this.x,this.y,this.r*3,0,Math.PI*2);
            ctx.fillStyle = `rgba(${r},${g},${b},${this.alpha*0.12})`; ctx.fill();
            ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
            ctx.fillStyle = `rgba(${r},${g},${b},${this.alpha*0.85})`; ctx.fill();
            ctx.beginPath(); ctx.arc(this.x,this.y,this.r*0.4,0,Math.PI*2);
            ctx.fillStyle = `rgba(255,255,255,${this.alpha*0.7})`; ctx.fill();
        }
    }

    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            const p1 = particles[i]; if (p1.alpha <= 0) continue;
            for (let j = i+1; j < particles.length; j++) {
                const p2 = particles[j]; if (p2.alpha <= 0) continue;
                const dx = p1.x-p2.x, dy = p1.y-p2.y;
                const dist = Math.sqrt(dx*dx+dy*dy);
                if (dist < CONNECT_DIST) {
                    const s = (1 - dist/CONNECT_DIST);
                    const a = s * 0.35 * Math.min(p1.alpha, p2.alpha);
                    const grad = ctx.createLinearGradient(p1.x,p1.y,p2.x,p2.y);
                    grad.addColorStop(0, `rgba(${p1.color.r},${p1.color.g},${p1.color.b},${a})`);
                    grad.addColorStop(1, `rgba(${p2.color.r},${p2.color.g},${p2.color.b},${a})`);
                    ctx.beginPath(); ctx.moveTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y);
                    ctx.strokeStyle = grad; ctx.lineWidth = s*1.5+0.3; ctx.stroke();
                }
            }
            if (mouse.active) {
                const mdx = p1.x-mouse.x, mdy = p1.y-mouse.y;
                const md = Math.sqrt(mdx*mdx+mdy*mdy);
                if (md < MOUSE_CONNECT_DIST) {
                    const s = (1-md/MOUSE_CONNECT_DIST);
                    ctx.beginPath(); ctx.moveTo(p1.x,p1.y); ctx.lineTo(mouse.x,mouse.y);
                    ctx.strokeStyle = `rgba(${p1.color.r},${p1.color.g},${p1.color.b},${s*0.5*p1.alpha})`;
                    ctx.lineWidth = s*2; ctx.stroke();
                }
            }
        }
    }

    function drawMouseGlow() {
        if (!mouse.active) return;
        const g1 = ctx.createRadialGradient(mouse.x,mouse.y,0,mouse.x,mouse.y,100);
        g1.addColorStop(0,'rgba(110,90,255,0.15)'); g1.addColorStop(0.5,'rgba(0,210,255,0.06)'); g1.addColorStop(1,'rgba(0,0,0,0)');
        ctx.beginPath(); ctx.arc(mouse.x,mouse.y,100,0,Math.PI*2); ctx.fillStyle=g1; ctx.fill();
        const g2 = ctx.createRadialGradient(mouse.x,mouse.y,0,mouse.x,mouse.y,20);
        g2.addColorStop(0,'rgba(255,255,255,0.25)'); g2.addColorStop(1,'rgba(255,255,255,0)');
        ctx.beginPath(); ctx.arc(mouse.x,mouse.y,20,0,Math.PI*2); ctx.fillStyle=g2; ctx.fill();
    }

    function animate() {
        frame++;
        ctx.clearRect(0,0,W,H);
        particles = particles.filter(p => !p.isBurst || p.life > 0);
        particles.forEach(p => { p.update(); p.draw(); });
        drawConnections(); drawMouseGlow();
        if (mouse.active) {
            const mdx = mouse.x-prevMouse.x, mdy = mouse.y-prevMouse.y;
            const speed = Math.sqrt(mdx*mdx+mdy*mdy);
            if (speed > 8 && particles.length < 350) {
                const tp = new Particle(mouse.x+(Math.random()-0.5)*20, mouse.y+(Math.random()-0.5)*20, true);
                tp.baseR = Math.random()*1.8+0.8; tp.vx = (Math.random()-0.5)*2; tp.vy = (Math.random()-0.5)*2; tp.life = 0.6;
                particles.push(tp);
            }
        }
        prevMouse.x = mouse.x; prevMouse.y = mouse.y;
        animId = requestAnimationFrame(animate);
    }

    function start() { resize(); particles = []; for (let i=0;i<COUNT;i++) particles.push(new Particle()); animate(); }
    function stop()  { if (animId) { cancelAnimationFrame(animId); animId = null; } }

    const ls = document.getElementById('login-screen');
    if (ls) {
        ls.addEventListener('mousemove', e => { const r=canvas.getBoundingClientRect(); mouse.x=e.clientX-r.left; mouse.y=e.clientY-r.top; mouse.active=true; });
        ls.addEventListener('mouseleave', () => { mouse.x=-9999; mouse.y=-9999; mouse.active=false; });
        ls.addEventListener('click', e => {
            if (e.target.closest('.login-container') && e.target !== ls && e.target !== canvas) return;
            const r=canvas.getBoundingClientRect(); const cx=e.clientX-r.left, cy=e.clientY-r.top;
            for (let i=0;i<30;i++) { const bp = new Particle(cx,cy,true); bp.baseR=Math.random()*4+2; bp.r=bp.baseR; particles.push(bp); }
            if (particles.length > 400) particles.splice(0, particles.length-400);
        });
    }
    window.addEventListener('resize', resize);
    const observer = new MutationObserver(() => {
        const lsEl = document.getElementById('login-screen');
        if (lsEl && !lsEl.classList.contains('hidden')) { resize(); if(!animId) start(); }
        else stop();
    });
    if (ls) {
        observer.observe(ls, { attributes:true, attributeFilter:['class'] });
        if (!ls.classList.contains('hidden')) start();
        setTimeout(() => { if (ls && !ls.classList.contains('hidden')) { resize(); if(!animId) start(); } }, 2500);
    }
})();

/* ==================== MUSIC PLAYER ==================== */
let audioCtx       = null;
let musicGainNode  = null;
let musicPlaying   = false;
let musicTrackIdx  = 0;
let musicStartTime = 0;
let musicElapsed   = 0;
let musicTimer     = null;
let musicAnalyser  = null;
let vizAnimId      = null;
let currentNodes   = [];

const TRACKS = [
    { name: 'Lo-fi Coding Session', artist: "Sunil's Playlist", emoji: '🎵', duration: 180,
      notes: [261,293,329,349,392,440,493,523], tempo: 0.4, style: 'lofi' },
    { name: 'Midnight Debug',       artist: "Sunil's Playlist", emoji: '🌙', duration: 150,
      notes: [220,246,261,293,329,349,392,440], tempo: 0.35, style: 'ambient' },
    { name: 'Deploy Day',           artist: "Sunil's Playlist", emoji: '🚀', duration: 120,
      notes: [293,329,370,415,440,493,554,587], tempo: 0.25, style: 'chill' },
    { name: 'It Works™',            artist: "Sunil's Playlist", emoji: '✅', duration: 105,
      notes: [349,392,440,523,587,659,698,784], tempo: 0.45, style: 'upbeat' },
];

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    musicGainNode = audioCtx.createGain();
    musicGainNode.gain.setValueAtTime(masterVolume * 0.3, audioCtx.currentTime);
    musicAnalyser = audioCtx.createAnalyser();
    musicAnalyser.fftSize = 128;
    musicGainNode.connect(musicAnalyser);
    musicAnalyser.connect(audioCtx.destination);
}

function initMusicVisualizer() {
    if (vizAnimId) return;
    drawVisualizer();
}

function drawVisualizer() {
    const canvas = document.getElementById('music-visualizer');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.offsetWidth || 340;
    const H = canvas.height = 60;

    function frame() {
        ctx.clearRect(0, 0, W, H);
        if (musicAnalyser && musicPlaying) {
            const bufLen = musicAnalyser.frequencyBinCount;
            const data   = new Uint8Array(bufLen);
            musicAnalyser.getByteFrequencyData(data);
            const barW = (W / bufLen) * 2;
            let x = 0;
            for (let i = 0; i < bufLen; i++) {
                const barH = (data[i] / 255) * H;
                const hue  = (i / bufLen) * 280 + 200;
                ctx.fillStyle = `hsl(${hue},80%,60%)`;
                ctx.beginPath();
                ctx.roundRect(x, H - barH, barW - 1, barH, 2);
                ctx.fill();
                x += barW + 1;
            }
        } else {
            /* Idle wave */
            const t = Date.now() / 1000;
            ctx.strokeStyle = 'rgba(255,255,255,0.12)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let x2 = 0; x2 <= W; x2 += 4) {
                const y = H/2 + Math.sin(x2/40 + t) * 6 + Math.sin(x2/20 + t*1.5) * 3;
                x2 === 0 ? ctx.moveTo(x2, y) : ctx.lineTo(x2, y);
            }
            ctx.stroke();
        }
        vizAnimId = requestAnimationFrame(frame);
    }
    frame();
}

function playTrack(idx) {
    stopCurrentNodes();
    musicTrackIdx = idx;
    const track = TRACKS[idx];
    /* Update UI */
    document.getElementById('music-track').textContent  = track.name;
    document.getElementById('music-artist').textContent = track.artist;
    document.getElementById('music-art-emoji').textContent = track.emoji;
    document.getElementById('music-duration').textContent = formatTime(track.duration);
    document.querySelectorAll('.playlist-item').forEach((el, i) => el.classList.toggle('active', i === idx));
    musicElapsed = 0;
    musicPlaying = false;
    document.getElementById('music-play-btn').textContent = '▶';
    toggleMusic();
}

function toggleMusic() {
    if (!audioCtx) initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    if (musicPlaying) {
        pauseMusic();
    } else {
        startMusic();
    }
}

function startMusic() {
    musicPlaying = true;
    document.getElementById('music-play-btn').textContent = '⏸';
    musicStartTime = audioCtx.currentTime - musicElapsed;
    playAmbient();
    clearInterval(musicTimer);
    musicTimer = setInterval(updateMusicProgress, 250);
}

function pauseMusic() {
    musicPlaying = false;
    document.getElementById('music-play-btn').textContent = '▶';
    musicElapsed = audioCtx.currentTime - musicStartTime;
    stopCurrentNodes();
    clearInterval(musicTimer);
}

function stopMusic() {
    pauseMusic();
    musicElapsed = 0;
    updateMusicProgressUI(0);
    if (vizAnimId) { cancelAnimationFrame(vizAnimId); vizAnimId = null; }
}

function stopCurrentNodes() {
    currentNodes.forEach(n => { try { n.stop(); } catch(e) {} });
    currentNodes = [];
}

function playAmbient() {
    if (!audioCtx || !musicGainNode) return;
    const track  = TRACKS[musicTrackIdx];
    const notes  = track.notes;
    const tempo  = track.tempo;
    const now    = audioCtx.currentTime;
    const startOff = musicElapsed % (notes.length * tempo);

    /* Build a looping sequence using oscillators + envelopes */
    for (let rep = 0; rep < 12; rep++) {
        notes.forEach((freq, i) => {
            const t = now + (rep * notes.length + i) * tempo - startOff;
            if (t < now) return;

            const osc  = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = ['sine','triangle','sine','square'][musicTrackIdx % 4];
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.12, t + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, t + tempo * 0.85);

            osc.connect(gain); gain.connect(musicGainNode);
            osc.start(t); osc.stop(t + tempo);
            currentNodes.push(osc);
        });
    }
    /* Restart when sequence ends */
    const seqDuration = notes.length * tempo * 12 - startOff;
    setTimeout(() => { if (musicPlaying) { stopCurrentNodes(); playAmbient(); } }, seqDuration * 1000 - 200);
}

function updateMusicProgress() {
    if (!musicPlaying) return;
    musicElapsed = audioCtx.currentTime - musicStartTime;
    const track = TRACKS[musicTrackIdx];
    if (musicElapsed >= track.duration) { nextTrack(); return; }
    updateMusicProgressUI(musicElapsed / track.duration);
    document.getElementById('music-elapsed').textContent = formatTime(Math.floor(musicElapsed));
}
function updateMusicProgressUI(pct) {
    const fill  = document.getElementById('music-fill');
    const thumb = document.getElementById('music-thumb');
    if (fill)  fill.style.width  = (pct * 100) + '%';
}

function seekMusic(e) {
    const bar = document.getElementById('music-progress-bar');
    const rect = bar.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    musicElapsed = pct * TRACKS[musicTrackIdx].duration;
    if (musicPlaying) { stopCurrentNodes(); musicStartTime = audioCtx.currentTime - musicElapsed; playAmbient(); }
    updateMusicProgressUI(pct);
}

function nextTrack() { playTrack((musicTrackIdx + 1) % TRACKS.length); }
function prevTrack() { playTrack((musicTrackIdx - 1 + TRACKS.length) % TRACKS.length); }

function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2,'0')}`;
}

/* ==================== VS CODE CLONE ==================== */
function buildVSCode() {
    const container = document.getElementById('vscode-code');
    if (!container || container.innerHTML.trim()) return;

    const snippet = [
        ['/* macOS Portfolio — script.js v2 */', 'cmt'],
        ['', ''],
        ["'use strict';", 'str'],
        ['', ''],
        ['let zIndex = 100;', 'var'],
        ['let locked = true;', 'var'],
        ['let missionControlActive = false;', 'var'],
        ['', ''],
        ['/* Boot Sequence */', 'cmt'],
        ['document.addEventListener(', 'fn'],
        ["  'DOMContentLoaded', () => {", 'str'],
        ['  const bootFill = document.getElementById(', 'kw'],
        ["    'boot-fill');", 'str'],
        ['  let progress = 0;', 'var'],
        ['', ''],
        ['  const bootInterval = setInterval(() => {', 'kw'],
        ['    progress += Math.random() * 7 + 2;', 'num'],
        ['    if (progress >= 100) {', 'kw'],
        ['      clearInterval(bootInterval);', 'fn'],
        ['      /* Transition to login */', 'cmt'],
        ['      bootScreen.classList.add(', 'fn'],
        ["        'hidden');", 'str'],
        ['    }', 'punc'],
        ['    bootFill.style.width = progress + \'%\';', 'var'],
        ['  }, 130);', 'num'],
        ['', ''],
        ['/* Music Player (Web Audio API) */', 'cmt'],
        ['function playAmbient() {', 'fn'],
        ['  const osc = audioCtx', 'var'],
        ['    .createOscillator();', 'fn'],
        ["  osc.type = 'sine';", 'str'],
        ['  const gain = audioCtx.createGain();', 'var'],
        ['  gain.gain.setValueAtTime(0.12, t);', 'num'],
        ['  osc.connect(gain);', 'fn'],
        ['  gain.connect(musicGainNode);', 'fn'],
        ['  osc.start(t); osc.stop(t + tempo);', 'fn'],
        ['}', 'punc'],
        ['', ''],
        ['/* Matrix Effect */', 'cmt'],
        ['function startMatrix() {', 'fn'],
        ["  const chars = 'アイウエオ0123456789';", 'str'],
        ['  const drops = Array(cols).fill(1);', 'fn'],
        ['  ctx.fillStyle = \'#0f0\';', 'str'],
        ['  ctx.font = \'14px monospace\';', 'str'],
        ['}', 'punc'],
        ['', ''],
        ['/* Zero Dependencies. Pure JS. */', 'cmt'],
        ["// 'How did you make this?' — Everyone", 'cmt'],
    ];

    const colorMap = {
        cmt: 'syn-cmt', str: 'syn-str', fn: 'syn-fn',
        kw: 'syn-kw', var: 'syn-var', num: 'syn-num', punc: 'syn-punc',
    };

    container.innerHTML = snippet.map(([text, type], i) => {
        const cls = colorMap[type] || '';
        const safe = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        return `<div class="code-line">
            <span class="line-num">${i + 1}</span>
            <span class="code-content ${cls}">${safe || '&nbsp;'}</span>
        </div>`;
    }).join('');
}

/* ==================== RESTORE SETTINGS ==================== */
// (already called in DOMContentLoaded above)
