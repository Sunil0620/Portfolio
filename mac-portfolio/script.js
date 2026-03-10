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
        const inInput = ['INPUT','TEXTAREA'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
        if ((e.key === ' ' && !inInput) || e.key === 'F4') { e.preventDefault(); toggleSpotlight(); return; }
        if (e.key === 'F3') { e.preventDefault(); triggerMissionControl(); return; }
        if (isMeta && e.key === 's') {
            e.preventDefault();
            const dirtyDots = document.querySelectorAll('.vsc-dirty');
            let hadDirty = false;
            dirtyDots.forEach(d => { if (d.style.display !== 'none') hadDirty = true; d.style.display = 'none'; });
            showNotification(hadDirty ? '💾 script.js — saved' : '💾 All files up to date');
            return;
        }
        if (isMeta && e.key === 'q') { e.preventDefault(); lockScreen(); return; }
        if (!inInput && e.key >= '1' && e.key <= '6') {
            e.preventDefault();
            const wins = ['window-about','window-projects','window-skills','window-contact','window-music','window-vscode'];
            toggleWindow(wins[parseInt(e.key) - 1]);
            return;
        }
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

    /* Dynamic notes date */
    const notesDateEl = document.getElementById('notes-current-date');
    if (notesDateEl) {
        const nd = new Date();
        notesDateEl.textContent = nd.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    /* Tab visibility easter egg */
    document.addEventListener('visibilitychange', () => {
        document.title = document.hidden
            ? '👀 Come back...'
            : 'Portfolio — macOS Sonoma';
    });

    /* Desktop click ripple */
    document.addEventListener('click', e => {
        if (locked) return;
        if (e.target.closest('.window') || e.target.closest('#dock-wrapper') || e.target.closest('#menu-bar')) return;
        const r = document.createElement('div');
        r.className = 'click-ripple';
        r.style.left = e.clientX + 'px';
        r.style.top  = e.clientY + 'px';
        document.body.appendChild(r);
        r.addEventListener('animationend', () => r.remove());
    });

});

/* ==================== KONAMI CODE EASTER EGG ==================== */
(function initKonami() {
    const seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let idx = 0;
    document.addEventListener('keydown', e => {
        if (e.key === seq[idx]) { idx++; } else { idx = e.key === seq[0] ? 1 : 0; }
        if (idx === seq.length) {
            idx = 0;
            toggleWindow('window-skills');
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
let _saverClockIv = null;

function activateScreensaver() {
    if (locked) return;
    const ss = document.getElementById('screen-saver');
    if (!ss) return;
    ss.classList.remove('hidden');
    startSaverAnimation();
    _updateSaverClock();
    _saverClockIv = setInterval(_updateSaverClock, 1000);

    function dismiss(e) {
        if (e) e.preventDefault();
        ss.removeEventListener('click', dismiss);
        document.removeEventListener('keydown', dismiss);
        cancelAnimationFrame(saverAnimId);
        clearInterval(_saverClockIv);
        ss.style.opacity = '0';
        setTimeout(() => { ss.classList.add('hidden'); ss.style.opacity = ''; resetIdleTimer(); }, 520);
    }
    ss.addEventListener('click', dismiss);
    document.addEventListener('keydown', dismiss);
}

function _updateSaverClock() {
    const now = new Date();
    const te = document.getElementById('saver-time');
    const de = document.getElementById('saver-date');
    if (te) te.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    if (de) de.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function startSaverAnimation() {
    const canvas = document.getElementById('saver-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const W = canvas.width, H = canvas.height;

    // ── Star field ──
    const stars = Array.from({ length: 200 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.1 + 0.15,
        a: Math.random() * 0.55 + 0.1,
        phase: Math.random() * Math.PI * 2,
        spd:   Math.random() * 0.012 + 0.004,
    }));

    // ── Aurora layers: [r,g,b, wavespeed, frequency, yCenter%, amplitude%, ribbonHeight%, peak-alpha] ──
    const LAYERS = [
        { r:0,   g:220, b:185, spd:0.00055, freq:0.0022, yR:0.46, amp:0.10, ht:0.24, al:0.58 },
        { r:90,  g:40,  b:255, spd:0.00080, freq:0.0030, yR:0.42, amp:0.12, ht:0.22, al:0.46 },
        { r:0,   g:145, b:255, spd:0.00042, freq:0.0037, yR:0.52, amp:0.09, ht:0.18, al:0.38 },
        { r:190, g:25,  b:255, spd:0.00095, freq:0.0026, yR:0.40, amp:0.11, ht:0.25, al:0.34 },
        { r:15,  g:255, b:130, spd:0.00060, freq:0.0018, yR:0.50, amp:0.08, ht:0.16, al:0.28 },
    ];

    let frame = 0;

    function drawLayer(l) {
        const yBase  = l.yR * H;
        const ribbonH = l.ht * H;

        // Compute sine-wave spine
        const pts = [];
        for (let x = 0; x <= W; x += 5) {
            const y = yBase
                + Math.sin(x * l.freq          + frame * l.spd * 55) * l.amp * H
                + Math.sin(x * l.freq * 1.85   + frame * l.spd * 37 + 1.3) * l.amp * H * 0.38;
            pts.push({ x, y });
        }

        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        // Upper ribbon (above spine)
        ctx.beginPath();
        pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y - ribbonH) : ctx.lineTo(p.x, p.y - ribbonH));
        for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.closePath();
        const gU = ctx.createLinearGradient(0, yBase - ribbonH, 0, yBase);
        gU.addColorStop(0,   `rgba(${l.r},${l.g},${l.b},0)`);
        gU.addColorStop(0.45,`rgba(${l.r},${l.g},${l.b},${l.al})`);
        gU.addColorStop(1,   `rgba(${l.r},${l.g},${l.b},${l.al * 0.55})`);
        ctx.fillStyle = gU;
        ctx.fill();

        // Lower tail (below spine, shorter)
        ctx.beginPath();
        pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i].x, pts[i].y + ribbonH * 0.38);
        ctx.closePath();
        const gD = ctx.createLinearGradient(0, yBase, 0, yBase + ribbonH * 0.38);
        gD.addColorStop(0, `rgba(${l.r},${l.g},${l.b},${l.al * 0.55})`);
        gD.addColorStop(1, `rgba(${l.r},${l.g},${l.b},0)`);
        ctx.fillStyle = gD;
        ctx.fill();

        ctx.restore();
    }

    function draw() {
        frame++;

        // Deep-space background — full clear each frame (crisp, no trails)
        ctx.fillStyle = '#03040a';
        ctx.fillRect(0, 0, W, H);

        // Stars
        stars.forEach(s => {
            s.phase += s.spd;
            const a = s.a * (0.55 + 0.45 * Math.sin(s.phase));
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`;
            ctx.fill();
        });

        // Aurora
        LAYERS.forEach(drawLayer);

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
    setTimeout(() => showNotification('Welcome! Explore via dock or Space for Spotlight'), 1200);
    resetIdleTimer();
    initVisitorMemory();
    _initConsole();
    _initPresence();
    _initKernelPanic();
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
    if (localStorage.getItem('mac-dev-mode') === '1') {
        showNotification('🔒 Appearance is locked in developer mode');
        return;
    }
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
    if (ytPlayer && ytReady) ytPlayer.setVolume(masterVolume * 100);
}

/* ==================== WIFI TOGGLE ==================== */
let wifiOn = true;
function ccToggleWifi() {
    wifiOn = !wifiOn;
    const tile = document.getElementById('cc-wifi-tile');
    const sub  = tile?.querySelector('.cc-tile-sub');
    if (tile)  tile.classList.toggle('active', wifiOn);
    if (sub)   sub.textContent = wifiOn ? 'Connected' : 'Off';
    showNotification(wifiOn ? 'Wi-Fi: Connected to Portfolio_Network' : 'Wi-Fi: Turned off');
}

/* ==================== TEXTEDIT TOOLBAR ==================== */
function teSetFont(font) {
    const el = document.querySelector('.textedit-content');
    if (el) el.style.fontFamily = font === 'Menlo' ? "'Menlo','Monaco',monospace" : "'Inter',system-ui,sans-serif";
}
function teSetSize(size) {
    const el = document.querySelector('.textedit-content');
    if (el) el.style.fontSize = size + 'px';
}

/* ==================== VSCODE TAB CLOSE ==================== */
function vscodeCloseTab(type) {
    const tab = document.getElementById('vstab-' + type);
    if (tab) tab.style.display = 'none';
    const exp = document.getElementById('vsexp-' + type);
    if (exp) exp.style.opacity = '0.4';
    /* Switch to another visible tab */
    const order = ['js','css','html'];
    const next = order.find(t => t !== type && document.getElementById('vstab-'+t)?.style.display !== 'none');
    if (next) { vscodeOpenFile(next); }
    else {
        const code = document.getElementById('vscode-code');
        if (code) code.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-tertiary);font-size:13px;">No files open — click a file in the explorer</div>';
    }
    showNotification('Closed ' + type + ' tab');
}

/* ==================== VSCODE DEBUG TABS ==================== */
function vscodeDebugTab(tabName, el) {
    document.querySelectorAll('.vscode-debug-tab').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');
    const log = document.getElementById('vscode-debug-log');
    if (!log) return;
    if (tabName === 'PROBLEMS') {
        log.innerHTML = '<div style="padding:8px 12px;font-size:12px;color:var(--text-tertiary);">No problems detected</div>';
    } else if (tabName === 'OUTPUT') {
        log.innerHTML = '<div style="padding:8px 12px;font-size:12px;color:#30d158;">[Output] Portfolio build successful · 0 errors</div>';
    } else {
        /* CONSOLE — re-run debug */
        runVscodeDebug();
    }
}

/* ==================== NPM INFO TOAST ==================== */
const _npmData = {
    'react': { desc:'A declarative UI library by Meta.', dep: 'react-dom, scheduler', size:'50 KB' },
    'webpack': { desc:'Module bundler for modern JS apps.', dep:'acorn, tapable, watchpack', size:'5.2 MB' },
    'babel-core': { desc:'JS transpiler — write future JS today.', dep:'@babel/core, browse-rs', size:'3.1 MB' },
    'lodash': { desc:'Utility library delivering consistency.', dep:'none', size:'531 KB' },
    'express': { desc:'Fast, unopinionated web framework.', dep:'path-to-regexp, cookie', size:'210 KB' },
    'left-pad': { desc:'Pads the left side of strings. Once broke the internet.', dep:'none', size:'4 KB' },
    'is-odd': { desc:'Returns true if a number is odd. Seriously.', dep:'is-number', size:'3 KB' },
    'is-even': { desc:'Returns true if a number is even. Uses is-odd internally.', dep:'is-odd', size:'2 KB' },
    'is-string': { desc:'Checks if a value is a string.', dep:'has-tostringtag', size:'4 KB' },
    'is-boolean': { desc:'Checks if a value is a boolean.', dep:'none', size:'2 KB' },
    'assert-never': { desc:'TypeScript exhaustiveness checking helper.', dep:'none', size:'1 KB' },
};
function showNpmInfo(el) {
    const pkg = el.textContent.replace('📦 ', '').trim();
    const name = pkg.split('@')[0];
    const info = _npmData[name] || { desc: 'A dependency of a dependency of a dependency.', dep: 'unknown', size: '???' };
    showNotification(`📦 ${pkg}: ${info.desc}`);
}

/* ==================== NOTIFICATION CENTER ==================== */
function toggleNotifCenter() {
    const nc = document.getElementById('notif-center');
    const cc = document.getElementById('control-center');
    cc.classList.add('hidden');
    nc.classList.toggle('hidden');
    if (!nc.classList.contains('hidden')) fetchGitHubActivity();
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

/* Open Spotlight pre-filled with a query (from tag clicks) */
function openSpotlightWithQuery(query) {
    const sl = document.getElementById('spotlight');
    const input = document.getElementById('spotlight-input');
    if (!sl || !input) return;
    sl.classList.remove('hidden');
    sl.style.animation = '';
    input.value = query;
    renderSpotlightResults(query);
    setTimeout(() => input.focus(), 50);
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
    _trackVisitedWindow(win.id);
    _spikePresence(18);
    _consoleLog('ws','info',`Application activated: ${win.id} [${win.style.left}, ${win.style.top}]`);
    if (win.id === 'window-console' && !win._consoleGreeted) {
        win._consoleGreeted = true;
        setTimeout(() => {
            _consoleLog('human','warn','HumanInteraction: non-automated click pattern detected');
            _consoleLog('human','warn','Visitor classification: developer | curiosity_score: HIGH');
        }, 600);
    }
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
    if (win.id === 'window-trash') _setTrashLid(true);
    if (win.id === 'window-about') {
        setTimeout(() => {
            win.querySelectorAll('.skill-bar-fill[data-width]').forEach(bar => {
                bar.style.width = '0%';
                setTimeout(() => { bar.style.width = bar.dataset.width + '%'; }, 50);
            });
        }, 80);
    }
    if (win.id === 'window-vscode') {
        buildVSCode();
        setTimeout(() => {
            ['js','css','html'].forEach(t => {
                const d = document.getElementById('vsdirty-' + t);
                const tab = document.getElementById('vstab-' + t);
                if (d && tab && tab.style.display !== 'none') d.style.display = 'inline';
            });
        }, 4000);
    }
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
    if (id === 'window-trash') _setTrashLid(false);
    _consoleLog('ws','info',`Window closed: ${id}`);
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
    if (id === 'window-trash') _setTrashLid(false);
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
    document.querySelectorAll('.window').forEach(w => {
        if (w.style.display !== 'none' && !w.classList.contains('minimized')) {
            minimizeWindow(w.id);
        }
    });
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
    header.addEventListener('dblclick', e => {
        if (e.target.closest('.window-controls') || e.target.closest('.url-bar')) return;
        minimizeWindow(el.id);
    });
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
                const tw = document.getElementById('window-trash');
                if (!tw || tw.style.display === 'none') resetTrash();
                toggleWindow('window-trash');
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
    if (save && localStorage.getItem('mac-dev-mode') === '1') {
        showNotification('🔒 Wallpaper is locked in developer mode');
        return;
    }
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
    if (save && localStorage.getItem('mac-dev-mode') === '1') {
        showNotification('🔒 Appearance is locked in developer mode');
        return;
    }
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
        root.style.setProperty('--win-bg',           'rgba(248,248,255,0.55)');
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
        root.style.setProperty('--win-bg',           'rgba(28,28,38,0.45)');
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
    if (save && localStorage.getItem('mac-dev-mode') === '1') {
        showNotification('🔒 Accent color is locked in developer mode');
        return;
    }
    document.documentElement.style.setProperty('--accent', color);
    document.querySelectorAll('.accent-dot').forEach(d => d.classList.remove('active'));
    if (dot) dot.classList.add('active');
    if (save) localStorage.setItem('mac-accent', color);
}

function setDockSize(size, save = true) {
    if (save && localStorage.getItem('mac-dev-mode') === '1') {
        showNotification('🔒 Dock size is locked in developer mode');
        return;
    }
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

/* ==================== FINDER SIDEBAR SECTIONS ==================== */
let _finderHomeContent = null;
function switchFinderSection(section, rowEl) {
    document.querySelectorAll('#window-about .sidebar-item').forEach(r => r.classList.remove('active'));
    if (rowEl) rowEl.classList.add('active');
    const main = document.querySelector('#window-about .finder-main');
    if (!main) return;
    if (!_finderHomeContent) _finderHomeContent = main.innerHTML;

    const sections = {
        home: _finderHomeContent,
        documents: `
            <p class="notes-date">Documents</p>
            <h2 style="font-size:18px;margin-bottom:16px;">📁 ~/Documents</h2>
            <div style="display:flex;flex-direction:column;gap:8px;">
                <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--surface);border-radius:8px;cursor:pointer;" onclick="window.open('assets/Sunil-Saini-Resume.pdf','_blank')">
                    <span style="font-size:28px;">📄</span>
                    <div><strong>Sunil-Saini-Resume.pdf</strong><br><small style="color:var(--text-secondary)">PDF · 142 KB · Click to open</small></div>
                </div>
                <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--surface);border-radius:8px;">
                    <span style="font-size:28px;">📋</span>
                    <div><strong>skills.json</strong><br><small style="color:var(--text-secondary)">JSON · 2 KB · Tech stack</small></div>
                </div>
                <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--surface);border-radius:8px;">
                    <span style="font-size:28px;">📝</span>
                    <div><strong>cover-letter-template.docx</strong><br><small style="color:var(--text-secondary)">Word · 18 KB</small></div>
                </div>
                <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--surface);border-radius:8px;">
                    <span style="font-size:28px;">🗄️</span>
                    <div><strong>portfolio-notes.md</strong><br><small style="color:var(--text-secondary)">Markdown · 6 KB</small></div>
                </div>
            </div>`,
        downloads: `
            <p class="notes-date">Downloads</p>
            <h2 style="font-size:18px;margin-bottom:16px;">📥 ~/Downloads</h2>
            <div style="display:flex;flex-direction:column;gap:8px;">
                <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--surface);border-radius:8px;">
                    <span style="font-size:28px;">🗜️</span>
                    <div><strong>portfolio-source.zip</strong><br><small style="color:var(--text-secondary)">ZIP · 1.2 MB · Today</small></div>
                </div>
                <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--surface);border-radius:8px;">
                    <span style="font-size:28px;">🖼️</span>
                    <div><strong>screenshots.tar.gz</strong><br><small style="color:var(--text-secondary)">Archive · 4.8 MB · Yesterday</small></div>
                </div>
                <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--surface);border-radius:8px;">
                    <span style="font-size:28px;">📦</span>
                    <div><strong>node_modules-backup.tar</strong><br><small style="color:var(--text-secondary)">Archive · 47.3 GB · (Please delete)</small></div>
                </div>
            </div>`,
        work: `
            <p class="notes-date">Work Experience</p>
            <h2 style="font-size:18px;margin-bottom:16px;">💼 Experience</h2>
            <div style="display:flex;flex-direction:column;gap:14px;">
                <div style="padding:14px;background:var(--surface);border-radius:10px;border-left:3px solid var(--accent);">
                    <strong>Full-Stack Developer</strong> <span style="color:var(--text-tertiary);font-size:12px;float:right">2023 — present</span>
                    <p style="color:var(--text-secondary);font-size:13px;margin-top:4px;">Building Django + React applications. ML/AI integrations with GPT-4.</p>
                    <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">
                        <span style="background:var(--accent);color:#fff;padding:2px 8px;border-radius:20px;font-size:11px;">Django</span>
                        <span style="background:var(--accent);color:#fff;padding:2px 8px;border-radius:20px;font-size:11px;">React</span>
                        <span style="background:var(--accent);color:#fff;padding:2px 8px;border-radius:20px;font-size:11px;">Python</span>
                    </div>
                </div>
                <div style="padding:14px;background:var(--surface);border-radius:10px;border-left:3px solid #30d158;">
                    <strong>Open to Work</strong>
                    <p style="color:var(--text-secondary);font-size:13px;margin-top:4px;">Actively seeking freelance, internship and full-time opportunities.</p>
                    <a href="mailto:sunilsaini5652@gmail.com" style="color:var(--accent);font-size:13px;text-decoration:none;display:block;margin-top:8px;">📧 sunilsaini5652@gmail.com</a>
                </div>
            </div>`,
        opensource: `
            <p class="notes-date">Open Source</p>
            <h2 style="font-size:18px;margin-bottom:16px;">🐙 github.com/Sunil0620</h2>
            <div style="display:flex;flex-direction:column;gap:10px;">
                <div style="padding:14px;background:var(--surface);border-radius:10px;" onclick="window.open('https://github.com/Sunil0620/Portfolio','_blank')" style="cursor:pointer">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <strong>🖥️ Portfolio</strong>
                        <span style="font-size:11px;color:var(--text-tertiary)">★ Public</span>
                    </div>
                    <p style="color:var(--text-secondary);font-size:13px;margin-top:4px;">macOS Sonoma-style portfolio — zero dependencies.</p>
                    <div style="margin-top:6px;display:flex;gap:6px;">
                        <span style="font-size:11px;color:var(--text-tertiary)">HTML · CSS · JS</span>
                    </div>
                </div>
                <div style="padding:14px;background:var(--surface);border-radius:10px;" onclick="window.open('https://github.com/Sunil0620','_blank')" style="cursor:pointer">
                    <strong>View all repositories →</strong>
                    <p style="color:var(--text-secondary);font-size:13px;margin-top:4px;">github.com/Sunil0620</p>
                </div>
            </div>`,
    };

    main.innerHTML = sections[section] || sections.home;
    /* Re-init skill bar animations for home */
    if (section === 'home') {
        main.querySelectorAll('.skill-bar-fill[data-width]').forEach(bar => {
            const w = bar.dataset.width;
            bar.style.width = '0%';
            setTimeout(() => { bar.style.width = w + '%'; }, 50);
        });
    }
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
            launchConfetti();
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
    help:    () => {
        const isRoot = localStorage.getItem('mac-dev-mode') === '1';
        return `<span class="g">Available commands:</span>
  <span class="term-cmd">about</span>       — Who I am
  <span class="term-cmd">skills</span>      — My tech stack (JSON)
  <span class="term-cmd">projects</span>    — What I've built
  <span class="term-cmd">contact</span>     — How to reach me
  <span class="term-cmd">date</span>        — Current UTC time
  <span class="term-cmd">matrix</span>      — Enter the Matrix 🟩
  <span class="term-cmd">hack</span>        — Totally hacking 💻
  <span class="term-cmd">cowsay [text]</span> — Wise words from a cow
  <span class="term-cmd">sl</span>          — 🚂 Steam locomotive
  <span class="term-cmd">weather</span>     — ASCII weather report
  <span class="term-cmd">stats</span>       — Session statistics
  <span class="term-cmd">snake</span>       — Launch 🐍 Snake game
  <span class="term-cmd">linkedin</span>    — Open LinkedIn profile
  <span class="term-cmd">resume</span>      — Download resume
  <span class="term-cmd">hire</span>        — Why hire me?
  <span class="term-cmd">sudo make me a sandwich</span> — Classic
  <span style="color:#ff453a" class="term-cmd">sudo rm -rf /</span> — ⚠️ Don't.
  <span class="term-cmd">clear</span>       — Clear the terminal
