# HackSim - Hollywood Hacking Terminal Simulator

A full-featured, browser-based hacking terminal simulator built with React. Features a complete dark OS desktop environment with terminal, browser, file manager, system monitor, calculator, notepad, settings, and 100+ terminal commands.

**Perfect as a:** Portfolio piece, UI template, terminal simulator, or dark-themed React starter project.

## live preview:  https://hacksimulator3.netlify.app

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server (accessible on your network)
npm run dev

# 3. Open in browser
# Local:   http://localhost:5173
# Network: http://YOUR-IP:5173
```

That's it. No API keys, no database, no backend needed.

## Production Build

```bash
npm run build
# Output in dist/ folder - deploy anywhere (Netlify, Vercel, GitHub Pages, etc.)
```

## Tech Stack

- **React 19** + **Vite 8**
- **Web Audio API** - Sound effects engine (clicks, typing, alarms, ambient)
- **Canvas API** - Matrix rain animation
- **Pure CSS** - No UI frameworks, fully custom dark theme
- **Zero dependencies** beyond React

## Features

### Desktop Environment
- **Window Management** - Drag, resize (8 handles), minimize, maximize, close, z-index stacking
- **Taskbar** - Running apps, start menu, system tray, live clock
- **Desktop Icons** - 2-column grid, single-click to launch
- **Start Menu** - All apps listed
- **4 Color Themes** - Green, Amber, Cyan, Red (switchable in Settings)
- **Right-Click Context Menus** - Desktop, icons, and taskbar items

### Apps (7 built-in)

| App | Description |
|-----|-------------|
| **Terminal** | 100+ commands: shell, crypto, network, hacking tools, fun commands |
| **DarkWire Browser** | 6 dark news sites, bookmarks, incognito mode, article downloads |
| **File Manager** | Navigate a creepy virtual filesystem with 40+ files |
| **Notepad** | Editable text editor with operator journal |
| **System Monitor** | Live CPU/RAM/network graphs, processes, alerts |
| **Calculator** | Basic calculator with expression evaluation |
| **Settings** | Theme switcher, audio/effects toggles, system info |

### Terminal Commands (100+)

```
Shell:      ls, cd, pwd, cat, mkdir, touch, rm, cp, mv, grep, find, head, tail, wc, chmod, echo, tree
System:     ps, top, kill, df, free, ifconfig, netstat, lsof, dmesg, uname, w, id
Crypto:     base64, rot13, hash, md5, sha256, hex, uuid, ssl-check
Network:    ping, traceroute, curl, wget, dns-lookup, port-scan, ssh, scp
Tools:      nmap, exploit, decrypt, ssh-brute, inject, keylog, firewall, vpn, rootkit, backdoor
Fun:        fortune, cowsay, calc, weather, joke, time, neofetch, ascii-art, matrix
Easter:     freedom, hack-cam, intercept, bypass, god-mode, matrix-breach, summon, coffee, 8ball
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Global search (commands + apps) |
| `Ctrl+T` | Open new terminal |
| `Ctrl+W` | Close focused window |
| `Alt+Tab` | Cycle through open windows |
| `Escape` | Dismiss overlays |
| `Ctrl+L` | Clear terminal |
| `Tab` | Autocomplete in terminal |
| `↑/↓` | Terminal command history |

### Special Features
- **Pipe Support** - Chain commands: `cat file | head`
- **Kill Command** - `kill <pid>` (some processes are protected...)
- **Surveillance System** - Creepy alert popups every ~2 minutes
- **Fight Back** - Type `freedom` or `real-freedom` to stop the surveillance
- **Easter Eggs** - Hidden commands throughout (`hack-cam`, `god-mode`, `summon`, etc.)
- **Matrix Rain** - Toggle from Settings
- **Sound Effects** - Boot sequence, typing, alarms, ambient sounds
- **Boot Sequence** - Animated startup with progress bar
- **Toast Notifications** - Non-blocking feedback messages
- **Right-Click Menus** - Context-sensitive actions everywhere

## Project Structure

```
HackSim/
  index.html            # Entry point
  package.json          # Dependencies & scripts
  vite.config.js        # Vite configuration
  src/
    main.jsx            # React bootstrap
    App.jsx             # All components & logic (~2800 lines)
    index.css           # All styles (~1700 lines)
    App.css             # (empty - all styles in index.css)
```

## Using as a Template

1. Fork or download this repo
2. Run `npm install`
3. Modify `App.jsx` to add your own apps/commands
4. Customize themes in `index.css` by editing CSS variables under `[data-theme]`
5. Replace the news sites in `NEWS_SITES` with your own content
6. Deploy with `npm run build`

## Customization

### Adding a New Command
In `App.jsx`, find the `execCmd` function and add a new `case` to the switch statement:

```javascript
case 'mycommand': {
  add('Output here', 'accent');  // 'accent', 'err', 'dim', 'warning', 'danger'
  break;
}
```

### Adding a New Theme
In `index.css`, add a new `[data-theme]` block:

```css
[data-theme="mytheme"] {
  --accent: #ff00ff;
  --accent-rgb: 255, 0, 255;
  --border: rgba(255, 0, 255, 0.3);
  --glow: 0 0 20px rgba(255, 0, 255, 0.2);
}
```

### Adding a New App
1. Create a function component in `App.jsx`
2. Add it to `appMap`
3. Add an icon to `desktopIcons`
4. Add CSS styles in `index.css`

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge). Uses:
- Web Audio API (for sound effects)
- CSS Grid/Flexbox
- Canvas API (for matrix rain)
- `backdrop-filter` (for blur effects)

## License

Free to use, modify, and distribute. No attribution required.
