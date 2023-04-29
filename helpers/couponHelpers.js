const voucherCode = require('voucher-code-generator')
const couponModel = require('../schema/models')


module.exports = {

    /* GET Generate Coupon Code Page. */
    generatorCouponCode: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let couponCode = voucherCode.generate({
                    length: 6,
                    count: 1,
                    charset: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
                    prefix: "Promo-",
                });
                resolve({ status: true, couponCode: couponCode[0] });
            } catch (err) {
            }
        });
    },

    /* Post Add Coupone Page. */
    postaddCoupon: (data) => {
        try {
            return new Promise((resolve, reject) => {
                couponModel.Coupon.findOne({ couponCode: data.couponCode }).then((coupon) => {
                    if (coupon) {
                        resolve({ status: false })
                    } else {
                        couponModel.Coupon(data).save().then((response) => {
                            resolve({ status: true })
                        })
                    }
                })
            })
        } catch (error) {
            console.log(error.message);
        }
    },

    /* GET Coupon List Page. */
    getCouponList:()=>{
        try {
            return new Promise((resolve,reject)=>{
                couponModel.Coupon.find().then((coupons)=>{
                    resolve(coupons)
                })
            })
        } catch (error) {
            console.log(error.message);
        }
    }
}