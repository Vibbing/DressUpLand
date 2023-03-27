const userModel = require('../schema/models')
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
                                console.log(loginTrue);
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

}

