import mongoose from 'mongoose';

const propertyQuerySchema = new mongoose.Schema({
    source:  {
        type: String,
        required: true,
        lowercase: true,
    },
    decision: {
        type: String,
        required: true,
        uppercase: true,
    },
    date: { 
        type: Date, 
        default: Date.now,
    },
    alternativeKey: {
        type: String,
        required: true,
    },
    property: {
        type: String,
        lowercase: true,
        required: true,
    },
    response: {
        type: mongoose.Schema.Types.Mixed,
    },
});

module.exports = mongoose.model('PropertyQuery', propertyQuerySchema);