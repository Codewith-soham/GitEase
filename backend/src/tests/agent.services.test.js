import test from 'node:test'
import assert from 'node:assert/strict'

import { runAgentCommand, handleAgentMessage } from '../services/agent.services.js'
import { agentConnections } from '../config/webScoket.config.js'
import { ApiError } from '../utils/ApiError.js'

test('runAgentCommand throws 409 when the user has no connected agent', async () => {
  await assert.rejects(
    async () => runAgentCommand('no-such-user', { command: 'status' }),
    (err) => err instanceof ApiError && err.statusCode === 409,
  )
})

test('runAgentCommand rejects with 504 on timeout', async () => {
  const userId = 'agent-timeout-user'
  agentConnections.set(userId, { send: () => {} })

  await assert.rejects(
    () => runAgentCommand(userId, { command: 'status' }, { timeoutMs: 10 }),
    (err) => err instanceof ApiError && err.statusCode === 504,
  )

  agentConnections.delete(userId)
})

test('runAgentCommand resolves with accumulated stdout/stderr/exitCode on exit message', async () => {
  const userId = 'agent-exit-user'
  const sent = []
  agentConnections.set(userId, { send: (msg) => sent.push(JSON.parse(msg)) })

  const promise = runAgentCommand(userId, { command: 'status' })
  const { id } = sent[0]

  handleAgentMessage(userId, JSON.stringify({ id, type: 'stdout', data: 'hello ' }))
  handleAgentMessage(userId, JSON.stringify({ id, type: 'stderr', data: 'warn' }))
  handleAgentMessage(userId, JSON.stringify({ id, type: 'exit', code: 0 }))

  const result = await promise
  assert.deepEqual(result, { exitCode: 0, stdout: 'hello ', stderr: 'warn' })

  agentConnections.delete(userId)
})

test('runAgentCommand rejects with 409 when the agent reports REPO_BUSY', async () => {
  const userId = 'agent-busy-user'
  const sent = []
  agentConnections.set(userId, { send: (msg) => sent.push(JSON.parse(msg)) })

  const promise = runAgentCommand(userId, { command: 'status' })
  const { id } = sent[0]

  handleAgentMessage(
    userId,
    JSON.stringify({ id, type: 'error', code: 'REPO_BUSY', message: 'busy' }),
  )

  await assert.rejects(
    () => promise,
    (err) => err instanceof ApiError && err.statusCode === 409,
  )

  agentConnections.delete(userId)
})

test('runAgentCommand rejects with 500 for other agent error codes', async () => {
  const userId = 'agent-error-user'
  const sent = []
  agentConnections.set(userId, { send: (msg) => sent.push(JSON.parse(msg)) })

  const promise = runAgentCommand(userId, { command: 'status' })
  const { id } = sent[0]

  handleAgentMessage(
    userId,
    JSON.stringify({ id, type: 'error', code: 'GIT_FAILURE', message: 'boom' }),
  )

  await assert.rejects(
    () => promise,
    (err) => err instanceof ApiError && err.statusCode === 500 && err.message === 'boom',
  )

  agentConnections.delete(userId)
})

test('handleAgentMessage is a no-op for malformed JSON', () => {
  assert.doesNotThrow(() => handleAgentMessage('any-user', 'not json'))
})

test('handleAgentMessage is a no-op for an unknown message id', () => {
  assert.doesNotThrow(() =>
    handleAgentMessage('any-user', JSON.stringify({ id: 'unknown-id', type: 'exit', code: 0 })),
  )
})
