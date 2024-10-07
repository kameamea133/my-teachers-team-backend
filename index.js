const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const dotenv = require("dotenv");
dotenv.config();

const port = process.env.PORT || 5000;
require("./db");

const allowedOrigins = [process.env.FRONTEND_URL];

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials:true
    })
)

app.use(bodyParser.json());


const isProduction = process.env.NODE_ENV === 'production';
app.use(cookieParser({
    httpOnly: true,
    secure: isProduction,
    sameSite: "none",
    maxage: 1000 * 60 * 60 * 24 * 7,
    signed: true,
}));

const authRoutes = require("./routes/authRoutes");
const classroomRoutes = require("./routes/classroomRoutes");

app.use("/auth", authRoutes);
app.use("/class", classroomRoutes);

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.get("/test", (req, res) => {
    res.send("monnier stephane, 45 years old");
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});