import { runPushWorkflow } from "./automation.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const pushChanges = asyncHandler(async(req, res) => {
    const { cwd, branch, commitMessage } = req.body

    const results = await runPushWorkflow(req.user._id, { cwd, branch, commitMessage })

    return res.status(200).json(new ApiResponse(200, results, "Push workflow completed"))
})

export { pushChanges }
