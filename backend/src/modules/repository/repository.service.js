import { createGithubBranch, createGithubRepo, getGithubBranchSha, getGithubRepos, listGithubBranch } from "../../services/github.services.js";
import { findUserbyId } from "../auth/auth.repository.js";

const getRepos = async(userId) => {
    const user = await findUserbyId(userId)
    const repos = await getGithubRepos(user.githubAccessToken)

    return repos.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullname: repo.fullname,
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

export {
    getRepos,
    createRepository,
    createBranch,
    listBranch
}