const express = require("express")
const cors = require("cors");
const app = express()
const cookieParser = require("cookie-parser")
const bodyParser = require("body-parser")
const fileUpload = require("express-fileupload")

const dotenv = require("dotenv")

const errorMiddleware = require("./middleware/error")

//config
dotenv.config({ path: "./config/config.env" });


// app.use(cors())
app.use("*", cors({
    origin: true,
    credentials: true,
}))
//* menas it applies on all api's ,all routes
//origin:true from different also, we can hit our server, so server will not block then
//credentials:true ,it is saying to browser that u can now store cookie

app.use(express.json())
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(fileUpload())

//Route imports
const product = require("./routes/productRoute")
const user = require("./routes/userRoute")
const order = require("./routes/orderRoute")
const payment = require("./routes/paymentRoute")

app.use("/api/v1", product);
app.use("/api/v1", user);
app.use("/api/v1", order);
app.use("/api/v1", payment);

//Middleware for errors
app.use(errorMiddleware)

module.exports = app