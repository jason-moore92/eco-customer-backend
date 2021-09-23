const mongoose = require('mongoose')
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');
const Schema = mongoose.Schema

const PushSubSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true
        },
        pushSub: {
            endpoint: {
                type: String
            },
            expirationTime: {
                type: Date
            },
            keys: {
                p256dh: {
                    type: String
                },
                auth: {
                    type: String
                }
            }

        },
        tokens: [
            {
                token: {
                    type: String,
                    required: true
                },
                vendor: {
                    type: String,
                    required: true,
                    enum: ["FCMTOKEN"]
                },
                active: {
                    type: Boolean,
                    default: true
                }
            }
        ],
        active: {
            type: Boolean,
            default: true
        }
    },
    {
        versionKey: false,
        timestamps: true
    }
)

PushSubSchema.plugin(aggregatePaginate);
module.exports = mongoose.model('pushsubscriptions', PushSubSchema)