${isRoot
    ? `<span style="color:#00ff41;font-weight:600">  [ ROOT — UNLOCKED ]</span>
  <span class="term-cmd" style="color:#00ff41">breach</span>      — 💀 Full hack experience
  <span class="term-cmd" style="color:#ff6b6b">classified</span>  — Classified project list
  <span class="term-cmd" style="color:#ff6b6b">devlog</span>      — Raw build diary
  <span class="term-cmd" style="color:#ff6b6b">secrets</span>     — Things I shouldn't share
  <span class="term-cmd" style="color:#636366">logout</span>      — Exit developer mode`
    : ''}`;
    },
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
    stats: () => {
        const timeEl = document.getElementById('stat-time');
        const appsEl = document.getElementById('stat-apps');
        const cmdsEl = document.getElementById('stat-cmds');
        const t = timeEl ? timeEl.textContent : '0s';
        const a = appsEl ? appsEl.textContent : '0';
        const c = cmdsEl ? cmdsEl.textContent : '0';
        return `<span class="g">Session Stats:</span>
  ⏱  Time on desktop:  <strong>${t}</strong>
  📂  Apps opened:      <strong>${a}</strong>
  💻  Commands run:     <strong>${c}</strong>`;
    },
    snake: () => { toggleWindow('window-snake'); return '<span class="g">🐍 Launching Snake Game…</span>'; },
    linkedin: () => { window.open('https://www.linkedin.com/in/sunil-saini-6190ba255/','_blank'); return '<span class="g">Opening LinkedIn…</span>'; },
    resume: () => { window.open('https://sunil0620.github.io/Portfolio/','_blank'); return '<span class="g">Opening portfolio / resume…</span>'; },
    hire: () => `<span class="g">Why hire Sunil?</span>
  ✅  Full-stack: Django + React + Next.js
  ✅  ML/AI experience — GPT-4 integrations, RAG systems
  ✅  Ships fast, writes clean, explains clearly
  ✅  Zero-dependency portfolio built from scratch
  ✅  Problem solver, not just a code writer
  → Email: <a class="term-link" href="mailto:sunilsaini5652@gmail.com">sunilsaini5652@gmail.com</a>`,

    /* ── Dev-mode only commands ── */
    classified: () => localStorage.getItem('mac-dev-mode') !== '1'
        ? `<span style="color:#ff453a">zsh: Permission denied — developer mode required</span>`
        : `<span style="color:#ff6b6b;font-weight:700">[ CLASSIFIED — AUTHORIZED ACCESS ]</span>
  <span class="g">Real Projects (not shown publicly):</span>
  🤖  LLM-powered code review bot — catches bugs before PRs merge
  🔐  Internal auth service — JWT + refresh token rotation at scale
  📊  Realtime analytics pipeline — Kafka + ClickHouse, 50k events/min
  🧬  ML anomaly detector — flags prod incidents before alerts fire
  🌐  Edge deployment system — zero-downtime deploys across 12 regions
  <span class="term-dim">Repos are private. Ask me in an interview.</span>`,

    devlog: () => localStorage.getItem('mac-dev-mode') !== '1'
        ? `<span style="color:#ff453a">zsh: Permission denied — developer mode required</span>`
        : `<span class="g">== RAW BUILD LOG ==</span>
  <span class="term-dim">commit a1b2c3  "init: simple portfolio page"</span>
  <span class="term-dim">commit d4e5f6  "feat: add boot screen (1hr becomes 3hr)"</span>
  <span class="term-dim">commit 7g8h9i  "fix: boot screen now skippable on return visit"</span>
  <span class="term-dim">commit j0k1l2  "feat: music player (youtube embeds, what could go wrong)"</span>
  <span class="term-dim">commit m3n4o5  "fix: track 2 not playing (it was an array, not a string)"</span>
  <span class="term-dim">commit p6q7r8  "feat: vs code clone + terminal + spotlight"</span>
  <span class="term-dim">commit s9t0u1  "feat: kernel panic easter egg (4hrs, 0 regrets)"</span>
  <span class="term-dim">commit v2w3x4  "feat: you are here"</span>
  <span style="color:#ffd60a">Total commits: 47  |  Total hours: don't ask  |  Regrets: none</span>`,

    secrets: () => localStorage.getItem('mac-dev-mode') !== '1'
        ? `<span style="color:#ff453a">zsh: Permission denied — developer mode required</span>`
        : `<span style="color:#bf5af2">== SECRETS ==</span>
  The screensaver clock font is Inter weight 200. Took 2 hours to pick.
  The trash can lid animation pivot point took 45 minutes to get right.
  "Presence engine" CPU % is completely fake. It's a random drift function.
  There are ${Object.keys(TERM_COMMANDS).length} terminal commands. You found the hidden ones.
  The boot sequence can be skipped on return visits (localStorage 'mac-visited').
  Konami code detection buffer is cleared on every keydown. Naturally.
  This portfolio has more lines of code than some production apps I've seen.`,

    'sudo rm -rf /': () => {
        setTimeout(_doRmRf, 80);
        return `<span style="color:#ff453a;font-weight:700">sudo: executing rm -rf / — you were warned.</span>`;
    },

    sudo: (args) => localStorage.getItem('mac-dev-mode') !== '1'
        ? `<span style="color:#ff453a">sudo: command not found in guest mode</span>`
        : `<span class="g">root access confirmed.</span> What did you want to sudo?
  <span class="term-dim">Try: breach, classified, devlog, secrets</span>`,

    breach: () => {
        if (localStorage.getItem('mac-dev-mode') !== '1')
            return `<span style="color:#ff453a">zsh: permission denied: breach</span><br><span class="term-dim">Trigger the easter egg first.</span>`;
        /* Run the live breach animation into the terminal output */
        setTimeout(() => {
            const out  = document.getElementById('terminal-output');
            const body = document.getElementById('terminal-body');
            if (!out) return;
            const seq = [
                { d:0,    c:'#ff453a', t:'INITIATING BREACH PROTOCOL...' },
                { d:200,  c:'#00ff41', t:'[>>>] Scanning open ports ... 22 80 443 8080 ✓' },
                { d:450,  c:'#00ff41', t:'[>>>] Bypassing firewall ... spoofing MAC addr' },
                { d:700,  c:'#ffd60a', t:'[!!!] Rate limit detected — rotating proxies' },
                { d:980,  c:'#00ff41', t:'[>>>] Proxy chain: TOR → VPN → SOCKS5 → localhost' },
                { d:1250, c:'#00ff41', t:'[>>>] Injecting payload into /dev/null ...' },
                { d:1520, c:'#00ff41', t:'[>>>] Extracting RSA private key ... 4096-bit' },
                { d:1800, c:'#ffd60a', t:'[!!!] Anomaly detected in memory segment 0x4200' },
                { d:2100, c:'#00ff41', t:'[>>>] Patching kernel — writing to /proc/sys/kernel' },
                { d:2380, c:'#00ff41', t:'[>>>] Installing backdoor on port 1337 ...' },
                { d:2650, c:'#ff453a', t:'[!!!] ALERT: Intrusion detection triggered!' },
                { d:2800, c:'#ffd60a', t:'[>>>] Suppressing IDS alerts ... done' },
                { d:3050, c:'#00ff41', t:'[>>>] Exfiltrating data ... 0 bytes (nothing to steal)' },
                { d:3300, c:'#00ff41', t:'[>>>] Covering tracks — wiping logs ...' },
                { d:3550, c:'#00ff41', t:'████████████████████ 100% — BREACH COMPLETE' },
                { d:3900, c:'#636366', t:'────────────────────────────────────────────────────' },
                { d:4100, c:'#ffd60a', t:'// Actual status: nothing was hacked. This is a portfolio.' },
                { d:4350, c:'#636366', t:'// No systems were harmed in the making of this easter egg.' },
                { d:4600, c:'#00ff41', t:'// You just watched a very convincing fake. Nice.' },
                { d:4900, c:'#bf5af2', t:'// P.S: Hire the dev who built this. sunilsaini5652@gmail.com' },
            ];
            seq.forEach(({ d, c, t }) => {
                setTimeout(() => {
                    const p = document.createElement('p');
                    p.innerHTML = `<span style="color:${c};font-family:var(--mono)">${t}</span>`;
                    out.appendChild(p);
                    if (body) body.scrollTop = body.scrollHeight;
                }, d);
            });
        }, 80);
        return `<span style="color:#ff453a;font-weight:700">💀 BREACH INITIATED — stand by...</span>`;
    },

    logout() {
        const isRoot = localStorage.getItem('mac-dev-mode') === '1';
        if (!isRoot) {
            return `<span class="r">logout: not in developer mode</span>`;
        }
        _exitDevMode();
        return '';
    },

    dev: () => {
        if (localStorage.getItem('mac-dev-mode') === '1')
            return `<span class="term-dim">Already in developer mode.</span>`;
        localStorage.setItem('mac-dev-mode', '1');
        _applyDevMode(true);
        return '';
    },
};

