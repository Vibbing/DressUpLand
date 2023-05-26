module.exports = {

    adminRedirecting: (req, res, next) => {
        if (req.session.admin) {
            return res.redirect('/admin/dashboard')
            
        } else {
            next()
        }
    },

    adminAuth: (req, res, next) => {

        if (req.session.admin) {
            next()
        } else {
            res.render('admin/login', { layout: 'adminLayout' })
        }
    },

   
    userAuth: (req, res, next) => {
        if (req.session.user) {
            next()
        } else {
            res.render('user/login', { layout: 'Layout' })
        }
    },

    userRedirecting: (req, res, next) => {
        if (req.session.user) {
            return res.redirect('/')
        } else {
            next()
        }
    }


}