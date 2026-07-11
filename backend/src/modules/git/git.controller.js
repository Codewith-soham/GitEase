import {
    getStatus as getStatusService,
    addFiles as addFilesService,
    commitChanges as commitChangesService,
    pushChanges as pushChangesService,
    pullChanges as pullChangesService,
    fetchRemote as fetchRemoteService,
    createBranch as createBranchService,
    switchBranch as switchBranchService,
    deleteBranch as deleteBranchService
} from "./git.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const getStatus = asyncHandler(async(req, res) => {
    const { repositoryId } = req.body

    const result = await getStatusService(req.user._id, { repositoryId })

    return res.status(200).json(new ApiResponse(200, result, "Status completed"))
})

const addFiles = asyncHandler(async(req, res) => {
    const { repositoryId, files } = req.body

    const result = await addFilesService(req.user._id, { repositoryId, files })

    return res.status(200).json(new ApiResponse(200, result, "Add completed"))
})

const commitChanges = asyncHandler(async(req, res) => {
    const { repositoryId, commitMessage } = req.body

    const result = await commitChangesService(req.user._id, { repositoryId, commitMessage })

    return res.status(200).json(new ApiResponse(200, result, "Commit completed"))
})

const pushChanges = asyncHandler(async(req, res) => {
    const { repositoryId, branch, remote } = req.body

    const result = await pushChangesService(req.user._id, { repositoryId, branch, remote })

    return res.status(200).json(new ApiResponse(200, result, "Push completed"))
})

const pullChanges = asyncHandler(async(req, res) => {
    const { repositoryId, branch, remote } = req.body

    const result = await pullChangesService(req.user._id, { repositoryId, branch, remote })

    return res.status(200).json(new ApiResponse(200, result, "Pull completed"))
})

const fetchRemote = asyncHandler(async(req, res) => {
    const { repositoryId, remote } = req.body

    const result = await fetchRemoteService(req.user._id, { repositoryId, remote })

    return res.status(200).json(new ApiResponse(200, result, "Fetch completed"))
})

const createBranch = asyncHandler(async(req, res) => {
    const { repositoryId, branch } = req.body

    const result = await createBranchService(req.user._id, { repositoryId, branch })

    return res.status(200).json(new ApiResponse(200, result, "Create branch completed"))
})

const switchBranch = asyncHandler(async(req, res) => {
    const { repositoryId, branch } = req.body

    const result = await switchBranchService(req.user._id, { repositoryId, branch })

    return res.status(200).json(new ApiResponse(200, result, "Switch branch completed"))
})

const deleteBranch = asyncHandler(async(req, res) => {
    const { repositoryId, branch, force, confirmed } = req.body

    const result = await deleteBranchService(req.user._id, { repositoryId, branch, force, confirmed })

    return res.status(200).json(new ApiResponse(200, result, "Delete branch completed"))
})

export {
    getStatus,
    addFiles,
    commitChanges,
    pushChanges,
    pullChanges,
    fetchRemote,
    createBranch,
    switchBranch,
    deleteBranch
}