function _exitDevMode() {
    // Visual farewell in terminal before wiping state
    const out  = document.getElementById('terminal-output');
    const body = document.getElementById('terminal-body');
    const lines = [
        { d:0,   c:'#ff453a', t:'[LOGOUT] Terminating root session...' },
        { d:300, c:'#ffd60a', t:'[  >>  ] Removing dev-mode class...' },
        { d:600, c:'#ffd60a', t:'[  >>  ] Clearing developer credentials...' },
        { d:900, c:'#00ff41', t:'[  OK  ] Session closed. Goodbye, root.' },
        { d:1100,c:'#636366', t:'────────────────────────────────────────────────────' },
    ];
    if (out) {
        lines.forEach(({ d, c, t }) => {
            setTimeout(() => {
                const p = document.createElement('p');
                p.innerHTML = `<span style="color:${c};font-family:var(--mono)">${t}</span>`;
                out.appendChild(p);
                if (body) body.scrollTop = body.scrollHeight;
            }, d);
        });
    }
    setTimeout(() => {
        localStorage.removeItem('mac-dev-mode');
        document.documentElement.classList.remove('dev-mode');
        /* Restore Linux prompt to guest/zsh */
        const pu = document.getElementById('term-prompt-user');
        const ps = document.getElementById('term-prompt-sym');
        const tt = document.getElementById('terminal-header-title');
        if (pu) { pu.textContent = 'guest@portfolio'; pu.className = 'g'; }
        if (ps) ps.textContent = '%';
        if (tt) tt.textContent = 'guest@portfolio — zsh';
        // Hide the classified dock item
        document.querySelectorAll('.dev-mode-item').forEach(el => el.style.display = 'none');
        // Close devnotes window if open
        const dn = document.getElementById('window-devnotes');
        if (dn && dn.style.display !== 'none') closeWindow('window-devnotes');
        showNotification('👋 Developer mode deactivated');
        _consoleLog('kernel','warn','Root session terminated — developer mode disabled');
    }, 1400);
}

function _doRmRf() {
    const out  = document.getElementById('terminal-output');
    const body = document.getElementById('terminal-body');

    /* Phase 1 — rapid file deletion log */
    const files = [
        '/bin/bash', '/bin/ls', '/bin/sh', '/usr/bin/python3',
        '/usr/bin/node', '/usr/lib/x86_64-linux-gnu/libc.so.6',
        '/etc/passwd', '/etc/shadow', '/etc/hosts', '/etc/fstab',
        '/var/log/syslog', '/var/log/auth.log', '/home/root/.ssh/id_rsa',
        '/usr/share/fonts', '/usr/lib/systemd/systemd',
        '/lib/modules/6.1.0-portfolio1', '/proc/1/exe',
        '/tmp/portfolio.lock', '/dev/sda1',
        '... [removing 47,821 more files]',
        '... [filesystem corruption detected]',
        '... [cannot remove running kernel — skipping]',
    ];
    files.forEach((f, i) => {
        setTimeout(() => {
            const p = document.createElement('p');
            p.innerHTML = `<span style="color:#ff453a;font-size:11px">removed '${f}'</span>`;
            if (out) { out.appendChild(p); if (body) body.scrollTop = body.scrollHeight; }
        }, i * 90);
    });

    const base = files.length * 90 + 400;

    /* Phase 2 — windows fall off screen one by one */
    setTimeout(() => {
        const wins = [...document.querySelectorAll('.window')];
        wins.forEach((w, i) => {
            setTimeout(() => {
                w.style.transition = 'all 0.5s cubic-bezier(0.4,0,1,1)';
                w.style.opacity    = '0';
                w.style.transform  = (w.style.transform||'') + ' scale(0.75) translateY(40px)';
                setTimeout(() => { w.style.display = 'none'; }, 500);
            }, i * 220);
        });
    }, base);

    /* Phase 3 — dock slides down */
    setTimeout(() => {
        const dock = document.getElementById('dock');
        if (dock) {
            dock.style.transition = 'transform 0.9s ease-in, opacity 0.9s';
            dock.style.transform  = 'translateX(-50%) translateY(140px)';
            dock.style.opacity    = '0';
        }
    }, base + 1300);

    /* Phase 4 — menu bar slides up */
    setTimeout(() => {
        const mb = document.getElementById('menu-bar');
        if (mb) {
            mb.style.transition = 'transform 0.6s ease-in, opacity 0.6s';
            mb.style.transform  = 'translateY(-50px)';
            mb.style.opacity    = '0';
        }
    }, base + 1900);

    /* Phase 5 — screen goes black */
    setTimeout(() => {
        document.body.style.transition  = 'background 1.2s';
        document.body.style.background  = '#000';
        document.body.style.animation   = 'none';
        const desktop = document.getElementById('desktop');
        if (desktop) { desktop.style.transition = 'background 1.2s'; desktop.style.background = '#000'; }
    }, base + 2500);

    /* Phase 6 — KERNEL PANIC overlay with countdown */
    setTimeout(() => {
        const ov = document.createElement('div');
        ov.style.cssText = 'position:fixed;inset:0;background:#000;z-index:99999;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;padding:40px 60px;font-family:monospace;font-size:12px;color:#ddd;gap:4px;line-height:1.8';
        ov.innerHTML = `
<span style="color:#ddd">panic(cpu 0 caller 0xffffff802b4f): <span style="color:#ff453a">Attempted to kill init!</span></span>
<span style="color:#ddd">Debugger called: &lt;panic&gt;</span>
<span style="color:#ddd">Backtrace (CPU 0)</span>
<span style="color:#ddd">&nbsp;&nbsp;frame #0: 0xffffff8020b3a1e0 machine_halt + 0x18</span>
<span style="color:#ddd">&nbsp;&nbsp;frame #1: 0xffffff8020c94f30 panic + 0x15c</span>
<span style="color:#ddd">&nbsp;&nbsp;frame #2: 0xffffff802b4f&nbsp;&nbsp;&nbsp;&nbsp; do_exit + 0xa8c</span>
<span style="color:#ddd">&nbsp;&nbsp;frame #3: 0xdeadbeef&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span style="color:#ff453a">rm_rf_root_was_a_bad_idea + 0x40</span></span>
<span style="color:#636366">&nbsp;</span>
<span style="color:#ddd">BSD process name corresponding to current thread: <span style="color:#ff453a">rm</span></span>
<span style="color:#ddd">Boot args: rootdev=disk0 rd=*uuid</span>
<span style="color:#636366">&nbsp;</span>
<span style="color:#ffd60a" id="_rmrf_status">System rebooting in 5...</span>`;
        document.body.appendChild(ov);

        let cnt = 5;
        const iv = setInterval(() => {
            cnt--;
            const el = document.getElementById('_rmrf_status');
            if (el) el.textContent = cnt > 0
                ? `System rebooting in ${cnt}...`
                : 'Rebooting now...';
            if (cnt <= 0) { clearInterval(iv); setTimeout(() => location.reload(), 800); }
        }, 1000);
    }, base + 3800);
}

function menuLogout() {
    if (localStorage.getItem('mac-dev-mode') === '1') {
        _exitDevMode();
    } else {
        showNotification('Not in developer mode');
    }
}

