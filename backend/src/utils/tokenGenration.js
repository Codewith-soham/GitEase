import jwt from 'jsonwebtoken'

const generateAccessToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_ACCESS_TOKEN,
        {
            expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY
        }
    )
}

const generateRefreshToken = (sessionId) => {
    return jwt.sign(
        { sessionId },
        process.env.JWT_REFRESH_TOKEN,
        {
            expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRY
        }
    )
}

const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.JWT_REFRESH_TOKEN)
}

export {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken
}