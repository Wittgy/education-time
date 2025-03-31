import Photo from "../models/Photos.js";
import videos from "../models/videos.js";

const creatPhoto = async (req, res) => {
    try {
        const photo = await Photo.create(req.body)
        res.status(201).json({
            succeeded: true,
            photo
        })
    } catch (error) {
        res.status(500).json({
            succeeded: false,
            error
        }) 
    }
}

const getAllPhotos = async (req, res) => {
    try {
        const photos = await Photo.find({})
        photos.forEach(photo => {
            photo.uploadedAtFormatted = new Date(photo.uploadedAt).toLocaleString('tr-TR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        });
        res.status(201).render("allphotos", {photos})
    } catch (error) {
        res.status(500).json({
            succeeded: false,
            error
        }) 
    }
}

const getLatestTwoContents  = async (req, res) => {
    try {
        const twoVideos = await videos.find().sort({_id:-1}).limit(2)
        const photos = await Photo.find().sort({_id:-1}).limit(2)
        photos.forEach(photo => {
            photo.uploadedAtFormatted = new Date(photo.uploadedAt).toLocaleString('tr-TR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        });

        twoVideos.forEach(video => {
            video.uploadedAtFormatted = new Date(video.uploadedAt).toLocaleString('tr-TR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        })
        res.status(200).render("calismalar", {photos, twoVideos})
    } catch (error) {
        res.status(500).json({
            succeeded: false,
            error
        }) 
    }

    
}

const getOnePhoto = async (req, res) => {
    try {
        const photo = await Photo.findById({_id: req.params.id})
        res.status(201).render("photo")
    } catch (error) {
        
    }

}

export { creatPhoto, getLatestTwoContents, getAllPhotos, getOnePhoto }