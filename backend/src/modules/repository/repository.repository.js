//all database queries

import { LocalRepo } from "../../models/localRepo.model.js"

const findLocalRepo = async(userId, repositoryId) => {
    return await LocalRepo.findOne({ userId, repositoryId })
}

const upsertLocalRepo = async(userId, repositoryId, localPath) => {
    return await LocalRepo.findOneAndUpdate(
        { userId, repositoryId },
        { userId, repositoryId, localPath },
        { new: true, upsert: true }
    )
}

const listLocalRepos = async(userId) => {
    return await LocalRepo.find({ userId })
}

const deleteLocalRepo = async(userId, repositoryId) => {
    return await LocalRepo.findOneAndDelete({ userId, repositoryId })
}

export {
    findLocalRepo,
    upsertLocalRepo,
    listLocalRepos,
    deleteLocalRepo
}
