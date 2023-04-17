const express = require('express')
const cartHelpers = require('../helpers/cartHelpers')
const orderHelpers = require('../helpers/orderHelpers')


module.exports = {

    /* GET Address Page */
    getAddress: async (req, res) => {
        var count = null
        let user = req.session.user
        if (user) {
            var count = await cartHelpers.getCartCount(user._id)
            let address = await orderHelpers.getAddress(user._id)
            let orders = await orderHelpers.getOrders(user._id)
            // let product = await orderHelpers.getProduct()
            res.render('user/profile', { user, count, address, orders })
        }

    },

    /* POST Address Page */
    postAddress: (req, res) => {
        let data = req.body
        let userId = req.session.user._id
        orderHelpers.postAddress(data, userId).then((response) => {
            res.send(response)
        })

    },

    /* GET Check Out Page */
    getCheckOut: async (req, res) => {
        let userId = req.session.user._id
        let user = req.session.user
        let total = await orderHelpers.totalCheckOutAmount(userId)
        let count = await cartHelpers.getCartCount(userId)
        let address = await orderHelpers.getAddress(userId)
        cartHelpers.getCartItems(userId).then((cartItems) => {
            res.render('user/checkOut', { user, cartItems, total, count, address })
        })
    },

    /* POST Check Out Page */
    postCheckOut: async (req, res) => {
        let data = req.body;
        let total = data.total
        await orderHelpers.placeOrder(data).then(async (response) => {
            if (data.payment_option === "COD") {
                res.json({ codStatus: true });
            } else if (data.payment_option === "razorpay") {
                await orderHelpers.generateRazorpay(req.session.user._id, total).then((order) => {
                    console.log(order, ';;');
                    res.json(order)
                })
            }
        })
    },

    getProduct: (req, res) => {
        let userId = req.session.user._id;
        let orderId = req.params.id;
        orderHelpers.findProduct(orderId, userId).then((product) => {
            console.log(product, 'ooo');
            res.send(product)
        })
    },

    verifyPayment: (req, res) => {
        orderHelpers.verifyPayment(req.body).then(() => {
            orderHelpers.changePaymentStatus(req.session.user._id, req.body["order[receipt]"])
                .then(() => {
                    res.json({ status: true })
                })
                .catch((err) => {
                    res.json({ status: false })
                })
        })
    }

}