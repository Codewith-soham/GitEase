// agent.js
// Standalone local agent that runs on the user's machine
// Connects to GitEase backend via WebSocket
// Receives git commands and executes them locally

import { createConnection } from './websocketHandler.js'

createConnection()
