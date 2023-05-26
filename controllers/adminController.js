const express = require('express')
const categoryModel = require('../schema/models')
const productModel = require('../schema/models')
const adminHelpers = require('../helpers/adminHelpers')
const { Product } = require('../schema/models')
const orderHelpers = require('../helpers/orderHelpers')
const userController = require('./userController')
const couponHelpers = require('../helpers/couponHelpers')




module.exports = {

    /* GET Dashboard */
    getDashboard: async (req, res) => {
        admin = req.session.admin;
        let totalProducts,
            days = [];
        let ordersPerDay = {};
        let paymentCount = [];

        let Products = await adminHelpers.getAllProducts();
        totalProducts = Products.length;

        await orderHelpers.getOrderByDate().then((response) => {

            let result = response;
            for (let i = 0; i < result.length; i++) {
                for (let j = 0; j < result[i].orders.length; j++) {
                    let ans = {};
                    ans["createdAt"] = result[i].orders[j].createdAt;
                    days.push(ans);
                }
            }

            days.forEach((order) => {
                let day = order.createdAt.toLocaleDateString("en-US", {
                    weekday: "long",
                });
                ordersPerDay[day] = (ordersPerDay[day] || 0) + 1;

            });
        });

        let getCodCount = await adminHelpers.getCodCount();
        let codCount = getCodCount.length;

        let getOnlineCount = await adminHelpers.getOnlineCount();
        let onlineCount = getOnlineCount.length;

        let getWalletCount = await adminHelpers.getWalletCount();
        let WalletCount = getWalletCount.length;

        paymentCount.push(onlineCount);
        paymentCount.push(codCount);
        paymentCount.push(WalletCount);

        let orderByCategory = await orderHelpers.getOrderByCategory()


        let Men = 0, Women = 0, Kids = 0;

        orderByCategory.forEach((order) => {
            order.forEach((product) => {
                if (product.category === 'Men') Men += product.quantity;
                else if (product.category === 'Women') Women += product.quantity;
                else if (product.category === 'Kids') Kids += product.quantity;
            });
        });

        let category = [Men, Women, Kids];

        orderHelpers.getAllOrders().then((response) => {

            let length = response;

            orderHelpers.getAllOrdersSum().then((response) => {
                let total = response

                res.render('admin/dashboard', {
                    layout: "adminLayout",
                    admin,
                    length,
                    total,
                    totalProducts,
                    ordersPerDay,
                    paymentCount,
                    category
                })
            });
        });
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
        if (status === 'false') {
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

    /* GET Sub Category list for Add Product Page. */
    getSubCategory: (req, res) => {
        let data = req.body
        adminHelpers.getSubCategory(data).then((subCategory) => {
            res.send(subCategory)
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
                console.log(category, 'category');
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
            // Check if sub-category already exists in the database
            const category = await categoryModel.Category.findOne({
                _id: req.body._id,
                sub_category: {
                    $elemMatch: {
                        name: req.body.newSubCat
                    }
                }
            });

            if (category) {
                // Sub-category already exists, update the discount and dates
                await categoryModel.Category.updateOne(
                    { _id: req.body._id, "sub_category.name": req.body.newSubCat },
                    {
                        $set: {
                            "sub_category.$.offer.discount": req.body.offer_percentage,
                            "sub_category.$.offer.validFrom": req.body.valid_from,
                            "sub_category.$.offer.validTo": req.body.valid_to
                        }
                    }
                );
                // Find all products associated with the subcategory and update their prices
                const products = await productModel.Product.find({ sub_category: req.body.newSubCat })
                products.forEach(async (product) => {
                    const originalPrice = product.price
                    const discount = req.body.offer_percentage / 100
                    const discountedPrice = Math.floor(originalPrice - (originalPrice * discount));
                    console.log(discountedPrice, 'discount');
                    console.log(originalPrice, 'originalPrice');
                    console.log(req.body.discount, 'req.body.discount');
                    console.log(req.body, 'req.body');

                    await productModel.Product.updateOne(
                        { _id: product._id },
                        {
                            $set: {
                                discountedPrice: discountedPrice
                            }
                        })
                })
            } else {
                // Sub-category doesn't exist, push it into the sub_category array with the discount and dates
                await categoryModel.Category.updateOne(
                    { _id: req.body._id },
                    {
                        $push: {
                            sub_category: {
                                name: req.body.newSubCat,
                                offer: {
                                    discount: req.body.offer_percentage,
                                    validFrom: req.body.valid_from,
                                    validTo: req.body.valid_to
                                }
                            }
                        }
                    }
                );
            }

            res.status(200).json({ message: "Sub-category updated successfully" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },




    removeSubCategory: (req, res) => {
        let cartId = req.params.id
        adminHelpers.deleteSubCategory(cartId, req.body.newSubCat).then((response) => {
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
        adminHelpers.getUserList(userId).then((user) => {
            console.log(user, 'user');
            orderHelpers.getOrders(userId).then((order) => {
                res.render('admin/orderList', { layout: 'adminLayout', user, userId, admin, order })
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
                            // console.log('admin',admin,'admin');
                            // console.log('orderDetails',orderDetails,'orderDetails');
                            // console.log('address',address,'address');
                            // console.log('product',product,'product');
                            // console.log('productTotalPrice',productTotalPrice,'productTotalPrice');
                            // console.log('orderTotalPrice',orderTotalPrice,'orderTotalPrice');
                            // console.log('userDetails',userDetails,'userDetails');
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
    getAddCoupon: (req, res) => {
        let admin = req.session.admin
        res.render('admin/addCoupon', { layout: 'adminLayout', admin })
    },

    /* GET Generate Coupon Code Page. */
    generatorCouponCode: (req, res) => {
        couponHelpers.generatorCouponCode().then((couponCode) => {
            res.send(couponCode)
        })
    },

    /* Post Add Coupone Page. */
    postaddCoupon: (req, res) => {
        let data = {
            couponCode: req.body.coupon,
            validity: req.body.validity,
            minPurchase: req.body.minPurchase,
            minDiscountPercentage: req.body.minDiscountPercentage,
            maxDiscountValue: req.body.maxDiscount,
            description: req.body.description
        }
        couponHelpers.postaddCoupon(data).then((response) => {
            res.send(response)
        })
    },

    /* GET Coupon List Page. */
    getCouponList: (req, res) => {
        let admin = req.session.admin
        console.log('called coupon list page')
        couponHelpers.getCouponList().then((couponList) => {
            res.render('admin/couponList', { layout: 'adminLayout', admin, couponList })
        })
    },


    /* DELETE Coupon  Page. */
    removeCoupon: (req, res) => {
        let couponId = req.body.couponId
        couponHelpers.removeCoupon(couponId).then((successResponse) => {
            res.send(successResponse)
        })
    },

    /* GET Sales Report Page. */
    getSalesReport: async (req, res) => {
        let admin = req.session.admin
        let report = await adminHelpers.getSalesReport()
        let details = []
        const getDate = (date) => {
            let orderDate = new Date(date)
            let day = orderDate.getDate()
            let month = orderDate.getMonth() + 1
            let year = orderDate.getFullYear()
            return `${isNaN(day) ? "00" : day} - ${isNaN(month) ? "00" : month} - ${isNaN(year) ? "0000" : year}`
        }

        report.forEach((orders) => {
            details.push(orders.orders)
        })

        res.render("admin/salesReport", { layout: 'adminLayout', admin, details, getDate })
    },

    /* POST Sales Report Page. */
    postSalesReport: (req, res) => {

        let admin = req.session.admin
        let details = []
        const getDate = (date) => {
            let orderDate = new Date(date)
            let day = orderDate.getDate()
            let month = orderDate.getMonth() + 1
            let year = orderDate.getFullYear()
            return `${isNaN(day) ? "00" : day} - ${isNaN(month) ? "00" : month} - ${isNaN(year) ? "0000" : year}`
        }

        adminHelpers.postReport(req.body).then((orderData) => {
            orderData.forEach((orders) => {
                details.push(orders.orders)
            })

            res.render("admin/salesReport", { layout: 'adminLayout', admin, details, getDate })
        })

    },


    getAddBanner: (req, res) => {
        let admin = req.session.admin
        res.render('admin/addBanner', { layout: 'adminLayout', admin })
    },

   /* POST Add Banner */
postAddBanner: (req, res) => {
    adminHelpers.addBanner(req.body, req.file.filename).then((response) => {
      if (response) {
        // Add SweetAlert for success
        Swal.fire({
          title: 'Success!',
          text: 'Banner has been added.',
          icon: 'success',
          confirmButtonText: 'OK'
        }).then(() => {
          res.redirect("/admin/banner-list");
        });
      } else {
        // Add SweetAlert for failure
        Swal.fire({
          title: 'Error!',
          text: 'Failed to add the banner.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        res.status(505);
      }
    });
  },
  

    getBannerList: (req, res) => {
        let admin = req.session.admin
        adminHelpers.getBannerList().then((banner) => {
            console.log(banner, 'banner');

            res.render('admin/bannerList', { layout: 'adminLayout', admin, banner })
        })
    },

    getEditBanner: (req, res) => {
        let admin = req.session.admin
        adminHelpers.getEditBanner(req.query.banner).then((banner) => {
            res.render("admin/editBanner", { layout: "adminLayout", admin, banner })
        })
    },

    postEditBanner: (req, res) => {
        console.log(req.query.editbanner, 'req.query.editbanner');
        console.log(req.body, 'req.body');
        console.log(req?.file?.filename, ' req?.file?.filename');
        adminHelpers.postEditBanner(req.query.editbanner, req.body, req?.file?.filename).then((response) => {
            res.redirect("/admin/banner-list")
        })
    },

    deleteBanner: (req, res) => {
        adminHelpers.deleteBanner(req.params.id).then((response) => {
            res.send(response)
        })
    }



    // errorPage:(req,res)=>{
    //     res.render('error',{layout : 'adminlayout'})
    // }

}


