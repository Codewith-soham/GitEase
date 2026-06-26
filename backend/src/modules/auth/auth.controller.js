import { handleGithubCallBack as githubCallbackService } from './auth.service.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiResponse } from '../../utils/ApiResponse.js'
import { findSessionByToken } from './auth.repository.js'
import { deleteSession } from './auth.repository.js'
import cookies from 'cookie-parser'  // unused
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

    const session = await findSessionByToken(token)

    await deleteSession(session._id)

    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')

    return res.status(200).json(new ApiResponse(200, null, "User logged out succcesfully"))

})



export { redirectToGithub, handleGithubCallBack, getMe, logOut }