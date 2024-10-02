const express = require("express");
const Classroom = require("../models/classroomModel");
const responseFunction = require("../utils/responseFunction");
const router = express.Router();
const authTokenHandler = require("../middlewares/checkAuthToken");

router.post('/create', authTokenHandler, async (req, res) => {
    const { name, description } = req.body;
    if(!name) {
        return responseFunction(res, 400, "Classname is required", null, false);
    }

    try {
        const newClassroom = new Classroom({
            name,
            owner: req.userId,
            description,
        });
        await newClassroom.save();
        return responseFunction(res, 200, "Classroom created successfully", newClassroom, true);
    } catch (error) {
        return responseFunction(res, 500, error.message, null, false);
    }
})

router.get('/classroomcreatedbyme', authTokenHandler, async (req, res) => {
    try {
        const classrooms = await Classroom.find({owner: req.userId});
        return responseFunction(res, 200, "Classrooms found", classrooms, true);
    } catch (error) {
        return responseFunction(res, 500, error.message, null, false);
    }
})