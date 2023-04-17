const DB_URL = process.env.DB_URL
const mongoose = require('mongoose')
mongoose.set('strictQuery',false)
mongoose.connect(DB_URL)
.then(()=>console.log('DataBase Connected Successfully'))
.catch((err)=>console.log(err.message))