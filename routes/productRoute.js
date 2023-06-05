const express = require('express');
const { getAllProducts, createProduct, updateProduct, deletProduct, getProductDetails, createProductReview, getProductReviews, deleteReview } = require('../controllers/productController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

router.route("/products").get(getAllProducts)

router.route("/product/new").post(isAuthenticatedUser, authorizeRoles("admin"), createProduct)
router.route("/product/:id").put(isAuthenticatedUser, authorizeRoles("admin"), updateProduct).delete(isAuthenticatedUser, authorizeRoles("admin"), deletProduct).get(getProductDetails)

router.route("/product/:id").get(getProductDetails);

router.route("/review").put(isAuthenticatedUser, createProductReview)
router.route("/review").get(getProductReviews).delete(isAuthenticatedUser, authorizeRoles("admin"), deleteReview);



module.exports = router;