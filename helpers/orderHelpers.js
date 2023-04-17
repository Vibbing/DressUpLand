const express = require('express')
const { ObjectId } = require('mongodb');
const Razorpay = require('razorpay');
const cartModel = require('../schema/models')
const addressModel = require('../schema/models')
const orderModel = require('../schema/models')

require('dotenv').config();

const keyId = process.env.key_id
const keySecret = process.env.key_secret

var instance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
});

module.exports = {


    // to get the total amount in the cart lising page

    totalCheckOutAmount: (userId) => {
        try {
            return new Promise((resolve, reject) => {
                cartModel.Cart.aggregate([
                    {
                        $match: {
                            user: new ObjectId(userId)
                        }
                    },
                    {
                        $unwind: "$cartItems"
                    },
                    {
                        $project: {
                            item: "$cartItems.productId",
                            quantity: "$cartItems.quantity"
                        }
                    },
                    {
                        $lookup: {
                            from: "products",
                            localField: "item",
                            foreignField: "_id",
                            as: "carted"
                        }
                    },
                    {
                        $project: {
                            item: 1,
                            quantity: 1,
                            product: { $arrayElemAt: ["$carted", 0] }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: { $multiply: ["$quantity", "$product.price"] } }
                        }
                    }
                ])
                    .then((total) => {
                        resolve(total[0]?.total)
                    })
            })
        } catch (error) {
            console.log(error.message);
        }
    },

    //to get the sub total 
    getSubTotal: (userId) => {
        try {
            return new Promise((resolve, reject) => {
                cartModel.Cart.aggregate([
                    {
                        $match: {
                            user: new ObjectId(userId)
                        }
                    },
                    {
                        $unwind: "$cartItems"
                    },
                    {
                        $project: {
                            item: "$cartItems.productId",
                            quantity: "$cartItems.quantity"
                        }
                    },
                    {
                        $lookup: {
                            from: "products",
                            localField: "item",
                            foreignField: "_id",
                            as: "carted"
                        }
                    },
                    {
                        $project: {
                            item: 1,
                            quantity: 1,

                            price: {
                                $arrayElemAt: ["$carted.price", 0]
                            }
                        }
                    },
                    {
                        $project: {
                            total: { $multiply: ["$quantity", "$price"] }
                        }
                    }
                ])
                    .then((total) => {

                        const totals = total.map(obj => obj.total)

                        resolve({ total, totals })
                    })
            })
        } catch (error) {
            console.log(error.message);
        }
    },

    /* GET Address Page */
    getAddress: (userId) => {
        return new Promise((resolve, reject) => {
            addressModel.Address.findOne({ user: userId }).then((response) => {
                resolve(response)
            })

        })
    },

    /* POST Address Page */
    postAddress: (data, userId) => {
        try {
            return new Promise((resolve, reject) => {
                let addressInfo = {
                    fname: data.fname,
                    lname: data.lname,
                    street: data.street,
                    appartment: data.appartment,
                    city: data.city,
                    state: data.state,
                    zipcode: data.zipcode,
                    phone: data.phone,
                    email: data.email
                }

                addressModel.Address.findOne({ user: userId }).then(async (ifAddress) => {
                    if (ifAddress) {
                        addressModel.Address.updateOne(
                            { user: userId },
                            {
                                $push: { Address: addressInfo }
                            }
                        ).then((response) => {
                            resolve(response)
                        })
                    } else {
                        let newAddress = addressModel.Address({ user: userId, Address: addressInfo })

                        await newAddress.save().then((response) => {
                            resolve(response)
                        })
                    }
                })
            })
        } catch (error) {
            console.log(error.message);
        }
    },

    //Post Check Out Page
    placeOrder: (data) => {
        try {
            return new Promise(async (resolve, reject) => {
                let productDetails = await cartModel.Cart.aggregate([
                    {
                        $match: {
                            user: new ObjectId(data.user)
                        }
                    },
                    {
                        $unwind: '$cartItems'
                    },
                    {
                        $project: {
                            item: "$cartItems.productId",
                            quantity: "$cartItems.quantity"
                        }
                    },
                    {
                        $lookup: {
                            from: "products",
                            localField: "item",
                            foreignField: "_id",
                            as: "productDetails"
                        }
                    },
                    {
                        $unwind: "$productDetails"

                    },
                    {
                        $project: {

                            productId: "$productDetails._id",
                            productName: "$productDetails.name",
                            productPrice: "$productDetails.price",
                            quantity: "$quantity",
                            category: "$productDetails.category",
                            image: "$productDetails.img"
                        }
                    }
                ])

                let Address = await addressModel.Address.aggregate([
                    {
                        $match: { user: new ObjectId(data.user) }
                    },
                    {
                        $unwind: "$Address"
                    },
                    {
                        $match: { "Address._id": new ObjectId(data.address) }
                    },
                    {
                        $project: { item: "$Address" }
                    }
                ])
                console.log();

                let status, orderStatus;
                if (data.payment_option === "COD") {
                    status = "placed",
                        orderStatus = "success"
                } else {
                    status = "pending",
                        orderStatus = "pending"
                }

                let orderData = {
                    name: Address[0].item.fname,
                    paymentStatus: status,
                    paymentMethod: data.payment_option,
                    productDetails: productDetails,
                    shippingAddress: Address,
                    orderStatus: orderStatus,
                    totalPrice: data.total
                }
                let order = await orderModel.Order.findOne({ user: data.user })

                if (order) {
                    await orderModel.Order.updateOne(
                        { user: data.user },
                        {
                            $push: { orders: orderData }
                        }
                    ).then((response) => {
                        resolve(response)
                    })
                } else {
                    let newOrder = orderModel.Order({
                        user: data.user,
                        orders: orderData
                    })
                    await newOrder.save().then((response) => {
                        resolve(response)
                    })
                }
                await cartModel.Cart.deleteMany({ user: data.user }).then(() => {
                    resolve()
                })
            })
        } catch (error) {
            console.log(error.message);
        }
    },

    /* GET Orders Page */
    getOrders: (userId) => {
        try {
            return new Promise((resolve, reject) => {
                orderModel.Order.findOne({ user: userId }).then((user) => {
                    resolve(user)
                })
            })
        } catch (error) {
            console.log(error.message);
        }
    },

    findProduct: (orderId, userId) => {
        try {
            return new Promise((resolve, reject) => {
                orderModel.Order.aggregate([
                    {
                        $match: {
                            "orders._id": new ObjectId(orderId),
                            user: new ObjectId(userId)
                        }
                    },
                    {
                        $unwind: "$orders"
                    },
                    {
                        $unwind: "$orders.productDetails"
                    },
                    {
                        $replaceRoot: { newRoot: "$orders.productDetails" }
                    },
                    {
                        $project: {
                            productId: 1,
                            productName: 1,
                            productPrice: 1,
                            image: 1,
                        }
                    },
                ]).then((response) => {
                    resolve(response)
                })
            })
        } catch (error) {
            console.log(error.message);
        }
    },

    generateRazorpay(userId, total) {
        try {
            return new Promise(async (resolve, reject) => {
                let orders = await orderModel.Order.find({ user: userId })

                let order = orders[0].orders.slice().reverse();
                let orderId = order[0]._id;

                var options = {
                    amount: total * 100,  // amount in the smallest currency unit
                    currency: "INR",
                    receipt: "" + orderId
                };
                instance.orders.create(options, function (err, order) {
                    if (err) {
                        console.log(err);
                    } else {
                        resolve(order)
                    }
                });

            })
        } catch (error) {
            console.log(error.message);
        }
    },

    // verify payment of razorpay
    verifyPayment: (details) => {
        try {
            return new Promise((resolve, reject) => {
                const crypto = require("crypto");
                let hmac = crypto.createHmac("sha256", process.env.key_secret);
                hmac.update(
                    details["payment[razorpay_order_id]"] +
                    "|" +
                    details["payment[razorpay_payment_id]"]
                );
                hmac = hmac.digest("hex");
                if (hmac == details["payment[razorpay_signature]"]) {
                    resolve();
                } else {
                    reject("not match");
                }
            })
        } catch (error) {
            console.log(error.message);
        }
    },

    // change payment status
    changePaymentStatus: (userId, orderId) => {
        try {
            return new Promise(async (resolve, reject) => {
               await orderModel.Order.updateOne(
                    {"orders._id": orderId },
                    {
                        $set: {
                            "orders.$.orderConfirm": "success",
                            "orders.$.paymentStatus": "paid"
                        }
                    }
                ),
                    cartModel.Cart.deleteMany({ user: userId }).then(() => {
                        resolve()
                    })
            })
        } catch (error) {
            console.log(error.message);
        }
    }

}