function execTerminal(cmd) {
    if (!cmd) return;
    const isRoot = localStorage.getItem('mac-dev-mode') === '1';
    const user   = isRoot ? 'root@portfolio' : 'guest@portfolio';
    _consoleLog('terminal','info',`${user} ~ % ${cmd}`);
    const out  = document.getElementById('terminal-output');
    const body = document.getElementById('terminal-body');

    /* Echo the command */
    const echo = document.createElement('p');
    const userClass = isRoot ? 'terminal-prompt-user' : 'g';
    const sym = isRoot ? '#' : '$';
    echo.innerHTML = `<span class="${userClass}">${user}</span> <span class="b">~</span> ${sym} <span>${escHtml(cmd)}</span>`;
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

/* ==================== MUSIC PLAYER (YouTube IFrame API) ==================== */

const TRACKS = [
    { ytId: 'UNjhqT_hlbg', name: 'Chala Jata Hoon',       artist: 'Kishore Kumar',      film: 'Mere Jeevan Saathi (1972)',     emoji: '🚶', duration: 265 },
    { ytId: 'RVeLrwoB_xw', name: 'Mere Sapno Ki Rani', artist: 'Kishore Kumar', film: 'Aradhana (1969)', emoji: '🚂', duration: 301 },
    { ytId: '1GUXATqIkxs', name: 'Likhe Jo Khat Tujhe',   artist: 'Mohammed Rafi',      film: 'Kanyadaan (1968)',              emoji: '💌', duration: 271 },
    { ytId: 'l7GR1S-HNGo', name: 'Ajeeb Dastan Hai Yeh',  artist: 'Lata Mangeshkar',    film: 'Dil Apna Preet Parayi (1960)', emoji: '✨', duration: 248 },
    { ytId: 'mfEQgoVi7P4', name: 'Abhi Na Jao Chhod Kar', artist: 'Mohammed Rafi & Asha Bhosle', film: 'Hum Dono (1961)',      emoji: '💫', duration: 272 },
    { ytId: '3wAnXhoCBXQ', name: 'Lag Ja Gale',           artist: 'Lata Mangeshkar',    film: 'Woh Kaun Thi (1964)',           emoji: '🌹', duration: 267 },
    { ytId: 'jWrQLYTVw5A', name: 'Kuch Toh Log Kahenge',  artist: 'Kishore Kumar',      film: 'Amar Prem (1972)',              emoji: '🌙', duration: 296 },
    { ytId: 'Ys3HtMHWuTc', name: 'Baharon Phool Barsao',  artist: 'Mohammed Rafi',      film: 'Suraj (1966)',                  emoji: '🌸', duration: 303 },
    { ytId: 'aRghXKLFlgo', name: 'Teri Aankhon Ke Siva',  artist: 'Mohammed Rafi',      film: 'Chirag (1969)',                 emoji: '👁️', duration: 256 },
    { ytId: 'QLwkAjJT864', name: 'Dil Ke Jharokhe Mein',  artist: 'Mohammed Rafi',      film: 'Brahmachari (1968)',            emoji: '🎶', duration: 252 },
];

let ytPlayer     = null;
let ytReady      = false;
let musicPlaying = false;
let musicTrackIdx = 0;
let musicTimer   = null;
let vizAnimId    = null;
let skipCount    = 0;

// ── Player factory — called by queue when YouTube API is ready ──
function _createYtPlayer() {
    const pageOrigin = (window.location.origin && window.location.origin !== 'null')
        ? window.location.origin : 'http://localhost';
    ytPlayer = new YT.Player('yt-iframe', {
        height: '200', width: '200',
        playerVars: {
            autoplay: 0, controls: 0, disablekb: 1,
            fs: 0, iv_load_policy: 3, modestbranding: 1,
            rel: 0, playsinline: 1, origin: pageOrigin,
        },
        events: {
            onReady: function() {
                ytReady = true;
            },
            onStateChange: function(e) {
                if (e.data === YT.PlayerState.ENDED) {
                    skipCount = 0;
                    nextTrack();
                } else if (e.data === YT.PlayerState.PLAYING) {
                    skipCount = 0;
                    /* ── Ad detection: getAdState() is undocumented but reliable ──
                       Returns 1 while a pre-roll ad is running, 0/-1 for real video */
                    if (typeof ytPlayer.getAdState === 'function' && ytPlayer.getAdState() === 1) {
                        document.getElementById('music-track').textContent  = '📺 Ad playing…';
                        document.getElementById('music-artist').textContent = 'Music starts shortly';
                        return; /* Don't update progress bar / play state yet */
                    }
                    musicPlaying = true;
                    document.getElementById('music-play-btn').textContent = '⏸';
                    const dur = Math.floor(ytPlayer.getDuration() || 0);
                    if (dur > 0) {
                        TRACKS[musicTrackIdx].duration = dur;
                        document.getElementById('music-duration').textContent = formatTime(dur);
                    }
                    /* Restore track name in case ad message was showing */
                    document.getElementById('music-track').textContent  = TRACKS[musicTrackIdx].name;
                    document.getElementById('music-artist').textContent = TRACKS[musicTrackIdx].artist;
                    clearInterval(musicTimer);
                    musicTimer = setInterval(updateMusicProgress, 250);
                } else if (e.data === YT.PlayerState.PAUSED) {
                    musicPlaying = false;
                    document.getElementById('music-play-btn').textContent = '▶';
                    clearInterval(musicTimer);
                }
            },
            onError: function() {
                skipCount++;
                if (skipCount >= TRACKS.length) {
                    skipCount = 0;
                    musicPlaying = false;
                    document.getElementById('music-play-btn').textContent = '▶';
                    document.getElementById('music-track').textContent  = 'Cannot load music';
                    document.getElementById('music-artist').textContent =
                        window.location.protocol === 'file:'
                            ? 'Run via localhost (python3 -m http.server)'
                            : 'All tracks blocked by YouTube';
                    return;
                }
                setTimeout(nextTrack, 600);
            }
        }
    });
}

// If YouTube API already fired (cached script) — run now; otherwise queue it
if (window._ytLoaded) {
    _createYtPlayer();
} else {
    window._ytQueue = window._ytQueue || [];
    window._ytQueue.push(_createYtPlayer);
}

function initAudio() { /* no-op — YouTube handles audio */ }
function stopCurrentNodes() { /* no-op */ }

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
    const BARS = 36;
    // Randomised per-bar phase + speed so each bar moves independently
    const phase = Array.from({length: BARS}, () => Math.random() * Math.PI * 2);
    const speed = Array.from({length: BARS}, () => 0.6 + Math.random() * 2.2);
    const base  = Array.from({length: BARS}, () => 6  + Math.random() * 22);

    function frame() {
        ctx.clearRect(0, 0, W, H);
        const t  = Date.now() / 1000;
        const bW = W / BARS - 1;
        for (let i = 0; i < BARS; i++) {
            const energy = musicPlaying
                ? 0.3 + 0.7 * Math.abs(Math.sin(t * speed[i] + phase[i]))
                : 0.06 + 0.04 * Math.abs(Math.sin(t * 0.5 + phase[i]));
            const h   = Math.max(2, base[i] * energy);
            const hue = (i / BARS) * 280 + 200;
            ctx.fillStyle = musicPlaying
                ? `hsl(${hue},80%,60%)`
                : 'rgba(255,255,255,0.12)';
            const x = i * (bW + 1);
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(x, H - h, bW, h, 2);
            else ctx.rect(x, H - h, bW, h);
            ctx.fill();
        }
        vizAnimId = requestAnimationFrame(frame);
    }
    frame();
}

function playTrack(idx) {
    musicTrackIdx = idx;
    const track = TRACKS[idx];
    _trackVisitedTrack(track.name);
    _consoleLog('music','info',`Now playing: "${track.name}" — ${track.artist} · ${track.film}`);

    // Update all UI
    document.getElementById('music-track').textContent    = track.name;
    document.getElementById('music-artist').textContent   = track.artist + ' · ' + track.film;
    document.getElementById('music-art-emoji').textContent = track.emoji;
    document.getElementById('music-duration').textContent = formatTime(track.duration);
    document.getElementById('music-elapsed').textContent  = '0:00';
    updateMusicProgressUI(0);
    document.querySelectorAll('.playlist-item').forEach((el, i) =>
        el.classList.toggle('active', i === idx));

    if (!ytReady || !ytPlayer) return;

    // Use direct video ID for deterministic playback.
    if (track.ytId) {
        ytPlayer.loadVideoById(track.ytId);
    } else {
        setTimeout(nextTrack, 300);
        return;
    }
    document.getElementById('music-play-btn').textContent = '⏸';
}

function toggleMusic() {
    if (!ytReady || !ytPlayer) {
        // Player not ready yet — show loading and poll every 300 ms
        const btn = document.getElementById('music-play-btn');
        if (btn) btn.textContent = '⏳';
        const poll = setInterval(function() {
            if (ytReady && ytPlayer) {
                clearInterval(poll);
                playTrack(musicTrackIdx);
            }
        }, 300);
        return;
    }
    const state = ytPlayer.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
        ytPlayer.pauseVideo();
    } else if (state === YT.PlayerState.PAUSED) {
        ytPlayer.playVideo();
    } else {
        playTrack(musicTrackIdx);
    }
}

function startMusic() {
    if (ytPlayer && ytReady) ytPlayer.playVideo();
}

function pauseMusic() {
    if (ytPlayer && ytReady) ytPlayer.pauseVideo();
    musicPlaying = false;
    document.getElementById('music-play-btn').textContent = '▶';
    clearInterval(musicTimer);
}

function stopMusic() {
    if (ytPlayer && ytReady) ytPlayer.stopVideo();
    musicPlaying = false;
    document.getElementById('music-play-btn').textContent = '▶';
    clearInterval(musicTimer);
    updateMusicProgressUI(0);
    document.getElementById('music-elapsed').textContent = '0:00';
    if (vizAnimId) { cancelAnimationFrame(vizAnimId); vizAnimId = null; }
}

function updateMusicProgress() {
    if (!ytPlayer || !ytReady || !musicPlaying) return;
    const elapsed = ytPlayer.getCurrentTime()  || 0;
    const total   = ytPlayer.getDuration()     || TRACKS[musicTrackIdx].duration;
    if (total > 0) updateMusicProgressUI(elapsed / total);
    document.getElementById('music-elapsed').textContent = formatTime(Math.floor(elapsed));
}

function updateMusicProgressUI(pct) {
    const fill = document.getElementById('music-fill');
    if (fill) fill.style.width = (pct * 100) + '%';
}

function seekMusic(e) {
    const bar  = document.getElementById('music-progress-bar');
    const rect = bar.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (ytPlayer && ytReady) {
        const total = ytPlayer.getDuration() || TRACKS[musicTrackIdx].duration;
        ytPlayer.seekTo(pct * total, true);
    }
    updateMusicProgressUI(pct);
}

function nextTrack() { playTrack((musicTrackIdx + 1) % TRACKS.length); }
function prevTrack() { playTrack((musicTrackIdx - 1 + TRACKS.length) % TRACKS.length); }

function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ==================== VS CODE CLONE ==================== */
function buildVSCode() {
    const container = document.getElementById('vscode-code');
    if (!container) return;
    if (!container.dataset.vsinit) {
        container.dataset.vsinit = '1';
        vscodeOpenFile('js');
    }
    setTimeout(runVscodeDebug, 500);
}

/* ==================== VSCODE SIDEBAR SWITCHER ==================== */
function switchVscodeSidebar(panel, iconEl) {
    document.querySelectorAll('#window-vscode .vscode-sidebar-icon').forEach(i => i.classList.remove('active'));
    if (iconEl) iconEl.classList.add('active');
    ['explorer','search','git','ext'].forEach(p => {
        const el = document.getElementById('vscode-panel-' + p);
        if (el) el.style.display = p === panel ? '' : 'none';
    });
}

/* ==================== VSCODE FILE SWITCHER ==================== */
function vscodeOpenFile(type) {
    const names = {js:'script.js', css:'style.css', html:'index.html'};
    const langs = {js:'JavaScript', css:'CSS', html:'HTML'};
    /* Restore tab if it was closed */
    const tabEl = document.getElementById('vstab-' + type);
    if (tabEl && tabEl.style.display === 'none') {
        tabEl.style.display = '';
        const expEl = document.getElementById('vsexp-' + type);
        if (expEl) expEl.style.opacity = '';
    }
    ['js','css','html'].forEach(t => {
        const ex = document.getElementById('vsexp-'+t);
        const tb = document.getElementById('vstab-'+t);
        if (ex) ex.classList.toggle('active', t===type);
        if (tb) tb.classList.toggle('active', t===type);
    });
    const titleEl = document.querySelector('.vscode-title');
    if (titleEl) titleEl.textContent = names[type]+' — Portfolio — Visual Studio Code';
    const sbRight = document.getElementById('vsc-sb-right');
    if (sbRight) sbRight.textContent = 'Ln 1, Col 1 \u00a0|\u00a0 '+langs[type]+' \u00a0|\u00a0 UTF-8';
    const codeEl = document.getElementById('vscode-code');
    if (!codeEl) return;
    codeEl.innerHTML = '<div class="code-line"><span class="line-num">1</span><span class="code-content syn-cmt">// Loading '+names[type]+'…</span></div>';
    fetch(names[type])
        .then(r => r.ok ? r.text() : Promise.reject())
        .then(text => _vsRender(codeEl, text, type))
        .catch(() => _vsRenderFallback(codeEl, type));
}

