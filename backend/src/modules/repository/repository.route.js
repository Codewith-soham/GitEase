import { Router }  from 'express'
import { verifyJwt } from '../auth/auth.middleware.js'
import { createRepo, getGitHubRepo } from './repository.controller.js'

const router = Router()

router.route("/repo")
    .get(verifyJwt, getGitHubRepo)
    .post(verifyJwt, createRepo)

export default router