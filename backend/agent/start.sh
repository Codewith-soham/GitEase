#!/bin/sh
set -e

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Install it from https://nodejs.org and re-run this script."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies, this only happens once..."
  npm install
fi

node agent.js
