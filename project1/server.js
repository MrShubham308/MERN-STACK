const express = require("express")
const mongoose =require("mongoose")
require ("dotenv").config();

const authRoutes = require ("./routes/authRoutes");

const app = express();
app.use(express.json());

mongoose.connect(Process.env.MONGODB_URI)
.then(()=>console.log("Db Connect Successfully"))
.catch((err)=>{console.log("Unable to connect DB")});
app.use("/api/auth",authRoutes);

const PORT=process.env.PORT || 5001;

app.listen(PORT,()=>{
    console.log("Server has been start at ",PORT)
});