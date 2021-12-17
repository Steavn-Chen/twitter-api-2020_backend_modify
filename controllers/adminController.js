const adminService = require("../services/adminService");

const adminController = {
  getUser: (req, res) => {
    adminService.getUser(req, res, (data) => {
      return res.render(`admin/users/:${req.params.id}`, data);
    })
  },
  getTweets: (req, res) => {
    adminService.getTweets(req, res, (data) => {
    return res.render("admin/tweets", data);
    })
  },
  getUsers: (req, res) => {
    adminService.getUsers(req, res, (data) => {
      return res.render("admin/users", data);
    })
  },
  deleteTweet: (req, res) => {
    adminService.deleteTweet(req, res, (data) => {
      return res.render("admin/tweets", data);
    })
  },
};

module.exports = adminController;
