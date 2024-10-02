const express = require("express");
const Classroom = require("../models/classroomModel");
const responseFunction = require("../utils/responseFunction");
const router = express.Router();
const authTokenHandler = require("../middlewares/checkAuthToken");