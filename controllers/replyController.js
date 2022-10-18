const db = require('../models')
const Reply = db.Reply

const helpers = require('../_helpers.js')

const replyService = require('../services/replyService.js')

const replyController = {
  postReply: (req, res) => {
    const currentUser = req.user ? req.user : helpers.getUser(req)
    return Reply.create({
      comment: req.body.reply,
      TweetId: req.params.tweet_id,
      UserId: currentUser.id
    }).then((reply) => {
      return res.redirect('back')
    })
  },
  getReplies: (req, res) => {
    replyService.getReplies(req, res, (data) => {
      return res.json(data)
    })
  }
}

module.exports = replyController
