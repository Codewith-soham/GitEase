import mongoose from "mongoose";
import crypto from 'crypto'

const sessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        refreshToken: {
            type: String,
            required: true
        },

        type: {
            type: String,
            enum: ['web', 'agent'],
            default: 'web'
        },

        deviceInfo: {
            type: String,
            required: true,
        },

        ip: {
            type:String,
        },
        userAgent: {
            type:String
        },
         lastUsedAt: {
            type: Date,
            default: Date.now,
        },

        expiresAt: {
            type: Date,
            required: true,
            index: {
                expiresAfterSeconds: 0   //mongottl deletes document when expiresAt is reached
            },
        }
    }, {
        timestamps: true
    }
)

//static method - hash before saving (static - called in model itself)

sessionSchema.statics.hashToken = function (refreshToken){
    return crypto.createHash("sha256").update(refreshToken).digest("hex")   //crypto is used to hash tokens because token are long and they need time crypto is fast compared to bcrypt
}

export const Session = mongoose.model("Session", sessionSchema)