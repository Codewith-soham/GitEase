import { runAgentCommand, inFlightUsers } from "../../services/agent.services.js";
import { ApiError } from "../../utils/ApiError.js";

const runPushWorkflow = async(userId, { cwd, branch, commitMessage }) => {
    if (inFlightUsers.has(userId)) {
        throw new ApiError(409, "A push is already in progress")
    }

    inFlightUsers.add(userId)

    try {
        const steps = [
            { step: 'init', command: 'init', args: [] },
            { step: 'add', command: 'add', args: ['.'] },
            { step: 'commit', command: 'commit', args: ['-m', commitMessage || 'automated commit'] },
            { step: 'push', command: 'push', args: ['-u', 'origin', branch] }
        ]

        const results = []

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
                    return results
                }
            }
        }

        return results
    } finally {
        inFlightUsers.delete(userId)
    }
}

export { runPushWorkflow }
