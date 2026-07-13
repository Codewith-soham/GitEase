import { exchangeCodeForToken, getGithubProfile } from '../../services/github.services.js'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, generateAgentToken as generateAgentTokenUtil } from '../../utils/tokenGenration.js'
import {
    findUserByGithubId,
    createUser,
    updateUser,
    createSession,
    countUserSession,
    findOldestSession,
    deleteSession,
    findSessionByToken,
    deleteALlSessions,
    deleteAgentSessions,
    findSessionbyUserId as findSessionsByUserIdRepository,
    updateUserGithubtoken,
} from './auth.repository.js'
import { Session } from '../../models/session.model.js'
import { ApiError } from '../../utils/ApiError.js'
import { getAgentConnection } from '../../config/webScoket.config.js'


const handleGithubCallBack = async (code, deviceInfo, ip, userAgent) => {
    const githubToken = await exchangeCodeForToken(code)

    const githubProfile = await getGithubProfile(githubToken)

    let user = await findUserByGithubId(githubProfile.id)

    if(!user){
        user = await createUser({
            githubId: githubProfile.id,
            username: githubProfile.login,
            email: githubProfile.email,
            avatar: githubProfile.avatar_url,
            githubAccessToken: githubToken 
        })
    } else {
        user = await updateUserGithubtoken(user._id, githubToken)
    }

    const sessionCount = await countUserSession(user._id)

    if(sessionCount >= 3){
        const oldestSession = await findOldestSession(user._id)
        await deleteSession(oldestSession._id)
    }

    const jwtaccessToken = generateAccessToken(user._id)
    const refreshToken = generateRefreshToken(user._id)

    const hashedTokens = Session.hashToken(refreshToken)

    const session = await createSession({
        userId: user._id,
        refreshToken: hashedTokens,
        deviceInfo: userAgent,
        ip: ip,
        userAgent: userAgent,
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
    })

    return {
    accessToken: jwtaccessToken,
    refreshToken,
    user
}
}

const logOutAllSessions = async(userId) => {
    return await deleteALlSessions(userId)
}

const refreshAccessToken = async (token) => {
    if (!token) {
        throw new ApiError(401, 'Refresh token required')
    }

    const hashedToken = Session.hashToken(token)

    const session = await findSessionByToken(hashedToken)

    if (!session) {
        throw new ApiError(401, "Session not found")
    }

    try {
        verifyRefreshToken(token)
    } catch (err) {
        throw new ApiError(401, "Refresh token expired")
    }

    return generateAccessToken(session.userId)
}

const findSessionbyUserId = async(userId) => {
    const sessions = await findSessionsByUserIdRepository(userId)

    return sessions
}

const createAgentToken = async(userId) => {
    const agentToken = generateAgentTokenUtil(userId)

    const hashedToken = Session.hashToken(agentToken)

    await createSession({
        userId,
        refreshToken: hashedToken,
        type: 'agent',
        deviceInfo: 'Local Agent',
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    })

    return agentToken
}

const revokeAgentTokens = async(userId) => {
    const result = await deleteAgentSessions(userId)

    // Same close code webScoket.config.js uses for a failed handshake, so
    // the agent's close handler can treat both as "this token is dead" and
    // stop retrying with it instead of looping forever.
    const ws = getAgentConnection(userId)
    if (ws) {
        ws.close(4001, 'Token revoked')
    }

    return result
}

export { handleGithubCallBack , logOutAllSessions, refreshAccessToken , findSessionbyUserId, createAgentToken, revokeAgentTokens}