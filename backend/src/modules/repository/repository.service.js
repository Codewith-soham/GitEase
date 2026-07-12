import path from "path";
import { createGithubBranch, createGithubRepo, deleteGithubrepo, getGithubBranchSha, getGithubRepos, listGithubBranch, deleteGithubBranch } from "../../services/github.services.js";
import { findUserbyId } from "../auth/auth.repository.js";
import { findLocalRepo, upsertLocalRepo, listLocalRepos, deleteLocalRepo } from "./repository.repository.js";
import { ApiError } from "../../utils/ApiError.js";

const getRepos = async(userId) => {
    const user = await findUserbyId(userId)
    const repos = await getGithubRepos(user.githubAccessToken)

    return repos.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullname: repo.full_name,
        description: repo.description,
        visibility: repo.visibility,
        defaultBranch: repo.default_branch,
        url: repo.html_url,
        language: repo.language,
        updatedAt: repo.updated_at
    }))
}
const createRepository = async(user, body) => {
    const newRepo = await createGithubRepo(user.githubAccessToken, body)

    return {
        id: newRepo.id,
        name: newRepo.name,
        private: newRepo.private,
        description: newRepo.description,
        url: newRepo.html_url,
        updatedAt: newRepo.updated_at
    }
}

const createBranch = async(user, repoName, body) => {
    const { branchName, baseBranch} = body

    const sha = await getGithubBranchSha(user.githubAccessToken, user.username, repoName, baseBranch)

    const newBranch = await createGithubBranch(user.githubAccessToken, user.username, repoName, branchName, sha)

    return {
        name: newBranch.ref.replace("refs/heads/", ""),
        sha: newBranch.object.sha
    }
}

const listBranch = async(user, repoName) => {

    const branches = await listGithubBranch(user.githubAccessToken, user.username, repoName)

    return branches.map(branch => ({
        name: branch.name,
        sha: branch.commit.sha
    }))
}

const deleteRepo = async(user, repoName) => {

    const deletedRepo = await deleteGithubrepo(user.githubAccessToken, user.username, repoName)

    return deletedRepo
}

const deleteBranch = async(user, repoName, branchName) => {
    await deleteGithubBranch(user.githubAccessToken, user.username, repoName, branchName)
    return { deletedBranch: branchName }
}

// Resolves a client-supplied repositoryId to the trusted local folder the
// agent cloned/initialized it into. This is the only path a `cwd` should
// ever reach runAgentCommand through — never take cwd from the client directly.
const resolveLocalRepoPath = async(userId, repositoryId) => {
    const localRepo = await findLocalRepo(userId, repositoryId)

    if (!localRepo) {
        throw new ApiError(404, "Local repository not found")
    }

    return localRepo.localPath
}

// Called whenever a clone/init command succeeds against the agent, to record
// which local folder a repository lives in for this user.
// NOTE: no clone/init flow currently calls this yet — automation.service.js's
// push workflow runs a bare `git init` step without a repositoryId/localPath,
// and there is no clone flow at all. Wiring this in is a follow-up task.
const recordLocalRepoPath = async(userId, repositoryId, localPath) => {
    return await upsertLocalRepo(userId, repositoryId, localPath)
}

const FORBIDDEN_PATH_CHARS = /[;&|`$()<>]/

const validateLocalPath = (p) => {
    if (typeof p !== "string" || p.length === 0) {
        throw new ApiError(400, "localPath must be a non-empty string")
    }

    if (p.length >= 500) {
        throw new ApiError(400, "localPath must be less than 500 characters")
    }

    if (!path.win32.isAbsolute(p) && !path.posix.isAbsolute(p)) {
        throw new ApiError(400, "localPath must be an absolute path")
    }

    const segments = p.split(/[\\/]/)
    if (segments.includes("..")) {
        throw new ApiError(400, "localPath must not contain '..' segments")
    }

    if (FORBIDDEN_PATH_CHARS.test(p)) {
        throw new ApiError(400, "localPath contains forbidden characters")
    }
}

const connectLocalRepo = async(userId, repositoryId, localPath) => {
    validateLocalPath(localPath)

    return await recordLocalRepoPath(userId, repositoryId, localPath)
}

const listLocalRepoPaths = async(userId) => {
    const localRepos = await listLocalRepos(userId)

    return localRepos.map(localRepo => ({
        repositoryId: localRepo.repositoryId,
        localPath: localRepo.localPath,
        updatedAt: localRepo.updatedAt
    }))
}

const removeLocalRepoPath = async(userId, repositoryId) => {
    const deleted = await deleteLocalRepo(userId, repositoryId)

    if (!deleted) {
        throw new ApiError(404, "Local repository not found")
    }

    return { deletedRepositoryId: repositoryId }
}

export {
    getRepos,
    createRepository,
    createBranch,
    listBranch,
    deleteRepo,
    deleteBranch,
    resolveLocalRepoPath,
    recordLocalRepoPath,
    validateLocalPath,
    connectLocalRepo,
    listLocalRepoPaths,
    removeLocalRepoPath
}