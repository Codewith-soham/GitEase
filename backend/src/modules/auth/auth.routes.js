import { Router } from 'express'
import { getAllSessions, redirectToGithub } from './auth.controller.js'
import { handleGithubCallBack, getMe } from './auth.controller.js'
import { verifyJwt } from "./auth.middleware.js"
import { logOut , logOutAll , newAccessToken} from './auth.controller.js'
import { generateAgentToken, revokeAgentToken } from './auth.controller.js'

const router = Router()

router.route("/github").get(redirectToGithub)
router.route("/github/callback").get(handleGithubCallBack)
router.route("/me").get(verifyJwt, getMe)
router.route("/logout").post(verifyJwt , logOut)
router.route("/logoutall").post(verifyJwt, logOutAll)
router.route("/refresh-token").post(newAccessToken)
router.route("/sessions").get(verifyJwt, getAllSessions)
router.route("/agent-token").post(verifyJwt, generateAgentToken).delete(verifyJwt, revokeAgentToken)

export default router 