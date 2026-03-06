/* ===================================================================
   macOS Portfolio — script.js  
   Boot · Login · UTC Clock · Spotlight · Terminal · Mission Control
   Context Menu · Notifications · Dock Magnification · Window Manager
   =================================================================== */

let zIndex = 100;
let locked = true;
let missionControlActive = false;

/* ==================== BOOT SEQUENCE ==================== */
document.addEventListener('DOMContentLoaded', () => {
    // Boot animation
    const bootFill = document.getElementById('boot-fill');
    const bootScreen = document.getElementById('boot-screen');
    const loginScreen = document.getElementById('login-screen');
    const desktop = document.getElementById('desktop');
    let progress = 0;

    const bootInterval = setInterval(() => {
        progress += Math.random() * 8 + 2;
        if (progress >= 100) {
            progress = 100;
            clearInterval(bootInterval);
            setTimeout(() => {
                bootScreen.classList.add('hidden');
                loginScreen.classList.remove('hidden');
                document.getElementById('password-input').focus();
            }, 400);
        }
        bootFill.style.width = progress + '%';
    }, 120);

    // Start clocks
    updateLoginClock();
    setInterval(updateLoginClock, 1000);
    updateMenuClock();
    setInterval(updateMenuClock, 1000);

    // Terminal timestamp
    const tt = document.getElementById('term-time');
    if (tt) tt.textContent = new Date().toUTCString();

    // Login handlers
    const loginBtn = document.getElementById('login-btn');
    const pwdInput = document.getElementById('password-input');
    if (loginBtn) loginBtn.addEventListener('click', unlock);
    if (pwdInput) pwdInput.addEventListener('keydown', e => { if (e.key === 'Enter') unlock(); });

    // Make windows draggable + front-on-click
    document.querySelectorAll('.window').forEach(w => {
        makeDraggable(w);
        w.addEventListener('mousedown', () => bringFront(w));
    });

    // Load persisted settings
    loadSettings();

    // Resize handles
    document.querySelectorAll('.resize-handle').forEach(h => makeResizable(h));
    document.querySelectorAll('.resize-handle-left').forEach(h => makeResizableLeft(h));

    // Dock, menu bar, Spotlight, context menu, terminal
    initDock();
    initMenuBar();
    initSpotlight();
    initContextMenu();
    initTerminal();

    // Keyboard shortcuts
    document.addEventListener('keydown', handleGlobalKeys);
});

/* ==================== LOAD SETTINGS ==================== */
function loadSettings() {
    const devName = localStorage.getItem('mac-dev-name') || 'SUN 🌗 :ツ';
    updateDevName(devName);
    const devInput = document.getElementById('dev-name-input');
    if (devInput) devInput.value = devName;

    const wall = localStorage.getItem('mac-wall') || 'img1';
    setWallpaper(wall);

    const appearance = localStorage.getItem('mac-appearance') || 'dark';
    const appBtn = document.querySelector(`.toggle-btn[onclick="setAppearanceMode('${appearance}',this)"]`);
    if (appBtn) setAppearanceMode(appearance, appBtn, false);

    const accent = localStorage.getItem('mac-accent') || '#007aff';
    const accBtn = document.querySelector(`.accent-dot[style="background:${accent}"]`);
    if (accBtn) setAccentColor(accent, accBtn, false);

    const dockSize = localStorage.getItem('mac-dock-size') || '48';
    setDockSize(dockSize, false);
    const sizeInput = document.querySelector('.settings-range');
    if (sizeInput) sizeInput.value = dockSize;
}

/* ==================== LOGIN ==================== */
function updateLoginClock() {
    const now = new Date();
    const h = now.getUTCHours().toString().padStart(2, '0');
    const m = now.getUTCMinutes().toString().padStart(2, '0');
    const lt = document.getElementById('login-time');
    if (lt) lt.textContent = `${h}:${m}`;

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const ld = document.getElementById('login-date');
    if (ld) ld.textContent = `${days[now.getUTCDay()]}, ${months[now.getUTCMonth()]} ${now.getUTCDate()}`;
}

function unlock() {
    const ls = document.getElementById('login-screen');
    const desktop = document.getElementById('desktop');
    if (!ls) return;
    ls.classList.add('hidden');
    desktop.classList.remove('hidden');
    locked = false;

    // Auto-open About Me
    setTimeout(() => toggleWindow('window-about'), 500);

    // Show welcome notification
    setTimeout(showNotification, 1200);
}

function lockScreen() {
    locked = true;
    const ls = document.getElementById('login-screen');
    const desktop = document.getElementById('desktop');
    if (ls) ls.classList.remove('hidden');
    if (desktop) desktop.classList.add('hidden');
    document.getElementById('password-input').value = '';
    // Close all
    document.querySelectorAll('.window').forEach(w => {
        w.style.display = 'none';
        const dot = document.getElementById('dot-' + w.id);
        if (dot) dot.classList.remove('active');
    });
    closeAllMenus();
    hideSpotlight();
}

