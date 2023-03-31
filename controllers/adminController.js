const express = require('express')
const categoryModel = require('../schema/models')
const adminHelpers = require('../helpers/adminHelpers')
const { Product } = require('../schema/models')


module.exports = {

    /* GET Dashboard */
    getDashboard: (req, res) => {
        let admin = req.session.admin
        res.render('admin/dashboard', { layout: 'adminLayout',admin})
    },

    /* GET Login Page. */
    getLogin: (req, res) => {
        res.render('admin/login', { layout: 'adminLayout'})
    },

    /* Post Login Page. */
    postLogin: (req, res) => {
        let data = req.body
        adminHelpers.doLogin(data).then((loginAction) => {
            req.session.admin = loginAction
            res.send(loginAction)
        })
    },

    doLogout:(req,res)=>{
        req.session.admin = null
        res.redirect('/admin/login')
    },

    /* GET User List Page. */
    getUserList:(req,res)=>{
        adminHelpers.getUserList().then((user)=>{
            res.render('admin/userList',{layout : 'adminLayout',user})
        })
    },

    // Put change user stastus//
    changeUserStatus:(req,res)=>{
        let userId = req.query.id
        let status = req.query.status
        console.log(req.query);
        adminHelpers.changeUserStatus(userId,status).then(()=>{
            res.send(status)
        })
    },

    /* GET Category Page. */
    getAddCategory: async (req, res) => {
        let categories = await categoryModel.Category.find()
        res.render('admin/addCategory', { layout: 'adminLayout', categories })
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
        let categories = await categoryModel.Category.find()
        res.render('admin/addProduct', { layout: 'adminLayout', categories })
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
        let proId = req.params.id;
        adminHelpers.getEditProduct(proId).then(async (product) => {
            let category = await categoryModel.Category.find()
            res.render('admin/editProduct', { layout: 'adminLayout', product, category })
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
    deleteProduct:(req,res)=>{
        let proId = req.params.id
        adminHelpers.deleteProduct(proId).then((response)=>{
            res.send(response)
        })
    },

    /* GET ProductList Page. */
    getProductList: (req, res) => {
        adminHelpers.getProductList().then((product) => {
            console.log(Product);
            res.render('admin/productList', { layout: 'adminLayout', product })
        })
    },

    //getting all categroys

    handleEditCategorys: async (req, res) => {
        try {
            const catId = req.params.id;
            console.log(catId);
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

            await categoryModel.Category.updateOne({ _id: req.body._id }, { $set: { name: req.body.name } });
            res.status(202).json(true);
        } catch (error) {
            res.status(404).redirect('/error')
        }
    },
    /* Delete Category Page. */
    deleteCategory: (req, res) => {
        let catId = req.params.id
        adminHelpers.deleteCategory(catId).then((response) => {
            res.send(response)
        })
    },

    // errorPage:(req,res)=>{
    //     res.render('error',{layout : 'adminlayout'})
    // }

}