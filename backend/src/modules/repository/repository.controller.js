import { createRepository, getRepos , createBranch } from "./repository.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js"
import { ApiResponse } from "../../utils/ApiResponse.js"
import { ApiError } from "../../utils/ApiError.js"

const getGitHubRepo = asyncHandler(async(req,res) => {
    const repository = await getRepos(req.user._id)
    return res.status(200).json(new ApiResponse(200, repository, "Repository fetched successfully"))
})

const createRepo = asyncHandler(async(req,res) => {
    console.log("req.user:", req.user)
    
    const newRepo = await createRepository(req.user, req.body)

    return res.status(200).json(new ApiResponse(200, newRepo, "New Repository created successfully"))
})

const createNewBranch = asyncHandler(async(req,res) => {
    const newBranch = await createBranch(req.user, req.params.repoName,req.body)

    return res.status(200).json(new ApiResponse(200, newBranch, "New branch created"))
})

export {
    getGitHubRepo,
    createRepo,
    createNewBranch
}