import { Router } from 'express'
import { verifyJwt } from '../auth/auth.middleware.js'
import { pushChanges } from './automation.controller.js'

const router = Router()

router.route("/push").post(verifyJwt, pushChanges)

export default router
