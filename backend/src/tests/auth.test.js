import test, { mock } from 'node:test'
import assert from 'node:assert/strict'
import jwt from 'jsonwebtoken'
import request from 'supertest'

import { app } from '../app.js'
import { redirectToGithub } from '../modules/auth/auth.controller.js'
import { verifyJwt } from '../modules/auth/auth.middleware.js'
import { generateAccessToken, generateRefreshToken } from '../utils/tokenGenration.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { Session } from '../models/session.model.js'
import { User } from '../models/user.model.js'

// Test: redirectToGithub builds the correct GitHub OAuth URL
test('redirectToGithub redirects to GitHub OAuth authorize endpoint', async () => {
  const previousClientId = process.env.CLIENT_ID
  process.env.CLIENT_ID = 'test-client-id'

  const redirects = []
  const res = {
    redirect(url) {
      redirects.push(url)
    },
  }

  await redirectToGithub({}, res, () => {})

  assert.equal(
    redirects[0],
    'https://github.com/login/oauth/authorize?client_id=test-client-id&scope=user:email',
  )

  process.env.CLIENT_ID = previousClientId
})

// Test: generateAccessToken and generateRefreshToken produce valid JWT strings
test('generateAccessToken produces a valid JWT string', () => {
  const previousSecret = process.env.JWT_ACCESS_TOKEN
  const previousExpiry = process.env.JWT_ACCESS_TOKEN_EXPIRY

  process.env.JWT_ACCESS_TOKEN = 'test-secret-key'
  process.env.JWT_ACCESS_TOKEN_EXPIRY = '1h'

  const token = generateAccessToken('user-123')

  assert.equal(typeof token, 'string')
  assert.ok(token.length > 0)
  assert.equal(token.split('.').length, 3) // JWT format: header.payload.signature

  process.env.JWT_ACCESS_TOKEN = previousSecret
  process.env.JWT_ACCESS_TOKEN_EXPIRY = previousExpiry
})

// Test: generateRefreshToken produces a valid JWT string
test('generateRefreshToken produces a valid JWT string', () => {
  const previousSecret = process.env.JWT_REFRESH_TOKEN
  const previousExpiry = process.env.JWT_REFRESH_TOKEN_EXPIRY

  process.env.JWT_REFRESH_TOKEN = 'refresh-secret-key'
  process.env.JWT_REFRESH_TOKEN_EXPIRY = '7d'

  const token = generateRefreshToken('session-456')

  assert.equal(typeof token, 'string')
  assert.ok(token.length > 0)
  assert.equal(token.split('.').length, 3)

  process.env.JWT_REFRESH_TOKEN = previousSecret
  process.env.JWT_REFRESH_TOKEN_EXPIRY = previousExpiry
})

// Test: Session.hashToken creates a SHA256 hash
test('Session.hashToken creates a SHA256 hash of the token', () => {
  const token = 'sample-refresh-token-xyz'
  const hashed = Session.hashToken(token)

  assert.equal(typeof hashed, 'string')
  assert.ok(hashed.length > 0)
  assert.equal(hashed, Session.hashToken(token)) // Deterministic
})

// Test: asyncHandler catches errors and passes to next()
test('asyncHandler catches async errors and passes to next middleware', async () => {
  const testError = new Error('Test error')
  const errors = []

  const handler = asyncHandler(async () => {
    throw testError
  })

  await handler({}, {}, (err) => {
    errors.push(err)
  })

  assert.equal(errors.length, 1)
  assert.equal(errors[0], testError)
})

// Test: ApiError maintains proper error structure
test('ApiError maintains proper error structure', () => {
  const error = new ApiError(401, 'Unauthorized access')

  assert.equal(error.statusCode, 401)
  assert.equal(error.message, 'Unauthorized access')
  assert.equal(error.success, false)
  assert.equal(error.data, null)
  assert.ok(Array.isArray(error.errors))
})

// Test: ApiResponse maintains proper response structure
test('ApiResponse maintains proper response structure', () => {
  const data = { userId: 123, name: 'John' }
  const response = new ApiResponse(200, data, 'User retrieved')

  assert.equal(response.statusCode, 200)
  assert.deepEqual(response.data, data)
  assert.equal(response.message, 'User retrieved')
  assert.equal(response.success, true)
})

