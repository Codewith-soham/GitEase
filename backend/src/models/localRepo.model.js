import mongoose from "mongoose";

// Maps a user's GitHub repository to the local filesystem folder the agent
// cloned/initialized it into, so a client-supplied repositoryId can be
// resolved to a trusted cwd without ever trusting a client-supplied path.
const localRepoSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        repositoryId: {
            type: String,
            required: true
        },

        localPath: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
)

localRepoSchema.index({ userId: 1, repositoryId: 1 }, { unique: true })

export const LocalRepo = mongoose.model("LocalRepo", localRepoSchema)
