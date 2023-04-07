const express = require('express')
const session = require('express-session')
const { response } = require('../app')
const userHelper = require('../helpers/userHelper')
const cartHelpers = require('../helpers/cartHelpers')


module.exports = {

    /* GET home page. */
    getHomePage: async (req, res) => {
        var count = null
        let user = req.session.user
        if(user){
        var count = await cartHelpers.getCartCount(user._id)
        }
        res.render('homePage',{layout: 'Layout',user,count})
    },

    /* GET SignUp Page. */
    getSignup: (req, res) => {
        res.render('user/signup')
    },

    /* Post SignUp Page. */
    postSignup: (req, res) => {
        let data = req.body
        userHelper.doSignup(data).then((response) => {
            req.session.user = response
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
    getLogout:(req,res)=>{
        req.session.user = null
        res.redirect('/login')
    },

    /* GET Otp Login Page. */
    otpLogin:(req,res)=>{
       let data = req.body
       console.log(data);
    },

    /* GET Shop Page. */
    getShop:async (req,res)=>{
        let user = req.session.user
        let count = await cartHelpers.getCartCount(user._id)
      userHelper.getShop().then((product)=>{
        res.render('user/shop',{layout : 'Layout',product,user,count})
      })
    },

    /* GET Product Detail Page. */
    getProductDetail:async (req,res)=>{
        let proId = req.params.id
        let user = req.session.user
        let count = await cartHelpers.getCartCount(user._id)
        userHelper.getProductDetail(proId).then((product)=>{
        res.render('user/productDetail',{product,user,count})
    })
    }
}