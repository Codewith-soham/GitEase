import { runAgentCommand, inFlightUsers } from "../../services/agent.services.js";
import { ApiError } from "../../utils/ApiError.js";

const throwWorkflowStepError = (step, result, results, statusCode = 400) => {
    throw new ApiError(
        statusCode,
        `Push workflow failed at step: ${step}`,
        [
            {
                failedStep: step,
                exitCode: result.exitCode,
                stderr: result.stderr,
                stdout: result.stdout,
                steps: results
            }
        ]
    )
}

const runPushWorkflow = async(userId, { cwd, branch, commitMessage }) => {
    const targetBranch = typeof branch === 'string' ? branch.trim() : ''

    if (!targetBranch) {
        throw new ApiError(400, "branch is required")
    }

    if (inFlightUsers.has(userId)) {
        throw new ApiError(409, "A push is already in progress")
    }

    inFlightUsers.add(userId)

    try {
        const results = []

        const checkoutResult = await runAgentCommand(userId, {
            command: 'checkout',
            args: [targetBranch],
            cwd
        })

        results.push({
            step: 'checkout',
            exitCode: checkoutResult.exitCode,
            stdout: checkoutResult.stdout,
            stderr: checkoutResult.stderr
        })

        if (checkoutResult.exitCode !== 0) {
            const missingBranch =
                checkoutResult.stderr.includes('did not match any file(s) known to git') ||
                checkoutResult.stderr.includes('pathspec')

            if (!missingBranch) {
                throwWorkflowStepError('checkout', checkoutResult, results)
            }

            const createBranchResult = await runAgentCommand(userId, {
                command: 'checkout',
                args: ['-b', targetBranch],
                cwd
            })

            results.push({
                step: 'checkout-create',
                exitCode: createBranchResult.exitCode,
                stdout: createBranchResult.stdout,
                stderr: createBranchResult.stderr
            })

            if (createBranchResult.exitCode !== 0) {
                throwWorkflowStepError('checkout-create', createBranchResult, results)
            }
        }

        const steps = [
            { step: 'init', command: 'init', args: [] },
            { step: 'add', command: 'add', args: ['.'] },
            { step: 'commit', command: 'commit', args: ['-m', commitMessage || 'automated commit'] },
            { step: 'push', command: 'push', args: ['-u', 'origin', targetBranch] }
        ]

        for (const { step, command, args } of steps) {
            const result = await runAgentCommand(userId, { command, args, cwd })

            results.push({
                step,
                exitCode: result.exitCode,
                stdout: result.stdout,
                stderr: result.stderr
            })

            if (result.exitCode !== 0) {
                const isNothingToCommit = step === 'commit' &&
                    (result.stdout.includes("nothing to commit") || result.stderr.includes("nothing to commit"))

                if (!isNothingToCommit) {
                    throwWorkflowStepError(step, result, results)
                }
            }
        }

        return results
    } finally {
        inFlightUsers.delete(userId)
    }
}

export { runPushWorkflow }
