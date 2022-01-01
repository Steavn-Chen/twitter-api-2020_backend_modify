const db = require("../models");
const Tweet = db.Tweet;
const Reply = db.Reply;
const User = db.User;
const Like = db.Like;
const Followship = db.Followship;
const sequelize = require('sequelize')

const adminService = {
  getUsers: (req, res, callback) => {
    return User.findAll({
      raw: true,
      nest: true,
      attributes: [
        "id",
        "name",
        "account",
        "avatar",
        "cover",
        [
          sequelize.literal(
            "(SELECT COUNT(*) FROM Tweets WHERE Tweets.UserId = User.id)"
          ),
          "tweetCount",
        ],
        [
          sequelize.literal(
            "(SELECT COUNT(*) FROM Likes WHERE Likes.UserId = User.id)"
          ),
          "likeCount",
        ],
        [
          sequelize.literal(
            "(SELECT COUNT(*) FROM Followships WHERE Followships.followingId = User.id)"
          ),
          "followingCount",
        ],
        [
          sequelize.literal(
            "(SELECT COUNT(*) FROM Followships WHERE Followships.followerId = User.id)"
          ),
          "followerCount",
        ],
        [
          // 注意下面的调用中的括号！
          sequelize.literal(`(
                    SELECT COUNT(*)
                    FROM Tweets AS Tweet
                    WHERE
                      Tweet.UserId = User.id        
                )`),
          "tweetcount",
        ],
      ],
      order: [[sequelize.literal("tweetCount"), "DESC"]],
    }).then((users) => {
      // users = users.sort((a, b) => b.tweetCount - a.tweetCount);
      return callback(users);
    });
  },
  getTweets: (req, res, callback) => {
    return Tweet.findAll({
      attributes: ['id', 'description', 'createdAt', 'UserId'],
      order: [["createdAt", "DESC"]],
      include: [{ model: User, attributes: ['id', 'name', 'account', 'avatar', 'createdAt'] }],
    }).then((tweets) => {
      callback({
        tweets: tweets,
      });
    });
  },
  deleteTweet: (req, res, callback) => {
    return Tweet.findByPk(req.params.id, { include: [Reply, Like] })
      .then((tweet) => {
        tweet.Replies.map(reply => {
          reply.destroy()
        })
        tweet.destroy()
          .then((tweet) => {
            callback({ status: 'success', message: '' })
          })
      })
  },
}

module.exports = adminService