import fs from 'fs';
import path from 'path';

//allowed commands 
const ALLOWED_COMMANDS = {
  clone: { minArgs: 1, maxArgs: 2 },
  pull: { minArgs: 0, maxArgs: 2 },
  push: { minArgs: 0, maxArgs: 3 },
  commit: { minArgs: 2, maxArgs: 2 }, // -m "message"
  checkout: { minArgs: 1, maxArgs: 2 },
  status: { minArgs: 2, maxArgs: 2 }, // --porcelain=v2 -b
  init: {minArgs: 0, maxArgs: 0},
  add: { minArgs: 2, maxArgs: 1000 }, // -- <file...>, translateCommand always prefixes with '--'
  fetch: { minArgs: 1, maxArgs: 1 },
  createBranch: { minArgs: 1, maxArgs: 2 }, // checkout -b <branch>
  switchBranch: { minArgs: 1, maxArgs: 1 }, // checkout <branch>
  deleteBranch: { minArgs: 2, maxArgs: 2 }, // branch -d|-D <branch>
  listBranches: { minArgs: 0, maxArgs: 0 } // branch
};

const UNSAFE_PATTERN = /[;&|`$()<>\\]|\.\./;

// Matches a valid branch name: no whitespace, none of ~^:?*[`, no leading '-',
// no leading/trailing '/' or '.', no '..', max length 250.
const BRANCH_NAME_PATTERN = /^(?!-)(?!.*\.\.)(?!.*[/.]$)[^\s~^:?*[`/.][^\s~^:?*[`]{0,249}$/;

function isSafeArg(arg) {
  return typeof arg === 'string' && arg.length < 500 && !UNSAFE_PATTERN.test(arg);
}

function isSafeBranchName(name) {
  return typeof name === 'string' && name.length > 0 && name.length <= 250 && BRANCH_NAME_PATTERN.test(name);
}

function isSafeFilePath(file, cwd) {
  if (file === '.') {
    return true;
  }
  if (typeof file !== 'string' || !file) {
    return false;
  }
  const resolvedCwd = path.resolve(cwd);
  const resolvedFile = path.resolve(cwd, file);
  return resolvedFile === resolvedCwd || resolvedFile.startsWith(resolvedCwd + path.sep);
}

const REMOTE_NAME_PATTERN = /^[a-zA-Z0-9_.-]+$/;

function getRemoteArg(command, args) {
  if (command === 'push') {
    if (args.length === 0) return undefined;
    return args[0] === '-u' ? args[1] : args[0];
  }
  if (command === 'pull' || command === 'fetch') {
    return args.length > 0 ? args[0] : undefined;
  }
  return undefined;
}

function getBranchArg(command, args) {
  if (['checkout', 'createBranch', 'switchBranch', 'deleteBranch'].includes(command)) {
    return args.length > 0 ? args[args.length - 1] : undefined;
  }
  return undefined;
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

  if (command === 'add') {
    for (const arg of args) {
      if (arg !== '.' && !isSafeFilePath(arg, safeCwd)) {
        throw new Error(`Unsafe file path rejected: ${arg}`);
      }
    }
  }

  const branchArg = getBranchArg(command, args);
  if (branchArg !== undefined && !isSafeBranchName(branchArg)) {
    throw new Error(`Unsafe branch name rejected: ${branchArg}`);
  }

  const remoteArg = getRemoteArg(command, args);
  if (remoteArg !== undefined && !REMOTE_NAME_PATTERN.test(remoteArg)) {
    throw new Error(`Unsafe remote name rejected: ${remoteArg}`);
  }

  return { command, args, cwd: safeCwd };
}