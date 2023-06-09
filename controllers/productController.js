const Product = require("../models/productModel");
const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apifeatures");
const cloudinary = require("cloudinary");

//create product
//admin
/*
exports.createProduct = async (req, res, next) => {
    const product = await Product.create(req.body);
    res.status(201).json({
        success: true,
        product
    })
}
*/
//in this code if i will not provide any required things then it will give error and await will still wait to get result so i can give middleware here for this
//to handlw this type of error
exports.createProduct = catchAsyncErrors(async (req, res, next) => {

    let images = [];
    if (typeof req.body.images === "string") {
        images.push(req.body.images)
    }
    else {
        images = req.body.images;
    }

    const imagesLinks = [];
    for (let i = 0; i < images.length; i++) {

        const result = await cloudinary.v2.uploader.upload(images[i], {
            // folder: "avatars",
            folder: "ecommerce_products",
            width: 150,
            crop: "scale",
        })
        imagesLinks.push({
            public_id: result.public_id,
            url: result.secure_url,
        },)
    }

    req.body.images = imagesLinks;
    req.body.user = req.user.id;
    const product = await Product.create(req.body);
    res.status(201).json({
        success: true,
        product
    })
})
//so now catch async error handles error if any.

//update product
//admin
exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
    let product = await Product.findById(req.params.id);
    // if (!product) {
    //     return res.status(500).json({ success: false, message: "Product not found" })
    // }
    if (!product) {
        return next(new ErrorHander("Product not found", 404))
    }

    //images start here
    let images = [];
    if (typeof req.body.images === "string") {
        images.push(req.body.images);
    }
    else {
        images = req.body.images;
    }

    if (images !== undefined) {
        for (let i = 0; i < product?.images.length; i++) {
            await cloudinary.v2.uploader.destroy(product?.images[i]?.public_id);
        }


        const imagesLinks = [];
        for (let i = 0; i < images.length; i++) {

            const result = await cloudinary.v2.uploader.upload(images[i], {
                // folder: "avatars",
                folder: "ecommerce_products",
                width: 150,
                crop: "scale",
            })
            imagesLinks.push({
                public_id: result.public_id,
                url: result.secure_url,
            },)
        }

        req.body.images = imagesLinks;

        product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
            useFindAndModify: false
        })

    }

    /*
    let { name } = req.body;
    product.name = name;
    await product.save();
    */

    res.status(200).json({
        success: true,
        product
    })
})

//delete product
//admin
exports.deletProduct = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    // if (!product) {
    //     return res.status(500).json({success: false,message: "Product not found"})
    // }
    if (!product) {
        return next(new ErrorHander("Product not found", 404))
    }
    // await product.remove();

    //deleting images from cloudinary
    for (let i = 0; i < product?.images.length; i++) {
        await cloudinary.v2.uploader.destroy(product?.images[i]?.public_id);
    }

    await product.deleteOne();
    res.status(200).json({
        success: true,
        message: "Product Deleted Successfully"
    })
})

//get product details
exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    // if (!product) {
    //     return res.status(500).json({success: false,message: "Product not found"})
    // }
    if (!product) {
        return next(new ErrorHander("Product not found", 404))
    }
    // console.log(product.images[0])
    res.status(200).json({
        success: true,
        product
    })

})

//get all product
exports.getAllProducts = catchAsyncErrors(async (req, res, next) => {

    const resultPerPage = 4;

    const productsCount = await Product.countDocuments();
    let apiFeature = new ApiFeatures(Product.find(), req.query)
        .search()
        .filter()

    let products = await apiFeature.query;

    let filteredProductsCount = products.length;

    //in one time, we can call only once thats reason creating another instance of this
    apiFeature = new ApiFeatures(Product.find(), req.query)
        .search()
        .filter()
        .pagination(resultPerPage)

    products = await apiFeature.query;


    res.status(200).json({
        success: true,
        products,
        productsCount,
        resultPerPage,
        filteredProductsCount,
    })
})

// Get All Product (Admin)
exports.getAdminProducts = catchAsyncErrors(async (req, res, next) => {
    const products = await Product.find();

    res.status(200).json({
        success: true,
        products,
    });
});


//create new review or update the review
exports.createProductReview = catchAsyncErrors(async (req, res, next) => {
    const { rating, comment, productId } = req.body;
    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment,
    }

    const product = await Product.findById(productId);

    const isReviewed = product.reviews.find(rev => rev.user.toString() === req.user._id.toString())
    if (isReviewed) {
        product.reviews.find((rev) => {
            if (rev.user.toString() === req.user._id.toString()) {
                rev.rating = rating;
                rev.comment = comment;
            }
        })
    }
    else {
        product.reviews.push(review);
        product.numOfReviews = product.reviews.length;
    }

    let avg = 0;
    product.reviews.forEach((rev) => {
        avg += rev.rating;
    })
    product.ratings = avg / product.reviews.length;

    await product.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
    })
})

//get all reviews of a product
exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.query.id)
    if (!product) {
        return next(new ErrorHander("Product not found", 404))
    }
    res.status(200).json({
        success: true,
        reviews: product.reviews,
    })
})

//delete review
exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.query.productId);
    if (!product) {
        return next(new ErrorHander("Product not found"));
    }

    const reviews = product.reviews.filter(rev => rev._id.toString() !== req.query.id.toString())

    let avg = 0;

    reviews.forEach((rev) => {
        avg += rev.rating;
    })

    let ratings = 0;
    if (reviews.length === 0) {
        ratings = 0;
    }
    else {
        ratings = avg / reviews.length;
    }
    const numOfReviews = reviews.length;

    await Product.findByIdAndUpdate(req.query.productId, {
        reviews,
        ratings,
        numOfReviews,
    }, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    })

    res.status(200).json({
        success: true,
    })
})