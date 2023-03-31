const express = require('express')
const cartSchema = require('../schema/models')


module.exports = {

    /* GET Cart Page */
    getCart:(req,res)=>{
        res.render('user/cart')
    }
}