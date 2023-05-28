const express = require('express')
const session = require('express-session')
const nodemailer = require('nodemailer')
const userHelper = require('../helpers/userHelper')
const cartHelpers = require('../helpers/cartHelpers')
const orderHelpers = require('../helpers/orderHelpers')
const wishListHelpers = require('../helpers/wishlistHelpers')
const userModel = require('../schema/models')
const { sendOtpApi, otpVerify } = require('../api/twilio')
const couponHelpers = require('../helpers/couponHelpers')
const adminMail = process.env.admin_email
const userMail = process.env.user_email
const userPassword = process.env.user_password


module.exports = {

    /* GET home page. */
    getHomePage: async (req, res) => {
        let count = null
        let wishlistCount = null
        let banner = null
        let user = req.session.user
        if (user) {
            count = await cartHelpers.getCartCount(user._id)
            wishlistCount = await wishListHelpers.getWishListCount(user._id)
            banner = await userHelper.getAllBanner()
            coupon = await userHelper.getAllCoupons()
            product = await userHelper.getAllProductsForHome()
        }
        res.render('homePage', { layout: 'Layout', user, count, wishlistCount, banner, coupon, product })
    },

    /* GET SignUp Page. */
    getSignup: (req, res) => {
        res.render('user/signup', { layout: 'Layout' })
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
        res.render('user/login', { layout: 'Layout' })
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
        const user = await userModel.User.findOne({ mobile: number }).lean().exec()
        req.session.user = user;
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
        try {
            let user = req.session.user
            let count = await cartHelpers.getCartCount(user._id)
            const wishlistCount = await wishListHelpers.getWishListCount(user._id)
            const page = parseInt(req.query?.page) || 1
            const perPage = 6
            if (req.query?.search || req.query?.sort || req.query?.filter) {
                const { product, currentPage, totalPages, noProductFound } = await userHelper.getQueriesOnShop(req.query)
                noProductFound ?
                    req.session.noProductFound = noProductFound
                    : req.session.selectedProducts = product
                res.render('user/shop', { layout: 'Layout', product, user, count, wishlistCount, currentPage, totalPages, productResult: req.session.noProductFound })
            } else {
                let currentPage = 1
                const { product, totalPages } = await userHelper.getAllProducts(page, perPage);
                if (product?.length != 0)
                    req.session.noProductFound = false
                res.render('user/shop', { layout: 'Layout', product, user, count, wishlistCount, totalPages, currentPage, productResult: req.session.noProduct })
                req.session.noProductFound = false
            }

        } catch (error) {
            console.log(error)
        }
    },





    /* GET Product Detail Page. */
    getProductDetail: async (req, res) => {
        let proId = req.params.id
        let user = req.session.user
        let count = await cartHelpers.getCartCount(user._id)
        const wishlistCount = await wishListHelpers.getWishListCount(user._id)
        userHelper.getProductDetail(proId).then((product) => {
            res.render('user/productDetail', { layout: 'Layout', product, user, count, wishlistCount })
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
            console.log(wishlistCount, 'count');
            res.render('user/wishList', { layout: 'Layout', user, count, wishlistProducts, wishlistCount })
        })
    },

    addWishList: (req, res) => {
        let proId = req.body.proId
        let userId = req.session.user._id
        console.log(proId, '1');
        console.log(userId, '2');
        wishListHelpers.addWishList(userId, proId).then((response) => {
            console.log(response, '3');
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
    },
    /* GET About us */
    getAboutUs: async (req, res) => {
        let user = req.session.user
        if(user){
            let count = await cartHelpers.getCartCount(user._id)
            const wishlistCount = await wishListHelpers.getWishListCount(user._id)
            res.render('user/aboutUs', { layout: 'Layout',user, count, wishlistCount })
        }else{
            res.render('user/aboutUs', { layout: 'Layout'})
        }
    },

    /* GET Contact us */
    getContactUs: async (req, res) => {
        let user = req.session.user
        if(user){
            let count = await cartHelpers.getCartCount(user._id)
            const wishlistCount = await wishListHelpers.getWishListCount(user._id)
            res.render('user/contactUs', { layout: 'Layout',user, count, wishlistCount })
        }else{
            res.render('user/contactUs', { layout: 'Layout'})
        }
    },

    /* GET Privacy Policy Page. */
    getPrivacyPolicy:async (req,res)=>{
        let user = req.session.user
        if(user){
            let count = await cartHelpers.getCartCount(user._id)
            const wishlistCount = await wishListHelpers.getWishListCount(user._id)
            res.render('user/privacyPolicy',{layout : 'Layout',user, count, wishlistCount})
        }else{
            res.render('user/privacyPolicy',{layout : 'Layout'})

        }
    },

    /* GET Terms And Conditions Page. */
    getTermsAndConditions:async (req,res)=>{
        let user = req.session.user
        if(user){
            let count = await cartHelpers.getCartCount(user._id)
            const wishlistCount = await wishListHelpers.getWishListCount(user._id)
        res.render('user/termsAndConditions',{layout : 'Layout',user, count, wishlistCount})
    }else{
        res.render('user/termsAndConditions',{layout : 'Layout',})
    }
},

    /* POST Contact us */
    postContactUs: (req, res) => {
        try {
            const { name, email, message } = req.body;

            // Create the email content
            const mailOptions = {
                from: email,
                to: adminMail,
                subject: 'New Contact Form Submission',
                text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
            }

            // Create a transporter with your email service provider's SMTP settings
            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: userMail,
                    pass: userPassword
                }
            });

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                    res.status(500).send('Failed to send email.');
                } else {
                    console.log('Email sent:', info.response);
                    res.send({ status: true });
                }
            });
        } catch (error) {
            console.log(error, 'error');
        }
    }

}