import express from "express"
import * as PhotoController from "../controllers/photoController.js"
import * as videoController from "../controllers/videoController.js"



const router = express.Router()
router.route("/")
.post(PhotoController.creatPhoto)
.get(PhotoController.getLatestTwoContents)


router.route("/allphotos").get(PhotoController.getAllPhotos)
router.route("/allvideos")
.get(videoController.getAllVideos)
.post(videoController.createVideo)






export default router