/* ==================== MENU CLOCK (UTC) ==================== */
function updateMenuClock() {
    const now = new Date();
    const opts = { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC', hour12: true };
    const str = now.toLocaleString('en-US', opts).replace(',', '');
    const el = document.getElementById('menu-clock');
    if (el) el.textContent = str + ' (UTC)';
}

/* ==================== NOTIFICATION ==================== */
function showNotification() {
    const n = document.getElementById('notification');
    if (!n) return;
    n.classList.remove('hidden');
    setTimeout(() => n.classList.add('hidden'), 5000);
    n.onclick = () => n.classList.add('hidden');
}

/* ==================== KEYBOARD SHORTCUTS ==================== */
function handleGlobalKeys(e) {
    if (locked) return;
    // Cmd+Space = Spotlight
    if ((e.metaKey || e.ctrlKey) && e.code === 'Space') {
        e.preventDefault();
        toggleSpotlight();
    }
    // Escape = close Spotlight / Mission Control
    if (e.key === 'Escape') {
        hideSpotlight();
        if (missionControlActive) exitMissionControl();
        hideContextMenu();
    }
    // F3 = Mission Control
    if (e.key === 'F3') {
        e.preventDefault();
        triggerMissionControl();
    }
    // 1-4 = open apps (only when not typing in an input)
    if (!e.metaKey && !e.ctrlKey && !e.altKey && e.key >= '1' && e.key <= '4') {
        const tag = document.activeElement?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
            e.preventDefault();
            const apps = ['window-about', 'window-projects', 'window-skills', 'window-contact'];
            toggleWindow(apps[parseInt(e.key) - 1]);
        }
    }
}

/* ==================== SPOTLIGHT SEARCH ==================== */
const spotlightIndex = [
    { label: 'About Me', type: 'App', icon: '🏠', action: () => toggleWindow('window-about') },
    { label: 'Projects', type: 'App', icon: '🧭', action: () => toggleWindow('window-projects') },
    { label: 'Terminal', type: 'App', icon: '💻', action: () => toggleWindow('window-skills') },
    { label: 'Contact', type: 'App', icon: '📝', action: () => toggleWindow('window-contact') },
    { label: 'About This Mac', type: 'System', icon: '', action: () => openAboutMac() },
    { label: 'Mission Control', type: 'System', icon: '🖥️', action: () => triggerMissionControl() },
    { label: 'Lock Screen', type: 'System', icon: '🔒', action: () => lockScreen() },
    { label: 'JavaScript', type: 'Skill', icon: '📦', action: () => toggleWindow('window-skills') },
    { label: 'TypeScript', type: 'Skill', icon: '📦', action: () => toggleWindow('window-skills') },
    { label: 'React', type: 'Skill', icon: '📦', action: () => toggleWindow('window-skills') },
    { label: 'Python', type: 'Skill', icon: '📦', action: () => toggleWindow('window-skills') },
    { label: 'AI Code Agent', type: 'Project', icon: '🤖', action: () => toggleWindow('window-projects') },
    { label: 'E-Commerce Platform', type: 'Project', icon: '🛒', action: () => toggleWindow('window-projects') },
    { label: 'Email: hello@example.com', type: 'Contact', icon: '📧', action: () => toggleWindow('window-contact') },
    { label: 'GitHub', type: 'Social', icon: '🐙', action: () => toggleWindow('window-contact') },
    { label: 'LinkedIn', type: 'Social', icon: '💼', action: () => toggleWindow('window-contact') },
];

let spotlightResults = [];
let spotlightSelectedIdx = 0;

function initSpotlight() {
    const input = document.getElementById('spotlight-input');
    input.addEventListener('input', onSpotlightInput);
    input.addEventListener('keydown', onSpotlightKey);

    const overlay = document.getElementById('spotlight');
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) hideSpotlight();
    });
}

function toggleSpotlight() {
    const s = document.getElementById('spotlight');
    if (s.classList.contains('hidden')) {
        s.classList.remove('hidden');
        const input = document.getElementById('spotlight-input');
        input.value = '';
        input.focus();
        document.getElementById('spotlight-results').innerHTML = '';
        document.getElementById('spotlight-results').classList.remove('visible');
        spotlightResults = [];
    } else {
        hideSpotlight();
    }
}

function hideSpotlight() {
    document.getElementById('spotlight').classList.add('hidden');
}

