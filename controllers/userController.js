const User = require("../models/userModel")
const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto")
const cloudinary = require("cloudinary");

//register a user
exports.registerUser = catchAsyncErrors(async (req, res, next) => {

    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "avatars",
        width: 150,
        crop: "scale",
    })

    const { name, email, password } = req.body;
    const user = await User.create({
        name,
        email,
        password,
        avatar: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
        },
    });
    // const token = user.getJWTToken();
    // res.status(201).json({
    //     success: true,
    //     token
    // })
    sendToken(user, 201, res)
})

//login user
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
    const { email, password } = req.body;

    //checking if user has given pwd and email both
    if (!email || !password) {
        return next(new ErrorHander("Please Enter Email & Password", 400))
    }

    const user = await User.findOne({ email }).select("+password")
    // console.log(user)
    if (!user) {
        return next(new ErrorHander("Invalid email or password", 401))
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
        return next(new ErrorHander("Invalid email or password", 401))
    }

    //else matched then
    // const token = user.getJWTToken();
    // res.status(200).json({
    //     success: true,
    //     token
    // })
    //instead of these code
    sendToken(user, 200, res);
})

//logout user
exports.logout = catchAsyncErrors(async (req, res, next) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    });
    res.status(200).json({
        success: true,
        message: "Logged Out"
    })
})

//forgot pwd
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new ErrorHander("User not found", 404));
    }

    //get resetpwd token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false })
    // const resetPasswordUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetToken}`
    const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`

    const message = `your pwd reset token is :- \n\n ${resetPasswordUrl} \n\n If you have not requested 
    this email then, please ignore it`;

    try {
        await sendEmail({
            email: user.email,
            subject: `thevsoni-eCommerce password recovery`,
            message,
        })
        res.status(200).json({
            success: true,
            message: `Email sent to ${user.email} successfully`
        })
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false })

        return next(new ErrorHander(error.message, 500))

    }
})

//actually from my mail ,i have to pass security then it will work. i have to learn how to do this

//reset pwd
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {

    //creating token hash
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex")

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    })

    if (!user) {
        return next(new ErrorHander("Reset Password Token is Invalid or has been expired", 400))
    }
    if (req.body.password != req.body.confirmPassword) {
        return next(new ErrorHander("Password doesn't match", 400))
    }
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save()
    sendToken(user, 200, res);
})

//get user detail
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({
        success: true,
        user,
    })
})

//update user pwd
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id).select("+password");
    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);
    if (!isPasswordMatched) {
        return next(new ErrorHander("old password is incorrect", 401));
    }
    if (req.body.newPassword != req.body.confirmPassword) {
        return next(new ErrorHander("pwd and confirm pwd does not match", 401));
    }

    user.password = req.body.newPassword;

    await user.save();

    sendToken(user, 200, res);
})

//update user profile
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,

    }

    if (req.body.avatar !== "") {
        const user = await User.findById(req.user.id);

        const imageId = user.avatar.public_id;

        await cloudinary.v2.uploader.destroy(imageId);

        const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder: "avatars",
            width: 150,
            crop: "scale",
        });

        newUserData.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
        };
    }


    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    })

    res.status(200).json({
        success: true,
    })
})

//get all users (admin)
exports.getAllUsers = catchAsyncErrors(async (req, res, next) => {
    const users = await User.find();

    res.status(200).json({
        success: true,
        users,
    })
})

//get single user (admin)
exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new ErrorHander(`User does not exist with id: ${req.params.id}`, 404))
    }
    res.status(200).json({
        success: true,
        user,
    })
})

//update user Role (admin)
exports.updateUserRole = catchAsyncErrors(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
    }

    await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    })

    res.status(200).json({
        success: true,
    })
})

//delete user (admin)
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {

    const user = await User.findById(req.params.id)

    if (!user) {
        return next(new ErrorHander(`User does not exist with id: ${req.params.id}`, 404))
    }

    const imageId = user.avatar.public_id;
    await cloudinary.v2.uploader.destroy(imageId);

    await user.deleteOne();

    res.status(200).json({
        success: true,
        message: "User Deleted Successfully",
    })
})