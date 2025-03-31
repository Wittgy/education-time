import mongoose from "mongoose";

const Schema = mongoose.Schema;

const videosSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    videodescription: {
        type: String,
        required:true
    },

    seviye: {
        type: String,
        required: false
    },

    uploadedAt: {
        type: Date,
        required: true,
        default: Date.now
    }

})


const videos = mongoose.model("videos", videosSchema)

export default videos