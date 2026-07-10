import { Router }  from 'express'
import { verifyJwt } from '../auth/auth.middleware.js'
import { createNewBranch, createRepo, deleteRepository, deleteRepositoryBranch, getGitHubRepo, listBranches } from './repository.controller.js'
import { deleteRepo } from './repository.service.js'

const router = Router()

router.route("/repo").get(verifyJwt, getGitHubRepo)
router.route("/repo").get(verifyJwt, getGitHubRepo).post(verifyJwt, createRepo)
router.route("/repo/:repoName/branches").post(verifyJwt, createNewBranch)
router.route("/repo/:repoName/branches").get(verifyJwt, listBranches)
router.route("/repo/:repoName").delete(verifyJwt, deleteRepository)
router.route("/repo/:repoName/branches/:branchName").delete(verifyJwt, deleteRepositoryBranch)

export default router