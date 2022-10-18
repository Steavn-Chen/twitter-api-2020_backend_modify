const tweetService = require('../services/tweetService')

const tweetController = {
  getTweets: (req, res) => {
    tweetService.getTweets(req, res, (data) => {
      return res.render('tweets', data)
    })
  },

  postTweet: (req, res) => {
    tweetService.postTweet(req, res, (data) => {
      if (data["status"] === 'error') {
        req.flash('error_messages', data["message"])
        return res.redirect('/tweets')
      } else {
        req.flash('success_messages', data["message"])
        return res.redirect('/tweets')
      }
    })
  },

  getTweet: (req, res) => {
    tweetService.getTweet(req, res, (data) => {
      if (data["status"] === 'error') {
        req.flash('error_messages', data["message"])
        return res.redirect('/tweets')
      }
      return res.render('tweet', data)
    })
  }
}

module.exports = tweetController