import fs from 'fs';
import path from 'path';

//allowed commands 
const ALLOWED_COMMANDS = {
  clone: { minArgs: 1, maxArgs: 2 },
  pull: { minArgs: 0, maxArgs: 2 },
  push: { minArgs: 0, maxArgs: 3 },
  commit: { minArgs: 2, maxArgs: 2 }, // -m "message"
  checkout: { minArgs: 1, maxArgs: 2 },
  status: { minArgs: 0, maxArgs: 0 },
  init: {minArgs: 0, maxArgs: 0},
  add: {minArgs: 1, maxArgs: 1}
};

const UNSAFE_PATTERN = /[;&|`$()<>\\]|\.\./;

function isSafeArg(arg) {
  return typeof arg === 'string' && arg.length < 500 && !UNSAFE_PATTERN.test(arg);
}

function validateCwd(cwd, requireGitRepo = true) {
  if (typeof cwd !== 'string' || !cwd) {
    throw new Error('cwd is required');
  }
  const resolved = path.resolve(cwd);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    throw new Error(`Invalid cwd: ${resolved}`);
  }
  if (requireGitRepo && !fs.existsSync(path.join(resolved, '.git'))) {
    throw new Error(`Not a git repository: ${resolved}`);
  }
  return resolved;
}

export function validateCommand({ command, args = [], cwd }) {
  if (!Object.prototype.hasOwnProperty.call(ALLOWED_COMMANDS, command)) {
    throw new Error(`Command not allowed: ${command}`);
  }

  const { minArgs, maxArgs } = ALLOWED_COMMANDS[command];
  if (!Array.isArray(args) || args.length < minArgs || args.length > maxArgs) {
    throw new Error(`Invalid arg count for ${command}`);
  }

  for (const arg of args) {
    if (!isSafeArg(arg)) {
      throw new Error(`Unsafe argument rejected: ${arg}`);
    }
  }

  // clone and init don't require an existing repo at cwd (target dir may not exist yet / not a repo yet)
  const requireGitRepo = !['clone', 'init'].includes(command);
  const safeCwd = validateCwd(cwd, requireGitRepo);

  return { command, args, cwd: safeCwd };
}