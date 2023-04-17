const express = require('express')
const session = require('express-session')
const userHelper = require('../helpers/userHelper')
const cartHelpers = require('../helpers/cartHelpers')
const userModel = require('../schema/models')
const { sendOtpApi, otpVerify } = require('../api/twilio')


module.exports = {

    /* GET home page. */
    getHomePage: async (req, res) => {
        var count = null
        let user = req.session.user
        if (user) {
            var count = await cartHelpers.getCartCount(user._id)
        }
        res.render('homePage', { layout: 'Layout', user, count })
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
            const status = await sendOtpApi(mobileNumber);
            if (!status) {

                res.status(200).json({ error: true, message: 'Something went wrong' })
            }
            res.status(200).json({ error: false, message: 'Otp has been send successfully' })

        } catch (error) {
            res.status(500).json({ message: 'Internal server error occured' })
        }
    },

    /* GET Otp verify Page. */
    otpVerify: async (req, res) => {
        
        const { otp } = req.body;
   
        let number = req.session.number
        const user = await userModel.User.findOne({mobile : number }).lean().exec()
        req.session.user = user;
        console.log(user);
        try {
            const status = await otpVerify(otp, number)

            if (!status) {
                res.status(200).json({ error: false, message: 'Something went wrong' })
            }
            res.status(200).json({ error: false, message: 'Otp has been verified'})

        } catch (error) {
            res.status(500).json({ message: 'Internal server error occured' })
        }
    },

    /* GET Shop Page. */
    getShop: async (req, res) => {
        let user = req.session.user
        let count = await cartHelpers.getCartCount(user._id)
        userHelper.getShop().then((product) => {
            res.render('user/shop', { layout: 'Layout', product, user, count })
        })
    },

    /* GET Product Detail Page. */
    getProductDetail: async (req, res) => {
        let proId = req.params.id
        let user = req.session.user
        let count = await cartHelpers.getCartCount(user._id)
        userHelper.getProductDetail(proId).then((product) => {
            res.render('user/productDetail', { product, user, count })
        })
    }
}