// Test: ApiResponse sets success to false for error codes
test('ApiResponse sets success to false for 400+ status codes', () => {
  const errorResponse = new ApiResponse(400, null, 'Bad request')

  assert.equal(errorResponse.statusCode, 400)
  assert.equal(errorResponse.success, false)
})

test('verifyJwt authenticates user from access token in cookie', async () => {
  const previousSecret = process.env.JWT_ACCESS_TOKEN
  const previousExpiry = process.env.JWT_ACCESS_TOKEN_EXPIRY
  process.env.JWT_ACCESS_TOKEN = 'cookie-secret'
  process.env.JWT_ACCESS_TOKEN_EXPIRY = '1h'

  const token = generateAccessToken('cookie-user-id')
  const req = {
    cookies: { accessToken: token },
    headers: {},
  }
  const res = {}
  let nextCalled = false

  const verifyMock = mock.method(jwt, 'verify', () => ({ userId: 'cookie-user-id' }))
  const findByIdMock = mock.method(User, 'findById', () => ({
    select: async () => ({ _id: 'cookie-user-id', username: 'cookie-user' }),
  }))

  await new Promise((resolve) => {
    verifyJwt(req, res, () => {
      nextCalled = true
      resolve()
    })
  })

  assert.equal(nextCalled, true)
  assert.equal(req.user.username, 'cookie-user')
  assert.equal(verifyMock.mock.callCount(), 1)
  assert.equal(findByIdMock.mock.callCount(), 1)

  verifyMock.mock.restore()
  findByIdMock.mock.restore()
  process.env.JWT_ACCESS_TOKEN = previousSecret
  process.env.JWT_ACCESS_TOKEN_EXPIRY = previousExpiry
})

test('verifyJwt authenticates user from bearer token attached from response data', async () => {
  const previousSecret = process.env.JWT_ACCESS_TOKEN
  const previousExpiry = process.env.JWT_ACCESS_TOKEN_EXPIRY
  process.env.JWT_ACCESS_TOKEN = 'bearer-secret'
  process.env.JWT_ACCESS_TOKEN_EXPIRY = '1h'

  const accessToken = generateAccessToken('bearer-user-id')
  const loginResponse = {
    statusCode: 200,
    body: new ApiResponse(200, { accessToken }, 'Authenticated'),
  }

  const req = {
    cookies: {},
    headers: {
      authorization: `Bearer ${loginResponse.body.data.accessToken}`,
    },
  }
  const res = {}
  let nextCalled = false

  const verifyMock = mock.method(jwt, 'verify', () => ({ userId: 'bearer-user-id' }))
  const findByIdMock = mock.method(User, 'findById', () => ({
    select: async () => ({ _id: 'bearer-user-id', username: 'bearer-user' }),
  }))

  await new Promise((resolve) => {
    verifyJwt(req, res, () => {
      nextCalled = true
      resolve()
    })
  })

  assert.equal(nextCalled, true)
  assert.equal(req.user._id, 'bearer-user-id')
  assert.equal(req.user.username, 'bearer-user')

  verifyMock.mock.restore()
  findByIdMock.mock.restore()
  process.env.JWT_ACCESS_TOKEN = previousSecret
  process.env.JWT_ACCESS_TOKEN_EXPIRY = previousExpiry
})

test('verifyJwt fails with ApiError when no token is provided', async () => {
  const req = {
    cookies: {},
    headers: {},
  }
  const res = {}
  const errors = []

  await new Promise((resolve) => {
    verifyJwt(req, res, (err) => {
      if (err) errors.push(err)
      resolve()
    })
  })

  assert.equal(errors.length, 1)
  assert.ok(errors[0] instanceof ApiError)
  assert.equal(errors[0].statusCode, 401)
  assert.equal(errors[0].message, 'Unauthorized user')
})

