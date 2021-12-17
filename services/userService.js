const bcrypt = require("bcryptjs");
const imgur = require("imgur-node-api");
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID;
const { Op, Sequelize } = require("sequelize");
const helpers = require("../_helpers");
const db = require("../models");
const Tweet = db.Tweet;
const Reply = db.Reply;
const User = db.User;
const Like = db.Like;
const Followship = db.Followship;
const sequelize = new Sequelize("`ac_twitter_workspace`", "root", "password", {
  dialect: "mysql",
});

const userService = {
  getUser: (req, res, callback) => {
    return Promise.all([
      User.findOne({
        where: {
          id: req.params.id,
        },
        attributes: {
          exclude: ["password", "email", "createdAt", "updatedAt"],
        },
        include: [
          {
            model: User,
            as: "Followers",
            attributes: ["id"],
          },
          {
            model: User,
            as: "Followings",
            attributes: {
              exclude: [
                "name",
                "avatar",
                "account",
                "introduction",
                "email",
                "role",
                "cover",
                "password",
                "createdAt",
                "updatedAt",
                "Followship",
              ],
            },
          },
        ],
      }),
      Tweet.count({
        where: {
          UserId: req.params.id,
        },
      }),
    ]).then(([user, tweetsCount]) => {
      user = {
        ...user.dataValues,
        FollowersCount: user.Followers.length,
        FollowingsCount: user.Followings.length,
        isFollower: user.Followers.map((d) => d.id).includes(
          helpers.getUser(req).id
        ),
        tweetsCount: tweetsCount,
      };
      return callback(user);
    });
  },
  addFollowing: (req, res, callback) => {
    return Followship.create({
      followerId: helpers.getUser(req).id,
      followingId: req.body.id,
    }).then((followship) => {
      return callback({ status: "success", message: "追隨成功" });
    });
  },
  removeFollowing: (req, res, callback) => {
    return Followship.destroy({
      where: {
        followerId: helpers.getUser(req).id,
        followingId: req.params.followingId,
      },
    }).then((followship) => {
      return callback({ status: "success", message: "取消追隨成功" });
    });
  },
  getUserTweets: (req, res, callback) => {
    return Tweet.findAll({
      where: {
        UserId: Number(req.params.userId),
      },
      attributes: { exclude: ["updatedAt"] },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          attributes: ["id", "name", "account", "avatar"],
        },
        { model: Reply, attributes: ["id"] },
        { model: Like, attributes: ["id", "isLike", "UserId", "TweetId"] },
      ],
    }).then((tweets) => {
      if (!tweets) {
        tweets = [];
        return callback(tweets);
      }
      tweets = tweets.map((tweet) => {
        let isLike =
          tweet.Likes.some((d) => d.UserId === helpers.getUser(req).id) ||
          false;
        let likeCount = tweet.Likes.filter((d) => d.isLike === true).length;
        return {
          ...tweet.dataValues,
          tweetReplyCount: tweet.Replies.length,
          tweetLikeCount: likeCount,
          isLike: isLike,
        };
      });
      return callback(tweets);
    });
  },
  getUserReplies: (req, res, callback) => {
    return Reply.findAll({
      where: {
        UserId: Number(req.params.userId),
      },
      attributes: { exclude: ["updatedAt", "TweetId"] },
      order: [["createdAt", "DESC"]],
      include: [
        { model: User, attributes: ["id", "account", 'name', 'avatar'] },
        {
          model: Tweet,
          attributes: ["id"],
          include: { model: User, attributes: ["id", "account", "avatar"] },
        },
      ],
    }).then((tweets) => {
      if (!tweets) {
        tweets = [];
        return callback(tweets);
      }
      return callback(tweets);
    });
  },
  getUserLikes: (req, res, callback) => {
    return Like.findAll({
      where: {
        UserId: Number(req.params.userId),
      },
      attributes: { exclude: ["updatedAt", "UserId"] },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Tweet,
          attributes: ["id", "description", "createdAt"],
          include: [
            { model: User, attributes: ["id", "avatar", 'account', 'name'] },
            { model: Reply, attributes: ["id"] },
            { model: Like, attributes: ["id", 'UserId'] },
          ],
        },
      ],
    }).then((tweets) => {
      if (!tweets) {
        tweets = [];
        return callback(tweets);
      }
      tweets = tweets.map((d) => {
        let isLike;
        isLike = d.Tweet.Likes.some(
          (l) => l.UserId === helpers.getUser(req).id
        );
        return {
          ...d.dataValues,
          tweetReplyCount: d.Tweet.Replies.length,
          tweetLikeCount: d.Tweet.Likes.filter((d) => d.isLike === true).length,
          isLike: isLike,
        };
      });
      return callback(tweets);
    });
  },
  getFollowers: (req, res, callback) => {
    return User.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "Followers", attributes: {
          exclude: ["password", "email", "createdAt", "updatedAt", 'cover'],
          },
        },
      ],
    }).then((followers) => {
      if (!followers) {
        followers = []
        return callback(followers)
      }
      followers = followers.Followers.map((d) => {
        let followerId = d.Followship.followerId || false
        // let followerId;
        // if (!d.Followship.followerId) {
        //   followerId = false;
        // }
        // followerId = d.Followship.followerId;
        return { ...d.dataValues, followerId };
      });
      return callback(followers);
    });
  },
  getFollowings: (req, res, callback) => {
    return User.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "Followings",
          attributes: {
            exclude: ["password", "email", "createdAt", "updatedAt", "cover"],
          },
        },
      ],
    }).then((followings) => {
      if (!followings) {
        followers = [];
        return callback(followings);
      }
      followings = followings.Followings.map((d, index) => {
        let followingId = d.Followship.followingId || false
        // let followingId;
        // if (!d.Followship.followingId) {
        //   followingId = false;
        // }
        // followingId = d.Followship.followingId;
        return { ...d.dataValues, followingId };
      });
      return callback(followings);
    });
  },
  getTopUser: (req, res, callback) => {
    return User.findAll({
      attributes: {
          exclude: ["password", "email", "createdAt", "updatedAt", "cover", 'introduction'],
        },
      include: [{ model: User, as: "Followers", attributes: ['id']
       }],
    }).then((users) => {
      users = users.map((user) => ({
        ...user.dataValues,
        FollowerCount: user.Followers.length,
        isFollowed: helpers.getUser(req).Followings
          ? helpers
              .getUser(req)
              .Followings.map((d) => d.id)
              .includes(user.id)
          : false,
      }));
      users = users.sort((a, b) => b.FollowerCount - a.FollowerCount);
      users = users.slice(1, 10);
      callback({ users: users });
    });
  },
  deleteAllUsers: (req, res, callback) => {
    User.destroy({
      where: {},
      truncate: true,
    }).then(() => {
      callback({ status: "success", message: "all users killed" });
    });
  },
  deleteAllTweets: (req, res, callback) => {
    Tweet.destroy({
      where: {},
      truncate: true,
    }).then(() => {
      callback({ status: "success", message: "all tweets killed" });
    });
  },
  deleteAllReplies: (req, res, callback) => {
    Reply.destroy({
      where: {},
      truncate: true,
    }).then(() => {
      callback({ status: "success", message: "all replies killed" });
    });
  },
  addLike: (req, res, callback) => {
    return Like.findOrCreate({
      where: {
        UserId: helpers.getUser(req).id,
        TweetId: req.params.id,
        isLike: true,
      },
      default: {
        UserId: helpers.getUser(req).id,
        TweetId: req.params.id,
      },
    })
      .then(([like, boolean]) => {
        return callback({ status: "success", message: "喜歡此筆推文" });
      })
      .catch((err) => console.log(err));
  },
  removeLike: (req, res, callback) => {
    return Like.destroy({
      where: {
        UserId: helpers.getUser(req).id,
        TweetId: req.params.id,
      },
    })
      .then((like) => {
        return callback({ status: "success", message: "取消喜歡推文" });
      })
      .catch((err) => console.log(err));
  },

  profileUser: async (req, res, callback) => {
    try {
      const [user] = await Promise.all([
        User.findByPk(helpers.getUser(req).id),
      ]);
      return callback({ user: user });
    } catch (e) {
      console.warn(e);
    }
  },

  putUser: async (req, res, callback) => {
    try {
      if (helpers.getUser(req).id !== Number(req.params.id)) {
        callback({ status: "error", message: "只能編輯自己的資訊." });
      }
      const [user] = await Promise.all([
        User.findByPk(helpers.getUser(req).id),
      ]);
      const { files } = req;
      imgur.setClientID(IMGUR_CLIENT_ID);
      if (files) {
        if (files.cover && !files.avatar) {
          imgur.upload(files.cover[0].path, async (err, coverImg) => {
            try {
              if (err) console.log("Error: ", err);
              let cover = await coverImg;
              await user
                .update({
                  ...req.body,
                  cover: cover.data.link,
                })
                .then((user) => {
                  callback({
                    status: "success",
                    message: "使用者資料編輯成功。",
                  });
                });
            } catch (e) {
              console.warn(e);
            }
          });
        } else if (!files.cover && files.avatar) {
          imgur.upload(files.avatar[0].path, async (err, avatarImg) => {
            if (err) console.log("Error: ", err);
            let avatar = await avatarImg;
            await user
              .update({
                ...req.body,
                avatar: avatar.data.link,
              })
              .then((user) => {
                callback({
                  status: "success",
                  message: "使用者資料編輯成功。",
                });
              });
            try {
            } catch (e) {
              console.warn(e);
            }
          });
        } else if (files.cover && files.avatar) {
          imgur.upload(files.cover[0].path, async (err, coverImg) => {
            if (err) console.log("Error: ", err);
            imgur.upload(files.avatar[0].path, async (err, avatarImg) => {
              try {
                if (err) console.log("Error: ", err);
                let cover = await coverImg;
                let avatar = await avatarImg;
                user
                  .update({
                    ...req.body,
                    cover: cover.data.link,
                    avatar: avatar.data.link,
                  })
                  .then((user) => {
                    return callback({
                      status: "success",
                      message: "使用者資料編輯成功。",
                    });
                  });
              } catch (e) {
                console.warn(e);
              }
            });
          });
        } else {
          user.update(req.body).then(() => {
            return callback({
              status: "success",
              message: "使用者資料編輯成功。",
            });
          });
        }
      } else {
        user.update(req.body).then(() => {
          return callback({
            status: "success",
            message: "使用者資料編輯成功。",
          });
        });
      }
    } catch (e) {
      console.warn(e);
      callback({
        status: "error",
        message: "使用者資料編輯失敗。",
      });
    }
  },

  reviseUser: (req, res, callback) => {
    const { name, email, account, password, checkPassword } = req.body;
    const userId = helpers.getUser(req).id;
    if (userId !== Number(req.params.id)) {
      callback({ status: "error", message: "只能編輯自己的資訊." });
    }
    return Promise.all([
      User.findAll({
        where: {
          email: { [Op.not]: helpers.getUser(req).email },
        },
      }),
      User.findAll({
        where: {
          account: { [Op.not]: helpers.getUser(req).account },
        },
      }),
      User.findByPk(userId),
    ]).then(([usersEmail, usersAccount, user]) => {
      const emailCheck = usersEmail.map((d) => d.email).includes(email);
      const accountCheck = usersAccount.map((d) => d.account).includes(account);
      if (!name || !email || !account || !password || !checkPassword) {
        callback({
          status: "error",
          message: "名字，信箱，帳號，密碼，確認密碼不能為空!",
        });
      }
      if (password !== checkPassword) {
        callback({ status: "error", message: "密碼與確認密碼不一致!" });
      }
      if (emailCheck) {
        callback({ status: "error", message: "此信箱己被註冊，請更改!" });
      }
      if (accountCheck) {
        callback({
          status: "error",
          message: "帳戶名稱已被其他使用者使用，請更改!",
        });
      }
      return user
        .update({
          name: name,
          email: email,
          account: account,
          password: bcrypt.hashSync(password, bcrypt.genSaltSync(10), null),
        })
        .then((user) => {
          return callback({
            status: "success",
            message: "使用者資料編輯成功。",
          });
        });
    });
  },
};
  
module.exports = userService