function onSpotlightInput(e) {
    const q = e.target.value.toLowerCase().trim();
    const resultsEl = document.getElementById('spotlight-results');

    if (!q) {
        resultsEl.classList.remove('visible');
        resultsEl.innerHTML = '';
        spotlightResults = [];
        return;
    }

    spotlightResults = spotlightIndex.filter(item =>
        item.label.toLowerCase().includes(q) || item.type.toLowerCase().includes(q)
    ).slice(0, 6);

    spotlightSelectedIdx = 0;

    if (spotlightResults.length === 0) {
        resultsEl.classList.remove('visible');
        resultsEl.innerHTML = '';
        return;
    }

    resultsEl.classList.add('visible');
    renderSpotlightResults();
}

function renderSpotlightResults() {
    const resultsEl = document.getElementById('spotlight-results');
    resultsEl.innerHTML = spotlightResults.map((r, i) =>
        `<div class="spot-result${i === spotlightSelectedIdx ? ' active' : ''}" data-idx="${i}">
            <span class="spot-icon">${r.icon}</span>
            <span class="spot-label">${r.label}</span>
            <span class="spot-type">${r.type}</span>
        </div>`
    ).join('');

    resultsEl.querySelectorAll('.spot-result').forEach(el => {
        el.addEventListener('mousedown', (e) => {
            e.preventDefault(); // Prevents input blur from hiding spotlight if applicable
            const idx = parseInt(el.dataset.idx);
            hideSpotlight();
            spotlightResults[idx].action();
        });
        el.addEventListener('mouseenter', () => {
            spotlightSelectedIdx = parseInt(el.dataset.idx);
            renderSpotlightResults();
        });
    });
}

function onSpotlightKey(e) {
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (spotlightSelectedIdx < spotlightResults.length - 1) {
            spotlightSelectedIdx++;
            renderSpotlightResults();
        }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (spotlightSelectedIdx > 0) {
            spotlightSelectedIdx--;
            renderSpotlightResults();
        }
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (spotlightResults.length > 0) {
            spotlightResults[spotlightSelectedIdx].action();
            hideSpotlight();
        }
    }
}

/* ==================== INTERACTIVE TERMINAL ==================== */
const terminalCommands = {
    help: `Available commands:
  help          Show this help
  about         About me
  skills        Show my skills
  projects      List my projects
  contact       My contact info
  clear         Clear terminal
  date          Show current UTC date
  whoami        Who am I?
  neofetch      System info`,

    about: `\n👋 Hi! I'm SUN 🌗 :ツ
I build full-stack web apps using Django and React.
I debug better with chai (it's basically my sudo command).`,

    skills: `{
  "languages": ["Python", "JavaScript", "HTML", "CSS"],
  "frameworks": ["Django", "React"],
  "tools": ["Git", "Docker", "PostgreSQL"],
  "superpower": "When code finally works: I knew what I was doing the whole time 😎"
}`,

    projects: `📂 Featured Projects:
  1. todoist       [JavaScript]
  2. crud-project  [Python, Django]
  3. PY            [Python]`,

    contact: `📧 Email:    sunilsaini5652@gmail.com
🐙 GitHub:   github.com/Sunil0620`,

    whoami: `guest@portfolio — Developer & ML Enthusiast`,

    date: () => new Date().toUTCString(),

    neofetch: `
  ██████╗  ██████╗ ██████╗ ████████╗███████╗
  ██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝
  ██████╔╝██║   ██║██████╔╝   ██║   █████╗
  ██╔═══╝ ██║   ██║██╔══██╗   ██║   ██╔══╝
  ██║     ╚██████╔╝██║  ██║   ██║   ██║
  ╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝

  OS:       macOS Sonoma 14.0 (Portfolio Edition)
  Shell:    zsh 5.9
  Terminal: portfolio-term v1.0
  CPU:      Portfolio M3 Max
  Memory:   128 GB
  Uptime:   since you loaded this page`
};

function initTerminal() {
    const input = document.getElementById('terminal-input');
    if (!input) return;

    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const cmd = input.value.trim().toLowerCase();
            input.value = '';
            processCommand(cmd);
        }
    });
}

function processCommand(cmd) {
    const output = document.getElementById('terminal-output');

    // Echo the command
    const cmdLine = document.createElement('p');
    cmdLine.innerHTML = `<span class="g">guest@portfolio</span> <span class="b">~</span> % ${escapeHtml(cmd)}`;
    output.appendChild(cmdLine);

    if (cmd === 'clear') {
        output.innerHTML = '';
        return;
    }

    let result = terminalCommands[cmd];
    if (result) {
        if (typeof result === 'function') result = result();
        const pre = document.createElement('pre');

        let escaped = escapeHtml(result);
        // Make email and github links clickable
        escaped = escaped.replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi, '<a href="mailto:$1" style="color:var(--accent);text-decoration:none;">$1</a>');
        escaped = escaped.replace(/(github\.com\/[a-zA-Z0-9._-]+)/gi, '<a href="https://$1" target="_blank" style="color:var(--accent);text-decoration:none;">$1</a>');

        pre.innerHTML = escaped;
        output.appendChild(pre);
    } else if (cmd) {
        const errP = document.createElement('p');
        errP.style.color = '#ff5f57';
        errP.textContent = `zsh: command not found: ${cmd}. Type 'help' for available commands.`;
        output.appendChild(errP);
    }

    // Auto-scroll
    const body = document.getElementById('terminal-body');
    if (body) body.scrollTop = body.scrollHeight;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/* ==================== RIGHT-CLICK CONTEXT MENU ==================== */
