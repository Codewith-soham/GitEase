import axios from "axios"
import { asyncHandler } from "../utils/asyncHandler.js"
import { response } from "express"
import { ApiError } from "../utils/ApiError.js"

// GitHub error bodies look like { message: "...", errors: [...] }.
// Axios throws a generic "Request failed with status code X" with no
// context, so unwrap the real message/status here before it reaches the
// client as an opaque 500.
const rethrowGithubError = (err) => {
    if (err.response) {
        const message = err.response.data?.message || "GitHub API request failed"
        throw new ApiError(err.response.status, message, err.response.data?.errors)
    }
    throw err
}

const exchangeCodeForToken = async (code) => {
    console.log('CLIENT_ID:', process.env.CLIENT_ID)
    console.log('SECRET:', process.env.CLIENT_SECRET ? 'exists' : 'missing')
    console.log('CODE:', code)

    const response = await axios.post(
        "https://github.com/login/oauth/access_token",
        {
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            code: code
        },
        {
            headers: {
                Accept: "application/json"
            }
        }
    )

    console.log('GITHUB RESPONSE:', response.data)
    return response.data.access_token
}

const getGithubProfile = async (accessToken) => {
    const response = await axios.get(
        "https://api.github.com/user",
        {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    )
    return response.data
}

const getGithubRepos = async(accessToken) => {
    try {
        const response = await axios.get(
            "https://api.github.com/user/repos",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        )
        return response.data
    } catch (err) {
        rethrowGithubError(err)
    }
}

//will create github repo giving name,private(type of repo),description and autoInit data of repo
const createGithubRepo = async(accessToken, payload) => {
    const {name , private: isPrivate, description, auto_init} = payload
    try {
        const response = await axios.post(
            "https://api.github.com/user/repos",
            {
                name,
                private: isPrivate,
                description,
                auto_init
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                }
            }
        )
        return response.data
    } catch (err) {
        rethrowGithubError(err)
    }
}

const getGithubBranchSha = async(accessToken , owner, repoName , baseBranch) => {
    console.log(owner, repoName, baseBranch)
    try {
        const response = await axios.get(
            `https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/${baseBranch}`,
            {
                headers:{
                    Authorization: `Bearer ${accessToken}`,
                }
            }
        )
        return response.data.object.sha //getting sha only as reponse   sha -> unique commit id
    } catch (err) {
        rethrowGithubError(err)
    }
}

const createGithubBranch = async(accessToken, owner, repoName, branchName, sha) => {
    try {
        const response = await axios.post(
            `https://api.github.com/repos/${owner}/${repoName}/git/refs`,
            {
                ref: `refs/heads/${branchName}`,
                sha
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        )
        return response.data
    } catch (err) {
        rethrowGithubError(err)
    }
}

const listGithubBranch = async(accessToken, owner, repoName) => {
    try {
        const response = await axios.get(
            `https://api.github.com/repos/${owner}/${repoName}/branches`,
            {
                headers:{
                    Authorization: `Bearer ${accessToken}`
                }
            }
        )
        return response.data
    } catch (err) {
        rethrowGithubError(err)
    }
}

const deleteGithubrepo = async(accessToken, owner, repoName) => {
    try {
        const response = await axios.delete(
            `https://api.github.com/repos/${owner}/${repoName}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                }
            }
        )
        return response.data
    } catch (err) {
        rethrowGithubError(err)
    }
}

const deleteGithubBranch = async(accessToken, owner, repoName, branchName) => {
    try {
        const response = await axios.delete(
            `https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/${branchName}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        )
        return response.data
    } catch (err) {
        rethrowGithubError(err)
    }
}

export { exchangeCodeForToken, getGithubProfile , getGithubRepos, createGithubRepo, getGithubBranchSha, createGithubBranch, listGithubBranch, deleteGithubrepo, deleteGithubBranch}