test('verifyJwt fails with ApiError when user is not found', async () => {
  const previousSecret = process.env.JWT_ACCESS_TOKEN
  const previousExpiry = process.env.JWT_ACCESS_TOKEN_EXPIRY
  process.env.JWT_ACCESS_TOKEN = 'missing-user-secret'
  process.env.JWT_ACCESS_TOKEN_EXPIRY = '1h'

  const req = {
    cookies: {},
    headers: {
      authorization: 'Bearer token-value',
    },
  }
  const res = {}
  const errors = []

  const verifyMock = mock.method(jwt, 'verify', () => ({ userId: 'missing-user-id' }))
  const findByIdMock = mock.method(User, 'findById', () => ({
    select: async () => null,
  }))

  await new Promise((resolve) => {
    verifyJwt(req, res, (err) => {
      if (err) errors.push(err)
      resolve()
    })
  })

  assert.equal(errors.length, 1)
  assert.ok(errors[0] instanceof ApiError)
  assert.equal(errors[0].statusCode, 401)
  assert.equal(errors[0].message, 'User not found')

  verifyMock.mock.restore()
  findByIdMock.mock.restore()
  process.env.JWT_ACCESS_TOKEN = previousSecret
  process.env.JWT_ACCESS_TOKEN_EXPIRY = previousExpiry
})

test('GET /api/auth/v1/github returns redirect to GitHub OAuth URL', async () => {
  const previousClientId = process.env.CLIENT_ID
  process.env.CLIENT_ID = 'integration-client-id'

  const response = await request(app).get('/api/auth/v1/github').expect(302)

  assert.equal(
    response.headers.location,
    'https://github.com/login/oauth/authorize?client_id=integration-client-id&scope=user:email',
  )

  process.env.CLIENT_ID = previousClientId
})

test('GET /api/auth/v1/me accepts bearer token from response payload style data', async () => {
  const previousSecret = process.env.JWT_ACCESS_TOKEN
  const previousExpiry = process.env.JWT_ACCESS_TOKEN_EXPIRY
  process.env.JWT_ACCESS_TOKEN = 'integration-bearer-secret'
  process.env.JWT_ACCESS_TOKEN_EXPIRY = '1h'

  const accessToken = generateAccessToken('route-bearer-user-id')
  const loginResponse = {
    body: new ApiResponse(200, { accessToken }, 'Authenticated'),
  }

  const verifyMock = mock.method(jwt, 'verify', () => ({ userId: 'route-bearer-user-id' }))
  const findByIdMock = mock.method(User, 'findById', () => ({
    select: async () => ({ _id: 'route-bearer-user-id', username: 'route-bearer-user' }),
  }))

  const response = await request(app)
    .get('/api/auth/v1/me')
    .set('Authorization', `Bearer ${loginResponse.body.data.accessToken}`)
    .expect(200)

  assert.equal(response.body.success, true)
  assert.equal(response.body.data._id, 'route-bearer-user-id')
  assert.equal(response.body.data.username, 'route-bearer-user')

  verifyMock.mock.restore()
  findByIdMock.mock.restore()
  process.env.JWT_ACCESS_TOKEN = previousSecret
  process.env.JWT_ACCESS_TOKEN_EXPIRY = previousExpiry
})

test('GET /api/auth/v1/me accepts cookie access token', async () => {
  const previousSecret = process.env.JWT_ACCESS_TOKEN
  const previousExpiry = process.env.JWT_ACCESS_TOKEN_EXPIRY
  process.env.JWT_ACCESS_TOKEN = 'integration-cookie-secret'
  process.env.JWT_ACCESS_TOKEN_EXPIRY = '1h'

  const accessToken = generateAccessToken('route-cookie-user-id')

  const verifyMock = mock.method(jwt, 'verify', () => ({ userId: 'route-cookie-user-id' }))
  const findByIdMock = mock.method(User, 'findById', () => ({
    select: async () => ({ _id: 'route-cookie-user-id', username: 'route-cookie-user' }),
  }))

  const response = await request(app)
    .get('/api/auth/v1/me')
    .set('Cookie', [`accessToken=${accessToken}`])
    .expect(200)

  assert.equal(response.body.success, true)
  assert.equal(response.body.data._id, 'route-cookie-user-id')
  assert.equal(response.body.data.username, 'route-cookie-user')

  verifyMock.mock.restore()
  findByIdMock.mock.restore()
  process.env.JWT_ACCESS_TOKEN = previousSecret
  process.env.JWT_ACCESS_TOKEN_EXPIRY = previousExpiry
})

