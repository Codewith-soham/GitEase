# GitEase Local Agent

This is a small helper program that runs on **your own computer**. It lets the
GitEase web dashboard run git commands (clone, commit, push, branch, etc.)
against repositories that live on your machine — the dashboard itself never
touches your files directly, it only talks to this agent, and this agent is
the thing that actually runs `git`.

You need Node.js installed (v18 or newer) — get it from https://nodejs.org
if you don't have it. Nothing else is required.

## Setup (one time)

1. Unzip this folder anywhere on your computer.
2. **Windows:** double-click `start.bat`.
   **Mac/Linux:** open a terminal in this folder and run `./start.sh`
   (first time only: `chmod +x start.sh`).
3. Leave the window open — it installs its dependencies on first run, then
   connects to the GitEase backend and waits to be paired.
4. Open the GitEase dashboard in your browser, go to the agent section, and
   click **"Connect Agent"**. This pairs your browser with the agent running
   on your machine — no copy/pasting tokens required.

Once paired, you can close the dashboard tab; the agent keeps running in the
background (the terminal window) and reconnects automatically if your
connection drops.

## Running it again later

Just re-run `start.bat` / `start.sh`. It remembers your pairing, so you
shouldn't need to click "Connect Agent" again unless you explicitly
disconnect or revoke it from the dashboard.

## Troubleshooting

- **Dashboard shows the agent as offline, but the terminal window is
  running:** check the terminal for connection errors. Make sure nothing
  else is using it, and that your firewall isn't blocking outbound
  connections from `node.exe`.
- **"Connect Agent" doesn't do anything:** the agent listens on
  `http://127.0.0.1:8843` for pairing requests from your browser — make sure
  no other program is already using that port, and that the agent's terminal
  window is still open and running.
- **Nothing happens when you double-click `start.bat`:** right-click it and
  choose "Run as administrator" isn't usually needed — instead, open a
  terminal (cmd/PowerShell) in this folder and run `start.bat` directly so
  you can see any error message.
