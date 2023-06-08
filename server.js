const app = require("./app")
const dotenv = require("dotenv")
const cloudinary = require("cloudinary");
const connectDatabase = require("./config/database")


//if i do console.log(youtube) then it will give me error that it is undefined so this is uncaught error
//handling uncaught exception error .i have to write these on the top bcs if i write clg(youtube) before this then
//no use of this bcs till that eror i have not defined this code so.write this on the top
process.on("uncaughtException", (err) => {
    console.log(`Error : ${err.message}`)
    console.log(`shuttting down the server due to uncaught exception`)
    process.exit(1);
})

// console.log(youtube)


//config
dotenv.config({ path: "./config/config.env" });
//i can make my env file directly in the root directory also then dont need to give the path bcs 
//that time my server.js and .env file will be in the same folder

//connect db
connectDatabase()

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const server = app.listen(process.env.PORT || 5000, () => {
    console.log(`server is working on http://localhost:${process.env.PORT || 5000}`)
})

//unhandled promise rejection
//if any error comes like from db side then
process.on("unhandledRejection", (err) => {
    console.log(`Error: ${err.message}`)
    console.log(`shutting down the server due to unhandled promise rejection`)

    server.close(() => {
        process.exit(1);
    })
})
