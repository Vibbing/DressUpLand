const express = require('express')
const session = require('express-session')
const { response } = require('../app')
const userHelper = require('../helpers/userHelper')

module.exports = {

    /* GET home page. */
    getHomePage: (req, res) => {
        let user = req.session.user
        res.render('homePage',{layout: 'Layout',user})
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

    /* GET Shop Page. */
    getShop:(req,res)=>{
        res.render('user/shop')
    }
}