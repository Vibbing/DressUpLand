const express = require('express')
const { ObjectId } = require('mongodb');
const Razorpay = require('razorpay');
const cartModel = require('../schema/models')
const addressModel = require('../schema/models')
const orderModel = require('../schema/models');
const userModel = require('../schema/models')
const productModel = require('../schema/models')
const { promises } = require('dns');
const { resolve } = require('path');
const { response } = require('../app');

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
                        $lookup: {
                            from: "products",
                            localField: "cartItems.productId",
                            foreignField: "_id",
                            as: "carted"
                        }
                    },
                    {
                        $project: {
                            item: "$cartItems.productId",
                            quantity: "$cartItems.quantity",
                            price: {
                                $cond: {
                                    if: { $gt: [{ $arrayElemAt: ["$carted.discountedPrice", 0] }, 0] },
                                    then: { $arrayElemAt: ["$carted.discountedPrice", 0] },
                                    else: { $arrayElemAt: ["$carted.price", 0] }
                                }
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: { $multiply: ["$quantity", "$price"] } }
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
                        $lookup: {
                            from: "products",
                            localField: "cartItems.productId",
                            foreignField: "_id",
                            as: "carted"
                        }
                    },
                    {
                        $project: {
                            item: "$cartItems.productId",
                            quantity: "$cartItems.quantity",
                            price: {
                                $cond: {
                                    if: { $gt: [{ $arrayElemAt: ["$carted.discountedPrice", 0] }, 0] },
                                    then: { $arrayElemAt: ["$carted.discountedPrice", 0] },
                                    else: { $arrayElemAt: ["$carted.price", 0] }
                                }
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
            let flag = 0
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
                            brand: "$productDetails.brand",
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

                let status, orderStatus;
                if (data.payment_option === "COD") {
                    status = "Placed",
                        orderStatus = "Success"

                } else if (data.payment_option === 'wallet') {
                    let userData = await userModel.User.findById({ _id: data.user })
                    if (userData.wallet < data.discountedAmount) {
                        flag = 1
                        reject(new Error("Insufficient wallet balance!"))

                    } else {
                        userData.wallet -= data.discountedAmount

                        await userData.save()
                        status = 'Placed',
                            orderStatus = 'Success'
                    }

                } else {
                    status = "Pending",
                        orderStatus = "Pending"
                }

                let orderData = {
                    name: Address[0].item.fname,
                    paymentStatus: status,
                    paymentMethod: data.payment_option,
                    productDetails: productDetails,
                    shippingAddress: Address,
                    orderStatus: orderStatus,
                    totalPrice: data.discountedAmount
                }
                let order = await orderModel.Order.findOne({ user: data.user })


                if (flag == 0) {
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

                    //inventory management 
                    // update product quantity in the database
                    for (let i = 0; i < productDetails.length; i++) {
                        let purchasedProduct = productDetails[i];
                        let originalProduct = await productModel.Product.findById(purchasedProduct.productId);
                        let purchasedQuantity = purchasedProduct.quantity;
                        originalProduct.quantity -= purchasedQuantity;
                        await originalProduct.save();
                        await cartModel.Cart.deleteMany({ user: data.user }).then(() => {
                            resolve()
                        })

                    }

                }

            })
        } catch (error) {
            throw error;
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

    findOrder: (orderId, userId) => {
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
                ]).then((response) => {
                    let orders = response.filter((element) => {
                        if (element.orders._id == orderId) {

                            return true;
                        }
                        return false;
                    }).map((element) => element.orders);
                    resolve(orders)
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



                ]).then((response) => {
                    let product = response.filter((element) => {
                        if (element.orders._id == orderId) {

                            return true;
                        }
                        return false;
                    }).map((element) => element.orders.productDetails);
                    resolve(product)
                })
            })
        } catch (error) {
            console.log(error.message);
        }
    },


    findAddress: (orderId, userId) => {
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
                        $unwind: "$orders.shippingAddress"
                    },
                    {
                        $replaceRoot: { newRoot: "$orders.shippingAddress.item" }
                    },
                    {
                        $project: {
                            _id: 1,
                            fname: 1,
                            lname: 1,
                            street: 1,
                            appartment: 1,
                            city: 1,
                            state: 1,
                            zipcode: 1,
                            phone: 1,
                            email: 1
                        }
                    }
                ]).then((response) => {
                    // console.log(response[0].phone,'[[');
                    resolve(response)
                })
            })
        } catch (error) {
            console.log(error.message);
        }
    },

    generateRazorpay(userId, total) {
        console.log(total, 'razortotal');
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
    changePaymentStatus: (userId, orderId, paymentId) => {
        console.log(paymentId, 'data----');
        try {
            return new Promise(async (resolve, reject) => {
                await orderModel.Order.updateOne(
                    { "orders._id": orderId },
                    {
                        $set: {
                            "orders.$.orderConfirm": "Success",
                            "orders.$.paymentStatus": "Paid",
                            "orders.$.paymentId": paymentId
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
    },

    //cancel order
    cancelOrder: (orderId) => {
        try {
            return new Promise((resolve, reject) => {
                orderModel.Order.find({ 'orders._id': orderId }).then((orders) => {
                    let orderIndex = orders[0].orders.findIndex((orders) => orders._id == orderId);
                    let order = orders[0].orders.find((order) => order._id == orderId);

                    if (order.paymentMethod === 'razorpay' && order.paymentStatus === 'Paid') {
                        // Fetch payment details from Razorpay API
                        instance.payments.fetch(order.paymentId).then((payment) => {
                            if (payment.status === 'captured') {
                                // Initiate refund using the payment ID and refund amount
                                instance.payments.refund(order.paymentId, { amount: order.totalPrice * 100 }).then((refund) => {
                                    // Update order status in the database
                                    orderModel.Order.updateOne(
                                        { 'orders._id': orderId },
                                        {
                                            $set: {
                                                ['orders.' + orderIndex + '.orderConfirm']: 'Canceled',
                                                ['orders.' + orderIndex + '.paymentStatus']: 'Refunded'
                                            }
                                        }
                                    ).then((orders) => {
                                        resolve(orders)
                                    });
                                }).catch((error) => {
                                    console.log(error);
                                    reject(error);
                                });
                            } else {
                                console.log('Payment not captured');
                                reject('Payment not captured');
                            }
                        }).catch((error) => {
                            console.log(error);
                            reject(error);
                        });
                    } else if (order.paymentMethod === 'COD' && order.orderConfirm === 'Delivered' && order.paymentStatus === 'paid') {
                        // Update order status in the database
                        orderModel.Order.updateOne(
                            { 'orders._id': orderId },
                            {
                                $set: {
                                    ['orders.' + orderIndex + '.orderConfirm']: 'Canceled',
                                    ['orders.' + orderIndex + '.paymentStatus']: 'Refunded'
                                }
                            }
                        ).then((orders) => {
                            resolve(orders)
                        });
                    } else {
                        // Update order status in the database
                        orderModel.Order.updateOne(
                            { 'orders._id': orderId },
                            {
                                $set: {
                                    ['orders.' + orderIndex + '.orderConfirm']: 'Canceled'
                                }
                            }
                        ).then((orders) => {
                            resolve(orders)
                        });
                    }
                });
            });
        } catch (error) {
            console.log(error.message);
        }
    },



    // return order
    returnOrder: (orderId) => {
        try {
            return new Promise((resolve, reject) => {
                orderModel.Order.find({ 'orders._id': orderId }).then((orders) => {

                    let orderIndex = orders[0].orders.findIndex(
                        (orders) => orders._id == orderId
                    );
                    let order = orders[0].orders.find((order) => order._id == orderId);

                    if (order.paymentMethod === 'razorpay' && order.paymentStatus === 'Paid') {
                        // Fetch payment details from Razorpay API
                        instance.payments.fetch(order.paymentId).then((payment) => {
                            if (payment.status === 'captured') {
                                // Initiate refund using the payment ID and refund amount
                                instance.payments.refund(order.paymentId, { amount: order.totalPrice * 100 }).then((refund) => {
                                    // Update order status in the database
                                    orderModel.Order.updateOne(
                                        { 'orders._id': orderId },
                                        {
                                            $set: {
                                                ['orders.' + orderIndex + '.orderConfirm']: 'Returned',
                                                ['orders.' + orderIndex + '.paymentStatus']: 'Refunded'
                                            }
                                        }
                                    ).then((orders) => {
                                        resolve(orders);
                                    });
                                }).catch((error) => {
                                    console.log(error);
                                    reject(error);
                                });
                            } else {
                                console.log('Payment not captured');
                                reject('Payment not captured');
                            }
                        }).catch((error) => {
                            console.log(error);
                            reject(error);
                        });
                    } else if (order.paymentMethod === 'COD' || order.paymentMethod === 'wallet') {
                        // Update order status in the database
                        orderModel.Order.updateOne(
                            { 'orders._id': orderId },
                            {
                                $set: {
                                    ['orders.' + orderIndex + '.orderConfirm']: 'Returned',
                                    ['orders.' + orderIndex + '.paymentStatus']: 'Refunded'
                                }
                            }
                        ).then((orders) => {
                            resolve(orders);
                        });
                    } else {
                        console.log('Invalid payment method');
                        reject('Invalid payment method');
                    }
                });
            });
        } catch (error) {
            console.log(error.message);
        }
    },

    //to get all orders for admin
    getAllOrders: () => {
        try {
            return new Promise((resolve, reject) => {
                orderModel.Order.find().then((order) => {
                    resolve(order)
                })
            })
        } catch (error) {
            console.log(error.message);
        }
    },


    //to get the current order
    getSubOrders: (orderId, userId) => {
        try {
            return new Promise((resolve, reject) => {
                orderModel.Order.aggregate([
                    {
                        $match: {
                            'user': new ObjectId(userId)
                        }
                    },
                    {
                        $unwind: '$orders'

                    },
                    {
                        $match: {
                            'orders._id': new ObjectId(orderId)
                        }
                    }

                ]).then((order) => {
                    resolve(order)
                })
            })
        } catch (error) {
            console.log(error.message);
        }
    },

    //to get the order address of the user
    getOrderAddress: (userId, orderId) => {
        return new Promise((resolve, reject) => {
            orderModel.Order.aggregate([
                {
                    $match: {
                        "user": new ObjectId(userId)
                    }
                },
                {
                    $unwind: "$orders"
                },
                {
                    $match: {
                        "orders._id": new ObjectId(orderId)
                    }
                },
                {
                    $unwind: "$orders.shippingAddress"
                },
                {
                    $project: {
                        "shippingAddress": "$orders.shippingAddress"
                    }
                }
            ]).then((address) => {
                resolve(address)
            })

        })
    },

    //to get the ordered products of the user
    getOrderedProducts: (orderId, userId) => {
        try {
            return new Promise((resolve, reject) => {
                orderModel.Order.aggregate([
                    {
                        $match: {
                            "user": new ObjectId(userId)
                        }
                    },
                    {
                        $unwind: "$orders"
                    },
                    {
                        $match: {
                            "orders._id": new ObjectId(orderId)
                        }
                    },
                    {
                        $unwind: "$orders.productDetails"
                    },
                    {
                        $project: {
                            "productDetails": "$orders.productDetails"
                        }
                    }
                ]).then((response) => {
                    resolve(response)
                })
            })
        } catch (error) {
            console.log(error.message);
        }
    },

    // to get the total of a certain product by multiplying with the quantity
    getTotal: (orderId, userId) => {
        try {
            return new Promise((resolve, reject) => {
                orderModel.Order.aggregate([
                    {
                        $match: {
                            "user": new ObjectId(userId)
                        }
                    },
                    {
                        $unwind: "$orders"
                    },
                    {
                        $match: {
                            "orders._id": new ObjectId(orderId)
                        }
                    },
                    {
                        $unwind: "$orders.productDetails"
                    },
                    {
                        $project: {
                            "productDetails": "$orders.productDetails",

                            "totalPrice": { $multiply: ["$orders.productDetails.productPrice", "$orders.productDetails.quantity"] }
                        }
                    }
                ]).then((response) => {
                    resolve(response)
                })
            })
        } catch (error) {
            console.log(error.message);
        }
    },

    //to find the total of the order
    getOrderTotal: (orderId, userId) => {
        try {
            return new Promise((resolve, reject) => {
                orderModel.Order.aggregate([
                    {
                        $match: {
                            "user": new ObjectId(userId)
                        }
                    },
                    {
                        $unwind: "$orders"
                    },
                    {
                        $match: {
                            "orders._id": new ObjectId(orderId)
                        }
                    },
                    {
                        $unwind: "$orders.productDetails"
                    },
                    {
                        $group: {
                            _id: "$orders._id",
                            totalPrice: { $sum: "$orders.productDetails.productPrice" }
                        }
                    }

                ]).then((response) => {
                    if (response && response.length > 0) {
                        const orderTotal = response[0].totalPrice
                        resolve(orderTotal)
                    }
                })
            })
        } catch (error) {
            console.log(error.message);
        }
    },

    //to change the order status by admin
    changeOrderStatus: (orderId, status) => {
        try {
            return new Promise((resolve, reject) => {
                orderModel.Order.updateOne(
                    { 'orders._id': orderId },
                    {
                        $set: { 'orders.$.orderConfirm': status }
                    }).then((response) => {
                        console.log(response, '$$$$$$$$$$$$$$');
                        resolve(response)
                    })
            })
        } catch (error) {
            console.log(error.message);
        }
    },

    addWallet: (userId, total) => {
        try {
            return new Promise((resolve, reject) => {
                console.log(userId, total, '--------');
                userModel.User.updateOne({ _id: userId },
                    {
                        $inc: { wallet: total }
                    }).then((response) => {
                        resolve(response)
                    })
            })
        } catch (error) {
            console.log(error.message);
        }
    },

    //admin dashboard
    // get order by date

    getOrderByDate: () => {
        return new Promise(async (resolve, reject) => {
            const startDate = new Date();
            await orderModel.Order
                .find({ createdAt: { $gte: startDate } })
                .then((response) => {
                    resolve(response);
                });
        });
    },

    // get orders by category wise

    getOrderByCategory: () => {
        return new Promise(async (resolve, reject) => {
            await orderModel.Order.aggregate([
                { $unwind: "$orders" },
            ]).then((response) => {
                const productDetails = response.map(order => order.orders.productDetails);
                resolve(productDetails)

            })
        })
    },

    /* GET Edit Address Page */
    getEditAddress: (addressId, userId) => {
        return new Promise((resolve, reject) => {
            addressModel.Address.aggregate([
                {
                    $match: {
                        user: new ObjectId(userId)
                    }
                },
                {
                    $project: {
                        address: {
                            $filter: {
                                input: "$Address",
                                as: "item",
                                cond: { $eq: ["$$item._id", new ObjectId(addressId)] }
                            }
                        }
                    }
                }
            ])
                .then(result => {
                    if (result.length === 0) {
                        resolve(null); // Address not found
                    } else {
                        resolve(result[0].address[0]); // Return the matched address
                    }
                })
                .catch(error => {
                    reject(error);
                });
        });
    }




    // updatePaymentStatus: (orderId, userId) => {
    //     try {
    //         return new Promise((resolve, reject) => {
    //             orderModel.Order.aggregate([
    //                 {
    //                     $match: {
    //                         'user': new ObjectId(userId)
    //                     }
    //                 },
    //                 {
    //                     $unwind: '$orders'
    //                 },
    //                 {
    //                     $match: {
    //                         'orders._id': new ObjectId(orderId)
    //                     }
    //                 },
    //                 {
    //                     $set: {
    //                         'orders.paymentStatus': 'refunded'
    //                     }
    //                 }
    //             ]).then((response) => {
    //                 console.log(response, '$$$$$$$$$$$$$$$');
    //                 resolve(response)
    //             })
    //         })
    //     } catch (error) {
    //         console.log(error.message);
    //     }
    // }
}