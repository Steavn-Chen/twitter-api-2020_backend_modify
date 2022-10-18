const db = require('../models')
const Tweet = db.Tweet
const Reply = db.Reply
const User = db.User
const Like = db.Like
const helpers = require('../_helpers')

const tweetService = {
  postTweet: (req, res, callback) => {
    if (!req.body.description) {
      return callback({ status: 'error', message: "text didn't exist" })
    } else {
      return Tweet.create({
        description: req.body.description,
        UserId: helpers.getUser(req).id
      }).then((tweet) => {
        return callback({ status: 'success', message: 'tweet was successfully created' })
      })
    }
  },
  getTweets: (req, res, callback) => {
    Tweet.findAll({
      attributes: { exclude: ['updatedAt'] },
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, attributes: { exclude: ['updatedAt', 'cover', 'password', 'email', 'createdAt', 'introduction'] } },
        { model: Reply, attributes: ['id'] },
        { model: Like, attributes: ['id', 'UserId'] }
      ]
    }).then((tweets) => {
      if (!tweets) {
        tweets = []
        return callback(tweets)
      }
      tweets = tweets.map((d) => {
        const tweetLikeCount = d.dataValues.Likes.length
        const tweetReplyCount = d.dataValues.Replies.length
        const userIsLike = d.dataValues.Likes.some(d => d.UserId === helpers.getUser(req).id)
        d = {
          ...d.dataValues,
          tweetReplyCount,
          tweetLikeCount,
          isLike: userIsLike
        }
        return d
      })
      return callback(tweets)
    })
  },
  getTweet: (req, res, callback) => {
    return Tweet.findOne({
      where: { id: req.params.id },
      attributes: { exclude: ['updatedAt'] },
      order: [[Reply, 'createdAt', 'DESC']],
      include: [
        { model: User, attributes: { exclude: ['password', 'email', 'createdAt', 'updatedAt', 'cover'] } },
        { model: Like, attributes: ['id', 'isLike', 'UserId'] },
        { model: Reply, attributes: ['id', 'comment', 'createdAt'], include: [{ model: User, attributes: ['id', 'avatar', 'account', 'name'] }] }
      ]
    }).then((tweet) => {
      if (!tweet) {
        tweet = []
        return callback(tweet)
      }
      const tweetReplyCount = tweet.Replies.length ? tweet.Replies.length : 0
      const tweetLikeCount = tweet.Likes.length || 0
      const isLike = tweet.Likes.map((d) => d.UserId).includes(helpers.getUser(req).id) || false
      tweet = {
        ...tweet.dataValues,
        tweetReplyCount,
        tweetLikeCount,
        isLike
      }
      return callback(tweet)
    })
  }
}
module.exports = tweetService