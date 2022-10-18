const db = require('../models')
const Reply = db.Reply
const helpers = require('../_helpers')

const chatroomService = {
  getChatroom: (req, res, callback) => {
    res.sendFile(__dirname + '/views/index.html')
  },
  postReply: (req, res, callback) => {
  const currentUser = req.user ? req.user : helpers.getUser(req)
  return Reply.create({
      comment: req.body.reply,
      TweetId: req.params.tweet_id,
      UserId: currentUser.id
    }).then((reply) => {
      return callback({
        status: 'success',
        message: 'created new reply successfully',
        TweetId: Number(reply.TweetId),
        replyId: reply.id
      })
    })
  }
}

module.exports = chatroomService