const db = require("../models");
const Tweet = db.Tweet;
const Reply = db.Reply;
const User = db.User;
const Like = db.Like;
const helpers = require("../_helpers");

const tweetService = {
  postTweet: (req, res, callback) => {
    if (!req.body.description) {
      callback({ status: "error", message: "text didn't exist" });
    } else {
      return Tweet.create({
        description: req.body.description,
        UserId: helpers.getUser(req).id,
      }).then((tweet) => {
        callback({
          status: "success",
          message: "tweet was successfully created",
        });
      });
    }
  },
  getTweets: (req, res, callback) => {
    Tweet.findAll({
      include: [User, { model: Reply }, { model: Like }],
      order: [["createdAt", "DESC"]],
    }).then((tweets) => {
      tweets = tweets.map((d) => {
        let tweetLikeCount = d.dataValues.Likes.filter(
          (d) => d.isLike === true
        ).length;
        let tweetReplyCount = d.dataValues.Replies.map((d) => d.id).length;
        let userIsLike = d.dataValues.Likes.find(
          (d) => d.UserId === helpers.getUser(req).id
        );
        if (!userIsLike) {
          userIsLike = false;
        } else {
          userIsLike = userIsLike.isLike;
        }
        d = {
          ...d.dataValues,
          tweetReplyCount,
          tweetLikeCount,
          isLike: userIsLike,
        };
        return d;
      });
      return callback(tweets);
      })
  },
  getTweet: (req, res, callback) => {
    return Tweet.findOne({
      where: { id: req.params.id },
      attributes: { exclude: ["updatedAt"] } ,
      include: [
        { model: User,  attributes: {
          exclude: ["password", "email", "createdAt", "updatedAt", 'cover'],
        },},
        { model: Like, attributes: ['id', 'isLike', 'UserId'] },
        { model: Reply,  attributes: ['id', 'comment', 'createdAt'],
         include: [ { model: User, attributes: ['id', 'avatar', 'account', 'name'] } ] 
        }],
    }).then((tweet) => {
      if (!tweet) {
        tweet = []
        return callback(tweet)
      }  
      let tweetReplyCount = tweet.Replies.length ? tweet.Replies.length : 0
      let tweetLikeCount = tweet.Likes.length || 0
      let isLike = tweet.Likes.map((d) => d.UserId).includes(helpers.getUser(req).id) || false
      tweet = {
        ...tweet.dataValues,
        tweetReplyCount,
        tweetLikeCount,
        isLike: isLike
      };
      return callback(tweet)
    });
  },
};
module.exports = tweetService;
