import axios from "axios"
import { asyncHandler } from "../utils/asyncHandler.js"
import { response } from "express"

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
    const response = await axios.get(
        "https://api.github.com/user/repos",
        {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    )
    return response.data
}

//will create github repo giving name,private(type of repo),description and autoInit data of repo
const createGithubRepo = async(accessToken, payload) => {
    const {name , private: isPrivate, description, auto_init} = payload
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
}

const getGithubBranchSha = async(accessToken , owner, repoName , baseBranch) => {
    console.log(owner, repoName, baseBranch)
    const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/${baseBranch}`,
        {
            headers:{
                Authorization: `Bearer ${accessToken}`,
            }
        }
    )
    return response.data.object.sha //getting sha only as reponse   sha -> unique commit id 
}

const createGithubBranch = async(accessToken, owner, repoName, branchName, sha) => {
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
}

const listGithubBranch = async(accessToken, owner, repoName) => {
    const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repoName}/branches`,
        {
            headers:{
                Authorization: `Bearer ${accessToken}`
            }
        }
    )
    return response.data
}

const deleteGithubrepo = async(accessToken, owner, repoName) => {
    const response = await axios.delete(
        `https://api.github.com/repos/${owner}/${repoName}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            }
        }
    )
    return response.data
}

const deleteGithubBranch = async(accessToken, owner, repoName, branchName) => {
    const response = await axios.delete(
        `https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/${branchName}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    return response.data
}

export { exchangeCodeForToken, getGithubProfile , getGithubRepos, createGithubRepo, getGithubBranchSha, createGithubBranch, listGithubBranch, deleteGithubrepo, deleteGithubBranch}