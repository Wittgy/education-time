import mongoose from "mongoose";

const conn = async () => {
    try {
        await mongoose.connect(process.env.DB_URI);
        console.log('Connected to the DB successfully');
    } catch (err) {
        console.log(`DB connection error: ${err.message}`);
    }
};

export default conn;
