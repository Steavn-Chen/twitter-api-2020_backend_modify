const db = require('../models')
const Reply = db.Reply
const helpers = require('../_helpers')
const User = db.User

let replyService = {
  postReply: (req, res, callback) => {
    return Reply.create({
      comment: req.body.comment,
      TweetId: req.params.tweet_id,
      UserId: helpers.getUser(req).id,
    }).then((reply) => {
      return callback({
        status: "success",
        message: "created new reply successfully",
        TweetId: Number(reply.TweetId),
        replyId: reply.id,
      });
    });
  },
  getReplies: (req, res, callback) => {
    const tweetId = req.params.tweet_id
    return Reply.findAll({
      where: { tweetId: tweetId },
      order: [["createdAt", "DESC"]],
      attributes: { exclude: ["updatedAt"] },
      include: [
        { model: User, attributes: ["id", "avatar", "account", "name"] },
      ],
    }).then((results) => {
      if (!results) {
        results = []
        return callback(results);
      } 
      let tweetReplyCount = results.length || 0
      results = {
        results,
        tweetReplyCount
      };
      return callback(results);
    })
  }
}

module.exports = replyService