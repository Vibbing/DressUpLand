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
            res.render('user/profile', { layout: 'Layout', user, userData, count, address, orders, wishlistCount })
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
    
    /* GET Edit Address Page */
    getEditAddress:(req,res)=>{
        let userId = req.session.user._id
        let addressId = req.params.id
        orderHelpers.getEditAddress(addressId,userId).then((currentAddress)=>{
            res.send(currentAddress)
        })
    },

    /* PATCH Edit Address Page */
    patchEditAddress:(req,res)=>{
        let addressId = req.params.id
        let userId = req.session.user._id
        let userData = req.body
        orderHelpers.patchEditAddress(userId,addressId,userData).then((response)=>{
            res.send(response)
        })
    },

    /* DELETE  Address Page */
    deleteAddress:(req,res)=>{
        let userId = req.session.user._id
        let addressId = req.params.id
        orderHelpers.deleteAddress(userId,addressId).then((response)=>{
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
            res.render('user/checkOut', { layout: 'Layout', user, cartItems, total, count, address, wishlistCount })
        })
    },

    /* POST Check Out Page */
    postCheckOut: async (req, res) => {
        try {
            let userId = req.session.user._id
            let data = req.body;
            let total = data.discountedAmount
            let couponCode = data.couponCode
            await couponHelpers.addCouponToUser(couponCode, userId)
            try {
                const response = await orderHelpers.placeOrder(data);
                console.log(response,'response');
                if (data.payment_option === "COD") {
                    res.json({ codStatus: true });
                } else if (data.payment_option === "razorpay") {
                    const order = await orderHelpers.generateRazorpay(req.session.user._id, total);
                    res.json(order);
                } else if (data.payment_option === 'wallet') {
                    res.json({ orderStatus: true, message: 'order placed successfully' })
                }
            } catch (error) {
                res.json({status : false , error : error.message})
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
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
                    console.log(orders[0].orderConfirm, '====');
                    res.render('user/orderDetails', { layout: 'Layout', user, count, product, address, orders, orderId, wishlistCount })
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
            // orderHelpers.addWallet(userId, total).then((walletStatus) => {
                // orderHelpers.updatePaymentStatus(orderId, userId).then((paymentStatus) => {
                res.send(returnOrderStatus)
                // })
            // })
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