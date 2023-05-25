
const userModel = require('../schema/models')
const productModel = require('../schema/models')
const bannerModel = require('../schema/models')
const couponModel = require('../schema/models')
const bcrypt = require('bcrypt')

module.exports = {

    //Post Signup
    doSignup: (data) => {
        let obj = {}
        return new Promise(async (resolve, reject) => {
            try {
                await userModel.User.findOne({ email: data.email }).then(async (res) => {
                    if (!res) {
                        data.password = await bcrypt.hash(data.password, 10)
                        userData = {
                            name: data.name,
                            email: data.email,
                            mobile: data.mobile,
                            password: data.password
                        }
                        let userDb = await userModel.User(userData)
                        userDb.save()
                        obj.status = true
                        obj.data = userDb

                        resolve(obj)
                    } else {

                        resolve({ status: false })
                    }
                })

            } catch (error) {
                console.log(error, "Login failed");
            }
        })
    },

    //Post Login
    doLogin: (data) => {
        return new Promise(async (resolve, reject) => {
            try {
                await userModel.User.findOne({ email: data.email }).then((user) => {
                    let response = {}
                    if (user) {
                        if (user.status == true) {
                            bcrypt.compare(data.password, user.password).then((loginTrue) => {
                                if (loginTrue) {
                                    response.user = user
                                    response.status = true
                                    resolve(response)
                                } else {
                                    console.log("login failed");
                                    resolve({ status: false })
                                }
                            })
                        } else {
                            resolve({ blocked: true })
                        }
                    } else {
                        console.log("login failed");
                        resolve({ status: false })
                    }
                })
            } catch (error) {
                console.log(error.message);
            }
        })
    },
    /* GET Shop Page. */
    getAllProducts: async (page, perPage) => {
        const skip = (page - 1) * perPage;
        const product = await productModel.Product.find()
            .skip(skip)
            .limit(perPage);
        
        const totalProducts = await productModel.Product.countDocuments();
        const totalPages = Math.ceil(totalProducts / perPage);
        
        return {
            product,
            totalPages,
        };
    },
    

    /* GET Product Detail Page. */
    getProductDetail: (proId) => {
        try {
            return new Promise((resolve, reject) => {
                productModel.Product.findById({ _id: proId }).then((response) => {
                    resolve(response)
                })
            })
        } catch (error) {
            console.log(error.message);
        }
    },

    getUser: (userId) => {
        try {
            return new Promise((resolve, reject) => {
                userModel.User.findById({ _id: userId }).then((response) => {
                    resolve(response)
                })
            })
        } catch (error) {
            console.log(error.message);
        }
    },

    changeUserData: (userId, data) => {
        try {
            return new Promise((resolve, reject) => {
                userModel.User.updateOne(
                    { _id: userId },
                    {
                        $set: {
                            name: data.userName,
                            email: data.email,
                            mobile: data.mobile
                        }
                    }
                ).then((response) => {
                    console.log(response);
                    resolve(response)
                })
            })
        } catch (error) {
            console.log(error.message);
        }
    },

    //to get the user number for otp verification
    getUserNumber: (mobileNumber) => {
        try {
          return new Promise((resolve, reject) => {
            userModel.User.findOne({ mobile: mobileNumber }).then((user) => {
              if (user) {
                resolve({status : true , message : "User found"});
              } else {
                resolve({status : false , message : "User not found"})
              }
            }).catch((error) => {
              reject(error);
            });
          });
        } catch (error) {
          console.log(error.message);
        }
      },
      
    getQueriesOnShop: (query) => {
        const search = query?.search
        const sort = query?.sort
        const filter = query?.filter
        const page = parseInt(query?.page) || 1
        const perPage = 10


            return new Promise( async(resolve, reject) =>{

                let filterObj = {}
    
                if (filter === 'category=Men') {
                    filterObj = { category: 'Men' }
                } else if (filter === 'category=Women') {
                    filterObj = { category: 'Women' }
                } else if (filter === 'category=Kids') {
                    filterObj = { category: 'Kids' }
                }
                console.log(filterObj,'filterObj');
    
                //Building search query
    
                let searchQuery = {}
    
                if (search) {
                    searchQuery = {
                        $or: [
                            { name: { $regex: search, $options: 'i' } },
                            { description: { $regex: search, $options: 'i' } }
                        ]
                    }
                }
    
                //Building object based on query parameter
    
                let sortObj = {}
    
                if (sort === '-createdAt') {
                    sortObj = { createdAt: -1 };
                } else if (sort === 'createdAt') {
                    sortObj = { createdAt: 1 };
                } else if (sort === '-price') {
                    sortObj = { price: -1 };
                } else if (sort === 'price') {
                    sortObj = { price: 1 };
                }
    
                const skip = (page - 1) * perPage;
                const product = await productModel.Product.find({
                    ...searchQuery,
                    ...filterObj,
                })
                    .sort(sortObj)
                    .skip(skip)
                    .limit(perPage);
    
    
                const totalProducts = await productModel.Product.countDocuments({
                    ...searchQuery,
                    ...filterObj,
                });
    
            //    console.log(searchQuery,'searchQuery');
            //    console.log(sortObj,'sortObj');
            //    console.log(skip,'skip');
            //    console.log(product,'product');
               console.log(totalProducts,'totalProducts');
    
                const totalPages = Math.ceil(totalProducts / perPage);
                if(product.length==0){
                    resolve({
                        noProductFound:true,
                        Message:"No results found.."
                    })
                }
                resolve({
                    product,
                    noProductFound:false,
                    currentPage: page,
                    totalPages,
                  });

            })    

    },

    //getting all banners
    getAllBanner:()=>{
        return new Promise((resolve,reject)=>{
            bannerModel.Banner.find().then((response)=>{
                resolve(response)
            }).catch(error =>{
                resolve(error)
            })
        })
    },

    //getting all coupons
    getAllCoupons:()=>{
        return new Promise((resolve,reject)=>{
            couponModel.Coupon.find().then((response)=>{
                resolve(response)
            }).catch(error=>{
                resolve(error)
            })
        })
    }

}

