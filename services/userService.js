const bcrypt = require("bcryptjs");
const imgur = require("imgur-node-api") // 優化第一種解法
// const imgur = require('imgur') //優化第二種解法
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID;
const { Op, sequelize } = require("sequelize");
const helpers = require("../_helpers");
const db = require("../models");
const Tweet = db.Tweet;
const Reply = db.Reply;
const User = db.User;
const Like = db.Like;
const Followship = db.Followship;

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
    return Promise.all([
      User.findByPk(req.params.id, {
        attributes: {
          exclude: ['password', 'email', 'createdAt', 'updatedAt', 'role', 'cover', 'account', 'avatar'],
        },
        include: [
          {
            model: User,
            as: 'Followers',
            attributes: ['id', 'avatar', 'name', 'introduction' ],
          },
        ],
      }),
      Tweet.count({
        where: {
          UserId: req.params.id,
        },
      }),
    ]).then(([followers, tweetsCount]) => {
      if (!followers) {
        followers = []
        return callback(followers)
      }
      followers = {
        ...followers.dataValues,
        tweetsCount: tweetsCount,
      }
      return callback(followers)
    })
  },
  getFollowings: (req, res, callback) => {
    return Promise.all([
      User.findByPk(req.params.id, {
        attributes: {
          exclude: [
            'password',
            'email',
            'createdAt',
            'updatedAt',
            'role',
            'cover',
            'account',
            'avatar',
          ],
        },
        include: [
          {
            model: User,
            as: 'Followings',
            attributes: ['id', 'avatar', 'name', 'introduction'],
          },
        ],
      }),
      Tweet.count({
        where: {
          UserId: req.params.id,
        },
      }),
    ]).then(([followings, tweetsCount]) => {
      if (!followings) {
        followings = []
        return callback(followings)
      }
      followings = {
        ...followings.dataValues,
        tweetsCount: tweetsCount,
      }
      return callback(followings)
    })
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
      imgur.setClientID(IMGUR_CLIENT_ID) //優化第一種解法
      // imgur.setClientId(IMGUR_CLIENT_ID) //優化第二種解法
      if (files) {
        // 優化第一種
      imgur.upload(files.cover[0].path, (err, coverImg) => {
        if (err) console.log("coverImgError: ", err);
        imgur.upload(files.avatar[0].path, (err, avatarImg) => {
          if (err) console.log("avatarImgError: ", err);
          let cover =  files.cover ?  coverImg.data.link : false
          let avatar = files.avatar ? avatarImg.data.link : false
           user
            .update({
              ...req.body,
              cover,
              avatar
            })
            .then((user) => {
              callback({ status: "success", message: "使用者編輯成功" });
            });
        })
      })
       // 優化第二種
      //  if (files.cover) {
      //    const coverImg = await imgur.uploadFile(files.cover[0].path)
      //    cover = coverImg.link
      //    req.body.cover = cover
      //  }  
      // if (files.avatar) {
      //   const avatarImg = await imgur.uploadFile(files.avatar[0].path)
      //   avatar = avatarImg.link
      //   req.body.avatar = avatar
      // }

      // 優化第三種
      // let cover =  files.cover ? await imgur.uploadFile(files.cover[0].path) : false
      // let avatar =  files.avatar ? await imgur.uploadFile(files.avatar[0].path) : false

      // await user.update({
      //   ...req.body,
      //   cover: cover.link,
      //   avatar: avatar.link,
      // }).then((user) => {
      //       callback({ status: "success", message: "使用者編輯成功" });
      //     });
       
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
      console.log(usersEmail,usersAccount)
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

