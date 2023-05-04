const express = require('express')
const categoryModel = require('../schema/models')
const adminHelpers = require('../helpers/adminHelpers')
const { Product } = require('../schema/models')
const orderHelpers = require('../helpers/orderHelpers')
const userController = require('./userController')
const couponHelpers = require('../helpers/couponHelpers')


module.exports = {

    /* GET Dashboard */
    getDashboard: (req, res) => {
        let admin = req.session.admin
        res.render('admin/dashboard', { layout: 'adminLayout', admin })
    },

    /* GET Login Page. */
    getLogin: (req, res) => {
        res.render('admin/login', { layout: 'adminLayout' })
    },

    /* Post Login Page. */
    postLogin: (req, res) => {
        let data = req.body
        adminHelpers.doLogin(data).then((loginAction) => {
            req.session.admin = loginAction
            res.send(loginAction)
        })
    },

    doLogout: (req, res) => {
        req.session.admin = null
        res.redirect('/admin/login')
    },

    /* GET User List Page. */
    getUserList: (req, res) => {
        let admin = req.session.admin
        adminHelpers.getUserList().then((user) => {
            res.render('admin/userList', { layout: 'adminLayout', user, admin })
        })
    },

    // Put change user stastus//
    changeUserStatus: (req, res) => {
        let userId = req.query.id
        let status = req.query.status
        if(status === 'false'){
            req.session.user = null
        }
        adminHelpers.changeUserStatus(userId, status).then(() => {
            res.send(status)
        })
    },

    /* GET Category Page. */
    getAddCategory: async (req, res) => {
        let admin = req.session.admin
        let categories = await categoryModel.Category.find()
        res.render('admin/addCategory', { layout: 'adminLayout', categories, admin })
    },

    /* Post addCategory Page. */
    postAddCategory: (req, res) => {
        let data = req.body
        adminHelpers.postAddCategory(data).then((category) => {
            res.send(category)
        })
    },
    /* GET editCategory Page. */
    getEditCategory: (req, res) => {
        let catId = req.params._id;
        adminHelpers.getEditCategory(catId)

    },
    /* Post editCategory Page. */
    postEditCategory: (req, res) => {
        let data = req.body
        adminHelpers.postEditCategory(data)
    },

    /* GET AddProduct Page. */
    getAddProduct: async (req, res) => {
        let admin = req.session.admin
        let categories = await categoryModel.Category.find()
        res.render('admin/addProduct', { layout: 'adminLayout', categories, admin })
    },

    /* Post AddProduct Page. */
    postAddProduct: (req, res) => {
        let file = req.files
        const fileName = file.map((file) => {
            return file.filename
        })
        console.log(file);
        const product = req.body
        product.img = fileName
        adminHelpers.postAddProduct(product).then(() => {
            res.redirect('/admin/dashboard')
        })
    },

    /* GET EditProduct Page. */
    getEditProduct: (req, res) => {
        let admin = req.session.admin
        let proId = req.params.id;
        adminHelpers.getEditProduct(proId).then(async (product) => {
            let category = await categoryModel.Category.find()
            res.render('admin/editProduct', { layout: 'adminLayout', product, category, admin })
        })

    },
    postEditProduct: async (req, res) => {
        let proId = req.params.id
        let file = req.files
        let image = [];

        let previousImages = await adminHelpers.getPreviousImages(proId)

        console.log(previousImages, 'oldimage');
        console.log(file, 'uploaded');


        if (req.files.image1) {
            image.push(req.files.image1[0].filename)
        } else {
            image.push(previousImages[0])
        }

        if (req.files.image2) {
            image.push(req.files.image2[0].filename)
        } else {
            image.push(previousImages[1])
        }
        if (req.files.image3) {
            image.push(req.files.image3[0].filename)
        } else {
            image.push(previousImages[2])
        }
        if (req.files.image4) {
            image.push(req.files.image4[0].filename)
        } else {
            image.push(previousImages[3])
        }

        adminHelpers.postEditProduct(proId, req.body, image).then(() => {
            res.redirect('/admin/productList')
        })
    },

    /*  Delete Product Page. */
    deleteProduct: (req, res) => {
        let proId = req.params.id
        adminHelpers.deleteProduct(proId).then((response) => {
            res.send(response)
        })
    },

    /* GET ProductList Page. */
    getProductList: (req, res) => {
        let admin = req.session.admin
        adminHelpers.getProductList().then((product) => {
            console.log(Product);
            res.render('admin/productList', { layout: 'adminLayout', product, admin })
        })
    },

    //getting all categroys

    handleEditCategorys: async (req, res) => {
        try {
            const catId = req.params.id;
            const category = await categoryModel.Category.findById(catId)
            if (category) {
                res.status(200).json(category);
            } else {
                res.status(404).json({ message: 'Somthing went wrong..' });
            }

        } catch (error) {
            res.status(404).redirect('/error')
        }
    },

    handleEditCategoryPatch: async (req, res) => {
        try {
            console.log(req.body)

            await categoryModel.Category.updateOne({ _id: req.body._id }, { $push: { sub_category: req.body.newSubCat } });
            res.status(202).json(true);
        } catch (error) {
            res.status(404).redirect('/error')
        }
    },

    removeSubCategory:(req,res)=>{
        let cartId = req.params.id
        adminHelpers.deleteSubCategory(cartId, req.body.newSubCat).then((response)=>{
            res.send(response)
        })
    },
    /* Delete Category Page. */
    deleteCategory: (req, res) => {
        let catId = req.params.id
        adminHelpers.deleteCategory(catId).then((response) => {
            res.send(response)
        })
    },

    /* GET Order List Page. */
    getOrderList: (req, res) => {
        let userId = req.params.id
        let admin = req.session.admin
        // orderHelpers.getAddress(userId).then((address) => {
        adminHelpers.getUserList().then((user) => {
            orderHelpers.getOrders(userId).then((order) => {
                res.render('admin/orderList', { layout: 'adminLayout', user, admin, order })
            })
        })
        // })
    },

    /* GET Order Details Page. */
    getOrderDetails: async (req, res) => {
        let admin = req.session.admin
        let orderId = req.query.orderId
        let userId = req.query.userId
        let userDetails = await userController.getDetails(userId)
        orderHelpers.getOrderAddress(userId, orderId).then((address) => {
            orderHelpers.getSubOrders(orderId, userId).then((orderDetails) => {
                orderHelpers.getOrderedProducts(orderId, userId).then((product) => {
                    orderHelpers.getTotal(orderId, userId).then((productTotalPrice) => {
                        orderHelpers.getOrderTotal(orderId, userId).then((orderTotalPrice) => {
                            // console.log('orderDetails',orderDetails,'orderDetails');
                            // console.log('orderId',orderId,'orderId');
                            res.render('admin/orderDetails', {
                                layout: 'adminLayout', admin, userDetails,
                                address, product, orderId, orderDetails, productTotalPrice, orderTotalPrice
                            })
                        })
                    })
                })
            })
        })
    },

    /* GET Add Coupon Page. */
    getAddCoupon:(req,res)=>{
        let admin = req.session.admin
        res.render('admin/addCoupon',{layout : 'adminLayout', admin})
    },

    /* GET Generate Coupon Code Page. */
    generatorCouponCode:(req,res)=>{
        couponHelpers.generatorCouponCode().then((couponCode)=>{
            console.log(couponCode,'-----');
            res.send(couponCode)
        })
    },

    /* Post Add Coupone Page. */
    postaddCoupon:(req,res)=>{
        let data = {
            couponCode : req.body.coupon,
            validity : req.body.validity,
            minPurchase : req.body.minPurchase,
            minDiscountPercentage : req.body.minDiscountPercentage,
            maxDiscountValue : req.body.maxDiscount,
            description : req.body.description
        }
        couponHelpers.postaddCoupon(data).then((response)=>{
            res.send(response)
        })
    },

    /* GET Coupon List Page. */
    getCouponList:(req,res)=>{
        let admin = req.session.admin
        console.log('called coupon list page')
        couponHelpers.getCouponList().then((couponList)=>{
            res.render('admin/couponList',{layout : 'adminLayout', admin, couponList})
        })
    },

    
    /* DELETE Coupon  Page. */
    removeCoupon:(req,res)=>{
        let couponId = req.body.couponId
        couponHelpers.removeCoupon(couponId).then((successResponse)=>{
            res.send(successResponse)
        })
    }
    // errorPage:(req,res)=>{
    //     res.render('error',{layout : 'adminlayout'})
    // }

}


