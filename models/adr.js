const mongoose = require("mongoose");
const adrSchema = new mongoose.Schema({
    age: {
        type: Number,
        required: true,
        min: 1,
        max: 100
    },
    sex: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true
    },
    weight: {
        type: Number,
        required: true,
        min: 1
    },
    drugs: {
        type: String,
        required: true
    },
    reactions: {
        type: String,
        required: true
    },
    images: [String]
});

// Create the ADR model
module.exports = mongoose.model("ADR", adrSchema)