function _vsColorJS(s) {
    const t = s.trimStart();
    if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return '<span class="syn-cmt">'+s+'</span>';
    return s
        .replace(/('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`[^`]*`)/g, '<span class="syn-str">$1</span>')
        .replace(/\b(const|let|var|function|return|if|else|for|while|class|new|typeof|try|catch|async|await|of|in|switch|case|break|import|export|default|this)\b/g, '<span class="syn-kw">$1</span>')
        .replace(/\b(true|false|null|undefined)\b/g, '<span class="syn-bool">$1</span>')
        .replace(/\b(\d+\.?\d*)\b/g, '<span class="syn-num">$1</span>')
        .replace(/\b([A-Za-z_$][A-Za-z0-9_$]*)(?=\s*\()/g, '<span class="syn-fn">$1</span>');
}
function _vsColorCSS(s) {
    const t = s.trimStart();
    if (t.startsWith('/*') || t.startsWith('*')) return '<span class="syn-cmt">'+s+'</span>';
    if (/^[.#@a-zA-Z:[]/.test(t)) return '<span class="syn-cls">'+s+'</span>';
    return s
        .replace(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/g, '<span class="syn-num">$1</span>')
        .replace(/^(\s*)([\w-]+)(\s*:)/g, '$1<span class="syn-var">$2</span>$3');
}
function _vsColorHTML(s) {
    return s
        .replace(/(&lt;\/?[a-zA-Z][^&gt;]*&gt;)/g, '<span class="syn-kw">$1</span>')
        .replace(/\b([a-z-]+)(?==)/g, '<span class="syn-var">$1</span>')
        .replace(/("(?:[^"]*)")/g, '<span class="syn-str">$1</span>');
}
function _vsRender(el, text, type) {
    const colorFn = type==='js'?_vsColorJS:type==='css'?_vsColorCSS:_vsColorHTML;
    const lines = text.split('\n').slice(0, 500);
    el.innerHTML = lines.map((line, i) => {
        const safe = line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        return '<div class="code-line"><span class="line-num">'+(i+1)+'</span><span class="code-content">'+
            (colorFn(safe)||'&nbsp;')+'</span></div>';
    }).join('');
    const sbLeft = document.getElementById('vsc-sb-left');
    if (sbLeft) sbLeft.innerHTML = '⎇ main &nbsp;|&nbsp; 0 errors &nbsp;|&nbsp; 0 warnings &nbsp;|&nbsp; '+lines.length+' lines';
}
function _vsRenderFallback(el, type) {
    const fallbacks = {
        js:  [['/* macOS Portfolio — script.js */','cmt'],["'use strict';",'str'],['',''],['let zIndex = 100;','var'],['let locked = true;','var'],['',''],['/* Boot Sequence */','cmt'],['document.addEventListener(','fn'],[" 'DOMContentLoaded', () => {",'str'],['  const boot = document.getElementById(','kw'],["    'boot-fill');",'str'],['  let progress = 0;','var'],['',''],['  const iv = setInterval(() => {','kw'],['    progress += Math.random() * 7 + 2;','num'],['    if (progress >= 100) clearInterval(iv);','kw'],['    bootFill.style.width = progress + \'%\';','var'],['  }, 130);','num'],['',''],['/* Zero Dependencies. Pure JS. */','cmt'],["// 'How did you make this?' — Everyone",'cmt']],
        css: [['/* macOS Portfolio — style.css */','cmt'],['',''],['* { box-sizing: border-box; margin: 0; }','cls'],['',''],['body {','cls'],['  background: #1c1c1e;','num'],["  font-family: -apple-system, 'SF Pro Display';",'str'],['  color: rgba(255,255,255,0.85);','num'],['  overflow: hidden;','var'],['}','punc'],['',''],['/* Window system */','cmt'],['.window {','cls'],['  backdrop-filter: blur(40px) saturate(180%);','var'],['  border-radius: 12px;','num'],['  border: 0.5px solid rgba(255,255,255,0.1);','num'],['}','punc']],
        html:[['&lt;!DOCTYPE html&gt;','kw'],['&lt;html lang="en"&gt;','kw'],['&lt;head&gt;','kw'],["  &lt;meta charset='UTF-8'&gt;",'kw'],['  &lt;title&gt;Sunil Saini — Portfolio&lt;/title&gt;','kw'],['  &lt;link rel="stylesheet" href="style.css"&gt;','kw'],['&lt;/head&gt;','kw'],['&lt;body&gt;','kw'],['',''],['  &lt;!-- Boot Screen --&gt;','cmt'],['  &lt;div id="boot-screen"&gt;','kw'],['    &lt;div id="boot-fill"&gt;&lt;/div&gt;','kw'],['  &lt;/div&gt;','kw'],['',''],['  &lt;!-- Desktop --&gt;','cmt'],['  &lt;div id="desktop"&gt;','kw'],['    &lt;div id="windows-container"&gt;&lt;/div&gt;','kw'],['  &lt;/div&gt;','kw'],['&lt;/body&gt;','kw']],
    };
    const colorMap = {cmt:'syn-cmt',str:'syn-str',fn:'syn-fn',kw:'syn-kw',var:'syn-var',num:'syn-num',punc:'syn-punc',cls:'syn-cls'};
    const snippet = fallbacks[type] || fallbacks.js;
    el.innerHTML = snippet.map(([text, t], i) => {
        const cls = colorMap[t] || '';
        return '<div class="code-line"><span class="line-num">'+(i+1)+'</span><span class="code-content '+cls+'">'+(text||'&nbsp;')+'</span></div>';
    }).join('');
}

/* ==================== VSCODE SELF-DIAGNOSTICS ==================== */
function runVscodeDebug() {
    const log = document.getElementById('vscode-debug-log');
    if (!log) return;
    log.innerHTML = '';
    const sbLeft = document.getElementById('vsc-sb-left');
    const steps = [
        [0,    'info', '> Portfolio Diagnostics v2.1 — Starting…'],
        [350,  'info', '  Scanning DOM structure…'],
        [750,  'ok',   '  ✓ 47 elements validated, 0 detached nodes'],
        [1050, 'info', '  Checking CSS keyframes…'],
        [1400, 'ok',   '  ✓ 14 animations healthy'],
        [1700, 'info', '  Auditing Web Audio graph…'],
        [2100, 'ok',   '  ✓ AudioContext nodes clean'],
        [2450, 'warn', '  ⚠  warn: Snake high-score cache may be stale'],
        [2750, 'warn', '  ⚠  warn: Battery interval drift +2ms detected'],
        [3150, 'info', '  Auto-patch applying…'],
        [3550, 'ok',   '  ✓ Fixed: Score cache refreshed'],
        [3850, 'ok',   '  ✓ Fixed: Battery interval recalibrated'],
        [4250, 'info', '  Fetching GitHub activity…'],
        [4700, 'ok',   '  ✓ Commits loaded from github.com/Sunil0620'],
        [5050, 'info', '  Running final checks…'],
        [5350, 'ok',   '  ✓ localStorage valid (7 keys)'],
        [5650, 'ok',   '  ✓ All systems operational 🟢'],
    ];
    const colors = {info:'rgba(255,255,255,0.45)', ok:'#30d158', warn:'#ffd60a', err:'#ff453a'};
    steps.forEach(([delay, type, msg]) => {
        setTimeout(() => {
            const div = document.createElement('div');
            div.className = 'vscode-log-line';
            div.style.color = colors[type] || colors.info;
            div.textContent = msg;
            log.appendChild(div);
            log.scrollTop = log.scrollHeight;
            if (type==='warn' && sbLeft && !sbLeft.dataset.warned) { sbLeft.dataset.warned='1'; sbLeft.innerHTML='⎇ main &nbsp;|&nbsp; 0 errors &nbsp;|&nbsp; 2 warnings'; }
            if (delay>=3800 && sbLeft) { delete sbLeft.dataset.warned; sbLeft.innerHTML='⎇ main &nbsp;|&nbsp; 0 errors &nbsp;|&nbsp; 0 warnings'; }
        }, delay);
    });
}

/* ==================== GITHUB ACTIVITY ==================== */
function fetchGitHubActivity() {
    const list = document.getElementById('nc-github-list');
    if (!list || list.dataset.loaded) return;
    list.dataset.loaded = '1';
    fetch('https://api.github.com/users/Sunil0620/events?per_page=10')
        .then(r => r.json())
        .then(events => {
            const pushes = events.filter(e => e.type==='PushEvent').slice(0, 5);
            if (!pushes.length) throw new Error('none');
            list.innerHTML = pushes.map(e => {
                const commit = e.payload.commits && e.payload.commits[e.payload.commits.length-1];
                const msg = commit ? commit.message.split('\n')[0].slice(0,60) : 'Pushed commits';
                const repo = e.repo.name.replace('Sunil0620/', '');
                const ago = _ghTimeAgo(new Date(e.created_at));
                return '<div class="nc-card" style="cursor:pointer" onclick="window.open(\'https://github.com/'+e.repo.name+'\',\'_blank\')">'
                    +'<div class="nc-card-header"><span class="nc-app-icon">🐙</span>'
                    +'<span class="nc-app-name">GitHub — '+repo+'</span>'
                    +'<span class="nc-time">'+ago+'</span></div>'
                    +'<div class="nc-card-body">'+msg+'</div></div>';
            }).join('');
        })
        .catch(() => {
            list.dataset.loaded = '';
            list.innerHTML = '<div class="nc-card" style="cursor:pointer" onclick="window.open(\'https://github.com/Sunil0620\',\'_blank\')">'
                +'<div class="nc-card-header"><span class="nc-app-icon">🐙</span>'
                +'<span class="nc-app-name">GitHub</span>'
                +'<span class="nc-time">recent</span></div>'
                +'<div class="nc-card-body">Latest work @ github.com/Sunil0620ⓓ</div></div>';
        });
}
function _ghTimeAgo(date) {
    const s = Math.floor((Date.now()-date)/1000);
    if (s<60) return s+'s ago';
    if (s<3600) return Math.floor(s/60)+'m ago';
    if (s<86400) return Math.floor(s/3600)+'h ago';
    return Math.floor(s/86400)+'d ago';
}

/* ==================== RESTORE SETTINGS ==================== */
// (already called in DOMContentLoaded above)

/* ==================== MOBILE COMPANION ==================== */
(function initMobileCompanion() {
    const isMobile = window.innerWidth < 1024;
    if (!isMobile) return;

    /* Update mobile status bar time */
    function updateMobTime() {
        const el = document.getElementById('mob-time');
        if (el) {
            const now = new Date();
            el.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        }
    }
    updateMobTime();
    setInterval(updateMobTime, 30000);

    /* Add smooth entrance animations */
    const sections = document.querySelectorAll('.mob-section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    sections.forEach((section, i) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(24px)';
        section.style.transition = `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s`;
        observer.observe(section);
    });

    /* Animate hero on load */
    const hero = document.querySelector('.mob-hero');
    if (hero) {
        hero.style.opacity = '0';
        hero.style.transform = 'translateY(20px)';
        hero.style.transition = 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s';
        setTimeout(() => {
            hero.style.opacity = '1';
            hero.style.transform = 'translateY(0)';
        }, 100);
    }
})();

/* ==================== IMPROVED WALLPAPER TRANSITION ==================== */
(function improveWallpaper() {
    /* Pre-load wallpaper images for smoother transitions */
    const wallImages = ['img/1.jpg','img/2.jpg','img/3.jpg','img/4.jpg','img/5.jpg','img/6.jpg'];
    wallImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });
})();

/* ==================== FEATURE PACK ==================== */
(function featurePack() {
    'use strict';

    /* ─── 1. SESSION STATS ─── */
    const _t0 = Date.now();
    let _apps = 0, _cmds = 0;
    window.incrementAppsOpened  = function() { _apps++; const e=document.getElementById('stat-apps');  if(e) e.textContent=_apps; };
    window.incrementCommandsRun = function() { _cmds++; const e=document.getElementById('stat-cmds');  if(e) e.textContent=_cmds; };
    setInterval(function() {
        const s=Math.floor((Date.now()-_t0)/1000), m=Math.floor(s/60);
        const e=document.getElementById('stat-time');
        if(e) e.textContent = m>0 ? m+'m '+(s%60)+'s' : s+'s';
    }, 1000);

    /* ─── 2. BATTERY SIMULATION ─── */
    let _batt = parseInt(localStorage.getItem('mac-battery')||'87');
    const _battEl = () => document.getElementById('battery-pct');
    const _battDraw = () => { const e=_battEl(); if(e){ e.textContent=_batt+'%'; e.style.color=_batt<=15?'#ff453a':_batt<=30?'#ff9f0a':''; } };
    _battDraw();
    setInterval(function() {
        if (_batt > 5) _batt--;
        if (_batt === 20 && !sessionStorage.getItem('batt-warned')) {
            sessionStorage.setItem('batt-warned','1');
            if (window.showNotification) window.showNotification('Battery Low','20% remaining — plug in soon.');
        }
        localStorage.setItem('mac-battery', _batt);
        _battDraw();
    }, 90000);

    /* ─── 3. WINDOW STATE MEMORY ─── */
    function _save(win) {
        if (!win||!win.id) return;
        try { localStorage.setItem('ws-'+win.id, JSON.stringify({l:win.style.left,t:win.style.top,w:win.style.width,h:win.style.height})); } catch(e){}
    }
    function _load(win) {
        if (!win||!win.id) return;
        try { const s=JSON.parse(localStorage.getItem('ws-'+win.id)||'null'); if(!s)return; if(s.l)win.style.left=s.l; if(s.t)win.style.top=s.t; const minW=parseInt(win.dataset.minw)||0,minH=parseInt(win.dataset.minh)||0; if(s.w&&(!minW||parseInt(s.w)>=minW)) win.style.width=s.w; if(s.h&&(!minH||parseInt(s.h)>=minH)) win.style.height=s.h; } catch(e){}
    }
    document.addEventListener('mouseup', function() {
        document.querySelectorAll('.window').forEach(function(w){ if(w.style.display!=='none') _save(w); });
    }, {passive:true});

    /* ─── 4. PATCH CORE FUNCTIONS ─── */
    const _oOpen = window.openWindow;
    if (typeof _oOpen==='function') window.openWindow = function(win) { _load(win); if(window.incrementAppsOpened) incrementAppsOpened(); if(window.playWindowOpenSound) playWindowOpenSound(); return _oOpen.call(this,win); };

    const _oClose = window.closeWindow;
    if (typeof _oClose==='function') window.closeWindow = function(id) { const w=document.getElementById(id); if(w) _save(w); if(window.playWindowCloseSound) playWindowCloseSound(); return _oClose.call(this,id); };

    const _oMin = window.minimizeWindow;
    if (typeof _oMin==='function') window.minimizeWindow = function(id) { if(window.playMinimizeSound) playMinimizeSound(); return _oMin.call(this,id); };

    const _oExec = window.execTerminal;
    if (typeof _oExec==='function') window.execTerminal = function(cmd) { if(window.incrementCommandsRun) incrementCommandsRun(); return _oExec.call(this,cmd); };

    const _oNotif = window.showNotification;
    if (typeof _oNotif==='function') window.showNotification = function(t,b,i) { if(window.playNotifSound) playNotifSound(); return _oNotif.call(this,t,b,i); };

    /* ─── 5. UI SOUNDS ─── */
    let _ac=null;
    function _gac(){ if(!_ac){try{_ac=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}} if(_ac&&_ac.state==='suspended')_ac.resume(); return _ac; }

    // macOS window open: soft upward pop (warm, airy)
    window.playWindowOpenSound = function(){
        const ac=_gac(); if(!ac)return;
        try{
            const t=ac.currentTime;
            const o=ac.createOscillator(), g=ac.createGain();
            o.connect(g); g.connect(ac.destination);
            o.type='sine';
            o.frequency.setValueAtTime(460,t); o.frequency.exponentialRampToValueAtTime(860,t+0.07);
            g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.055,t+0.008);
            g.gain.exponentialRampToValueAtTime(0.001,t+0.11);
            o.start(t); o.stop(t+0.12);
        }catch(e){}
    };

    // macOS window close: soft downward thud
    window.playWindowCloseSound = function(){
        const ac=_gac(); if(!ac)return;
        try{
            const t=ac.currentTime;
            const o=ac.createOscillator(), g=ac.createGain();
            o.connect(g); g.connect(ac.destination);
            o.type='sine';
            o.frequency.setValueAtTime(720,t); o.frequency.exponentialRampToValueAtTime(400,t+0.09);
            g.gain.setValueAtTime(0.05,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.10);
            o.start(t); o.stop(t+0.11);
        }catch(e){}
    };

    // macOS minimize: genie whoosh — falling pitch sweep
    window.playMinimizeSound = function(){
        const ac=_gac(); if(!ac)return;
        try{
            const t=ac.currentTime;
            const o=ac.createOscillator(), g=ac.createGain();
            o.connect(g); g.connect(ac.destination);
            o.type='sine';
            o.frequency.setValueAtTime(700,t); o.frequency.exponentialRampToValueAtTime(180,t+0.16);
            g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.05,t+0.01);
            g.gain.exponentialRampToValueAtTime(0.001,t+0.17);
            o.start(t); o.stop(t+0.18);
        }catch(e){}
    };

    // macOS "Glass" notification — two-tone crystal chime (C5 → G5)
    window.playNotifSound = function(){
        const ac=_gac(); if(!ac)return;
        try{
            const t=ac.currentTime;
            // First chime: C5 (523 Hz) + octave harmonic
            [[523.25,0],[1046.5,0]].forEach(([f,d])=>{
                const o=ac.createOscillator(),g=ac.createGain();
                o.connect(g); g.connect(ac.destination);
                o.type='sine'; o.frequency.value=f;
                g.gain.setValueAtTime(0,t+d); g.gain.linearRampToValueAtTime(f>600?0.022:0.045,t+d+0.004);
                g.gain.exponentialRampToValueAtTime(0.001,t+d+0.38);
                o.start(t+d); o.stop(t+d+0.4);
            });
            // Second chime: G5 (784 Hz) offset
            [[784,0.12],[1568,0.12]].forEach(([f,d])=>{
                const o=ac.createOscillator(),g=ac.createGain();
                o.connect(g); g.connect(ac.destination);
                o.type='sine'; o.frequency.value=f;
                g.gain.setValueAtTime(0,t+d); g.gain.linearRampToValueAtTime(f>800?0.018:0.038,t+d+0.004);
                g.gain.exponentialRampToValueAtTime(0.001,t+d+0.32);
                o.start(t+d); o.stop(t+d+0.34);
            });
        }catch(e){}
    };

    // macOS keyboard click: very short dampened noise tap
    window.playTypeClick = function(){
        const ac=_gac(); if(!ac)return;
        try{
            const len=Math.floor(ac.sampleRate*0.011);
            const b=ac.createBuffer(1,len,ac.sampleRate);
            const d=b.getChannelData(0);
            for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.exp(-i/(len*0.22));
            const s=ac.createBufferSource(), g=ac.createGain();
            const f=ac.createBiquadFilter(); f.type='bandpass'; f.frequency.value=3800; f.Q.value=1.2;
            s.buffer=b; g.gain.value=0.035;
            s.connect(f); f.connect(g); g.connect(ac.destination); s.start();
        }catch(e){}
    };

    /* ─── 6. TYPING SOUND ─── */
    const _ti=document.getElementById('terminal-input');
    if (_ti) _ti.addEventListener('keydown',function(e){ if(e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&window.playTypeClick) playTypeClick(); },{passive:true});

    /* ─── 7. FAST BOOT ─── */
    if (localStorage.getItem('mac-visited')==='1') {
        const bar=document.getElementById('boot-progress');
        if(bar){bar.style.transition='none';bar.style.width='100%';}
    }
    localStorage.setItem('mac-visited','1');

})();

