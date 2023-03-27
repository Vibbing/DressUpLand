const express = require('express')
const categoryModel = require('../schema/models')
const adminHelpers = require('../helpers/adminHelpers')


module.exports = {

    /* GET Dashboard */
    getDashboard: (req, res) => {
        res.render('admin/dashboard', { layout: 'adminLayout' })
    },

    /* GET Login Page. */
    getLogin:(req,res)=>{
        res.render('admin/login',{layout : 'adminLayout'})
    },

    /* Post Login Page. */
    postLogin:(req,res)=>{
        let data = req.body
        adminHelpers.doLogin(data).then((loginAction)=>{
            req.session.admin = loginAction
            res.send(loginAction)
        })
    },

    /* GET Category Page. */
    getAddCategory:async(req,res)=>{
        let categories = await categoryModel.Category.find()
        res.render('admin/addCategory',{layout : 'adminLayout',categories})
    },

    /* Post addCategory Page. */
    postAddCategory:(req,res)=>{
        let data = req.body
        adminHelpers.postAddCategory(data).then((category)=>{
            res.send(category)
        })
    },
     /* GET editCategory Page. */
    getEditCategory:(req,res)=>{
        let catId = req.params._id;
        adminHelpers.getEditCategory(catId)

    },
    /* Post editCategory Page. */
    postEditCategory:(req,res)=>{
        let data = req.body
        adminHelpers.postEditCategory(data)
    },

    /* GET AddProduct Page. */
    getAddProduct: async (req,res)=>{
        let categories = await categoryModel.Category.find()
        res.render('admin/addProduct',{layout : 'adminLayout',categories})
    },

    /* Post AddProduct Page. */
    postAddProduct:(req,res)=>{
        let file = req.files
        console.log(file,'.....');
        const fileName = file.map((file)=>{
            return file.filename
        })
        const product = req.body
        console.log(product.name,'/////');
        product.img = fileName
        adminHelpers.postAddProduct(product).then(()=>{
            res.redirect('/admin/dashboard')
        })
    },

    /* GET ProductList Page. */
    getProductList:(req,res)=>{
        adminHelpers.getProductList().then((product)=>{
            res.render('admin/productList',{layout : 'adminLayout',product})
        })
    },

    //getting all categroys

    handleEditCategorys : async (req, res) =>{
        try {
            const catId = req.params.id;
            console.log(catId);
           const category = await categoryModel.Category.findById(catId)
           if(category){
            res.status(200).json(category);
           } else {
            res.status(404).json({message: 'Somthing went wrong..'});
           }
           
        } catch (error) {
            res.status(404).redirect('/error')
        }
    },
        
    handleEditCategoryPatch : async (req, res)=>{
        try {
            console.log(req.body)

            await categoryModel.Category.updateOne({_id: req.body._id},{$set: { name: req.body.name}});
            res.status(202).json(true);
        } catch (error) {
            res.status(404).redirect('/error')
        }
    },
    /* Delete Category Page. */
    deleteCategory:(req,res)=>{
        let catId = req.params.id
        adminHelpers.deleteCategory(catId).then((response)=>{
            res.send(response)
        })
    },
    
    // errorPage:(req,res)=>{
    //     res.render('error',{layout : 'adminlayout'})
    // }

}