function initContextMenu() {
    const container = document.getElementById('windows-container');
    const desktop = document.getElementById('desktop');

    desktop.addEventListener('contextmenu', e => {
        if (locked) return;
        // Only on desktop background, not on windows/dock
        if (e.target.closest('.window') || e.target.closest('#dock-wrapper') || e.target.closest('#menu-bar')) return;
        e.preventDefault();
        showContextMenu(e.clientX, e.clientY);
    });

    document.addEventListener('click', hideContextMenu);
}

function showContextMenu(x, y) {
    const menu = document.getElementById('context-menu');
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.classList.remove('hidden');
    // Ensure it stays on screen
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) menu.style.left = (x - rect.width) + 'px';
    if (rect.bottom > window.innerHeight) menu.style.top = (y - rect.height) + 'px';
}

function hideContextMenu() {
    const menu = document.getElementById('context-menu');
    if (menu) menu.classList.add('hidden');
}

/* ==================== MISSION CONTROL ==================== */
function triggerMissionControl() {
    closeAllMenus();
    hideSpotlight();

    if (missionControlActive) {
        exitMissionControl();
        return;
    }

    missionControlActive = true;
    const wins = document.querySelectorAll('.window');
    const visible = [...wins].filter(w => w.style.display === 'flex');

    if (visible.length === 0) return;

    const cols = Math.ceil(Math.sqrt(visible.length));
    const vw = window.innerWidth;
    const vh = window.innerHeight - 60;
    const padding = 40;
    const cellW = (vw - padding * 2) / cols;
    const cellH = (vh - padding * 2) / Math.ceil(visible.length / cols);

    visible.forEach((w, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const targetX = padding + col * cellW + cellW / 2;
        const targetY = padding + 40 + row * cellH + cellH / 2;

        // Save original
        w.dataset.mcDisplay = w.style.display;
        w.dataset.mcTransform = w.style.transform || '';
        w.dataset.mcLeft = w.style.left;
        w.dataset.mcTop = w.style.top;
        w.dataset.mcWidth = w.style.width;
        w.dataset.mcHeight = w.style.height;

        const scale = Math.min(0.45, (cellW - 20) / w.offsetWidth, (cellH - 20) / w.offsetHeight);
        const cx = w.offsetLeft + w.offsetWidth / 2;
        const cy = w.offsetTop + w.offsetHeight / 2;
        const dx = targetX - cx;
        const dy = targetY - cy;

        w.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
        w.classList.add('mission-mode');

        // Click to focus and exit
        w._mcClick = () => {
            bringFront(w);
            exitMissionControl();
        };
        w.addEventListener('click', w._mcClick);
    });
}

function exitMissionControl() {
    missionControlActive = false;
    document.querySelectorAll('.window.mission-mode').forEach(w => {
        w.style.transform = w.dataset.mcTransform || '';
        w.classList.remove('mission-mode');
        if (w._mcClick) {
            w.removeEventListener('click', w._mcClick);
            delete w._mcClick;
        }
    });
}

/* ==================== MENU BAR DROPDOWNS ==================== */
function initMenuBar() {
    document.querySelectorAll('.menu-dropdown').forEach(dd => {
        const btn = dd.querySelector('.menu-btn');
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const isOpen = dd.classList.contains('open');
            closeAllMenus();
            if (!isOpen) dd.classList.add('open');
        });
        dd.addEventListener('mouseenter', () => {
            if (document.querySelector('.menu-dropdown.open') && !dd.classList.contains('open')) {
                closeAllMenus();
                dd.classList.add('open');
            }
        });
    });
    document.addEventListener('click', () => closeAllMenus());
    document.querySelectorAll('.dropdown-panel').forEach(p => {
        p.addEventListener('click', e => e.stopPropagation());
    });
}

function closeAllMenus() {
    document.querySelectorAll('.menu-dropdown.open').forEach(d => d.classList.remove('open'));
}

function openAboutMac() {
    closeAllMenus();
    toggleWindow('window-about-mac');
}

