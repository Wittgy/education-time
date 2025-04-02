import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import conn from "./db/db.js";
import PageRoute from "./routes/pageRoute.js";
import PhotoRoute from "./routes/photoRoute.js";
import userRoutes from "./routes/userRoutes.js";
import { checkUser } from "./middlewares/authMddleware.js";
import http from "http";
import { Server } from "socket.io";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

dotenv.config();

// Veritabanı bağlantısı
conn();

// Cloudinary konfigürasyonu
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cloudinary storage engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'chat_app_uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'pdf'],
    resource_type: 'auto',
    transformation: [
      { width: 800, height: 800, crop: 'limit' },
      { quality: 'auto' }
    ]
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// HTTP sunucusu ve Socket.io oluşturma
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Middleware'ler
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Kullanıcı yönetimi için Map
const activeUsers = new Map();

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

const generateUserColor = (username) => {
  const colors = ['#dcf8c6', '#ffe6cc', '#e6e6fa', '#f0fff0', '#e6f7ff', '#fff0f5', '#f0f8ff', '#fffacd'];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Dosya yükleme endpoint'i
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Dosya yüklenemedi' });
  }
  res.json({
    url: req.file.path,
    type: req.file.resource_type,
    publicId: req.file.filename
  });
});

// Socket.io Bağlantı Yönetimi
io.on('connection', (socket) => {
  console.log(`Yeni bağlantı: ${socket.id}`);

  socket.on('get user list', () => {
    socket.emit('user list', Array.from(activeUsers.values()));
  });

  socket.on('new user', (username) => {
    if (!username || typeof username !== 'string') {
      return socket.emit('error', 'Geçersiz kullanıcı adı');
    }

    const cleanUsername = sanitizeInput(username.trim());
    if (!cleanUsername) return;

    activeUsers.set(socket.id, {
      id: socket.id,
      username: cleanUsername,
      typing: false,
      lastSeen: new Date(),
      color: generateUserColor(cleanUsername)
    });

    io.emit('user list', Array.from(activeUsers.values()));

    const welcomeMessages = [
      `🌟 ${cleanUsername} sohbete katıldı!`,
      `🚀 ${cleanUsername} aramıza geldi!`,
      `🎉 ${cleanUsername} partiye katıldı!`
    ];
    const randomWelcome = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    
    io.emit('system message', {
      type: 'welcome',
      text: randomWelcome
    });
  });

  socket.on('chat message', (data) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;

    const messageData = {
      userId: user.id,
      username: user.username,
      timestamp: new Date().toISOString(),
      color: user.color
    };

    if (data.message) {
      messageData.message = sanitizeInput(data.message.toString().trim());
    }

    if (data.file) {
      messageData.file = {
        url: data.file.url,
        type: data.file.type,
        publicId: data.file.publicId
      };
    }

    io.emit('chat message', messageData);

    if (user.typing) {
      user.typing = false;
      socket.broadcast.emit('stop typing', user.username);
    }
  });

  socket.on('typing', () => {
    const user = activeUsers.get(socket.id);
    if (user && !user.typing) {
      user.typing = true;
      socket.broadcast.emit('typing', user.username);
    }
  });

  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      activeUsers.delete(socket.id);
      io.emit('user list', Array.from(activeUsers.values()));
      io.emit('system message', {
        type: 'left',
        text: `${user.username} ayrıldı`
      });
    }
  });
});

// Routes
app.use("*", checkUser);
app.use("/", PageRoute);
app.use("/calismalar", PhotoRoute);
app.use("/users", userRoutes);


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Server error!');
});

// Sunucuyu başlat
server.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});