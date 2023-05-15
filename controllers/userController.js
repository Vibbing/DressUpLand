const express = require('express')
const session = require('express-session')
const userHelper = require('../helpers/userHelper')
const cartHelpers = require('../helpers/cartHelpers')
const orderHelpers = require('../helpers/orderHelpers')
const wishListHelpers = require('../helpers/wishlistHelpers')
const userModel = require('../schema/models')
const { sendOtpApi, otpVerify } = require('../api/twilio')
const couponHelpers = require('../helpers/couponHelpers')


module.exports = {

    /* GET home page. */
    getHomePage: async (req, res) => {
        var count = null
        var wishlistCount = null
        let user = req.session.user
        if (user) {
            var count = await cartHelpers.getCartCount(user._id)
            var wishlistCount = await wishListHelpers.getWishListCount(user._id)
        }
        res.render('homePage', { layout: 'layout', user, count, wishlistCount })
    },

    /* GET SignUp Page. */
    getSignup: (req, res) => {
        res.render('user/signup')
    },

    /* Post SignUp Page. */
    postSignup: (req, res) => {
        let data = req.body
        userHelper.doSignup(data).then((response) => {
            req.session.user = response.data
            console.log(response.data, ';;');
            req.session.loggedIn = true
            res.send(response)
        })
    },

    /* GET Login Page. */
    getLogin: (req, res) => {
        res.render('user/login')
    },

    /* Post Login Page. */
    postLogin: (req, res) => {
        let data = req.body
        userHelper.doLogin(data).then((loginAction) => {
            if (loginAction.status) {
                req.session.user = loginAction.user
                req.session.status = true
                res.send(loginAction)
            } else {
                res.send(loginAction)
            }
        })
    },

    /* GET LogOut Page. */
    getLogout: (req, res) => {
        req.session.user = null
        res.redirect('/login')
    },

    /* GET Otp Login Page. */
    otpLogin: async (req, res) => {
        const { mobileNumber } = req.body;
        req.session.number = mobileNumber;
        try {
            const user = await userHelper.getUserNumber(mobileNumber);
            if (user.status !== true) {
                return res.status(200).json({ error: true, message: 'Wrong Mobile Number' });
            }
            const status = await sendOtpApi(mobileNumber);
            if (!status) {
                return res.status(200).json({ error: true, message: 'Something went wrong' });
            }
            res.status(200).json({ error: false, message: 'Otp has been send successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Internal server error occured' });
        }
    },


    /* GET Otp verify Page. */
    otpVerify: async (req, res) => {

        const { otp } = req.body;
        

        let number = req.session.number
        console.log(otp,req.body,number,'--');
        const user = await userModel.User.findOne({ mobile: number }).lean().exec()
        req.session.user = user;
        console.log(user);
        try {
            const status = await otpVerify(otp, number)

            if (!status) {
                res.status(200).json({ error: false, message: 'Something went wrong' })
            }
            res.status(200).json({ error: false, message: 'Otp has been verified' })

        } catch (error) {
            res.status(500).json({ message: 'Internal server error occured' })
        }
    },

    /* Post Resend Otp Page. */
    resendOtp: async (req, res) => {
        let mobileNumber = req.session.number

        try {
            const status = await sendOtpApi(mobileNumber);
            if (!status) {
                return res.status(200).json({ error: true, message: 'Something went wrong' });
            }
            res.status(200).json({ error: false, message: 'Otp has been send successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Internal server error occured' });
        }

    },

    /* GET Shop Page. */
    getShop: async (req, res) => {
        let user = req.session.user
        console.log(req.query.sort);
        let count = await cartHelpers.getCartCount(user._id)
        const wishlistCount = await wishListHelpers.getWishListCount(user._id)
        console.log(req.query);
        if (req.query?.search || req.query?.sort || req.query?.filter) {
            console.log('1');
            const { product, currentPage, totalPages, noProductFound } = await userHelper.getQueriesOnShop(req.query)
            noProductFound ?
                req.session.noProductFound = noProductFound
                : req.session.selectedProducts = product
            res.render('user/shop', { layout: 'layout', product, user, count, wishlistCount, productResult: req.session.noProductFound })
        } else {
            console.log('fetching all products')
            product = await userHelper.getShop()
            if (product.length != 0)
                req.session.noProductFound = false
            res.render('user/shop', { layout: 'layout', product, user, count, wishlistCount, productResult: req.session.noProduct })
            req.session.noProductFound = false

        }
    },





    /* GET Product Detail Page. */
    getProductDetail: async (req, res) => {
        let proId = req.params.id
        let user = req.session.user
        let count = await cartHelpers.getCartCount(user._id)
        const wishlistCount = await wishListHelpers.getWishListCount(user._id)
        userHelper.getProductDetail(proId).then((product) => {
            console.log(product,'=+==');
            res.render('user/productDetail', { product, user, count, wishlistCount })
        })
    },

    getDetails: (userId) => {
        try {
            return new Promise((resolve, reject) => {
                userModel.User.findOne({ _id: userId }).then((user) => {
                    resolve(user)
                })
            })
        } catch (error) {
            console.log(error.message);
        }
    },

    getWishList: async (req, res) => {
        let user = req.session.user
        let count = await cartHelpers.getCartCount(user._id)
        const wishlistCount = await wishListHelpers.getWishListCount(user._id)
        wishListHelpers.getWishListProducts(user._id).then((wishlistProducts) => {
            res.render('user/wishList', { user, count, wishlistProducts, wishlistCount })
        })
    },

    addWishList: (req, res) => {
        let proId = req.body.proId
        let userId = req.session.user._id
        wishListHelpers.addWishList(userId, proId).then((response) => {
            res.send(response)
        })
    },

    removeProductWishlist: (req, res) => {
        let proId = req.body.proId
        let wishListId = req.body.wishListId
        wishListHelpers.removeProductWishlist(proId, wishListId).then((response) => {
            res.send(response)
        })
    },

    changeUserData: (req, res) => {
        let userId = req.params.id
        let data = req.body
        userHelper.changeUserData(userId, data).then((updatedUserData) => {
            res.send(updatedUserData)
        })
    },

    verifyCoupon: (req, res) => {
        let couponCode = req.params.id
        let userId = req.session.user._id
        couponHelpers.verifyCoupon(userId, couponCode).then((response) => {
            res.send(response)
        })
    },

    applyCoupon: async (req, res) => {
        let couponCode = req.params.id
        let userId = req.session.user._id
        let total = await orderHelpers.totalCheckOutAmount(userId)
        couponHelpers.applyCoupon(couponCode, total).then((response) => {
            res.send(response)
        })
    }
}