/* ==================== SNAKE GAME ==================== */
window.snakeGame = (function(){
    const CELL=20, COLS=26, ROWS=26;
    const SPEEDS=[140,105,75,50,35];
    let canvas,ctx,scoreEl,bestEl,speedEl,pauseBtn;
    let snake,food,dir,nextDir,score,best,running,paused,rafId,lastTick,tickMs;
    let inited=false, _ac=null;

    function _gac(){ if(!_ac){try{_ac=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}} if(_ac&&_ac.state==='suspended') _ac.resume(); return _ac; }
    function _eatSnd(){
        const ac=_gac(); if(!ac)return;
        try{
            const t=ac.currentTime;
            [[1400,0,0.055],[2100,0.07,0.055]].forEach(([freq,delay,dur])=>{
                const o=ac.createOscillator(),g=ac.createGain();
                o.connect(g); g.connect(ac.destination);
                o.type='square'; o.frequency.value=freq;
                g.gain.setValueAtTime(0.0,t+delay);
                g.gain.linearRampToValueAtTime(0.14,t+delay+0.005);
                g.gain.setValueAtTime(0.14,t+delay+dur-0.01);
                g.gain.linearRampToValueAtTime(0.0,t+delay+dur);
                o.start(t+delay); o.stop(t+delay+dur);
            });
        }catch(e){}
    }

    function _gameOverSnd(){
        const ac=_gac(); if(!ac) return;
        try{
            const t=ac.currentTime;

            // ── Noise crack (impact hit) ──
            const buf=ac.createBuffer(1,Math.floor(ac.sampleRate*0.12),ac.sampleRate);
            const d=buf.getChannelData(0);
            for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1);
            const noise=ac.createBufferSource(); noise.buffer=buf;
            const nf=ac.createBiquadFilter(); nf.type='bandpass'; nf.frequency.value=1800; nf.Q.value=0.6;
            const ng=ac.createGain();
            noise.connect(nf); nf.connect(ng); ng.connect(ac.destination);
            ng.gain.setValueAtTime(0.55,t); ng.gain.exponentialRampToValueAtTime(0.001,t+0.14);
            noise.start(t); noise.stop(t+0.14);

            // ── First bass thud (K) ──
            const b1=ac.createOscillator(), bg1=ac.createGain();
            b1.connect(bg1); bg1.connect(ac.destination);
            b1.type='sine';
            b1.frequency.setValueAtTime(220,t); b1.frequency.exponentialRampToValueAtTime(45,t+0.45);
            bg1.gain.setValueAtTime(1.0,t); bg1.gain.exponentialRampToValueAtTime(0.001,t+0.55);
            b1.start(t); b1.stop(t+0.55);

            // ── Orchestra sawtooth sweep (dramatic fall) ──
            const os=ac.createOscillator(), osg=ac.createGain(), osf=ac.createBiquadFilter();
            osf.type='lowpass'; osf.frequency.value=700; osf.Q.value=1.2;
            os.connect(osf); osf.connect(osg); osg.connect(ac.destination);
            os.type='sawtooth';
            os.frequency.setValueAtTime(320,t); os.frequency.exponentialRampToValueAtTime(55,t+1.1);
            osg.gain.setValueAtTime(0.0,t); osg.gain.linearRampToValueAtTime(0.38,t+0.04);
            osg.gain.setValueAtTime(0.38,t+0.1); osg.gain.exponentialRampToValueAtTime(0.001,t+1.15);
            os.start(t); os.stop(t+1.15);

            // ── Second bass thud (O) — offset for K·O feel ──
            const b2=ac.createOscillator(), bg2=ac.createGain();
            b2.connect(bg2); bg2.connect(ac.destination);
            b2.type='sine';
            b2.frequency.setValueAtTime(180,t+0.20); b2.frequency.exponentialRampToValueAtTime(38,t+0.65);
            bg2.gain.setValueAtTime(0.75,t+0.20); bg2.gain.exponentialRampToValueAtTime(0.001,t+0.75);
            b2.start(t+0.20); b2.stop(t+0.75);

            // ── High metallic ring (Tekken hit sparkle) ──
            const r=ac.createOscillator(), rg=ac.createGain();
            r.connect(rg); rg.connect(ac.destination);
            r.type='sine'; r.frequency.setValueAtTime(1200,t);
            r.frequency.exponentialRampToValueAtTime(400,t+0.35);
            rg.gain.setValueAtTime(0.18,t); rg.gain.exponentialRampToValueAtTime(0.001,t+0.35);
            r.start(t); r.stop(t+0.35);
        }catch(e){}
    }
    function init(){
        canvas=document.getElementById('snake-canvas'); if(!canvas)return;
        ctx=canvas.getContext('2d');
        scoreEl=document.getElementById('snake-score');
        bestEl=document.getElementById('snake-best');
        speedEl=document.getElementById('snake-speed-label');
        pauseBtn=document.getElementById('snake-pause-btn');
        best=parseInt(localStorage.getItem('snake-best')||'0');
        if(bestEl) bestEl.textContent=best;
        idle(); inited=true;
    }
    function idle(){
        if(!ctx)return;
        ctx.fillStyle='#0d0d0d'; ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle='rgba(255,255,255,0.025)';
        for(let x=0;x<COLS;x++) for(let y=0;y<ROWS;y++) ctx.fillRect(x*CELL+CELL/2-1,y*CELL+CELL/2-1,2,2);
    }
    function start(){
        if(!inited) init();
        snake=[{x:16,y:13},{x:15,y:13},{x:14,y:13}];
        dir={x:1,y:0}; nextDir={x:1,y:0};
        score=0; running=true; paused=false; tickMs=SPEEDS[0];
        if(scoreEl) scoreEl.textContent='0';
        if(speedEl) speedEl.textContent='1';
        if(pauseBtn){ pauseBtn.textContent='⏸'; pauseBtn.title='Pause (P)'; }
        const ov=document.getElementById('snake-overlay'); if(ov) ov.classList.add('hidden');
        placeFood();
        if(rafId) cancelAnimationFrame(rafId);
        lastTick=performance.now(); rafId=requestAnimationFrame(loop);
    }
    function stop(){ running=false; paused=false; if(rafId) cancelAnimationFrame(rafId); if(pauseBtn) pauseBtn.textContent='⏸'; }
    function togglePause(){
        if(!running) return;
        paused=!paused;
        if(paused){
            if(pauseBtn){ pauseBtn.textContent='▶'; pauseBtn.title='Resume (P)'; }
            drawPauseOverlay();
        } else {
            if(pauseBtn){ pauseBtn.textContent='⏸'; pauseBtn.title='Pause (P)'; }
            lastTick=performance.now();
            rafId=requestAnimationFrame(loop);
        }
    }
    function drawPauseOverlay(){
        if(!ctx) return;
        ctx.fillStyle='rgba(0,0,0,0.55)';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle='rgba(48,209,88,0.9)';
        ctx.font='bold 36px -apple-system,system-ui,sans-serif';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('⏸ PAUSED',canvas.width/2,canvas.height/2-10);
        ctx.font='13px -apple-system,system-ui,sans-serif';
        ctx.fillStyle='rgba(255,255,255,0.5)';
        ctx.fillText('Press P or Esc to resume',canvas.width/2,canvas.height/2+30);
    }
    function loop(ts){
        if(!running||paused) return;
        if(ts-lastTick>=tickMs){lastTick=ts;tick();}
        rafId=requestAnimationFrame(loop);
    }
    function tick(){
        dir=nextDir;
        const h={x:snake[0].x+dir.x, y:snake[0].y+dir.y};
        if(h.x<0||h.x>=COLS||h.y<0||h.y>=ROWS) return over();
        for(let i=0;i<snake.length;i++) if(snake[i].x===h.x&&snake[i].y===h.y) return over();
        snake.unshift(h);
        if(h.x===food.x&&h.y===food.y){
            score++; if(scoreEl) scoreEl.textContent=score;
            _eatSnd();
            const lv=score<5?0:score<12?1:score<22?2:score<35?3:4;
            tickMs=SPEEDS[lv]; if(speedEl) speedEl.textContent=lv+1;
            placeFood();
        } else { snake.pop(); }
        draw();
    }
    function placeFood(){
        let p; do{ p={x:Math.floor(Math.random()*COLS),y:Math.floor(Math.random()*ROWS)}; }while(snake.some(s=>s.x===p.x&&s.y===p.y)); food=p;
    }
    function rr(x,y,w,h,r){
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();return;}
        ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.fill();
    }
    function draw(){
        ctx.fillStyle='#0d0d0d'; ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle='rgba(255,255,255,0.025)';
        for(let x=0;x<COLS;x++) for(let y=0;y<ROWS;y++) ctx.fillRect(x*CELL+CELL/2-1,y*CELL+CELL/2-1,2,2);
        const fx=food.x*CELL+CELL/2, fy=food.y*CELL+CELL/2;
        const gr=ctx.createRadialGradient(fx,fy,0,fx,fy,CELL);
        gr.addColorStop(0,'rgba(255,45,85,0.4)'); gr.addColorStop(1,'transparent');
        ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(fx,fy,CELL,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#ff2d55'; ctx.beginPath(); ctx.arc(fx,fy,CELL/2-2,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.arc(fx-2,fy-2,2,0,Math.PI*2); ctx.fill();
        for(let i=snake.length-1;i>=1;i--){
            const t=i/Math.max(snake.length-1,1);
            ctx.fillStyle=`rgb(${Math.round(22+(1-t)*18)},${Math.round(190-t*70)},${Math.round(75-t*30)})`;
            rr(snake[i].x*CELL+1,snake[i].y*CELL+1,CELL-2,CELL-2,4);
        }
        const hx=snake[0].x*CELL, hy=snake[0].y*CELL;
        ctx.fillStyle='#30d158'; rr(hx+1,hy+1,CELL-2,CELL-2,5);
        ctx.fillStyle='#001a09';
        const ez=2.5;
        if(dir.x===1)       {ctx.fillRect(hx+CELL-6,hy+4,ez,ez);ctx.fillRect(hx+CELL-6,hy+CELL-7,ez,ez);}
        else if(dir.x===-1) {ctx.fillRect(hx+4,hy+4,ez,ez);ctx.fillRect(hx+4,hy+CELL-7,ez,ez);}
        else if(dir.y===-1) {ctx.fillRect(hx+4,hy+4,ez,ez);ctx.fillRect(hx+CELL-7,hy+4,ez,ez);}
        else                {ctx.fillRect(hx+4,hy+CELL-7,ez,ez);ctx.fillRect(hx+CELL-7,hy+CELL-7,ez,ez);}
    }
    function over(){
        running=false; paused=false; cancelAnimationFrame(rafId);
        if(pauseBtn) pauseBtn.textContent='⏸';
        _gameOverSnd();
        if(score>best){best=score;localStorage.setItem('snake-best',best);if(bestEl)bestEl.textContent=best;}
        ctx.fillStyle='rgba(255,45,85,0.15)'; ctx.fillRect(0,0,canvas.width,canvas.height);
        const ov=document.getElementById('snake-overlay');
        const ti=document.getElementById('snake-title');
        const ms=document.getElementById('snake-msg');
        const fi=document.getElementById('snake-final');
        const bt=document.getElementById('snake-start-btn');
        if(ov) ov.classList.remove('hidden');
        if(ti) ti.textContent = score>=15?'🏆 GREAT!':'💀 GAME OVER';
        if(ms) ms.textContent = score===best&&best>0?'🎉 New High Score!':'Try again?';
        if(fi){fi.style.display='block';fi.textContent='Score: '+score+'  |  Best: '+best;}
        if(bt) bt.textContent='↺ PLAY AGAIN';
    }
    function handleClick(e){
        if(!running){ start(); return; }
        if(paused){ togglePause(); return; }
        if(!canvas||!snake) return;
        const rect=canvas.getBoundingClientRect();
        const cx=e.clientX-rect.left, cy=e.clientY-rect.top;
        const hx=snake[0].x*CELL+CELL/2, hy=snake[0].y*CELL+CELL/2;
        const dx=cx-hx, dy=cy-hy;
        if(Math.abs(dx)>Math.abs(dy)){
            if(dx>0&&dir.x!==-1) nextDir={x:1,y:0};
            if(dx<0&&dir.x!==1)  nextDir={x:-1,y:0};
        } else {
            if(dy>0&&dir.y!==-1) nextDir={x:0,y:1};
            if(dy<0&&dir.y!==1)  nextDir={x:0,y:-1};
        }
    }
    function keys(){
        document.addEventListener('keydown',function(e){
            const w=document.getElementById('window-snake');
            if(!w||w.style.display==='none') return;
            if(e.key==='p'||e.key==='P'||e.key==='Escape'){
                if(running){ e.preventDefault(); togglePause(); return; }
            }
            if(!running&&e.code==='Space'){e.preventDefault();start();return;}
            if(paused) return;
            switch(e.key){
                case 'ArrowUp':   case 'w':case 'W': if(dir.y!==1) {nextDir={x:0,y:-1};e.preventDefault();} break;
                case 'ArrowDown': case 's':case 'S': if(dir.y!==-1){nextDir={x:0,y:1}; e.preventDefault();} break;
                case 'ArrowLeft': case 'a':case 'A': if(dir.x!==1) {nextDir={x:-1,y:0};e.preventDefault();} break;
                case 'ArrowRight':case 'd':case 'D': if(dir.x!==-1){nextDir={x:1,y:0}; e.preventDefault();} break;
            }
        });
    }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){init();keys();});
    else {init();keys();}
    return {start,stop,init,handleClick,togglePause};
})();