/* ==================== WINDOW MANAGEMENT ==================== */
function toggleWindow(id) {
    if (locked) return;
    if (missionControlActive) exitMissionControl();

    const win = document.getElementById(id);
    if (!win) return;
    const dot = document.getElementById('dot-' + id);

    if (win.style.display === 'none' || win.style.display === '') {
        // Bounce dock icon
        const di = document.querySelector(`.dock-item[data-app="${id}"]`);
        if (di) { di.classList.add('bouncing'); setTimeout(() => di.classList.remove('bouncing'), 600); }

        // Opening animation
        win.classList.add('opening');
        win.style.display = 'flex';
        void win.offsetWidth;
        win.classList.remove('opening');
        bringFront(win);
        if (dot) dot.classList.add('active');
        updateActiveAppName(id);
    } else {
        if (parseInt(win.style.zIndex) === zIndex) {
            minimizeWindow(id);
        } else {
            bringFront(win);
            updateActiveAppName(id);
        }
    }
}

function closeWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    win.style.transition = 'transform .25s cubic-bezier(.2,.9,.3,1), opacity .2s ease';
    win.style.transform = 'scale(0.88)';
    win.style.opacity = '0';
    setTimeout(() => {
        win.style.display = 'none';
        win.style.transform = '';
        win.style.opacity = '';
        win.style.transition = '';
    }, 250);
    const dot = document.getElementById('dot-' + id);
    if (dot) dot.classList.remove('active');
}

function minimizeWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    win.style.transition = 'transform .35s cubic-bezier(.2,.9,.3,1), opacity .25s ease';
    win.style.transform = 'scale(0.3) translateY(100%)';
    win.style.opacity = '0';
    setTimeout(() => {
        win.style.display = 'none';
        win.style.transform = '';
        win.style.opacity = '';
        win.style.transition = '';
    }, 350);
}

function maximizeWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    if (win.dataset.max === '1') {
        win.style.width = win.dataset.ow;
        win.style.height = win.dataset.oh;
        win.style.top = win.dataset.ot;
        win.style.left = win.dataset.ol;
        win.dataset.max = '0';
    } else {
        win.dataset.ow = win.style.width || win.offsetWidth + 'px';
        win.dataset.oh = win.style.height || win.offsetHeight + 'px';
        win.dataset.ot = win.style.top;
        win.dataset.ol = win.style.left;
        win.style.top = '0'; win.style.left = '0';
        win.style.width = '100%';
        win.style.height = 'calc(100vh - var(--menu-h))';
        win.dataset.max = '1';
    }
    bringFront(win);
}

function bringFront(win) { zIndex++; win.style.zIndex = zIndex; }

function closeAllWindows() {
    closeAllMenus();
    document.querySelectorAll('.window').forEach(w => closeWindow(w.id));
}
function showAllWindows() {
    closeAllMenus();
    ['window-about', 'window-projects', 'window-skills', 'window-contact'].forEach(id => {
        const w = document.getElementById(id);
        if (w && (w.style.display === 'none' || w.style.display === '')) toggleWindow(id);
    });
}

function updateActiveAppName(id) {
    const map = {
        'window-about': 'Finder', 'window-projects': 'Safari',
        'window-skills': 'Terminal', 'window-contact': 'Notes',
        'window-about-mac': 'Finder', 'window-settings': 'System Settings'
    };
    const el = document.getElementById('menu-app-name');
    if (el && map[id]) el.textContent = map[id];
}

/* ==================== DRAGGING ==================== */
function makeDraggable(el) {
    const hdr = el.querySelector('.window-header');
    let sx, sy, ox, oy;
    (hdr || el).addEventListener('mousedown', start);

    function start(e) {
        if (e.target.closest('.ctrl') || e.target.closest('.url-bar') || e.target.closest('.resize-handle')) return;
        if (missionControlActive) return;
        e.preventDefault();
        bringFront(el);
        sx = e.clientX; sy = e.clientY;
        ox = el.offsetLeft; oy = el.offsetTop;
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', stop);
    }
    function move(e) {
        let nx = ox + (e.clientX - sx);
        let ny = oy + (e.clientY - sy);
        if (ny < 0) ny = 0;
        el.style.left = nx + 'px';
        el.style.top = ny + 'px';
    }
    function stop() {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', stop);
    }
}

