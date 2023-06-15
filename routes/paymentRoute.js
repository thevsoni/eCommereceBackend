
const express = require("express");
const {
    processPayment,
    sendStripeApiKey,
} = require("../controllers/paymentController");
const router = express.Router();
const { isAuthenticatedUser } = require("../middleware/auth");

router.route("/payment/process").post(isAuthenticatedUser, processPayment);

// router.route("/stripeapikey").get(isAuthenticatedUser, sendStripeApiKey);
//because when my web load for the first time,that time i m calling get stripeapikey, i can do this also with redux
//then with isAuthentication it works also. 
router.route("/stripeapikey").get(sendStripeApiKey);

module.exports = router;
