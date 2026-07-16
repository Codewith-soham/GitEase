import { runAgentCommand } from "../../services/agent.services.js";
import { resolveLocalRepoPath } from "../repository/repository.service.js";
import { ApiError } from "../../utils/ApiError.js";

const getStatus = async(userId, { repositoryId }) => {
    const cwd = await resolveLocalRepoPath(userId, repositoryId)

    return await runAgentCommand(userId, { command: 'status', cwd })
}

const addFiles = async(userId, { repositoryId, files }) => {
    const cwd = await resolveLocalRepoPath(userId, repositoryId)

    return await runAgentCommand(userId, { command: 'add', files, cwd })
}

const commitChanges = async(userId, { repositoryId, commitMessage }) => {
    const cwd = await resolveLocalRepoPath(userId, repositoryId)

    return await runAgentCommand(userId, { command: 'commit', commitMessage, cwd })
}

const pushChanges = async(userId, { repositoryId, branch, remote }) => {
    const cwd = await resolveLocalRepoPath(userId, repositoryId)

    return await runAgentCommand(userId, { command: 'push', branch, remote, cwd })
}

const pullChanges = async(userId, { repositoryId, branch, remote }) => {
    const cwd = await resolveLocalRepoPath(userId, repositoryId)

    return await runAgentCommand(userId, { command: 'pull', branch, remote, cwd })
}

const fetchRemote = async(userId, { repositoryId, remote }) => {
    const cwd = await resolveLocalRepoPath(userId, repositoryId)

    return await runAgentCommand(userId, { command: 'fetch', remote, cwd })
}

const listBranches = async(userId, { repositoryId }) => {
    const cwd = await resolveLocalRepoPath(userId, repositoryId)

    const result = await runAgentCommand(userId, { command: 'listBranches', cwd })

    // `git branch` prints one branch per line, current branch prefixed with "* "
    // and a detached HEAD as "* (HEAD detached at <ref>)" — skip that line.
    const branches = result.stdout
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => ({
            current: line.startsWith('*'),
            name: line.replace(/^\*\s*/, '').trim()
        }))
        .filter((b) => b.name && !b.name.startsWith('('))

    return { branches }
}

const createBranch = async(userId, { repositoryId, branch }) => {
    const cwd = await resolveLocalRepoPath(userId, repositoryId)

    return await runAgentCommand(userId, { command: 'createBranch', branch, cwd })
}

const switchBranch = async(userId, { repositoryId, branch }) => {
    const cwd = await resolveLocalRepoPath(userId, repositoryId)

    return await runAgentCommand(userId, { command: 'switchBranch', branch, cwd })
}

const deleteBranch = async(userId, { repositoryId, branch, force, confirmed }) => {
    if (confirmed !== true) {
        throw new ApiError(400, "Deletion must be confirmed")
    }

    const cwd = await resolveLocalRepoPath(userId, repositoryId)

    return await runAgentCommand(userId, { command: 'deleteBranch', branch, force, cwd })
}

export {
    getStatus,
    addFiles,
    commitChanges,
    pushChanges,
    pullChanges,
    fetchRemote,
    createBranch,
    switchBranch,
    deleteBranch,
    listBranches
}
