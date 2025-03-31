import mongoose from "mongoose";
import bcrypt from "bcrypt";
import validator from "validator";

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Kullanıcı alanı boş bırakılamaz!"],
      trim: true,
      validate: [validator.isAlphanumeric, "Sadece harf ve rakamlardan oluşmalı!"],
    },
    email: {
      type: String,
      required: [true, "Email alanı boş bırakılamaz!"],
      unique: true,
      lowercase: true, // Email küçük harfe çevrilecek
      validate: [validator.isEmail, "Geçerli bir mail adresi gerekli!"],
    },
    password: {
      type: String,
      required: [true, "Şifre alanı boş bırakılamaz!"],
      minlength: [4, "En az 4 karakter gerekli!"], // ✅ Hata düzeltilmiş
    },
  },
  {
    timestamps: true,
  }
);

// 🔐 **Şifreyi hashleyip kaydetmeden önce şifreyi güncelle**
userSchema.pre("save", async function (next) {
  const user = this;

  if (!user.isModified("password")) return next(); // Eğer şifre değişmediyse devam et

  try {
    user.password = await bcrypt.hash(user.password, 10); // Şifreyi hashle
    next();
  } catch (error) {
    next(error); // ✅ `err` yerine `error` kullanılmalı
  }
});

const Users = mongoose.model("Users", userSchema);

export default Users;
