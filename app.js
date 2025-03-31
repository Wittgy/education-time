import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import conn from "./db/db.js";
import PageRoute from "./routes/pageRoute.js"
import PhotoRoute from "./routes/photoRoute.js"
import userRoutes from "./routes/userRoutes.js"
import { checkUser } from "./middlewares/authMddleware.js";
import http from "http"; // HTTP sunucu ekleniyor
import { Server } from "socket.io"; // Socket.io ekleniyor

dotenv.config();

//connection to Database
conn();

const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// HTTP sunucusu oluşturuluyor
const server = http.createServer(app);
const io = new Server(server);


app.use(express.static("public"))
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const users = {}; // Kullanıcıları saklayan obje

io.on("connection", (socket) => {
    console.log("Bir kullanıcı bağlandı:", socket.id);

    // Kullanıcı giriş yaptığında adını al
    socket.on("new user", (username) => {
        users[socket.id] = username;
        io.emit("user list", Object.values(users)); // Güncellenmiş listeyi gönder
        console.log(`Kullanıcı eklendi: ${username}`);
    });

    socket.on("chat message", (data) => {
        io.emit("chat message", { user: users[socket.id], message: data.message });
    });

    // ✨ Kullanıcı yazmaya başladığında
    socket.on("typing", () => {
        if (users[socket.id]) {
            socket.broadcast.emit("typing", users[socket.id]);
        }
    });

    // ✨ Kullanıcı yazmayı bıraktığında
    socket.on("stop typing", () => {
        socket.broadcast.emit("stop typing");
    });

    // Kullanıcı ayrıldığında listeden çıkar
    socket.on("disconnect", () => {
        if (users[socket.id]) {
            console.log(`Kullanıcı ayrıldı: ${users[socket.id]}`);
            delete users[socket.id];
            io.emit("user list", Object.values(users)); // Listeyi güncelle
        }
    });
});


//routes
app.use("*", checkUser)
app.use("/", PageRoute)
app.use("/calismalar", PhotoRoute)
app.use("/users", userRoutes)





// Sunucu başlatma
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});