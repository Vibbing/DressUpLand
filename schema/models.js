const mongoose = require('mongoose')

//User Schema
const userSchema = new mongoose.Schema({
    name: {
        type: String
    },
    email: {
        type: String
    },
    mobile: {
        type: Number
    },
    password: {
        type: String
    },
    createdAt: {
        type: Date,
        default: new Date()
    },
    status: {
        type: Boolean,
        default: true
    }
})

const adminSchema = new mongoose.Schema({
    email: {
        type: String
    },
    password: {
        type: String
    }
})

const productSchema = new mongoose.Schema({
    name: {
        type: String
    },
    brand: {
        type: String
    },
    description: {
        type: String
    },
    price: {
        type: Number
    },
    quantity: {
        type: Number
    },
    category: {
        type: String
    },
    img: {
        type: Array
    }
})

const categorySchema = new mongoose.Schema({
    category: {
        type: String
    },
    sub_category: {
        type: Array
    }
})

const cartSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },

    cartItems: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "product" },
            quantity: { type: Number, default: 1 },
            price: { type: Number },
        },
    ],

})

module.exports = {
    User: mongoose.model('user', userSchema),
    Admin: mongoose.model('admin', adminSchema),
    Product: mongoose.model('product', productSchema),
    Category: mongoose.model('category', categorySchema),
    Cart: mongoose.model('cart', cartSchema)

}