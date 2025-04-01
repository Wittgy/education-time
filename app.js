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
    origin: "*", // Güvenlik için production'da spesifik domainler belirtin
    methods: ["GET", "POST"]
  }
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

// XSS koruma fonksiyonu
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

// Kullanıcı listesini güncelleme fonksiyonu
const updateUserList = () => {
  const users = Array.from(activeUsers.values());
  io.emit('user list', users);
};

// Renk üretme fonksiyonu
const generateUserColor = (username) => {
    const colors = [
        '#dcf8c6', // Açık yeşil (varsayılan WhatsApp)
        '#ffe6cc', // Açık turuncu
        '#e6e6fa', // Lavanta
        '#f0fff0', // Bal rengi
        '#e6f7ff', // Açık mavi
        '#fff0f5', // Pembe
        '#f0f8ff', // Alice mavisi
        '#fffacd'  // Limonlu
    ];
    
    // Kullanıcı adının karakter kodlarını toplayarak deterministik bir renk seçelim
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

io.on('connection', (socket) => {
  console.log(`Yeni bağlantı: ${socket.id}`);

  // Kullanıcı girişi
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
      color: generateUserColor(cleanUsername) // Renk ekliyoruz
    });

    updateUserList();
    console.log(`Kullanıcı giriş yaptı: ${cleanUsername}`);
    const welcomeMessages = [
        `🌟 ${cleanUsername} sohbete katıldı, partimiz şimdi daha renkli!`,
        `🚨 DİKKAT! ${cleanUsername} sohbetin tadını kaçırmaya geldi! 😂`,
        `😎 ${cleanUsername} geldi! Artık bu sohbet resmen VIP oldu`,
        `✨ ${cleanUsername} aramıza katıldı, hadi bi' şeyler karıştıralım!`,
        `🚀 ${cleanUsername} uzay gemisini yanaştırdı, hoş geldin kaptan!`,
        `🔮 ${cleanUsername} sihirli değneğiyle belirdi! Abracadabra!`,
        `🎧 ${cleanUsername} mix'e katıldı, volume up!`,
        `📺 ${cleanUsername} dizimize yeni sezon olarak katılıyor! IMDB: 10/10`,
        `🎯 ${cleanUsername} oyuna bağlandı! +100 Charisma, +50 Chat Skill`,
        `☢️ DURUN! ${cleanUsername} sohbet kıyametini önlemek için aramızda!`,
        `👽 ${cleanUsername} gezegenlerarası sohbet için dünyaya iniş yaptı!`,
        `🚔 ${cleanUsername} sohbet suçundan içeri alındı! Tahliye yok!`,
        `🔬 Deney sonucu: ${cleanUsername} elementi sohbet kimyasını patlattı!`,
        `🎉🎊 ${cleanUsername} çay partimize katıldı! 🧁☕️🎈`
    ];
    
    const randomWelcome = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    // Hoş geldin mesajı gönder
    socket.emit('system message', {
      type: 'welcome',
      text: randomWelcome
    });
  });

  // Mesaj alma
  socket.on('chat message', (data) => {
    const user = activeUsers.get(socket.id);
    if (!user || !data || !data.message) return;

    const cleanMessage = sanitizeInput(data.message.toString());
    if (!cleanMessage.trim()) return;

    io.emit('chat message', {
      userId: user.id,
      username: user.username,
      message: cleanMessage,
      timestamp: new Date().toISOString(),
      color: user.color
    });

    if (user.typing) {
      user.typing = false;
      socket.broadcast.emit('stop typing', user.username);
    }
  });

  // Yazma durumu
  socket.on('typing', () => {
    const user = activeUsers.get(socket.id);
    if (user && !user.typing) {
      user.typing = true;
      user.lastSeen = new Date();
      socket.broadcast.emit('typing', user.username);
    }
  });

  socket.on('stop typing', () => {
    const user = activeUsers.get(socket.id);
    if (user && user.typing) {
      user.typing = false;
      user.lastSeen = new Date();
      socket.broadcast.emit('stop typing', user.username);
    }
  });

  // Bağlantı kesildiğinde
  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      console.log(`Kullanıcı ayrıldı: ${user.username}`);
      activeUsers.delete(socket.id);
      updateUserList();
      
      // Çıkış mesajı gönder
      io.emit('system message', {
        type: 'left',
        text: `${user.username} sohbetten ayrıldı`
      });
    }
  });

  // Ping kontrolü
  socket.on('ping', (cb) => {
    if (typeof cb === 'function') {
      cb();
    }
  });
});


// Routes
app.use("*", checkUser);
app.use("/", PageRoute);
app.use("/calismalar", PhotoRoute);
app.use("/users", userRoutes);

// 404 Hatası
app.use((req, res) => {
    res.status(404).render('404');
});

// Hata yönetimi
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Bir hata oluştu!');
});

// Sunucuyu başlat
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});