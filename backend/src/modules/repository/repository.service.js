import { getGithubRepos } from "../../services/github.services.js";
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

export {
    getRepos
}