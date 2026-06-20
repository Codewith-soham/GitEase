import mongoose  from "mongoose";

const userSchema = new mongoose.Schema({
    githubId: {
        type: String,
        required: true,
        lowercase: true,
        index: true,
        unique: true
    },

    username : {
        type: String,
        lowercase: true,
        index: true,
        unique: true
    },

    email: {
        type: String,
        lowercase: true
    },

    avatar: {
        type: String
    },

    githubAccessToken:{
        type: String,
        required: true
    },
},
{
    timestamps: true
})

export const User = mongoose.model('User' , userSchema)