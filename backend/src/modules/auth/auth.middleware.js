import jwt from 'jsonwebtoken'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiError } from '../../utils/ApiError.js'
import { User } from '../../models/user.model.js'

const verifyJwt = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken  //reads access token from cookies

    if(!token) throw new ApiError(401, "Unauthorized useer")

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN)

    const user = await User.findById(decoded.userId).select("-githubAccessToken")

    if(!user) throw new ApiError(401, "User not found")

    req.user = user
    next()
})

export{
    verifyJwt
}