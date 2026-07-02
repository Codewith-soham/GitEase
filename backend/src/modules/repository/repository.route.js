import { Router }  from 'express'
import { verifyJwt } from '../auth/auth.middleware.js'
import { createNewBranch, createRepo, getGitHubRepo } from './repository.controller.js'

const router = Router()

router.route("/repo").get(verifyJwt, getGitHubRepo)
router.route("/repo").get(verifyJwt, getGitHubRepo).post(verifyJwt, createRepo)
router.route("/repo/:repoName/branches").post(verifyJwt, createNewBranch)

export default router