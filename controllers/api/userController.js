const bcrypt = require('bcryptjs')
const db = require('../../models')
const User = db.User

const jwt = require('jsonwebtoken')

const userService = require('../../services/userService')

const userController = {
  signIn: (req, res) => {
    if (!req.body.account || !req.body.password) {
      return res.json({ status: 'error', message: '請填寫帳號或密碼。' })
    }
    const username = req.body.account
    const password = req.body.password

    User.findOne({ where: { account: username } }).then((user) => {
      if (!user) return res.status(401).json({ status: 'error', message: '此帳號不存在。' })
      if (!bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ status: 'error', message: '密碼不正確' })
      }
      const payload = { id: user.id }
      const token = jwt.sign(payload, process.env.JWT_SECRET)
      return res.json({
        status: 'success',
        message: 'ok',
        token: token,
        user: {
          id: user.id,
          account: user.account,
          name: user.name,
          email: user.email,
          introduction: user.introduction,
          avatar: user.avatar,
          cover: user.cover,
          role: user.role
        }
      })
    })
  },
  signUp: (req, res) => {
    // confirm password
    if (req.body.checkPassword !== req.body.password) {
      return res.json({ status: 'error', message: '兩次密碼輸入不同' })
    } else {
      // confirm unique user
      return Promise.all([
        User.findOne({ where: { email: req.body.email } }),
        User.findOne({ where: { account: req.body.account } })
      ]).then(([emailCheck, accountCheck]) => {
        if (emailCheck) {
          return res.json({ status: 'error', message: '信箱重覆' })
        }
        if (accountCheck) {
          return res.json({ status: 'error', message: '帳號重覆' })
        } else {
          User.create({
            name: req.body.name,
            email: req.body.email,
            account: req.body.account,
            role: 'user',
            password: bcrypt.hashSync(
              req.body.password,
              bcrypt.genSaltSync(10),
              null
            )
          }).then((user) => {
            return res.json({ status: 'success', message: '成功註冊帳號' })
          })
        }
      })
    }
  },
  getUser: (req, res) => {
    userService.getUser(req, res, (data) => {
      return res.json(data)
    })
  },
  putUser: (req, res) => {
    userService.putUser(req, res, (data) => {
      return res.json(data)
    })
  },
  reviseUser: (req, res) => {
    userService.reviseUser(req, res, (data) => {
      return res.json(data)
    })
  },
  addLike: (req, res) => {
    userService.addLike(req, res, (data) => {
      return res.json(data)
    })
  },
  removeLike: (req, res) => {
    userService.removeLike(req, res, (data) => {
      return res.json(data)
    })
  },
  addFollowing: (req, res) => {
    userService.addFollowing(req, res, (data) => {
      return res.json(data)
    })
  },
  removeFollowing: (req, res) => {
    userService.removeFollowing(req, res, (data) => {
      return res.json(data)
    })
  },
  getUserTweets: (req, res) => {
    userService.getUserTweets(req, res, (data) => {
      return res.json(data)
    })
  },
  getUserReplies: (req, res) => {
    userService.getUserReplies(req, res, (data) => {
      return res.json(data)
    })
  },
  getUserLikes: (req, res) => {
    userService.getUserLikes(req, res, (data) => {
      return res.json(data)
    })
  },
  getCurrentUser: (req, res) => {
    return res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      account: req.user.account,
      avatar: req.user.avatar,
      cover: req.user.cover,
      introduction: req.user.introduction,
      role: req.user.role
    })
  },
  getFollowers: (req, res) => {
    userService.getFollowers(req, res, (data) => {
      return res.json(data)
    })
  },
  getFollowings: (req, res) => {
    userService.getFollowings(req, res, (data) => {
      return res.json(data)
    })
  },
  getTopUsers: (req, res) => {
    userService.getTopUser(req, res, (data) => {
      return res.json(data)
    })
  },
  deleteAllUsers: (req, res) => {
    userService.deleteAllUsers(req, res, (data) => {
      return res.json(data)
    })
  },
  deleteAllTweets: (req, res) => {
    userService.deleteAllTweets(req, res, (data) => {
      return res.json(data)
    })
  },
  deleteAllReplies: (req, res) => {
    userService.deleteAllReplies(req, res, (data) => {
      return res.json(data)
    })
  }
}

module.exports = userController