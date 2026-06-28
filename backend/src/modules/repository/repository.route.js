import { Router }  from 'express'
import { verifyJwt } from '../auth/auth.middleware.js'
import { getGitHubRepo } from './repository.controller.js'

const router = Router()

router.route("/repo").get(verifyJwt, getGitHubRepo)

export default router