/* ==================== RESIZEABLE ==================== */
function makeResizable(handle) {
    const winId = handle.dataset.win;
    const win = document.getElementById(winId);
    if (!win) return;

    handle.addEventListener('mousedown', e => {
        e.preventDefault();
        e.stopPropagation();
        bringFront(win);
        const startX = e.clientX;
        const startY = e.clientY;
        const startW = win.offsetWidth;
        const startH = win.offsetHeight;

        function onMove(ev) {
            const nw = Math.max(300, startW + (ev.clientX - startX));
            const nh = Math.max(200, startH + (ev.clientY - startY));
            win.style.width = nw + 'px';
            win.style.height = nh + 'px';
        }
        function onUp() {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    });
}

/* ==================== DOCK MAGNIFICATION ==================== */
function initDock() {
    const wrapper = document.getElementById('dock-wrapper');
    const items = document.querySelectorAll('.dock-item');
    const BASE = 48;
    const MAX = 76;
    const RANGE = 140;

    wrapper.addEventListener('mousemove', e => {
        items.forEach(item => {
            const rect = item.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const dist = Math.abs(e.clientX - cx);
            let w = BASE;
            if (dist < RANGE) {
                const ratio = 1 - dist / RANGE;
                const ease = (Math.cos(Math.PI * (1 - ratio)) + 1) / 2;
                w = BASE + (MAX - BASE) * ease;
            }
            item.style.width = w + 'px';
        });
    });

    wrapper.addEventListener('mouseleave', () => {
        items.forEach(item => { item.style.width = BASE + 'px'; });
    });

    items.forEach(item => {
        item.addEventListener('click', () => {
            const app = item.getAttribute('data-app');
            if (app) toggleWindow(app);
        });
    });
}

/* ==================== LEFT RESIZE ==================== */
function makeResizableLeft(handle) {
    const winId = handle.dataset.win;
    const win = document.getElementById(winId);
    if (!win) return;

    handle.addEventListener('mousedown', e => {
        e.preventDefault();
        e.stopPropagation();
        bringFront(win);
        const startX = e.clientX;
        const startY = e.clientY;
        const startW = win.offsetWidth;
        const startH = win.offsetHeight;
        const startL = win.offsetLeft;

        function onMove(ev) {
            const dx = ev.clientX - startX;
            const nw = Math.max(300, startW - dx);
            const nh = Math.max(200, startH + (ev.clientY - startY));
            win.style.width = nw + 'px';
            win.style.height = nh + 'px';
            win.style.left = (startL + (startW - nw)) + 'px';
        }
        function onUp() {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    });
}

/* ==================== WALLPAPER CHANGER ==================== */
function setWallpaper(name) {
    const num = name.replace('img', '');
    document.body.style.background = `url('img/${num}.jpg') center/cover no-repeat`;
    document.body.style.animation = 'none';

    // Save
    localStorage.setItem('mac-wall', name);

    // Update active state in picker
    document.querySelectorAll('.wallpaper-opt').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.wall === name);
    });
}

