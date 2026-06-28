import { getRepos  } from "./repository.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js"
import { ApiResponse } from "../../utils/ApiResponse.js"
import { ApiError } from "../../utils/ApiError.js"

const getGitHubRepo = asyncHandler(async(req,res) => {
    const repository = await getRepos(req.user._id)
    return res.status(200).json(new ApiResponse(200, repository, "Repository fetched successfully"))
})

export {
    getGitHubRepo
}