/* ==================== COPY EMAIL ==================== */
function copyEmail(e) {
    navigator.clipboard?.writeText('sunilsaini5652@gmail.com').then(() => {
        showNotification('📋 Email copied to clipboard!');
    }).catch(() => {
        showNotification('📧 sunilsaini5652@gmail.com');
    });
}

/* ==================== CONFETTI ==================== */
function launchConfetti() {
    const colors = ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#c77dff','#ff9f43','#ffffff'];
    const form = document.getElementById('contact-form');
    const rect = form ? form.getBoundingClientRect() : { left: window.innerWidth * 0.3, bottom: window.innerHeight * 0.7, width: 300 };
    for (let i = 0; i < 50; i++) {
        const p = document.createElement('div');
        const size = 5 + Math.random() * 7;
        p.style.cssText = `
            position:fixed;pointer-events:none;z-index:99999;
            left:${rect.left + Math.random() * (rect.width || 300)}px;
            top:${rect.bottom || window.innerHeight * 0.7}px;
            width:${size}px;height:${size}px;
            background:${colors[Math.floor(Math.random() * colors.length)]};
            border-radius:${Math.random() > 0.4 ? '50%' : '3px'};
            animation:confetti-fly ${0.7 + Math.random() * 1.1}s ease-out forwards;
            animation-delay:${Math.random() * 0.5}s;
        `;
        document.body.appendChild(p);
        p.addEventListener('animationend', () => p.remove());
    }
}

/* ==================== TRASH ==================== */
function _setTrashLid(open) {
    const art = document.querySelector('.dock-item[data-app="trash"] .trash-art');
    if (art) art.classList.toggle('open', open);
}

let _trashEmptied = localStorage.getItem('trashEmptied') === '1';
function emptyTrash() {
    if (_trashEmptied) return;
    _trashEmptied = true;
    localStorage.setItem('trashEmptied', '1');
    const btn = document.getElementById('trash-empty-btn');
    if (btn) btn.disabled = true;

    // ── macOS paper crumple sound ──
    try {
        const ac = new (window.AudioContext || window.webkitAudioContext)();
        if (ac.state === 'suspended') ac.resume();
        const t = ac.currentTime;
        // Five overlapping crinkle bursts — staggered for organic paper feel
        [
            [0.00, 0.18, 2800, 0.28],
            [0.04, 0.14, 1900, 0.22],
            [0.09, 0.16, 3500, 0.20],
            [0.15, 0.13, 2200, 0.17],
            [0.22, 0.12, 4000, 0.13],
        ].forEach(([delay, dur, freq, vol]) => {
            const len = Math.floor(ac.sampleRate * dur);
            const buf = ac.createBuffer(1, len, ac.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < len; i++)
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.35));
            const src = ac.createBufferSource(); src.buffer = buf;
            const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1100;
            const lp = ac.createBiquadFilter(); lp.type = 'lowpass';  lp.frequency.value = 5500;
            const bp = ac.createBiquadFilter(); bp.type = 'peaking';  bp.frequency.value = freq; bp.gain.value = 8; bp.Q.value = 1.5;
            const g  = ac.createGain();
            g.gain.setValueAtTime(vol, t + delay);
            g.gain.exponentialRampToValueAtTime(0.001, t + delay + dur);
            src.connect(hp); hp.connect(bp); bp.connect(lp); lp.connect(g); g.connect(ac.destination);
            src.start(t + delay); src.stop(t + delay + dur);
        });
        // Tiny transient click at the very start (paper separation)
        const ck = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.008), ac.sampleRate);
        const ckd = ck.getChannelData(0);
        for (let i = 0; i < ckd.length; i++) ckd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ckd.length * 0.4));
        const cks = ac.createBufferSource(); cks.buffer = ck;
        const ckg = ac.createGain(); ckg.gain.value = 0.12;
        cks.connect(ckg); ckg.connect(ac.destination); cks.start(t);
    } catch(e) {}

    // ── Animate items out staggered ──
    const items = document.querySelectorAll('#trash-items-list .trash-item');
    items.forEach((el, i) => {
        setTimeout(() => {
            el.style.transition = 'transform 0.3s ease-in, opacity 0.3s ease-in';
            el.style.transform = 'translateX(60px) scale(0.8)';
            el.style.opacity = '0';
        }, i * 60);
    });

    // ── Show empty state after animation ──
    const total = items.length;
    setTimeout(() => {
        const list = document.getElementById('trash-items-list');
        const empty = document.getElementById('trash-empty-state');
        const label = document.getElementById('trash-count-label');
        if (list) list.style.display = 'none';
        if (empty) empty.style.display = 'flex';
        if (label) label.textContent = 'Zero items · 0 bytes · Finally clean';
        if (btn) { btn.textContent = 'Already Empty'; btn.style.opacity = '0.4'; }
    }, total * 60 + 350);
}

function resetTrash() {
    const list  = document.getElementById('trash-items-list');
    const empty = document.getElementById('trash-empty-state');
    const label = document.getElementById('trash-count-label');
    const btn   = document.getElementById('trash-empty-btn');
    if (_trashEmptied) {
        /* Already emptied this session — show empty state directly */
        if (list)  list.style.display  = 'none';
        if (empty) empty.style.display = 'flex';
        if (label) label.textContent   = 'Zero items · 0 bytes · Finally clean';
        if (btn)   { btn.disabled = true; btn.textContent = 'Already Empty'; btn.style.opacity = '0.4'; }
        return;
    }
    const items = document.querySelectorAll('#trash-items-list .trash-item');
    items.forEach(el => { el.style.transform = ''; el.style.opacity = ''; el.style.transition = ''; });
    if (list)  list.style.display  = '';
    if (empty) empty.style.display = 'none';
    if (label) label.textContent   = '8 items · 47.3 GB used';
    if (btn)   { btn.disabled = false; btn.textContent = 'Empty Trash'; btn.style.opacity = ''; }
}

/* ==================== MEMORY OF VISITOR ==================== */
function _loadVisitData() {
    try { return JSON.parse(localStorage.getItem('mac-visit-data') || 'null'); } catch(e) { return null; }
}
function _saveVisitData(d) {
    try { localStorage.setItem('mac-visit-data', JSON.stringify(d)); } catch(e) {}
}
function initVisitorMemory() {
    const prev = _loadVisitData();
    const now  = Date.now();
    const data = {
        count:        (prev ? prev.count : 0) + 1,
        firstVisit:   prev ? prev.firstVisit : now,
        lastVisit:    now,
        prevWindows:  prev ? (prev.sessionWindows || []) : [],
        prevTracks:   prev ? (prev.sessionTracks  || []) : [],
        sessionWindows: [],
        sessionTracks:  [],
    };
    _saveVisitData(data);
    window._visitData = data;

    if (prev && prev.count >= 1) {
        const days = Math.floor((now - prev.lastVisit) / 86400000);
        const ago  = days === 0 ? 'earlier today' : days === 1 ? 'yesterday' : `${days} days ago`;
        const nice = id => id.replace('window-','').replace(/-/g,' ');
        const explored = (prev.sessionWindows || []).length
            ? (prev.sessionWindows).slice(0,3).map(nice).join(', ')
            : 'the portfolio';
        setTimeout(() => {
            showNotification(`👋 Welcome back! Last visit: ${ago}. You explored: ${explored}.`);
            _consoleLog('portfolio','info',`Returning visitor detected — visit #${data.count}, last seen ${ago}`);
        }, 3800);
    }
}
function _trackVisitedWindow(winId) {
    if (!window._visitData) return;
    const s = window._visitData.sessionWindows;
    if (!s.includes(winId)) { s.push(winId); _saveVisitData(window._visitData); }
}
function _trackVisitedTrack(name) {
    if (!window._visitData) return;
    const s = window._visitData.sessionTracks;
    if (!s.includes(name)) { s.push(name); _saveVisitData(window._visitData); }
}

/* ==================== CONSOLE APP ==================== */
const _conLogs = [];
const _CON_PROC = {
    kernel:    { label: 'kernel',           color: '#ff453a' },
    ws:        { label: 'WindowServer',     color: '#007aff' },
    mds:       { label: 'mds',              color: '#30d158' },
    notifyd:   { label: 'notifyd',          color: '#ffd60a' },
    dock:      { label: 'Dock',             color: '#bf5af2' },
    music:     { label: 'Music',            color: '#ff375f' },
    terminal:  { label: 'Terminal',         color: '#30d158' },
    portfolio: { label: 'portfolio[js]',    color: '#00d2ff' },
    human:     { label: 'HumanDetector[1]', color: '#ff9f0a' },
    presence:  { label: 'presenced',        color: '#636366' },
};
let _consoleFilterLevel = 'all';

function _consoleLog(proc, level, msg) {
    const ts   = new Date();
    const time = ts.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})
                 + '.' + String(ts.getMilliseconds()).padStart(3,'0');
    const entry = { time, proc, level, msg };
    _conLogs.push(entry);
    if (_conLogs.length > 600) _conLogs.shift();
    _appendConsoleRow(entry);
}

