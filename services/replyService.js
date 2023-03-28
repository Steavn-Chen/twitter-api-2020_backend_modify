const db = require('../models')
const Reply = db.Reply
const helpers = require('../_helpers')
const User = db.User
const Tweet = db.Tweet

const replyService = {
  postReply: (req, res, callback) => {
    if (req.params.tweet_id === ':tweet_id' || req.params.tweet_id.trim() === '') {
      return callback({ status: 'error', message: 'Please enter tweet ID!' })
    }
    return Promise.all([
      Reply.create({
        comment: req.body.comment,
        TweetId: req.params.tweet_id,
        UserId: helpers.getUser(req).id
      }),
      Tweet.findByPk(req.params.tweet_id)
    ])
    .then(([reply, tweet]) => {
      if (!tweet) {
        return callback({ status: 'error', message: 'without this tweet!' })
      }
      return callback({
        status: 'success',
        message: 'created new reply successfully',
        TweetId: Number(reply.TweetId),
        replyId: reply.id
      })
    })
    .catch(err => console.log(err))
  },
  getReplies: (req, res, callback) => {
    if (req.params.tweet_id === ':tweet_id' || req.params.tweet_id.trim() === '') {
      return callback({ status: 'error', message: 'Please enter tweet ID!' })
    }
    const tweetId = req.params.tweet_id
    return Promise.all([
      Reply.findAll({
        where: { tweetId },
        order: [['createdAt', 'DESC']],
        attributes: { exclude: ['updatedAt'] },
        include: [
          { model: User, attributes: ['id', 'avatar', 'account', 'name'] }
        ]
      }),
      Tweet.findByPk(Number(req.params.tweet_id))
    ])
    .then(([results, tweet]) => {
      if (!tweet) {
        return callback({ status: 'error', message: 'without this tweet!' })
      }
      if (!results) {
        results = []
        return callback(results)
      }
      const tweetReplyCount = results.length || 0
      results = {
        results,
        tweetReplyCount
      }
      return callback(results)
    })
    .catch(err => console.log(err))
  }
}

module.exports = replyService