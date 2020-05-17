import mongoose from 'mongoose';

const alternativeQuerySchema = new mongoose.Schema({
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
    response: {
        type: mongoose.Schema.Types.Mixed,
    },
});

module.exports = mongoose.model('AlternativeQuery', alternativeQuerySchema);