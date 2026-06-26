import test from 'node:test'
import assert from 'node:assert/strict'

import { redirectToGithub } from '../modules/auth/auth.controller.js'
import { generateAccessToken, generateRefreshToken } from '../utils/tokenGenration.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { Session } from '../models/session.model.js'

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