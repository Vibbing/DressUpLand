const adminModel = require('../schema/models')
const productModel = require('../schema/models')
const categoryModel = require('../schema/models')
const userModel = require('../schema/models')
const bcrypt = require('bcrypt')
const { response } = require('../app')

module.exports = {


    /* Post Login Page. */
    doLogin:(data)=>{
        console.log(data,'ooo');
        try {
            return new Promise((resolve,reject)=>{
               adminModel.Admin.findOne({email : data.email}).then((admin)=>{ 
                if(admin){
                    bcrypt.compare(data.password,admin.password).then((loginTrue)=>{  
                        resolve(loginTrue)
                    })
                }else{
                    resolve(false)
                }
               })
            })
        } catch (error) {
            console.log(error.message);
        }
    },
    /* GET User List Page. */
    getUserList:()=>{
        try {
            return new Promise((resolve,reject)=>{
                userModel.User.find().then((user)=>{
                    if(user){
                        resolve(user)
                    }else{
                        console.log("User not found");
                    }
                })
            })
        } catch (error) {
            console.log(error.message);
        }
    },

    // Put change user stastus//
    changeUserStatus:(userId,status)=>{
        try {
            return new Promise((resolve,reject)=>{
                userModel.User.updateOne({_id:userId},{$set:{status : status}}).then((response)=>{
                    if(response){
                        resolve(response)
                    }else{
                        console.log("not found");
                    }
                })
            })
        } catch (error) {
            console.log(error.message);
        }

    },

    /* Post AddProduct Page. */
    postAddProduct:(data)=>{
      try {
        return new Promise((resolve,reject)=>{
            let product = new productModel.Product(data);
            product.save().then(()=>{
                resolve()
            })

        })
      } catch (error) {
        console.log(error.message);
      }
    },

    /* GET EditProduct Page. */
    getEditProduct:(proId)=>{
        try {
            return new Promise((resolve,reject)=>{
            productModel.Product.findById(proId).then((product)=>{
                if(product){
                    resolve(product)
                }else{
                    console.log('product not found');
                }
            })
            })
        } catch (error) {
            console.log(error.message);
        }

    },
    //to get images for edit product
    getPreviousImages:(proId)=>
    {
       try {
        return new Promise(async(resolve,reject)=>{
            await productModel.Product.findOne({_id:proId}).then((response)=>{
                resolve(response.img)
            })
        })
       } catch (error) {
        console.log(error.message);
       }
        
    },
    /* Post EditProduct Page. */
    postEditProduct:(proId,product,image)=>{

        try {
            return new Promise((resolve,reject)=>{
                productModel.Product.updateOne({_id:proId},
                    {
                        $set:
                        {
                            name : product.name,
                            brand : product.brand,
                            description : product.description,
                            price : product.price,
                            quantity : product.quantity,
                            category : product.category,
                            img : image
                        }
                    }).then((newProduct)=>{
                        resolve(newProduct)
                    })
            })
        } catch (error) {
            console.log(error.message);
        }
    },

    /*  Delete Product Page. */
    deleteProduct:(proId)=>{
        try {
            return new Promise((resolve,reject)=>{
                productModel.Product.findByIdAndDelete({_id:proId}).then((response)=>{
                   if(response){
                    resolve({status : true})
                   }else{
                    resolve({status : false})
                   }
                })
            })
        } catch (error) {
            console.log(error.message);
        }
    },

    /* GET ProductList Page. */
    getProductList:()=>{
        try {
            return new Promise((resolve,reject)=>{
                 productModel.Product.find().then((product)=>{
                    if(product){
                        resolve(product)
                    }else{
                        console.log('product not found');
                    }
                })
            })
        } catch (error) {
            console.log(error.message);
        }

    },

    /* Post addCategory Page. */
    postAddCategory:(data)=>{
       try {
        return new Promise((resolve,reject)=>{
            categoryModel.Category.findOne({name : data.name}).then(async (category)=>{
                if(category){
                    resolve({status : false})
                }else{
                    let category = categoryModel.Category(data)
                    await category.save().then(()=>{
                        resolve({status : true})
                    })
                }
            })
        })
       } catch (error) {
        console.log(error.message);
       }
    },
    
    /* GET editCategory Page. */
    getEditCategory:(catId)=>{
        try {
            categoryModel.Category.findById(catId).then((category)=>{
                if(category){
                    resolve
                }
            })
        } catch (error) {
            
        }

    },

    /* Post editCategory Page. */
    postEditCategory:(data)=>{
        try {
            return new Promise((resolve,reject)=>{
                categoryModel.Category.find().then((category)=>{

                })
            })
        } catch (error) {
            console.log(error.message);
        }
    },
     /* Delete Category Page. */
    deleteCategory:(catId)=>{
        try {
            return new Promise((resolve,reject)=>{
                categoryModel.Category.findByIdAndDelete(catId).then((res)=>{
                    if(res){
                        resolve({status : true})
                    }else{
                        resolve({status : false})
                    }
                })
            })
            
        } catch (error) {
            console.log(err.message);
        }
    }
}