test('GET /api/auth/v1/me returns 401 when no auth token is provided', async () => {
  const response = await request(app).get('/api/auth/v1/me').expect(401)

  assert.equal(response.body.success, false)
  assert.equal(response.body.message, 'Unauthorized user')
})

test('POST /api/auth/v1/logout logs out current session and clears cookies', async () => {
  const previousSecret = process.env.JWT_ACCESS_TOKEN
  const previousExpiry = process.env.JWT_ACCESS_TOKEN_EXPIRY
  process.env.JWT_ACCESS_TOKEN = 'logout-access-secret'
  process.env.JWT_ACCESS_TOKEN_EXPIRY = '1h'

  const accessToken = generateAccessToken('logout-user-id')
  const refreshToken = 'refresh-token-for-logout'
  const expectedHashed = Session.hashToken(refreshToken)

  const verifyMock = mock.method(jwt, 'verify', () => ({ userId: 'logout-user-id' }))
  const findByIdMock = mock.method(User, 'findById', () => ({
    select: async () => ({ _id: 'logout-user-id', username: 'logout-user' }),
  }))
  const findSessionByTokenMock = mock.method(Session, 'findOne', async ({ refreshToken: token }) => {
    assert.equal(token, expectedHashed)
    return { _id: 'session-logout-id' }
  })
  const deleteSessionMock = mock.method(Session, 'findByIdAndDelete', async (sessionId) => {
    assert.equal(sessionId, 'session-logout-id')
    return { _id: 'session-logout-id' }
  })

  const response = await request(app)
    .post('/api/auth/v1/logout')
    .set('Authorization', `Bearer ${accessToken}`)
    .set('Cookie', [`refreshToken=${refreshToken}`])
    .expect(200)

  assert.equal(response.body.success, true)
  assert.equal(response.body.message, 'User logged out successfully')
  assert.equal(findSessionByTokenMock.mock.callCount(), 1)
  assert.equal(deleteSessionMock.mock.callCount(), 1)
  assert.ok(Array.isArray(response.headers['set-cookie']))
  assert.ok(response.headers['set-cookie'].some((value) => value.startsWith('accessToken=')))
  assert.ok(response.headers['set-cookie'].some((value) => value.startsWith('refreshToken=')))

  verifyMock.mock.restore()
  findByIdMock.mock.restore()
  findSessionByTokenMock.mock.restore()
  deleteSessionMock.mock.restore()
  process.env.JWT_ACCESS_TOKEN = previousSecret
  process.env.JWT_ACCESS_TOKEN_EXPIRY = previousExpiry
})

test('POST /api/auth/v1/logoutall deletes all sessions and clears cookies', async () => {
  const previousSecret = process.env.JWT_ACCESS_TOKEN
  const previousExpiry = process.env.JWT_ACCESS_TOKEN_EXPIRY
  process.env.JWT_ACCESS_TOKEN = 'logoutall-access-secret'
  process.env.JWT_ACCESS_TOKEN_EXPIRY = '1h'

  const accessToken = generateAccessToken('logoutall-user-id')

  const verifyMock = mock.method(jwt, 'verify', () => ({ userId: 'logoutall-user-id' }))
  const findByIdMock = mock.method(User, 'findById', () => ({
    select: async () => ({ _id: 'logoutall-user-id', username: 'logoutall-user' }),
  }))
  const logoutAllSessionsMock = mock.method(Session, 'deleteMany', async ({ userId }) => {
    assert.equal(userId, 'logoutall-user-id')
    return { deletedCount: 2 }
  })

  const response = await request(app)
    .post('/api/auth/v1/logoutall')
    .set('Authorization', `Bearer ${accessToken}`)
    .expect(200)

  assert.equal(response.body.success, true)
  assert.equal(response.body.message, 'All user sessions deleted')
  assert.equal(logoutAllSessionsMock.mock.callCount(), 1)
  assert.ok(Array.isArray(response.headers['set-cookie']))
  assert.ok(response.headers['set-cookie'].some((value) => value.startsWith('accessToken=')))
  assert.ok(response.headers['set-cookie'].some((value) => value.startsWith('refreshToken=')))

  verifyMock.mock.restore()
  findByIdMock.mock.restore()
  logoutAllSessionsMock.mock.restore()
  process.env.JWT_ACCESS_TOKEN = previousSecret
  process.env.JWT_ACCESS_TOKEN_EXPIRY = previousExpiry
})

