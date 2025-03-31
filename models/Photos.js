import mongoose from "mongoose";

const Schema = mongoose.Schema;

const PhotoSchema = new Schema({
    name: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    uploadedAt: {
        type: Date,
        required: true,
        default: Date.now
    }

})

const Photo = mongoose.model('photos', PhotoSchema);

export default Photo