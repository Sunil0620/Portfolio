<div align="center">

# macOS Portfolio

**A fully interactive macOS Sonoma desktop — running entirely in the browser.**

[**Live Demo →**](https://sunil0620.github.io/Portfolio/)

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen?style=flat)

</div>

---

## What is this?

A developer portfolio disguised as a fully functional OS. It boots, logs in, and drops you into a macOS-like desktop where every window is a section of my portfolio. No React, no Vue, no bundler — just vanilla HTML, CSS, and JavaScript.

---

## Features

### Desktop Shell
- **Boot sequence** — aurora canvas animation, kernel boot log, boot chime
- **Login screen** — particle physics background, live clock, password prompt
- **Menu bar** — Apple menu, Spotlight, Control Center, live UTC clock
- **Dock** — icon magnification, open-app dot indicators
- **Mission Control** — `F3` tiles all open windows
- **Screen saver** — activates after 90s idle, aurora animation with clock
- **Right-click context menu**, desktop click ripple, custom animated cursor

### Windows
| App | Contents |
|-----|----------|
| **Finder** | About me — skills, stack, resume download |
| **Safari** | Projects showcase |
| **Terminal** | Interactive shell with real commands |
| **Notes** | Contact form |
| **Music** | Classic Bollywood playlist (YouTube IFrame API + Web Audio visualizer) |
| **VS Code** | Syntax-highlighted view of the actual source files |
| **System Settings** | Wallpaper picker, dark/light mode, accent colors, dock size |
| **About This Mac** | Humorous hardware specs and session stats |
| **TextEdit** | This README (editable in-app) |
| **Console** | Live filterable log viewer |
| **Snake** | Playable canvas Snake game |
| **Trash** | Developer-themed trash items |
| **node_modules** | Joke Finder window — 2.8M items, 47 GB |
| **todo.txt** | Interactive developer to-do list |

### Terminal Commands
```
portfolio   about  skills  projects  contact
links       linkedin  resume  hire
fun         matrix  hack  snake  sl  weather  cowsay  stats
misc        date  clear  sudo rm -rf /
```

### Easter Eggs
A few are hidden in plain sight. One involves a classic cheat code. One involves the terminal. One will delete your entire filesystem (not really).

---

## Tech Stack

| Layer | Technology |
|--|--|
| Markup | Vanilla HTML5 — single `index.html` |
| Styles | Vanilla CSS3 — single `style.css` |
| Logic | Vanilla JS (ES2024) — single `script.js` |
| Fonts | Inter, Space Grotesk, IBM Plex Mono (Google Fonts) |
| Music | YouTube IFrame API + Web Audio API |
| Contact | Formspree |
| Storage | `localStorage` |
| **Dependencies** | **None** |

---

## Getting Started

```bash
git clone https://github.com/Sunil0620/Portfolio.git
cd Portfolio/mac-portfolio
# open index.html in any modern browser
open index.html
```

No install step. No build step.

---

## Project Structure

```
mac-portfolio/
├── index.html        # entire UI markup
├── script.js         # all JavaScript (~176 KB)
├── style.css         # all CSS (~109 KB)
├── img/              # 6 wallpaper photos
├── assets/           # resume PDF + robots.txt
└── User/             # avatar + custom wallpaper slot
```

---

## Customising

| What | Where |
|------|-------|
| Profile photo | `User/avatar.jpg` |
| Custom wallpaper | `User/2.jpg` (slot 2 in Settings) |
| Resume | `assets/Sunil-Saini-Resume.pdf` |
| Projects | `#window-projects` section in `index.html` |
| Music playlist | `TRACKS` array in `script.js` |

---

## Contact

**Sunil Saini** — Full-Stack Developer & ML Enthusiast

[sunilsaini5652@gmail.com](mailto:sunilsaini5652@gmail.com) · [GitHub](https://github.com/Sunil0620) · [LinkedIn](https://linkedin.com/in/sunil-saini-6190ba255/)

---

<div align="center">
<sub>Built with zero dependencies and an unreasonable amount of attention to detail.</sub>
</div>
