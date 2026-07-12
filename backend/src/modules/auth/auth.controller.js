import { handleGithubCallBack as githubCallbackService, logOutAllSessions, refreshAccessToken, findSessionbyUserId, createAgentToken as createAgentTokenService, revokeAgentTokens } from './auth.service.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiResponse } from '../../utils/ApiResponse.js'
import { deleteSession, findSessionByToken } from './auth.repository.js'
import { ApiError } from '../../utils/ApiError.js'
import { Session } from '../../models/session.model.js'

const redirectToGithub = asyncHandler(async (req, res) => {
    const clientId = process.env.CLIENT_ID

    res.redirect(
        `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user:email,repo,delete_repo`,
    )
})

const handleGithubCallBack = asyncHandler(async (req, res) => {
    const code = req.query.code
    const ip = req.ip
    const userAgent = req.headers['user-agent']

    const { accessToken, refreshToken } = await githubCallbackService(
        code,
        null,
        ip,
        userAgent,
    )

    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
    })

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.redirect(process.env.FRONTEND_URL || '/')
})

const getMe = asyncHandler(async(req , res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "User fetched successfully"))
})

const logOut = asyncHandler(async(req,res) => {
    const token = req.cookies?.refreshToken

    if (!token) {
        throw new ApiError(401, 'Refresh token required')
    }

    const hashedToken = Session.hashToken(token)

    const session = await findSessionByToken(hashedToken)

    if (!session) {
        throw new ApiError(401, 'Session not found')
    }

    await deleteSession(session._id)

    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')

    return res.status(200).json(new ApiResponse(200, null, "User logged out successfully"))

})

const logOutAll = asyncHandler(async(req,res) => {
    await logOutAllSessions(req.user._id)

    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')

    return res.status(200).json(new ApiResponse(200, null, "All user sessions deleted"))
})

const newAccessToken = asyncHandler(async(req,res) => {
    const accessToken = await refreshAccessToken(req.cookies.refreshToken)

    res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
    })

    return res.status(200).json(new ApiResponse(200, accessToken, "New access Token generated"))
})

const getAllSessions = asyncHandler(async(req,res) => {
    const allSessions = await findSessionbyUserId(req.user._id)

    return res.status(200).json(new ApiResponse(200, allSessions , "Sessions fetched successfully"))
})

const generateAgentToken = asyncHandler(async(req,res) => {
    const agentToken = await createAgentTokenService(req.user._id)

    return res.status(200).json(new ApiResponse(200, agentToken, "Agent token generated successfully"))
})

const revokeAgentToken = asyncHandler(async(req,res) => {
    await revokeAgentTokens(req.user._id)

    return res.status(200).json(new ApiResponse(200, null, "Agent tokens revoked successfully"))
})

export { redirectToGithub, handleGithubCallBack, getMe, logOut , logOutAll , newAccessToken, getAllSessions, generateAgentToken, revokeAgentToken}