/* ==================== CURSOR-REACTIVE PARTICLES (Enhanced) ==================== */
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

    // --- Tuning knobs ---
    const COUNT = 120;
    const CONNECT_DIST = 180;
    const MOUSE_RADIUS = 220;
    const MOUSE_CONNECT_DIST = 280;

    // Beautiful color palette
    const PALETTE = [
        { r: 110, g: 90, b: 255 },   // purple-blue
        { r: 0, g: 210, b: 255 },     // cyan
        { r: 255, g: 60, b: 120 },    // pink-red
        { r: 255, g: 160, b: 40 },    // orange
        { r: 80, g: 255, b: 160 },    // green
        { r: 180, g: 120, b: 255 },   // lavender
    ];

    function resize() {
        W = canvas.width = canvas.offsetWidth;
        H = canvas.height = canvas.offsetHeight;
    }

    function pickColor() {
        return PALETTE[Math.floor(Math.random() * PALETTE.length)];
    }

    function lerpColor(c1, c2, t) {
        return {
            r: c1.r + (c2.r - c1.r) * t,
            g: c1.g + (c2.g - c1.g) * t,
            b: c1.b + (c2.b - c1.b) * t,
        };
    }

    class Particle {
        constructor(x, y, isBurst = false) {
            this.x = x !== undefined ? x : Math.random() * W;
            this.y = y !== undefined ? y : Math.random() * H;
            this.baseR = isBurst ? Math.random() * 3 + 2 : Math.random() * 2.5 + 1;
            this.r = this.baseR;
            this.color = pickColor();
            this.pulseOffset = Math.random() * Math.PI * 2;
            this.pulseSpeed = 0.02 + Math.random() * 0.02;
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
            // Cursor interaction: gentle attraction + strong close-range repulsion
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (mouse.active && dist < MOUSE_RADIUS && dist > 0) {
                const angle = Math.atan2(dy, dx);
                if (dist < 80) {
                    // Strong repulsion when very close
                    const force = (80 - dist) / 80;
                    this.vx += Math.cos(angle) * force * 2.5;
                    this.vy += Math.sin(angle) * force * 2.5;
                } else {
                    // Gentle attraction at medium range
                    const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS * 0.15;
                    this.vx -= Math.cos(angle) * force;
                    this.vy -= Math.sin(angle) * force;
                }
            }

            // Friction
            this.vx *= 0.97;
            this.vy *= 0.97;

            this.x += this.vx;
            this.y += this.vy;

            // Pulse size
            this.r = this.baseR + Math.sin(frame * this.pulseSpeed + this.pulseOffset) * 0.6;

            // Burst particle decay
            if (this.isBurst) {
                this.life -= 0.012;
                this.alpha = Math.max(0, this.life);
                this.r = this.baseR * this.life;
            }

            // Wrap around edges with margin
            if (this.x < -30) this.x = W + 20;
            if (this.x > W + 30) this.x = -20;
            if (this.y < -30) this.y = H + 20;
            if (this.y > H + 30) this.y = -20;
        }

        draw() {
            if (this.alpha <= 0 || this.r <= 0) return;
            const { r, g, b } = this.color;

            // Glow layer (larger, softer)
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r * 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${this.alpha * 0.12})`;
            ctx.fill();

            // Core particle
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${this.alpha * 0.85})`;
            ctx.fill();

            // Bright center
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${this.alpha * 0.7})`;
            ctx.fill();
        }
    }

    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            const p1 = particles[i];
            if (p1.alpha <= 0) continue;

            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                if (p2.alpha <= 0) continue;

                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONNECT_DIST) {
                    const strength = (1 - dist / CONNECT_DIST);
                    const alpha = strength * 0.35 * Math.min(p1.alpha, p2.alpha);

                    // Gradient connection line
                    const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
                    const c1 = p1.color;
                    const c2 = p2.color;
                    grad.addColorStop(0, `rgba(${c1.r},${c1.g},${c1.b},${alpha})`);
                    grad.addColorStop(1, `rgba(${c2.r},${c2.g},${c2.b},${alpha})`);

                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = grad;
                    ctx.lineWidth = strength * 1.5 + 0.3;
                    ctx.stroke();
                }
            }

            // Connect particles near the mouse with a brighter line
            if (mouse.active) {
                const mdx = p1.x - mouse.x;
                const mdy = p1.y - mouse.y;
                const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

                if (mdist < MOUSE_CONNECT_DIST) {
                    const strength = (1 - mdist / MOUSE_CONNECT_DIST);
                    const alpha = strength * 0.5 * p1.alpha;
                    const c = p1.color;

                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${alpha})`;
                    ctx.lineWidth = strength * 2;
                    ctx.stroke();
                }
            }
        }
    }

    function drawMouseGlow() {
        if (!mouse.active) return;

        // Outer glow
        const outerGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 100);
        outerGrad.addColorStop(0, 'rgba(110, 90, 255, 0.15)');
        outerGrad.addColorStop(0.5, 'rgba(0, 210, 255, 0.06)');
        outerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 100, 0, Math.PI * 2);
        ctx.fillStyle = outerGrad;
        ctx.fill();

        // Inner bright spot
        const innerGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 20);
        innerGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
        innerGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 20, 0, Math.PI * 2);
        ctx.fillStyle = innerGrad;
        ctx.fill();
    }

    function animate() {
        frame++;
        ctx.clearRect(0, 0, W, H);

        // Remove dead burst particles
        particles = particles.filter(p => !p.isBurst || p.life > 0);

        particles.forEach(p => { p.update(); p.draw(); });
        drawConnections();
        drawMouseGlow();

        // Spawn trail particles when mouse moves fast
        if (mouse.active) {
            const mdx = mouse.x - prevMouse.x;
            const mdy = mouse.y - prevMouse.y;
            const speed = Math.sqrt(mdx * mdx + mdy * mdy);
            if (speed > 8 && particles.length < 350) {
                const tp = new Particle(
                    mouse.x + (Math.random() - 0.5) * 20,
                    mouse.y + (Math.random() - 0.5) * 20,
                    true
                );
                tp.baseR = Math.random() * 1.8 + 0.8;
                tp.vx = (Math.random() - 0.5) * 2;
                tp.vy = (Math.random() - 0.5) * 2;
                tp.life = 0.6;
                particles.push(tp);
            }
        }
        prevMouse.x = mouse.x;
        prevMouse.y = mouse.y;

        animId = requestAnimationFrame(animate);
    }

    function start() {
        resize();
        particles = [];
        for (let i = 0; i < COUNT; i++) particles.push(new Particle());
        animate();
    }

    function stop() {
        if (animId) { cancelAnimationFrame(animId); animId = null; }
    }

    // Track mouse on the login screen
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) {
        loginScreen.addEventListener('mousemove', e => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
            mouse.active = true;
        });
        loginScreen.addEventListener('mouseleave', () => {
            mouse.x = -9999;
            mouse.y = -9999;
            mouse.active = false;
        });

        // Particle Burst on click — dramatic colorful explosion
        loginScreen.addEventListener('click', e => {
            if (e.target.closest('.login-container') && e.target !== loginScreen && e.target !== canvas) return;
            const rect = canvas.getBoundingClientRect();
            const cx = e.clientX - rect.left;
            const cy = e.clientY - rect.top;

            // Add 30 burst particles with random colors
            for (let i = 0; i < 30; i++) {
                const bp = new Particle(cx, cy, true);
                bp.baseR = Math.random() * 4 + 2;
                bp.r = bp.baseR;
                particles.push(bp);
            }

            // Cap total particles to keep performance good
            if (particles.length > 400) {
                particles.splice(0, particles.length - 400);
            }
        });
    }

    window.addEventListener('resize', resize);

    // Start when login screen becomes visible, stop on unlock
    const observer = new MutationObserver(() => {
        const ls = document.getElementById('login-screen');
        if (ls && !ls.classList.contains('hidden')) {
            resize();
            if (!animId) start();
        } else {
            stop();
        }
    });

    // Observe login screen visibility
    const ls = document.getElementById('login-screen');
    if (ls) {
        observer.observe(ls, { attributes: true, attributeFilter: ['class'] });
        // Also start immediately if login screen is not hidden (initial page load)
        if (!ls.classList.contains('hidden')) start();
        // Start after boot finishes (login becomes visible)
        setTimeout(() => { if (!ls.classList.contains('hidden')) { resize(); if (!animId) start(); } }, 2500);
    }
})();

