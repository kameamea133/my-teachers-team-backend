const mongoose = require("mongoose");


const classroomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    description: {
        type: String,
        trim: true,
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }]

}, 

{ timestamps: true });

const Classroom = mongoose.model("Classroom", classroomSchema);


module.exports = Classroom;