function _appendConsoleRow(entry) {
    const list = document.getElementById('console-log-list');
    if (!list) return;
    if (_consoleFilterLevel !== 'all' && entry.level !== _consoleFilterLevel) return;
    const q = (document.getElementById('console-search-input') || {}).value || '';
    if (q && !(entry.msg + entry.proc).toLowerCase().includes(q.toLowerCase())) return;
    const p   = _CON_PROC[entry.proc] || { label: entry.proc, color: '#aaa' };
    const row = document.createElement('div');
    row.className = `con-row con-level-${entry.level}`;
    row.dataset.level = entry.level; row.dataset.proc = entry.proc;
    row.innerHTML =
        `<span class="con-col-time">${entry.time}</span>` +
        `<span class="con-col-type con-type-${entry.level}">${entry.level.toUpperCase()}</span>` +
        `<span class="con-col-process" style="color:${p.color}">${p.label}</span>` +
        `<span class="con-col-msg">${entry.msg}</span>`;
    list.appendChild(row);
    const win = document.getElementById('window-console');
    if (win && win.style.display !== 'none') list.scrollTop = list.scrollHeight;
}

function setConsoleFilter(level, btn) {
    _consoleFilterLevel = level;
    document.querySelectorAll('.con-filter').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    const list = document.getElementById('console-log-list');
    if (!list) return;
    list.innerHTML = '';
    _conLogs.forEach(e => _appendConsoleRow(e));
}

function filterConsoleLogs() {
    const list = document.getElementById('console-log-list');
    if (!list) return;
    list.innerHTML = '';
    _conLogs.forEach(e => _appendConsoleRow(e));
}

function _seedConsoleLogs() {
    [
        ['kernel','info', 'Darwin Kernel Version 24.0.0 — Portfolio Edition'],
        ['kernel','info', 'Copyright © 2024 Sunil Saini. All rights reserved.'],
        ['ws',    'info', 'WindowServer starting — display compositor initialized'],
        ['mds',   'info', 'Spotlight indexing: /Portfolio/projects (4 items found)'],
        ['notifyd','info','Notification daemon ready — focus mode: OFF'],
        ['dock',  'info', 'Dock registered 9 app icons'],
        ['portfolio','info','DOM ready — boot sequence initiated'],
        ['portfolio','info','Assets: style.css (2600+ lines), script.js (3000+ lines), zero dependencies'],
        ['ws',    'warn', 'YouTube IFrame API: embed restricted — retrying next track'],
        ['mds',   'info', 'Indexing complete. Trash: 0 items (already emptied)'],
        ['portfolio','info','AudioContext suspended — awaiting first user gesture'],
        ['ws',    'info', 'GPU compositing active — Metal renderer'],
    ].forEach(([p,l,m]) => _consoleLog(p,l,m));
}

function _initConsole() {
    _seedConsoleLogs();
    // Ambient background daemon logs
    (function _ambient() {
        const msgs = [
            ['presence','info',`WindowServer: compositing ${document.querySelectorAll('.window').length} registered windows`],
            ['mds',     'info', 'SpotlightIndex: portfolio keywords re-indexed'],
            ['notifyd', 'info', 'Delivered 1 notification to portfolio[js]'],
            ['kernel',  'info', 'Memory pressure: normal — heap stable'],
            ['presence','info', 'presenced: heartbeat OK — system responsive'],
            ['mds',     'warn', 'CoreData: performing vacuum on SQLite metadata store'],
            ['ws',      'info', 'SkyLight: vsync — frame rendered at 60fps'],
            ['kernel',  'info', 'sandboxd: allow(1) portfolio-js network-socket'],
            ['presence','info', 'cfprefsd: syncing preferences to disk'],
        ];
        const [p,l,m] = msgs[Math.floor(Math.random() * msgs.length)];
        _consoleLog(p,l,m);
        setTimeout(_ambient, 18000 + Math.random() * 35000);
    })();
}

/* ==================== PRESENCE ENGINE ==================== */
let _cpuLoad   = 12;
let _cpuTarget = 12;

function _initPresence() {
    // Drift CPU naturally, spike on activity
    setInterval(() => {
        _cpuTarget = 6 + Math.random() * 14;
        _cpuLoad   = _cpuLoad + (_cpuTarget - _cpuLoad) * 0.25;
        const el = document.getElementById('presence-cpu');
        if (!el) return;
        el.textContent = _cpuLoad.toFixed(1) + '%';
        el.classList.toggle('hot', _cpuLoad > 55);
    }, 2200);

    // Ambient notification-center cards every 45–120s
    const _presenceMsgs = [
        ['💾','mds',      'Spotlight: portfolio index updated'],
        ['⚡','kernel',   'CPU: burst mode released — idle throttle active'],
        ['🌐','Safari',   'Network: portfolio_net — 12ms latency'],
        ['🔒','securityd','Code signature: verified OK'],
        ['💻','Terminal', 'Background process exited with code 0'],
        ['🎵','Music',    'Audio buffer preloaded — next track ready'],
        ['📦','npm',      'portfolio@1.0.0 — all dependencies up to date'],
        ['🛠','Xcode',    'Build succeeded — 0 errors, 0 warnings'],
    ];
    (function _ambientCard() {
        const [icon, app, msg] = _presenceMsgs[Math.floor(Math.random() * _presenceMsgs.length)];
        _addPresenceCard(icon, app, msg);
        _consoleLog('presence','info',`${app}: ${msg}`);
        setTimeout(_ambientCard, 45000 + Math.random() * 75000);
    })();
}

function _spikePresence(amount) {
    _cpuLoad = Math.min(92, _cpuLoad + (amount || 25) + Math.random() * 15);
    const el = document.getElementById('presence-cpu');
    if (el) { el.textContent = _cpuLoad.toFixed(1) + '%'; el.classList.add('hot'); }
}

function _addPresenceCard(icon, app, msg) {
    const nc = document.getElementById('notif-center');
    if (!nc) return;
    const now  = new Date();
    const time = now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false});
    const card = document.createElement('div');
    card.className = 'nc-card';
    card.innerHTML =
        `<div class="nc-card-header"><span class="nc-app-icon">${icon}</span>` +
        `<span class="nc-app-name">${app}</span><span class="nc-time">${time}</span></div>` +
        `<div class="nc-card-body">${msg}</div>`;
    const anchor = nc.querySelector('#nc-github-list');
    anchor ? anchor.before(card) : nc.appendChild(card);
    setTimeout(() => card.remove(), 180000);
}

/* ==================== KERNEL PANIC EASTER EGG ==================== */
const _PANIC_SEQ = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let _panicBuf = [];

function _initKernelPanic() {
    if (localStorage.getItem('mac-dev-mode') === '1') _applyDevMode(false);
    document.addEventListener('keydown', e => {
        _panicBuf.push(e.key);
        if (_panicBuf.length > _PANIC_SEQ.length) _panicBuf.shift();
        if (_panicBuf.join(',') === _PANIC_SEQ.join(',')) {
            _panicBuf = [];
            _triggerKernelPanic();
        }
    });
}

function _triggerKernelPanic() {
    const overlay  = document.getElementById('kernel-panic');
    const trace    = document.getElementById('panic-trace');
    const fill     = document.getElementById('panic-progress-fill');
    const countEl  = document.getElementById('panic-countdown');
    if (!overlay) return;

    if (trace) trace.textContent =
        `panic(cpu 3 caller 0xffffff80043d3d): "EasterEgg exploit triggered"\n` +
        `frame #0: kernel + 0xd3c000  _dispatch_visitor_event + 0x42\n` +
        `frame #1: portfolio.js + 0x8042  _handleKeySequence + 0x60\n` +
        `frame #2: 0xffffff802b4f  konami_sequence_detected + 0x1a\n\n` +
        `Kernel slide: 0x206b39f9\nCaught by easter-egg trap at 0x0000dead\n\n` +
        `BSD process name: Google Chrome\nMac OS Version: Portfolio 1.0`;

    overlay.classList.remove('hidden');
    _panicSound();
    _consoleLog('kernel','error','panic: EasterEgg exploit triggered — system halting');

    // Countdown
    let secs = 5;
    const iv = setInterval(() => {
        secs--;
        if (countEl) countEl.textContent = secs;
        if (secs <= 0) clearInterval(iv);
    }, 1000);

    // Progress fill over 5s
    requestAnimationFrame(() => {
        if (fill) { fill.style.transition = 'width 5s linear'; fill.style.width = '100%'; }
    });

    setTimeout(() => {
        overlay.classList.add('hidden');
        if (fill) { fill.style.transition = 'none'; fill.style.width = '0'; }
        localStorage.setItem('mac-dev-mode','1');
        _applyDevMode(true);
    }, 5200);
}

function _applyDevMode(isNew) {
    document.documentElement.classList.add('dev-mode');
    /* Linux-style root prompt */
    const pu = document.getElementById('term-prompt-user');
    const ps = document.getElementById('term-prompt-sym');
    const tt = document.getElementById('terminal-header-title');
    if (pu) { pu.textContent = 'root@portfolio'; pu.className = 'terminal-prompt-user'; }
    if (ps) ps.textContent = '#';
    if (tt) tt.textContent = 'root@portfolio — bash';
    if (isNew) {
        setTimeout(() => showNotification('🔧 Root access granted — check the new dock icon'), 800);
        setTimeout(() => _consoleLog('kernel','warn','System recovered — developer mode enabled. Welcome, root.'), 900);
        setTimeout(() => {
            const win = document.getElementById('window-devnotes');
            if (win) toggleWindow('window-devnotes');
        }, 1400);
        /* Auto-open terminal and run hack welcome sequence */
        setTimeout(() => {
            const term = document.getElementById('window-skills');
            if (term && (term.style.display === 'none' || !term.style.display)) toggleWindow('window-skills');
            setTimeout(_hackTypeSequence, 700);
        }, 2400);
        setTimeout(() => {
            _consoleLog('portfolio','info','Unlocked terminal commands: classified, devlog, secrets, breach');
        }, 1800);
    }
}

/* Typewriter hack sequence — runs in terminal on dev-mode activate */
function _hackTypeSequence() {
    const out  = document.getElementById('terminal-output');
    const body = document.getElementById('terminal-body');
    if (!out) return;
    const lines = [
        { d:0,    html: `<span style="color:#ff453a;font-weight:700">⚠  KERNEL PANIC RECOVERY — DEVELOPER MODE ACTIVE  ⚠</span>` },
        { d:180,  html: `<span class="term-dim">────────────────────────────────────────────────────</span>` },
        { d:320,  html: `<span style="color:#00ff41">[  OK  ]</span> Mounting encrypted partition /dev/classified ...` },
        { d:600,  html: `<span style="color:#00ff41">[  OK  ]</span> Decrypting payload &nbsp;<span id="_hack_bar">░░░░░░░░░░░░░░░░░░░░</span> 0%` },
        { d:900,  html: null, fn: _animHackBar },
        { d:2400, html: `<span style="color:#00ff41">[  OK  ]</span> Payload decrypted — integrity verified` },
        { d:2600, html: `<span style="color:#00ff41">[  OK  ]</span> Escalating privileges ... <span style="color:#ffd60a">root</span>` },
        { d:2850, html: `<span style="color:#00ff41">[  OK  ]</span> Loading secret terminal commands` },
        { d:3100, html: `<span class="term-dim">────────────────────────────────────────────────────</span>` },
        { d:3300, html: `<pre style="color:#00ff41;line-height:1.2">
  ██████╗  ██████╗  ██████╗ ████████╗
  ██╔══██╗██╔═══██╗██╔═══██╗╚══██╔══╝
  ██████╔╝██║   ██║██║   ██║   ██║
  ██╔══██╗██║   ██║██║   ██║   ██║
  ██║  ██║╚██████╔╝╚██████╔╝   ██║
  ╚═╝  ╚═╝ ╚═════╝  ╚═════╝   ╚═╝
  <span style="color:#ff453a">A C C E S S &nbsp; G R A N T E D</span></pre>` },
        { d:3800, html: `<span style="color:#00ff41">Type <span style="color:#ffd60a">breach</span> for the full experience. Or just explore.</span>` },
    ];
    lines.forEach(({ d, html, fn }) => {
        setTimeout(() => {
            if (fn) { fn(); return; }
            const p = document.createElement('p');
            p.innerHTML = html;
            out.appendChild(p);
            if (body) body.scrollTop = body.scrollHeight;
        }, d);
    });
}

function _animHackBar() {
    const el = document.getElementById('_hack_bar');
    if (!el) return;
    const blocks = '████████████████████';
    let pct = 0;
    const iv = setInterval(() => {
        pct += 5 + Math.floor(Math.random() * 8);
        if (pct >= 100) { pct = 100; clearInterval(iv); }
        const filled = Math.floor(pct / 5);
        el.textContent = blocks.slice(0, filled) + '░'.repeat(20 - filled);
        const bar = el.parentElement;
        if (bar) bar.lastChild.textContent = ' ' + pct + '%';
    }, 90);
}

function _panicSound() {
    try {
        const ac = new (window.AudioContext || window.webkitAudioContext)();
        if (ac.state === 'suspended') ac.resume();
        const t = ac.currentTime;
        // White noise burst
        const len = Math.floor(ac.sampleRate * 0.35);
        const buf = ac.createBuffer(1, len, ac.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.7));
        const src = ac.createBufferSource(); src.buffer = buf;
        const g = ac.createGain(); g.gain.setValueAtTime(0.45, t);
        src.connect(g); g.connect(ac.destination); src.start(t);
        // Low rumble
        const osc = ac.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 55;
        const og  = ac.createGain(); og.gain.setValueAtTime(0.3, t);
        og.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        osc.connect(og); og.connect(ac.destination); osc.start(t); osc.stop(t + 0.6);
    } catch(e) {}
}
