const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs"); // Imported as bcrypt
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

dotenv.config();

const authMiddleware = require("./middleware/authMiddleware");
const User = require("./models/user"); // Capitalized model convention

const app = express();

// FIX: Changed from express() to express.json() to parse JSON bodies
app.use(express.json()); 
app.use(cookieParser());

mongoose.connect(process.env.MONGO_URL)
.then(() => {
    console.log("DB CONNECTED SUCCESSFULLY");
})
.catch((err) => {
    console.log(process.env.MONGO_URL);
    console.log("Unable to connect to DB", err);
});

// --- Register Route ---
app.post("/api/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // FIX: Fixed typo 'finOne' to 'findOne'
        const oldUser = await User.findOne({ email });
        if (oldUser) {
            return res.status(400).json({
                success: false,
                message: "User Already Exists"
            });
        }
        
        const hashPassword = await bcrypt.hash(password, 10);
        
        // FIX: Changed 'UserActivation' to 'User'
        const newUser = await User.create({ name, email, password: hashPassword });
        
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: { id: newUser._id, name: newUser.name, email: newUser.email } // FIX: Return newUser details safely
        });

    } catch (err) {
        console.error("Unable to Register", err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// --- Login Route ---
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        // FIX: Spelling fix for 'massage'
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        // FIX: Changed 'bcryptjs.compare' to 'bcrypt.compare' to match the import variable
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid Credentials"
            });
        }

        // NOTE: Double-check that your .env file matches SECRRET_KEY or SECRET_KEY
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.SECRET_KEY || process.env.SECRRET_KEY, 
            { expiresIn: "2d" }
        );

        res.cookie("token", token, { httpOnly: true });

        res.json({
            success: true,
            message: "Login Successful"
        });

    } catch (err) {
        console.error("Unable to Login", err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// --- Home Route (Protected) ---
app.get("/api/home", authMiddleware, (req, res) => {
    res.json({
        success: true, // FIX: Spelling fix for 'sussess'
        message: "Welcome to Home page",
        user: req.user
    });
});

// --- Logout Route ---
app.get("/api/logout", (req, res) => {
    res.clearCookie("token");
    res.json({
        success: true,
        message: "Logged out successfully" // FIX: Spelling fix
    });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log("Server Started at " + PORT);
});