test('POST /api/auth/v1/refresh-token returns new access token and sets cookie', async () => {
  const previousAccessSecret = process.env.JWT_ACCESS_TOKEN
  const previousAccessExpiry = process.env.JWT_ACCESS_TOKEN_EXPIRY
  const previousRefreshSecret = process.env.JWT_REFRESH_TOKEN
  const previousRefreshExpiry = process.env.JWT_REFRESH_TOKEN_EXPIRY

  process.env.JWT_ACCESS_TOKEN = 'refresh-new-access-secret'
  process.env.JWT_ACCESS_TOKEN_EXPIRY = '1h'
  process.env.JWT_REFRESH_TOKEN = 'refresh-secret'
  process.env.JWT_REFRESH_TOKEN_EXPIRY = '7d'

  const refreshToken = generateRefreshToken('refresh-session-user-id')
  const expectedHashed = Session.hashToken(refreshToken)
  const findSessionByTokenMock = mock.method(Session, 'findOne', async ({ refreshToken: token }) => {
    assert.equal(token, expectedHashed)
    return { userId: 'refresh-session-user-id' }
  })

  const response = await request(app)
    .post('/api/auth/v1/refresh-token')
    .set('Cookie', [`refreshToken=${refreshToken}`])
    .expect(200)

  assert.equal(response.body.success, true)
  assert.equal(typeof response.body.data, 'string')
  assert.equal(response.body.data.split('.').length, 3)
  assert.equal(response.body.message, 'New access Token generated')
  assert.ok(Array.isArray(response.headers['set-cookie']))
  assert.ok(response.headers['set-cookie'].some((value) => value.startsWith('accessToken=')))

  findSessionByTokenMock.mock.restore()
  process.env.JWT_ACCESS_TOKEN = previousAccessSecret
  process.env.JWT_ACCESS_TOKEN_EXPIRY = previousAccessExpiry
  process.env.JWT_REFRESH_TOKEN = previousRefreshSecret
  process.env.JWT_REFRESH_TOKEN_EXPIRY = previousRefreshExpiry
})

test('GET /api/auth/v1/sessions returns sessions for authenticated user', async () => {
  const previousSecret = process.env.JWT_ACCESS_TOKEN
  const previousExpiry = process.env.JWT_ACCESS_TOKEN_EXPIRY
  process.env.JWT_ACCESS_TOKEN = 'sessions-access-secret'
  process.env.JWT_ACCESS_TOKEN_EXPIRY = '1h'

  const accessToken = generateAccessToken('sessions-user-id')
  const sessions = [
    {
      _id: 'session-1',
      userId: 'sessions-user-id',
      deviceInfo: 'Chrome on Linux',
    },
    {
      _id: 'session-2',
      userId: 'sessions-user-id',
      deviceInfo: 'Safari on iPhone',
    },
  ]

  const verifyMock = mock.method(jwt, 'verify', () => ({ userId: 'sessions-user-id' }))
  const findByIdMock = mock.method(User, 'findById', () => ({
    select: async () => ({ _id: 'sessions-user-id', username: 'sessions-user' }),
  }))
  const findSessionsMock = mock.method(Session, 'find', async ({ userId }) => {
    assert.equal(userId, 'sessions-user-id')
    return sessions
  })

  const response = await request(app)
    .get('/api/auth/v1/sessions')
    .set('Authorization', `Bearer ${accessToken}`)
    .expect(200)

  assert.equal(response.body.success, true)
  assert.equal(response.body.message, 'Sessions fetched successfully')
  assert.deepEqual(response.body.data, sessions)
  assert.equal(findSessionsMock.mock.callCount(), 1)

  verifyMock.mock.restore()
  findByIdMock.mock.restore()
  findSessionsMock.mock.restore()
  process.env.JWT_ACCESS_TOKEN = previousSecret
  process.env.JWT_ACCESS_TOKEN_EXPIRY = previousExpiry
})