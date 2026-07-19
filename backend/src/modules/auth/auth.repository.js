//all database queries

import { User } from '../../models/user.model.js'
import { Session } from '../../models/session.model.js'
import { ApiError } from '../../utils/ApiError.js'
import { encrypt, decrypt, isEncrypted } from '../../utils/encryption.js'

const findUserByGithubId = async(githubId) => {
    const user = await User.findOne({
        githubId
    })

    return user
}

const createUser = async(userData) => {
    const payload = { ...userData }
    if (payload.githubAccessToken) {
        payload.githubAccessToken = encrypt(payload.githubAccessToken)
    }

    const user = await User.create(payload)

    return user
}

const updateUser = async(userId , updateData) => {
    const updatedUser = await User.findByIdAndUpdate(userId , updateData, { new: true} ) //new-true returns updated document not the old one

    return updatedUser
}

const createSession = async(data) => { 
    const session = await Session.create(data)
    return session
}

const countUserSession = async(userId) => {
    const userSessions = await Session.countDocuments({userId})

    return userSessions
}

const findOldestSession = async(userId) => {
    const oldestSession = await Session.findOne({userId}).sort({createdAt:1})  //will find userId and sort it in ascending order

    return oldestSession
}

const deleteSession = async(sessionId) => {
    const deleteSession = await Session.findByIdAndDelete(sessionId)

    return deleteSession
}

const findSessionByToken = async(hashedToken) => {
    const findSessionbyToken = await Session.findOne({   
        refreshToken : hashedToken
    })

    return findSessionbyToken
}

const deleteALlSessions = async(userId) => {
   return await Session.deleteMany({userId})
}

const findAgentSessionByToken = async(hashedToken) => {
    const findSessionbyToken = await Session.findOne({
        refreshToken : hashedToken,
        type: 'agent'
    })

    return findSessionbyToken
}

const deleteAgentSessions = async(userId) => {
   return await Session.deleteMany({userId, type: 'agent'})
}

const findSessionbyUserId = async(userId) => {    
    return await Session.find({userId})
}

const findUserbyId = async(userId) => {
    return await User.findById(userId)
}

const updateUserGithubtoken = async(userId, githubtoken) => {
    return await User.findByIdAndUpdate(
        userId,
        {
            githubAccessToken: encrypt(githubtoken)
        },
        {new: true}
    )
}

const getDecryptedGithubToken = async(userId) => {
    const user = await User.findById(userId).select('+githubAccessToken')

    if (!user) {
        throw new ApiError(404, 'User not found')
    }

    const stored = user.githubAccessToken
    const plaintext = decrypt(stored)

    if (!isEncrypted(stored)) {
        // legacy plaintext row from before encryption-at-rest was added —
        // re-encrypt now that it's been read, so the fleet migrates itself
        // as normal usage happens instead of needing a batch migration.
        await updateUserGithubtoken(userId, plaintext)
    }

    return plaintext
}

export {
    findUserByGithubId,
    createUser,
    updateUser,
    createSession,
    countUserSession,
    findOldestSession,
    deleteSession,
    findSessionByToken,
    deleteALlSessions,
    findAgentSessionByToken,
    deleteAgentSessions,
    findSessionbyUserId,
    findUserbyId,
    updateUserGithubtoken,
    getDecryptedGithubToken
}