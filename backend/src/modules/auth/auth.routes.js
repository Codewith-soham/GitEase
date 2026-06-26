import { Router } from 'express'
import { redirectToGithub } from './auth.controller.js'
import { handleGithubCallBack, getMe } from './auth.controller.js'
import { verifyJwt } from "./auth.middleware.js"
import { logOut , logOutAll , newAccessToken} from './auth.controller.js'

const router = Router()

router.route("/github").get(redirectToGithub)
router.route("/github/callback").get(handleGithubCallBack)
router.route("/me").get(verifyJwt, getMe)
router.route("/logout").post(verifyJwt , logOut)
router.route("/logoutall").post(verifyJwt, logOutAll)
router.route("/refresh-token").post(newAccessToken)

export default router 