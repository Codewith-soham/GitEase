import jwt from 'jsonwebtoken'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiError } from '../../utils/ApiError.js'
import { User } from '../../models/user.model.js'

const verifyJwt = asyncHandler(async (req, res, next) => {
    const cookieToken = req.cookies?.accessToken
    const authHeader = req.headers?.authorization || ''
    const bearerToken = authHeader.toLowerCase().startsWith('bearer ')
        ? authHeader.slice(7).trim()
        : null

    const token = cookieToken || bearerToken

    if(!token) throw new ApiError(401, "Unauthorized user")

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN)

    const user = await User.findById(decoded.userId).select("-githubAccessToken")

    if(!user) throw new ApiError(401, "User not found")

    req.user = user
    next()
})

export{
    verifyJwt
}