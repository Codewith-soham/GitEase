import { exchangeCodeForToken, getGithubProfile } from '../../services/github.services.js'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/tokenGenration.js'
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
    findSessionbyUserId as findSessionsByUserIdRepository,
} from './auth.repository.js'
import { Session } from '../../models/session.model.js'
import { ApiError } from '../../utils/ApiError.js'


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

export { handleGithubCallBack , logOutAllSessions, refreshAccessToken , findSessionbyUserId}