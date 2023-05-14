const adminModel = require('../schema/models')
const productModel = require('../schema/models')
const categoryModel = require('../schema/models')
const userModel = require('../schema/models')
const orderModel = require('../schema/models')
const bannerModel = require('../schema/models')
const bcrypt = require('bcrypt')
const { response } = require('../app')
const { text } = require('pdfkit')

module.exports = {


    /* Post Login Page. */
    doLogin: (data) => {
        console.log(data, 'ooo');
        try {
            return new Promise((resolve, reject) => {
                adminModel.Admin.findOne({ email: data.email }).then((admin) => {
                    if (admin) {
                        bcrypt.compare(data.password, admin.password).then((loginTrue) => {
                            resolve(loginTrue)
                        })
                    } else {
                        resolve(false)
                    }
                })
            })
        } catch (error) {
            console.log(error.message);
        }
    },
    /* GET User List Page. */
    getUserList: () => {
        try {
            return new Promise((resolve, reject) => {
                userModel.User.find().then((user) => {
                    if (user) {
                        resolve(user)
                    } else {
                        console.log("User not found");
                    }
                })
            })
        } catch (error) {
            console.log(error.message);
        }
    },

    // Put change user stastus//
    changeUserStatus: (userId, status) => {
        try {
            return new Promise((resolve, reject) => {
                userModel.User.updateOne({ _id: userId }, { $set: { status: status } }).then((response) => {
                    if (response) {
                        resolve(response)
                    } else {
                        console.log("not found");
                    }
                })
            })
        } catch (error) {
            console.log(error.message);
        }

    },

    /* Post AddProduct Page. */
    postAddProduct: (data) => {
        console.log(data,'dataaaaa');
        try {
            return new Promise((resolve, reject) => {
                let product = new productModel.Product(data);
                product.save().then(() => {
                    resolve()
                })

            })
        } catch (error) {
            console.log(error.message);
        }
    },

    /* GET Sub Category list for Add Product Page. */
    getSubCategory:(data)=>{
        try {
            return new Promise((resolve,reject)=>{
                categoryModel.Category.findOne({category : data.category}).then((category)=>{
                    if(category){
                        resolve(category.sub_category)
                    }else{
                        reject("Error Category not found")
                    }
                })
            })
        } catch (error) {
            console.log(error.message);
        }
    },

    /* GET EditProduct Page. */
    getEditProduct: (proId) => {
        try {
            return new Promise((resolve, reject) => {
                productModel.Product.findById(proId).then((product) => {
                    if (product) {
                        resolve(product)
                    } else {
                        console.log('product not found');
                    }
                })
            })
        } catch (error) {
            console.log(error.message);
        }

    },
    //to get images for edit product
    getPreviousImages: (proId) => {
        try {
            return new Promise(async (resolve, reject) => {
                await productModel.Product.findOne({ _id: proId }).then((response) => {
                    resolve(response.img)
                })
            })
        } catch (error) {
            console.log(error.message);
        }

    },
    /* Post EditProduct Page. */
    postEditProduct: (proId, product, image) => {

        try {
            return new Promise((resolve, reject) => {
                productModel.Product.updateOne({ _id: proId },
                    {
                        $set:
                        {
                            name: product.name,
                            brand: product.brand,
                            description: product.description,
                            price: product.price,
                            quantity: product.quantity,
                            category: product.category,
                            img: image
                        }
                    }).then((newProduct) => {
                        resolve(newProduct)
                    })
            })
        } catch (error) {
            console.log(error.message);
        }
    },

    /*  Delete Product Page. */
    deleteProduct: (proId) => {
        try {
            return new Promise((resolve, reject) => {
                productModel.Product.findByIdAndDelete({ _id: proId }).then((response) => {
                    if (response) {
                        resolve({ status: true })
                    } else {
                        resolve({ status: false })
                    }
                })
            })
        } catch (error) {
            console.log(error.message);
        }
    },

    /* GET ProductList Page. */
    getProductList: () => {
        try {
            return new Promise((resolve, reject) => {
                productModel.Product.find().then((product) => {
                    if (product) {
                        resolve(product)
                    } else {
                        console.log('product not found');
                    }
                })
            })
        } catch (error) {
            console.log(error.message);
        }

    },

    /* Post addCategory Page. */
    postAddCategory: (data) => {
        console.log(data, 'dataa');
        try {
            return new Promise((resolve, reject) => {
                // capitalize the first letter of category
                const category = data.category.charAt(0).toUpperCase() + data.category.slice(1).toLowerCase();

                categoryModel.Category.findOne({ category: category })
                    .then(async (categoryDoc) => {
                        if (!categoryDoc) {
                            let newCategory = new categoryModel.Category({
                                category: category,
                                sub_category: [{ name: data.sub_category, offer: { validFrom: 0, validTo: 0, discountPercentage: 0 } }]
                            });
                            await newCategory.save().then(() => {
                                resolve({ status: true });
                            });
                        } else {
                            let subcategoryDoc = categoryDoc.sub_category.find((sub_category) => sub_category.name === data.sub_category);
                            if (!subcategoryDoc) {
                                categoryDoc.sub_category.push({ name: data.sub_category, offer: { validFrom: 0, validTo: 0, discountPercentage: 0 } });
                                await categoryDoc.save().then(() => {
                                    resolve({ status: true });
                                });
                            } else {
                                resolve({ status: false, message: 'Subcategory already exists.' });
                            }
                        }
                    });
            });
        } catch (error) {
            console.log(error.message);
        }
    },





    /* GET editCategory Page. */
    getEditCategory: (catId) => {
        try {
            categoryModel.Category.findById(catId).then((category) => {
                if (category) {
                    resolve
                }
            })
        } catch (error) {

        }

    },

    /* Post editCategory Page. */
    postEditCategory: (data) => {
        try {
            return new Promise((resolve, reject) => {
                categoryModel.Category.find().then((category) => {

                })
            })
        } catch (error) {
            console.log(error.message);
        }
    },
    /* Delete Category Page. */
    deleteCategory: (catId) => {
        try {
            return new Promise((resolve, reject) => {
                categoryModel.Category.findByIdAndDelete(catId).then((res) => {
                    if (res) {
                        resolve({ status: true })
                    } else {
                        resolve({ status: false })
                    }
                })
            })

        } catch (error) {
            console.log(err.message);
        }
    },

    
    deleteSubCategory: (id, name) => {
        return new Promise(async (resolve, reject) => {
          await categoryModel.Category.updateOne(
            { _id: id },
            { $pull: { sub_category: { name: name } } }
          ).then((response) => {
            console.log(response);
            resolve(response);
          });
        });
      },
      

    getSalesReport: () => {
        try {
            return new Promise((resolve, reject) => {
                orderModel.Order.aggregate([
                    {
                        $unwind: '$orders'
                    },
                    {
                        $match: {
                            "orders.orderConfirm": "delivered"
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

    postReport: (date) => {
        console.log(date, 'date+++++');
        try {
            let start = new Date(date.startdate);
            let end = new Date(date.enddate);
            return new Promise((resolve, reject) => {
                orderModel.Order.aggregate([
                    {
                        $unwind: '$orders'
                    },
                    {
                        $match: {
                            $and: [
                                { "orders.orderConfirm": "delivered" },
                                { "orders.createdAt": { $gte: start, $lte: end } }
                            ]
                        }
                    }
                ]).exec()
                    .then((response) => {
                        console.log(response, 'response---');
                        resolve(response)
                    })
            })
        } catch (error) {
            console.log(error.message);
        }
    },

    
  addBanner: (texts, Image) => {

    return new Promise(async (resolve, reject) => {

      let banner = bannerModel.Banner({
        title: texts.title,
        description: texts.description,
        image: Image

      })
      await banner.save().then((response) => {
        resolve(response)
      })
    })
  },

  //dashboard codes
  
  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      await productModel.Product.find().then((response) => {
        resolve(response);
      });
    });
  },

  getCodCount: () => {
    return new Promise(async (resolve, reject) => {
      let response = await orderModel.Order.aggregate([
        {
          $unwind: "$orders",
        },
        {
          $match: {
            "orders.paymentMethod": "COD",
          },
        },
      ]);
      resolve(response);
    });
  },

  getOnlineCount: () => {
    return new Promise(async (resolve, reject) => {
      let response = await orderModel.Order.aggregate([
        {
          $unwind: "$orders",
        },
        {
          $match: {
            "orders.paymentMethod": "razorpay",
          },
        },
      ]);
      resolve(response);
    });
  },

  getWalletCount:()=>
  {
    return new Promise(async (resolve, reject) => {
      let response = await orderModel.Order.aggregate([
        {
          $unwind: "$orders",
        },
        {
          $match: {
            "orders.paymentMethod": "wallet",
          },
        },
      ]);
      resolve(response);
    });

  },

  getBannerList:()=>{
   return new Promise((resolve,reject)=>{
    bannerModel.Banner.find().then((banner)=>{
        resolve(banner)
    })
   })
  },

  getEditBanner:(bannerId)=>{
    return new Promise((resolve,reject)=>{
        bannerModel.Banner.findOne({_id : bannerId}).then((bannerFound)=>{
        resolve(bannerFound)
        })
    })
  },

  postEditBanner:(bannerId,text,image)=>{
    return new Promise((resolve,reject)=>{
        bannerModel.Banner.updateOne(
            {_id : bannerId},
            {
                $set:{
                    title : text.title,
                    description :text.description,
                    image : image
                }
            }).then((bannerUpdated)=>{
                resolve(bannerUpdated)
            })
    })
  },

  deleteBanner:(bannerId)=>{
    return new Promise((resolve,reject)=>{
        bannerModel.Banner.deleteOne({_id : bannerId}).then(()=>{
            resolve()
        })
    })
  }


}