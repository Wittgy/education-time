import users from "../models/users.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const createUser = async (req, res) => {
    try {
        const user = await users.create(req.body);
        res.redirect("/?message=Kayıt%20başarılı!"); // Başarılı kayıt sonrası yönlendirme
    } catch (error) {
        let showErrors = {};
        let oldInputs = req.body;

        if (error.name === "ValidationError") {
            Object.keys(error.errors).forEach((key) => {
                showErrors[key] = error.errors[key].message;
            });
        }

        if (error.code === 11000) {  // MongoDB duplicate key error code
            if (error.keyValue.email) {
                showErrors.email = "Bu email adresi zaten kayıtlı!";
            } else if (error.keyValue.username) {
                showErrors.username = "Bu kullanıcı adı zaten mevcut!";
            }
        }

       

        // Eğer hata oluştuysa, aynı sayfayı render et ve hata mesajlarını ve eski input verilerini gönder
        res.render("register", { showErrors, oldInputs });
    }
}

const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;
        let error = null;

        // 🔹 1. BOŞ ALAN KONTROLÜ
        if (!username || !password) {
            return res.render("index", {
                error: "Lütfen kullanıcı adı ve şifre girin!",
                oldInputs: { username }
            });
        }

        const user = await users.findOne({ username });

        // 🔹 2. KULLANICI BULUNAMADI
        if (!user) {
            return res.render("index", {
                error: "Böyle bir kullanıcı adı yok!",
                oldInputs: { username }
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        // 🔹 3. ŞİFRE YANLIŞ
        if (!isMatch) {
            return res.render("index", {
                error: "Şifre hatalı!",
                oldInputs: { username }
            });
        }

        // 🔹 4. BAŞARILI GİRİŞ
        const token = createToken(user._id);
        const ONE_DAY = 1000 * 60 * 60 * 24;

        res.cookie("jsonwebtoken", token, {
            httpOnly: true,
            maxAge: ONE_DAY
        });

        res.redirect("/");
    } catch (error) {
        console.error("Login Error:", error.message || error);
        res.status(500).render("login", {
            error: "Sunucu hatası, lütfen daha sonra tekrar deneyin."
        });
    }
};



const logOutPage = (req, res) => {
    res.cookie("jsonwebtoken", "", {
        maxAge: 1
    })
    res.redirect("/")
}

const createToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: "1d"
    })
}

const getRegisterPage = (req, res) => {
    res.render("register", { showErrors: {}, oldInputs: {} });
};


const getDashBoard = (req, res) => {
    res.render("dashboard"); // 
};

export { createUser, getRegisterPage, loginUser, getDashBoard, logOutPage }