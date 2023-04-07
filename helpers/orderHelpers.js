const express = require('express')
const { ObjectId } = require('mongodb');
const cartModel = require('../schema/models')

module.exports = {


    // to get the total amount in the cart lising page

    totalCheckOutAmount : (userId) =>{
       try {
        return new Promise((resolve,reject)=>{
            cartModel.Cart.aggregate([
                {
                    $match : {
                        user : new ObjectId(userId)
                    }
                },
                {
                    $unwind : "$cartItems"
                },
                {
                    $project :{
                        item : "$cartItems.productId",
                        quantity : "$cartItems.quantity"
                    }
                },
                {
                    $lookup : {
                        from : "products",
                        localField : "item",
                         foreignField : "_id",
                         as : "carted"
                    }
                },
                {
                    $project : {
                        item : 1,
                        quantity : 1,
                        product : {$arrayElemAt:["$carted", 0]} 
                    }
                },
                {
                    $group : {
                        _id : null,
                        total : {$sum :{$multiply:["$quantity","$product.price"]}}
                    }
                }
            ])
            .then((total)=>{
                resolve(total[0]?.total)
            })
        })
       } catch (error) {
        console.log(error.message);
       }
    },

    //to get the sub total 
    getSubTotal:(userId)=>{
        try {
            return new Promise((resolve,reject)=>{
                cartModel.Cart.aggregate([
                    {
                        $match :{
                            user : new ObjectId(userId)
                        }
                    },
                    {
                        $unwind : "$cartItems"
                    },
                    {
                        $project : {
                            item : "$cartItems.productId",
                            quantity : "$cartItems.quantity"
                        }
                    },
                    {
                        $lookup : {
                            from : "products",
                            localField : "item",
                            foreignField : "_id",
                            as : "carted"
                        }
                    },
                    {
                        $project:{
                            item : 1,
                            quantity : 1,

                            price : {
                                $arrayElemAt : ["$carted.price", 0]
                            }
                        }
                    },
                    {
                        $project : {
                            total : {$multiply:["$quantity","$price"]}
                        }
                    }
                ])
                .then((total)=>{
                    resolve(total)
                })
            })
        } catch (error) {
            console.log(error.message);
        }
    },
}