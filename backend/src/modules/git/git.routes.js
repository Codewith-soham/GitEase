import { Router } from 'express'
import { verifyJwt } from '../auth/auth.middleware.js'
import {
    getStatus,
    addFiles,
    commitChanges,
    pushChanges,
    pullChanges,
    fetchRemote,
    createBranch,
    switchBranch,
    deleteBranch
} from './git.controller.js'

const router = Router()

router.route('/status').post(verifyJwt, getStatus)
router.route('/add').post(verifyJwt, addFiles)
router.route('/commit').post(verifyJwt, commitChanges)
router.route('/push').post(verifyJwt, pushChanges)
router.route('/pull').post(verifyJwt, pullChanges)
router.route('/fetch').post(verifyJwt, fetchRemote)
router.route('/create-branch').post(verifyJwt, createBranch)
router.route('/switch-branch').post(verifyJwt, switchBranch)
router.route('/delete-branch').post(verifyJwt, deleteBranch)

export default router
