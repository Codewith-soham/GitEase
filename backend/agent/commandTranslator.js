export function translateCommand({ command, files, branch, remote, commitMessage, force }) {
  const effectiveRemote = remote || 'origin';
  let gitCommand = command;
  let args;

  switch (command) {
    case 'status':
      args = ['--porcelain=v2', '-b'];
      break;
    case 'add':
      args = ['--', ...(files && files.length ? files : ['.'])];
      break;
    case 'commit':
      args = ['-m', commitMessage];
      break;
    case 'push':
      args = ['-u', effectiveRemote, branch];
      break;
    case 'pull':
      args = branch ? [effectiveRemote, branch] : [effectiveRemote];
      break;
    case 'fetch':
      args = [effectiveRemote];
      break;
    case 'listBranches':
      gitCommand = 'branch';
      args = [];
      break;
    case 'createBranch':
      gitCommand = 'checkout';
      args = ['-b', branch];
      break;
    case 'switchBranch':
      gitCommand = 'checkout';
      args = [branch];
      break;
    case 'deleteBranch':
      gitCommand = 'branch';
      args = [force ? '-D' : '-d', branch];
      break;
    default:
      throw new Error(`Unknown command: ${command}`);
  }

  return { gitCommand, args };
}
