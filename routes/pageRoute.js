import express from "express"
import * as PageController from "../controllers/pagecontroller.js"



const router = express.Router()
router.route("/").get(PageController.getIndexPage)
router.route("/guncel-yazilar").get(PageController.getGuncelYazilarPage)
router.route("/kategoriler").get(PageController.getKategorilerPage);
router.route("/hakkimda").get(PageController.getHakkimPage)
router.route("/chat").get(PageController.getChatPage)



export default router