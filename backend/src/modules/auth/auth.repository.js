//all database queries

import { User } from '../../models/user.model.js'
import { Session } from '../../models/session.model.js'

const findUserByGithubId = async(githubId) => {
    const user = await User.findOne({
        githubId
    })

    return user
}

const createUser = async(userData) => {
    const user = await User.create(userData)

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
            githubAccessToken: githubtoken
        },
        {new: true}
    )
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
    updateUserGithubtoken
}