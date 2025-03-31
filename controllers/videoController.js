import videos from "../models/videos.js";

const createVideo = async (req, res) => {
    try {
        const video = await videos.create(req.body)
        res.status(201).json({
            succeed: true,
            video
        })
    } catch (error) {
        res.status(500).json({
            succeeded: false,
            error
        }) 
    }
}

const getAllVideos = async (req, res) => {
    try {
        const allVideos = await videos.find({})
        allVideos.forEach(video => {
            video.uploadedAtFormatted = new Date(video.uploadedAt).toLocaleString('tr-TR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        });
        res.status(201).render("allvideos", {allVideos})
    } catch (error) {
        res.status(500).json({
            succeeded: false,
            error
        }) 
    }
}

export { createVideo, getAllVideos }