const replyService = require('../../services/replyService.js')

const replyController = {
  postReply: (req, res) => {
    replyService.postReply(req, res, (data) => {
      return res.json(data)
    })
  },
  getReplies: (req, res) => {
    replyService.getReplies(req, res, (data) => {
      return res.json(data)
    })
  }
}

module.exports = replyController