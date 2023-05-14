const productModel = require('../schema/models')

const checkProductQty = async (req, res, next) =>{
    const {id} = req.params
    try {
        const prodQty = await productModel.Product.findById(id).select('quantity');
        console.log(prodQty)
        if(prodQty.quantity <= 0){
            return res.status(200).json({error: true, message: "Product is out of stock" })
        }
        next()
    } catch (error) {
        res.status(500).json({message: "Internal error occured"})
    }

}






module.exports = {
    checkProductQty
}