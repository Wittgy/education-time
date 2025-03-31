import express from "express"
import * as userController from "../controllers/userController.js"
import * as autMiddleware from "../middlewares/authMddleware.js"


const router = express.Router()

router.route("/register").get(userController.getRegisterPage)
router.route("/register").post(userController.createUser)
router.route("/login").post(userController.loginUser)
router.route("/dashboard").get(autMiddleware.authenticateToken, userController.getDashBoard)
router.route("/logout").get(userController.logOutPage)





export default router