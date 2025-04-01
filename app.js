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

dotenv.config();

// Veritabanı bağlantısı
conn();

const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Socket.io Bağlantı Yönetimi
io.on('connection', (socket) => {
  console.log(`Yeni bağlantı: ${socket.id}`);

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

    // Tüm kullanıcı listesini güncelle
    io.emit('user list', Array.from(activeUsers.values()));

    // Hoş geldin mesajı
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

  // Mesaj İletimi (DÜZELTİLDİ)
  socket.on('chat message', (data) => {
    const user = activeUsers.get(socket.id);
    if (!user || !data?.message) return;

    const cleanMessage = sanitizeInput(data.message.toString().trim());
    if (!cleanMessage) return;

    // Tüm istemcilere mesajı ilet (io.emit kullanıyoruz)
    io.emit('chat message', {
      userId: user.id,
      username: user.username,
      message: cleanMessage,
      timestamp: new Date().toISOString(),
      color: user.color
    });

    // Yazma durumunu sıfırla
    if (user.typing) {
      user.typing = false;
      socket.broadcast.emit('stop typing', user.username);
    }
  });

  // Diğer olaylar...
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

// Hata Yönetimi
app.use((req, res) => {
  res.status(404).render('404');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Server error!');
});

// Sunucuyu başlat
server.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});