/* ==================== SETTINGS PANE SWITCHING ==================== */
function switchSettingsPane(pane) {
    // Update sidebar active
    document.querySelectorAll('.settings-item').forEach(i => {
        i.classList.toggle('active', i.dataset.pane === pane);
    });
    // Show/hide panes
    document.querySelectorAll('.settings-pane').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById('pane-' + pane);
    if (target) target.classList.remove('hidden');
}

/* ==================== APPEARANCE MODE ==================== */
function setAppearanceMode(mode, btn, save = true) {
    if (btn) {
        document.querySelectorAll('.toggle-btn').forEach(b => {
            if (b.parentNode === btn.parentNode) b.classList.remove('active');
        });
        btn.classList.add('active');
    }

    if (save) localStorage.setItem('mac-appearance', mode);

    if (mode === 'light') {
        document.documentElement.style.setProperty('--win-bg', 'rgba(245,245,245,0.88)');
        document.documentElement.style.setProperty('--win-shadow', '0 22px 70px rgba(0,0,0,0.15), 0 0 0 0.5px rgba(0,0,0,0.05)');
        document.documentElement.style.setProperty('--text-primary', 'rgba(0,0,0,0.85)');
        document.documentElement.style.setProperty('--text-secondary', 'rgba(0,0,0,0.55)');
        document.documentElement.style.setProperty('--text-tertiary', 'rgba(0,0,0,0.35)');
        document.documentElement.style.setProperty('--surface', 'rgba(0,0,0,0.04)');
        document.documentElement.style.setProperty('--surface-hover', 'rgba(0,0,0,0.06)');
        document.documentElement.style.setProperty('--border-subtle', 'rgba(0,0,0,0.08)');
    } else {
        document.documentElement.style.setProperty('--win-bg', 'rgba(30,30,30,0.78)');
        document.documentElement.style.setProperty('--win-shadow', '0 24px 80px rgba(0,0,0,0.45), 0 0 0 0.5px rgba(255,255,255,0.08)');
        document.documentElement.style.setProperty('--text-primary', 'rgba(255,255,255,0.92)');
        document.documentElement.style.setProperty('--text-secondary', 'rgba(255,255,255,0.55)');
        document.documentElement.style.setProperty('--text-tertiary', 'rgba(255,255,255,0.35)');
        document.documentElement.style.setProperty('--surface', 'rgba(255,255,255,0.06)');
        document.documentElement.style.setProperty('--surface-hover', 'rgba(255,255,255,0.1)');
        document.documentElement.style.setProperty('--border-subtle', 'rgba(255,255,255,0.08)');
    }
}

/* ==================== ACCENT COLOR ==================== */
function setAccentColor(color, dot, save = true) {
    document.documentElement.style.setProperty('--accent', color);
    document.querySelectorAll('.accent-dot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
    if (save) localStorage.setItem('mac-accent', color);
}

/* ==================== DOCK SIZE ==================== */
function setDockSize(size, save = true) {
    const items = document.querySelectorAll('.dock-item');
    items.forEach(item => { item.style.width = size + 'px'; });
    if (save) localStorage.setItem('mac-dock-size', size);
}

/* ==================== UPDATE DEVELOPER NAME ==================== */
function updateDevName(name) {
    const el = document.querySelector('.login-username');
    if (el) el.textContent = name || 'Guest User';
    localStorage.setItem('mac-dev-name', name || 'Guest User');
}

