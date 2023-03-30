const bcrypt = require('bcryptjs')
const { Op, sequelize } = require('sequelize')
const { imgurFileHandler } = require('../helpers/file.heplers.js')
const helpers = require('../_helpers')
const db = require('../models')
const Tweet = db.Tweet
const Reply = db.Reply
const User = db.User
const Like = db.Like
const Followship = db.Followship

const userService = {
  getUser: (req, res, callback) => {
    return Promise.all([
      User.findOne({
        where: {
          id: req.params.id
        },
        attributes: {
          exclude: ['password', 'email', 'createdAt', 'updatedAt']
        },
        include: [
          {
            model: User,
            as: 'Followers',
            attributes: ['id']
          },
          {
            model: User,
            as: 'Followings',
            attributes: {
              exclude: [
                'name',
                'avatar',
                'account',
                'introduction',
                'email',
                'role',
                'cover',
                'password',
                'createdAt',
                'updatedAt',
                'Followship'
              ]
            }
          }
        ]
      }),
      Tweet.count({
        where: {
          UserId: req.params.id
        }
      })
    ]).then(([user, tweetsCount]) => {
      if (!user) {
        return callback({ status: 'error', message: 'no such user!' })
      }
      user = {
        ...user.dataValues,
        FollowersCount: user.Followers.length,
        FollowingsCount: user.Followings.length,
        isFollower: user.Followers.map((d) => d.id).includes(helpers.getUser(req).id),
        tweetsCount
      }
      return callback(user)
    })
  },
  addFollowing: (req, res, callback) => {
    console.log(req.body)
    if (!req.body.id) {
      return callback({ status: 'error', message: 'followingId 不能為空!' })
    }
    return User.findByPk(Number(req.body.id))
      .then(followingId => {
        if (followingId === null || helpers.getUser(req).id === null) {
          return callback({ status: 'error', message: '追隨者或跟隨者錯誤!' })
        }
        return Followship.findOrCreate({
          where: {
            followerId: helpers.getUser(req).id,
            followingId: Number(req.body.id)
          },
          default: {
            followerId: helpers.getUser(req).id,
            followingId: Number(req.body.id)
          }
        })
          .then(([followship, boolean]) => {
            if (boolean === false) {
              return callback({ status: 'error', message: '己經跟隨了!' })
            }
            return callback({ status: 'success', message: '追隨成功' })
          })
      })
      .catch((err) => console.log(err))
  },
  removeFollowing: (req, res, callback) => {
    if (req.params.followingId === ':followingId' || req.params.followingId.trim() === '') {
      return callback({ status: 'error', message: 'followingId 不能為空!' })
    }
    return User.findByPk(Number(req.params.followingId))
      .then(followingId => {
        if (followingId === null || helpers.getUser(req).id === null) {
          return callback({ status: 'error', message: '追隨者或跟隨者錯誤!' })
        }
        return Followship.destroy({
          where: {
            followerId: helpers.getUser(req).id,
            followingId: req.params.followingId
          }
        }).then((followship) => {
          if (followship === 0) {
            return callback({ status: 'error', message: ' 還沒跟隨!' })
          }
          return callback({ status: 'success', message: '取消追隨成功' })
        })
      })
      .catch((err) => console.log(err))
  },
  getUserTweets: (req, res, callback) => {
    if (req.params.userId === ':userId' || req.params.userId.trim() === '') {
      return callback({ status: 'error', message: 'Please enter user ID!'})
    }
    return Promise.all([
      Tweet.findAll({
        where: {
          UserId: Number(req.params.userId)
        },
        attributes: { exclude: ['updatedAt'] },
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'account', 'avatar']
          },
          { model: Reply, attributes: ['id'] },
          { model: Like, attributes: ['id', 'isLike', 'UserId', 'TweetId'] }
        ]
      }),
      User.findByPk(Number(req.params.userId))
    ])
    .then(([tweets, user]) => {
      if (!user) {
        return callback({ status: 'error', message: 'no such user!' })
      }
      if (!tweets) {
        tweets = []
        return callback(tweets)
      }
      tweets = tweets.map((tweet) => {
        const isLike = tweet.Likes.some((d) => d.UserId === helpers.getUser(req).id) || false
        const likeCount = tweet.Likes.filter((d) => d.isLike === true).length
        return {
          ...tweet.dataValues,
          tweetReplyCount: tweet.Replies.length,
          tweetLikeCount: likeCount,
          isLike
        }
      })
      return callback(tweets)
    })
    .catch(err => console.log(err))
  },
  getUserReplies: (req, res, callback) => {
    if (req.params.userId === ':userId' || req.params.userId.trim() === '') {
      return callback({ status: 'error', message: 'Please enter user ID!' })
    }
    return Promise.all([
      Reply.findAll({
        where: {
          UserId: Number(req.params.userId)
        },
        attributes: { exclude: ['updatedAt', 'TweetId'] },
        order: [['createdAt', 'DESC']],
        include: [
          { model: User, attributes: ['id', 'account', 'name', 'avatar'] },
          {
            model: Tweet,
            attributes: ['id'],
            include: { model: User, attributes: ['id', 'account', 'avatar'] }
          }
        ]
      }),
      User.findByPk(Number(req.params.userId))
      ])
    .then(([tweets, user]) => {
      if (!user) {
        return callback({ status: 'error', message: 'no such user!' })
      }
      if (!tweets) {
        tweets = []
        return callback(tweets)
      }
      return callback(tweets)
    })
    .catch(err => console.log(err))
  },
  getUserLikes: (req, res, callback) => {
    if (req.params.userId === ':userId' || req.params.userId.trim() === '') {
      return callback({ status: 'error', message: 'Please enter user ID!' })
    }
    return Promise.all([    
      Like.findAll({
        where: {
          UserId: Number(req.params.userId)
        },
        attributes: { exclude: ['updatedAt', 'UserId'] },
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Tweet,
            attributes: ['id', 'description', 'createdAt'],
            include: [
              { model: User, attributes: ['id', 'avatar', 'account', 'name'] },
              { model: Reply, attributes: ['id'] },
              { model: Like, attributes: ['id', 'UserId'] }
            ]
          }
        ]
      }),
      User.findByPk(Number(req.params.userId))
    ])
    .then(([tweets, user]) => {
      if (!user) {
        return callback({ status: 'error', message: 'no such user!' })
      }
      if (!tweets) {
        tweets = []
        return callback(tweets)
      }
      tweets = tweets.map((d) => {
        const isLike = d.Tweet?.Likes ? d.Tweet.Likes.some((l) => l.UserId === helpers.getUser(req).id
        ) : false
        return {
          ...d.dataValues,
          tweetReplyCount: d.Tweet?.Replies ? d.Tweet.Replies.length : null,
          tweetLikeCount: d.Tweet?.Likes ? d.Tweet.Likes.filter((d) => d.isLike === true).length : null,
          isLike
        }
      })
      return callback(tweets)
    })
    .catch(err => console.log(err))
  },
  getFollowers: (req, res, callback) => {
    return Promise.all([
      User.findByPk(req.params.id, {
        attributes: {
          exclude: ['password', 'email', 'createdAt', 'updatedAt', 'role', 'cover', 'account', 'avatar']
        },
        include: [
          {
            model: User,
            as: 'Followers',
            attributes: ['id', 'avatar', 'name', 'introduction', 'account']
          }
        ]
      }),
      Tweet.count({
        where: {
          UserId: req.params.id
        }
      })
    ]).then(([followers, tweetsCount]) => {
      if (!followers) {
        followers = []
        return callback(followers)
      }
      followers = {
        ...followers.dataValues,
        tweetsCount
      }
      return callback(followers)
    })
  },
  getFollowings: (req, res, callback) => {
    return Promise.all([
      User.findByPk(req.params.id, {
        attributes: {
          exclude: [
            'password',
            'email',
            'createdAt',
            'updatedAt',
            'role',
            'cover',
            'account',
            'avatar'
          ]
        },
        include: [
          {
            model: User,
            as: 'Followings',
            attributes: ['id', 'avatar', 'name', 'introduction', 'account']
          }
        ]
      }),
      Tweet.count({
        where: {
          UserId: req.params.id
        }
      })
    ]).then(([followings, tweetsCount]) => {
      if (!followings) {
        followings = []
        return callback(followings)
      }
      followings = {
        ...followings.dataValues,
        tweetsCount
      }
      return callback(followings)
    })
  },
  getTopUser: (req, res, callback) => {
    return User.findAll({
      where: {
          role: "user"
      },
      attributes: {
        exclude: ['password', 'email', 'createdAt', 'updatedAt', 'cover', 'introduction']
      },
      include: [{ model: User, as: 'Followers', attributes: ['id'] }
      ]
    }).then((users) => {
      users = users.map((user) => ({
        ...user.dataValues,
        FollowerCount: user.Followers.length,
        isFollowed: helpers.getUser(req).Followings ? helpers.getUser(req).Followings.map((d) => d.id).includes(user.id) : false
      }))
      users = users.sort((a, b) => b.FollowerCount - a.FollowerCount)
      users = users.slice(0, 9)
      return callback({ users })
    })
  },
  deleteAllUsers: (req, res, callback) => {
    User.destroy({
      where: {},
      truncate: true
    }).then(() => {
      return callback({ status: 'success', message: 'all users killed' })
    })
  },
  deleteAllTweets: (req, res, callback) => {
    Tweet.destroy({
      where: {},
      truncate: true
    }).then(() => {
      callback({ status: 'success', message: 'all tweets killed' })
    })
  },
  deleteAllReplies: (req, res, callback) => {
    Reply.destroy({
      where: {},
      truncate: true
    }).then(() => {
      callback({ status: 'success', message: 'all replies killed' })
    })
  },
  addLike: (req, res, callback) => {
    if (req.params.id === ':id' || req.params.id.trim() === '') {
      return callback({ status: 'error', message: 'TweetId 不能為空!' })
    }
    return Tweet.findByPk(Number(req.params.id))
      .then(tweet => {
        if (!tweet) {
          if (tweet === null || helpers.getUser(req).id === null) {
            return callback({ status: 'error', message: '沒有這筆推文或使用者ID錯誤!' })
          }
        }
        return Like.findOrCreate({
          where: {
            UserId: helpers.getUser(req).id,
            TweetId: req.params.id,
            isLike: true
          },
          default: {
            UserId: helpers.getUser(req).id,
            TweetId: req.params.id
          }
        })
          .then(([like, boolean]) => {
            if (boolean === false) {
              return callback({ status: 'error', message: '此筆推文已經被喜歡!' })
            }
            return callback({ status: 'success', message: '喜歡此筆推文。' })
          })
      })
      .catch((err) => console.log(err))
  },
  removeLike: (req, res, callback) => {
    if (req.params.id === ':id' || req.params.id.trim() === '') {
      return callback({ status: 'error', message: 'TweetId 不能為空!' })
    }
    return Tweet.findByPk(Number(req.params.id))
      .then(tweet => {
        if (!tweet) {
          if (tweet === null || helpers.getUser(req).id === null) {
            return callback({ status: 'error', message: '沒有這筆推文或使用者ID錯誤!' })
          }
        }
        return Like.destroy({
          where: {
            UserId: helpers.getUser(req).id,
            TweetId: req.params.id
          }
        })
          .then((like) => {
            if (like === 0) {
              return callback({ status: 'error', message: '此筆推文沒有被喜歡!' })
            }
            return callback({ status: 'success', message: '取消喜歡推文' })
          })
      })
      .catch((err) => console.log(err))
  },

  putUser: async (req, res, callback) => {
    try {
      if (helpers.getUser(req).id !== Number(req.params.id)) {
        return callback({ status: 'error', message: '只能編輯自己的資訊.' })
      }
      const [user] = await Promise.all([
        User.findByPk(helpers.getUser(req).id)
      ])
      const { files } = req
      if (files.cover || files.avatar) {
        const cover = files?.cover ? await imgurFileHandler(files.cover) : null
        const avatar = files?.avatar ? await imgurFileHandler(files.avatar) : null
        return user.update({
          ...req.body,
          cover: cover?.link || user.cover,
          avatar: avatar?.link || user.avatar
        })
          .then((user) => { return callback({ status: 'success', message: '使用者編輯成功' }) })
      } else {
        user.update(req.body).then(() => {
          return callback({
            status: 'success',
            message: '使用者資料編輯成功。'
          })
        })
      }
    } catch (e) {
      console.warn(e)
      return callback({
        status: 'error',
        message: '使用者資料編輯失敗。'
      })
    }
  },

  reviseUser: (req, res, callback) => {
    const { name, email, account, password, checkPassword } = req.body
    const userId = helpers.getUser(req).id
    if (userId !== Number(req.params.id)) {
      return callback({ status: 'error', message: '只能編輯自己的資訊.' })
    }
    return Promise.all([
      User.findAll({
        where: {
          email: { [Op.not]: helpers.getUser(req).email }
        }
      }),
      User.findAll({
        where: {
          account: { [Op.not]: helpers.getUser(req).account }
        }
      }),
      User.findByPk(userId)
    ]).then(([usersEmail, usersAccount, user]) => {
      const emailCheck = usersEmail.map((d) => d.email).includes(email)
      const accountCheck = usersAccount.map((d) => d.account).includes(account)
      if (!name || !email || !account || !password || !checkPassword) {
        return callback({
          status: 'error',
          message: '名字，信箱，帳號，密碼，確認密碼不能為空!'
        })
      }
      if (password !== checkPassword) {
        return callback({ status: 'error', message: '密碼與確認密碼不一致!' })
      }
      if (emailCheck) {
        return callback({ status: 'error', message: '此信箱己被註冊，請更改!' })
      }
      if (accountCheck) {
        return callback({ status: 'error', message: '帳戶名稱已被其他使用者使用，請更改!' })
      }
      return user
        .update({
          name,
          email,
          account,
          password: bcrypt.hashSync(password, bcrypt.genSaltSync(10), null)
        })
        .then((user) => {
          return callback({ status: 'success', message: '使用者資料編輯成功。' })
        })
    })
  }
}

module.exports = userService