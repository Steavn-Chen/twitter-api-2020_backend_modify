const adminService = require('../services/adminService')

const adminController = {
  getTweets: (req, res) => {
    adminService.getTweets(req, res, (data) => {
      return res.render('admin/tweets', data)
    })
  },
  getUsers: (req, res) => {
    adminService.getUsers(req, res, (data) => {
      return res.render('admin/users', data)
    })
  },
  deleteTweet: (req, res) => {
    adminService.deleteTweet(req, res, (data) => {
      return res.render('admin/tweets', data)
    })
  }
}

module.exports = adminController
