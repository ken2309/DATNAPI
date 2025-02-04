const UserModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
// const nodemailer = require('nodemailer');
const crypto = require('crypto');

//Đăng nhập
const loginUser = async (email, password) => {
    try {
        const user = await UserModel.findOne({ email });
        if (!user) {
            throw new Error('Người dùng không tồn tại');
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Mật khẩu không hợp lệ');
        }
        return user;
    } catch (error) {
        return false;
    }
};

// đăng ký
const registerUser = async ({ email, password, phone, name }) => {
    try {
        if (!email || !email.includes('@') || !email.includes('.')) {
            throw new Error('Email không hợp lệ');
        }
        if (password.length < 6) {
            throw new Error('Mật khẩu phải ít nhất 6 ký tự');
        }
        const phoneStr = phone.toString();
        if (phoneStr.length < 10 || phoneStr.length > 11) {
            throw new Error('Số điện thoại phải từ 10 tới 11 số');
        }

        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            throw new Error('Người dùng đã tồn tại với email này');
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = new UserModel({
            email,
            password: hashedPassword,
            phone,
            name
        });
        await newUser.save();
        return newUser;
    } catch (error) {
        console.error("Error registering user:", error.message);
        return false;
    }
};

const forgotPassword = async (email) => {
    try {
        const user = await UserModel.findOne({ email });
        if (!user) {
            throw new Error('Không tồn tại người dùng với email này');
        }

        // Tạo token ngẫu nhiên
        const resetToken = crypto.randomBytes(20).toString('hex');
        console.log(resetToken);

        // Cập nhật người dùng với token và thời gian hết hạn
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
        await user.save();

        // Cấu hình transporter cho nodemailer
        const transporter = nodemailer.createTransport({
            service: 'Gmail', 
            auth: {
                user: 'duy768366@gmail.com',
                pass: 'pdfaiovzkizuvbpd' 
            }
        });

        // Tạo mail
        const mailOptions = {
            to: user.email,
            from: 'noreply@yourapp.com',
            subject: 'Quên Mật Khẩu',
            text: `Bạn nhận được email này vì bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của bạn.\n\n` +
                  `Vui lòng nhấp vào link sau hoặc dán vào trình duyệt của bạn để hoàn thành quá trình đặt lại mật khẩu:\n\n` +
                  `http://yourapp.com/reset/${resetToken}\n\n` +
                  `Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này và mật khẩu của bạn sẽ không thay đổi.\n`
        };

        // Gửi email
        await transporter.sendMail(mailOptions);
        return { success: true, message: "Email đặt lại mật khẩu đã được gửi.", resetToken };
    } catch (error) {
        return false;
    }
};

const resetPassword = async (resetToken, newPassword) => {
    try {
        // Tìm người dùng từ cơ sở dữ liệu bằng reset token và kiểm tra thời gian hết hạn
        const user = await UserModel.findOne({
            resetPasswordToken: resetToken,
            resetPasswordExpires: { $gt: Date.now() }  // Kiểm tra token vẫn còn hạn
        });

        if (!user) {
            throw new Error('Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
        }

        // Băm mật khẩu mới và cập nhật vào cơ sở dữ liệu
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;  // Xóa token đặt lại mật khẩu
        user.resetPasswordExpires = undefined;  // Xóa thời gian hết hạn của token
        await user.save();

        return { success: true, message: "Mật khẩu đã được đặt lại thành công" };
    } catch (error) {
        throw error;
    }
};

//lấy user bằng email
const getUserByEmail = async (email) => {
    try {
        const user = await UserModel.findOne({ email });
        return user;
    } catch (error) {
        return false;
    }
};

// Lấy tất cả users
const getAllUsers = async () => {
    try {
        const users = await UserModel.find();
        return users;
    } catch (error) {
        return false;
    }
};

// Thêm user
const addUser = async (userData) => {
    try {
        const newUser = await UserModel.create(userData);
        return newUser;
    } catch (error) {
        return false;
    }
};

// Sửa user
const updateUser = async (id, updatedUserData) => {
    try {
        const updatedUser = await UserModel.findOneAndUpdate(
            { _id: id },
            { $set: updatedUserData },
            { new: true } 
        );
        return updatedUser;
    } catch (error) {
        return false;
    }
};

// Xóa user
const deleteUser = async (id) => {
    try {
        const deletedUser = await UserModel.findOneAndDelete({ _id: id });
        return deletedUser;
    } catch (error) {
        return false;
    }
};



module.exports = {
    getAllUsers, addUser, updateUser, deleteUser, loginUser, registerUser,forgotPassword,resetPassword
};
