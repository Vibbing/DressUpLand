const express = require('express')
const cartHelpers = require('../helpers/cartHelpers')
const orderHelpers = require('../helpers/orderHelpers')
const wishListHelpers = require('../helpers/wishlistHelpers')
const { response } = require('../app')
const userHelper = require('../helpers/userHelper')
const couponHelpers = require('../helpers/couponHelpers')


module.exports = {

    /* GET Address Page */
    getAddress: async (req, res) => {
        var count = null
        var wishlistCount = null
        let user = req.session.user
        if (user) {
            var count = await cartHelpers.getCartCount(user._id)
            var wishlistCount = await wishListHelpers.getWishListCount(user._id)
            let userData = await userHelper.getUser(user._id)
            let address = await orderHelpers.getAddress(user._id)
            let orders = await orderHelpers.getOrders(user._id)
            // let product = await orderHelpers.getProduct()
            res.render('user/profile', { user, userData, count, address, orders, wishlistCount })
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
        const wishlistCount = await wishListHelpers.getWishListCount(user._id)
        let address = await orderHelpers.getAddress(userId)
        cartHelpers.getCartItems(userId).then((cartItems) => {
            res.render('user/checkOut', { user, cartItems, total, count, address, wishlistCount })
        })
    },

    /* POST Check Out Page */
    postCheckOut: async (req, res) => {
        console.log(req.body, 'body');
        try {
            let userId = req.session.user._id
            let data = req.body;
            let total = data.discountedAmount
            let couponCode = data.couponCode
            console.log(total,couponCode,'---------');
            await couponHelpers.addCouponToUser(couponCode, userId)
            await orderHelpers.placeOrder(data).then(async (response) => {
                if (data.payment_option === "COD") {
                    res.json({ codStatus: true });
                } else if (data.payment_option === "razorpay") {
                    await orderHelpers.generateRazorpay(req.session.user._id, total).then((order) => {
                        console.log(order, ';;');
                        res.json(order)
                    })
                } else if (data.payment_option === 'wallet') {
                    res.json({ orderStatus: true, message: 'order placed successfully' })
                }
            })
        } catch (error) {
            res.json({ error: error.message })
        }
    },

    orderDetails: async (req, res) => {
        let user = req.session.user;
        let count = await cartHelpers.getCartCount(user._id)
        const wishlistCount = await wishListHelpers.getWishListCount(user._id)
        let userId = req.session.user._id;
        let orderId = req.params.id;
        orderHelpers.findOrder(orderId, userId).then((orders) => {
            orderHelpers.findAddress(orderId, userId).then((address) => {
                orderHelpers.findProduct(orderId, userId).then((product) => {
                    console.log(orders, '====');
                    res.render('user/orderDetails', { user, count, product, address, orders, orderId, wishlistCount })
                })
            })
        })
    },

    verifyPayment: (req, res) => {
        orderHelpers.verifyPayment(req.body).then(() => {
            orderHelpers.changePaymentStatus(req.session.user._id, req.body["order[receipt]"], req.body["payment[razorpay_payment_id]"])
                .then(() => {
                    res.json({ status: true })
                })
                .catch((err) => {
                    res.json({ status: false })
                })
        })
    },

    cancelOrder: (req, res) => {
        let orderId = req.query.id;
        let total = req.query.total;
        let userId = req.session.user._id
        console.log(orderId, req.query.total, req.session.user._id);
        orderHelpers.cancelOrder(orderId).then((canceled) => {
            // orderHelpers.addWallet(userId, total).then((walletStatus) => {
            // console.log(canceled, 'cancel', walletStatus, 'wallet');
            res.send(canceled)
            // })
        })
    },

    returnOrder: (req, res) => {
        let orderId = req.query.id
        let total = req.query.total
        let userId = req.session.user._id
        orderHelpers.returnOrder(orderId, userId).then((returnOrderStatus) => {
            orderHelpers.addWallet(userId, total).then((walletStatus) => {
                // orderHelpers.updatePaymentStatus(orderId, userId).then((paymentStatus) => {
                res.send(returnOrderStatus)
                // })
            })
        })
    },


    //to change order Status 
    changeOrderStatus: (req, res) => {
        let orderId = req.body.orderId
        let status = req.body.status
        orderHelpers.changeOrderStatus(orderId, status).then((response) => {
            console.log(response);
            res.send(response)
        })
    }

}