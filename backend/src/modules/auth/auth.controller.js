import { handleGithubCallBack as githubCallbackService, logOutAllSessions, refreshAccessToken } from './auth.service.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiResponse } from '../../utils/ApiResponse.js'
import { deleteALlSessions, findSessionByToken } from './auth.repository.js'
import { Session } from '../../models/session.model.js'

const redirectToGithub = asyncHandler(async (req, res) => {
    const clientId = process.env.CLIENT_ID

    res.redirect(
        `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user:email`,
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
    const  tokens  = req.cookies.refreshToken

    const hashedTokens = Session.hashToken(tokens)

    const session = await findSessionByToken(tokens)

    await deleteSession(session._id)

    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')

    return res.status(200).json(new ApiResponse(200, null, "User logged out succcesfully"))

})

const logOutAll = asyncHandler(async(req,res) => {
    await logOutAllSessions(req.user_.id)

    res.clearCookie('accessToken')
    res.clearCookie('refreshToke')

    return res.status(200).json(new ApiResponse(200, null, "ALl user sessions deleted"))
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




export { redirectToGithub, handleGithubCallBack, getMe, logOut , logOutAll , newAccessToken}