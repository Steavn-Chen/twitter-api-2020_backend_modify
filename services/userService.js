const bcrypt = require("bcryptjs");
const imgur = require("imgur-node-api");
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID;
const { Op } = require('sequelize')
const helpers = require("../_helpers");
const db = require("../models");
const Tweet = db.Tweet;
const Reply = db.Reply;
const User = db.User;
const Like = db.Like;
const Followship = db.Followship;

// JWT
const jwt = require('jsonwebtoken')

const userService = {
  
  getUser: (req, res, callback) => {
    const currentUser = req.user ? req.user : helpers.getUser(req);
    User.findOne({
      where: {
        id: req.params.id
      },
      include: [
        { model: User, as: "Followers" },
        { model: User, as: "Followings" },
      ],
    }).then(user => {
      user = {
        ...user.dataValues,
        FollowersCount: user.Followers.length,
        FollowingsCount: user.Followings.length,
      };
      return callback({
        user: user,
        status: "success",
        message: "service success!",
      });
    }).catch(error => { return callback({ status: "error", message: "service error!" }) })
    // User.findByPk(req.params.id, {
    //   include: [
    //     { model: User, as: "Followers" },
    //     { model: User, as: "Followings" },
    //   ],
    // }).then((user) => {
    //   console.log('11111111111111111',req.body)
    //   user = {
    //     ...user.dataValues,
    //     FollowersCount: user.Followers.length,
    //     FollowingsCount: user.Followings.length,
    //   };
    //   return callback({ user: user})
    // }).catch(error => { return callback({ status: "error", message: "service error!" }) })
  },
  
  addFollowing: (req, res, callback) => {
    const currentUser = req.user ? req.user : helpers.getUser(req);
    return Followship.create({
      followerId: currentUser.id,
      followingId: Number(req.params.id),
    }).then((followship) => {
      return callback({ status: "success", message: "" });
    });
  },
  removeFollowing: (req, res, callback) => {
    const currentUser = req.user ? req.user : helpers.getUser(req);
    return Followship.findOne({
      where: {
        followerId: currentUser.id,
        followingId: Number(req.params.id),
      },
    }).then((followship) => {
      followship.destroy().then((followship) => {
        return callback({ status: "success", message: "" });
      });
    });
  },
  getUserTweets: (req, res, callback) => {
    const currentUser = req.user ? req.user : helpers.getUser(req);
    return Promise.all([
      User.findByPk(req.params.userId, {
        include: [
          { model: User, as: "Followers" },
          { model: User, as: "Followings" },
        ],
      }),
      Tweet.findAll({
        where: {
          UserId: Number(req.params.userId),
        },
        order: [["createdAt", "DESC"]],
        include: [User, Reply, Like],
      }),
    ]).then(([user, tweets]) => {
      user = {
        ...user.dataValues,
        FollowersCount: user.Followers.length,
        FollowingsCount: user.Followings.length,
        isFollower: user.Followers.map((d) => d.id).includes(currentUser.id),
      };
      let newTweets = tweets.map((tweet) => {
        let isLike = tweet.Likes.find((d) => d.UserId === currentUser.id);
        isLike = !isLike ? false : isLike.isLike;
        let likeCount = tweet.Likes.filter((d) => d.isLike === true).length;
        return {
          ...tweet.dataValues,
          tweetReplyCount: tweet.Replies.length,
          tweetLikeCount: likeCount,
          isLike: isLike,
        };
      });
      let tweetCount = tweets.length;
      return callback({
        tweets: newTweets,
        user: user,
        tweetCount: tweetCount,
      });
    });
  },
  getUserReplies: (req, res, callback) => {
    const currentUser = req.user ? req.user : helpers.getUser(req);
    return Promise.all([
      User.findByPk(req.params.userId, {
        include: [
          { model: User, as: "Followers" },
          { model: User, as: "Followings" },
        ],
      }),
      Reply.findAll({
        where: {
          UserId: Number(req.params.userId),
        },
        order: [["createdAt", "DESC"]],
        include: [User, { model: Tweet, include: [User] }],
      }),
    ]).then(([user, tweets]) => {
      user = {
        ...user.dataValues,
        FollowersCount: user.Followers.length,
        FollowingsCount: user.Followings.length,
        isFollower: user.Followers.map((d) => d.id).includes(currentUser.id),
      };
      let newTweets = tweets.map((d) => {
        d.User = {
          UserId: d.User.id,
          avatar: d.User.avatar,
          name: d.User.name,
          account: d.User.account,
          introduction: d.User.introduction,
          createdAt: d.User.createdAt,
        };
        return d;
      });
      let tweetCount = tweets.length;
      return callback({
        tweets: newTweets,
        user: user,
        tweetCount: tweetCount,
      });
    });
  },
  getUserLikes: (req, res, callback) => {
    const currentUser = req.user ? req.user : helpers.getUser(req);
    return Promise.all([
      User.findByPk(req.params.userId, {
        include: [
          { model: User, as: "Followers" },
          { model: User, as: "Followings" },
        ],
      }),
      Like.findAll({
        where: {
          UserId: Number(req.params.userId),
          isLike: true,
        },
        order: [["createdAt", "DESC"]],
        include: [User, { model: Tweet, include: [User, Reply, Like] }],
      }),
    ]).then(([user, tweets]) => {
      user = {
        ...user.dataValues,
        FollowersCount: user.Followers.length,
        FollowingsCount: user.Followings.length,
        isFollower: user.Followers.map((d) => d.id).includes(currentUser.id),
      };
      let newTweets = tweets.map((d) => {
        let isLike;
        let userLike = d.Tweet.Likes.find((l) => l.UserId === currentUser.id);
        if (!userLike) {
          isLike = false;
        } else {
          isLike = userLike.isLike;
        }
        return {
          ...d.dataValues,
          tweetReplyCount: d.Tweet.Replies.length,
          tweetLikeCount: d.Tweet.Likes.filter((d) => d.isLike === true).length,
          isLike: isLike,
        };
      });
      let tweetCount = tweets.length;
      return callback({
        tweets: newTweets,
        user: user,
        tweetCount: tweetCount,
      });
      // return callback({
      //   tweets: tweets,
      //   user: user,
      // });
    });
  },
  getFollowers: (req, res, callback) => {
    const currentUser = req.user ? req.user : helpers.getUser(req);
    return User.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "Followers",
          include: [{ model: User, as: "Followers" }],
        },
      ],
    }).then((result) => {
      const followersCount = result.Followers.length;
      const thoseWeFollows = []; //those users that follows the user who are followed by the user as well
      const ff = result.Followers.map((d) => d.Followers);
      for (i = 0; i < ff.length; i++) {
        for (j = 0; j < ff[i].length; j++) {
          if (ff[i][j].id === currentUser.id) {
            thoseWeFollows.push(ff[i][j].Followship.followingId);
          }
        }
      }
      callback({ result, followersCount, thoseWeFollows });
    });
  },
  getFollowings: (req, res, callback) => {
    const currentUser = req.user ? req.user : helpers.getUser(req);
    return User.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "Followings",
          include: [{ model: User, as: "Followers" }],
        },
      ],
    }).then((result) => {
      const followersCount = result.Followings.length;
      const thoseWeFollows = []; //those who the user and the req.user both follows
      const ff = result.Followings.map((d) => d.Followers);
      for (i = 0; i < ff.length; i++) {
        for (j = 0; j < ff[i].length; j++) {
          if (ff[i][j].id === currentUser.id) {
            thoseWeFollows.push(ff[i][j].Followship.followingId);
          }
        }
      }
      callback({ result, followersCount, thoseWeFollows });
    });
  },
  getTopUser: (req, res, callback) => {
    const currentUser = req.user ? req.user : helpers.getUser(req);
    return User.findAll({
      include: [{ model: User, as: "Followers" }],
    }).then((users) => {
      users = users.map((user) => ({
        ...user.dataValues,
        FollowerCount: user.Followers.length,
        isFollowed: currentUser.Followings
          ? currentUser.Followings.map((d) => d.id).includes(user.id)
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
  getUserLikesTweet: (req, res, callback) => {
    const currentUser = req.user ? req.user : helpers.getUser(req);
    return Promise.all([
      User.findByPk(req.params.userId, {
        include: [
          { model: User, as: "Followers" },
          { model: User, as: "Followings" },
        ],
      }),
      // Like.findAll({
      //   where: {
      //     UserId: Number(req.params.userId),
      //     isLike: true,
      //   },
      //   order: [["createdAt", "DESC"]],
      //   include: [User, { model: Tweet, include: [User, Reply, Like] }],
       Like.findAll({
        where: {
          UserId: Number(req.params.userId),
          isLike: true,
        },
        order: [["createdAt", "DESC"]],
        include: [User, { model: Tweet, include: [User, Reply, Like] }],
      }),
    ]).then(([user, tweets]) => {
      user = {
        ...user.dataValues,
        FollowersCount: user.Followers.length,
        FollowingsCount: user.Followings.length,
        isFollower: user.Followers.map((d) => d.id).includes(currentUser.id),
      };
      let newTweets = tweets.map((d) => {
        let isLike;
        let userLike = d.Tweet.Likes.find((l) => l.UserId === currentUser.id);
        if (!userLike) {
          isLike = false;
        } else {
          isLike = userLike.isLike;
        }
        return {
          ...d.dataValues,
          tweetReplyCount: d.Tweet.Replies.length,
          tweetLikeCount: d.Tweet.Likes.filter((d) => d.isLike === true).length,
          isLike: isLike,
        };
      });
      let tweetCount = tweets.length;
      return callback({
        tweets: newTweets,
        user: user,
        tweetCount: tweetCount,
      });
    });
  },

  putUser: async (req, res, callback) => {
    console.log('req.body',req.body)
    const currentUser = req.user ? req.user : helpers.getUser(req);
    if (helpers.getUser(req).id !== Number(req.params.id)) {
      callback({ status: "error", message: "只能編輯自己的資訊." });
    }
    const [usersEmail, usersAccount, user] = await Promise.all([
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
      User.findByPk(req.params.id),
    ]);
    const emailCheck = usersEmail.map((d) => d.email).includes(req.body.email);
    const accountCheck = usersAccount
      .map((d) => d.account)
      .includes(req.body.account);
    if (
      !req.body.name ||
      !req.body.email ||
      !req.body.account ||
      !req.body.password ||
      !req.body.checkPassword
    ) {
      await callback({
        status: "error",
        message: "名字，信箱，帳號，密碼，確認密碼不能為空!",
      });
    }
    if (req.body.password !== req.body.checkPassword) {
      await callback({ status: "error", message: "密碼與確認密碼不一致!" });
    }
    if (emailCheck) {
      await callback({ status: "error", message: "此信箱己被註冊，請更改!" });
    }
    if (accountCheck) {
      await callback({
        status: "error",
        message: "帳戶名稱已被其他使用者使用，請更改!",
      });
    }
     user.update({
      ...req.body,
      password: bcrypt.hashSync(
        req.body.password,
        bcrypt.genSaltSync(10),
        null
      ),
    });
     callback({
      status: "success",
      message: "使用者資料編輯成功。",
    });
  },
  addLike: (req, res, callback) => {
    Like.findOne({
      where: {
        UserId: helpers.getUser(req).id,
        TweetId: Number(req.params.id),
      },
    }).then((like) => {
      if (!like) {
        return Like.create({
          UserId: helpers.getUser(req).id,
          TweetId: Number(req.params.id),
          isLike: true,
        }).then((like) => {
          return callback({ status: "error", message: "" });
        });
      }
      if (like.isLike === false) {
        return like.update({ ...like, isLike: !like.isLike }).then((like) => {
          return callback({ status: "success", message: "" });
        });
      }
      return callback({ status: "error", message: "" });
    });
  },
  removeLike: (req, res, callback) => {
    Like.findOne({
      where: {
        UserId: helpers.getUser(req).id,
        TweetId: Number(req.params.id),
      },
    }).then((like) => {
      if (!like) {
        return Like.create({
          UserId: helpers.getUser(req).id,
          TweetId: Number(req.params.id),
          isLike: false,
        }).then((like) => {
          return callback({ status: "error", message: "" });
        });
      }
       else  { 
        return like.destroy().then((like) => {
          return callback({ status: "success", message: "" });
        });
      } 
    });
  },

  profileUser: async (req, res, callback) => {
    try {
      const currentUser = req.user ? req.user : helpers.getUser(req);
      const [user] = await Promise.all([User.findByPk(currentUser.id)]);
      return callback({ user: user });
    } catch (e) {
      console.warn(e);
    }
  },

  reviseUser: async (req, res, callback) => {
    try {
      if (helpers.getUser(req).id !== Number(req.params.id)) {
        callback({ status: "error", message: "只能編輯自己的資訊." });
      }

      const [user] = await Promise.all([User.findByPk(helpers.getUser(req).id)]);
      console.log("我在編輯頁面");
      const { files } = req;
      imgur.setClientID(IMGUR_CLIENT_ID);
      if (files) {
        if (files.cover && !files.avatar) {
          console.log("只有大頭照");
          imgur.upload(files.cover[0].path, async (err, coverImg) => {
            try {
              if (err) console.log("Error: ", err);
              let cover = await coverImg;
              await user
                .update({
                  ...req.body,
                  cover: coverImg.data.link,
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
          console.log("只有背景照");
          imgur.upload(files.avatar[0].path, async (err, avatarImg) => {
            if (err) console.log("Error: ", err);
            let avatar = await avatarImg;
            await user
              .update({
                ...req.body,
                avatar: avatarImg.data.link,
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
          console.log("贡張都有");
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
                    callback({
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
          console.log("都沒有照片");
          user
            .update({
              ...req.body,
              cover: user.cover,
              avatar: user.avatar,
            })
            .then(() => {
              callback({
                status: "success",
                message: "使用者資料編輯成功。",
              });
            });
        }
      }
    } catch (e) {
      console.warn(e);
      callback({
        status: "error",
        message: "使用者資料編輯失敗。",
      });
    }
  },
};
  
module.exports = userService

// putUser: (req, res, callback) => {
//   const currentUser = req.user ? req.user : helpers.getUser(req);
//   // if (currentUser.id !== Number(req.params.id)) {
  //   //   // console.log(req, user, currentUser, helpers.getUser(req));
//   //   callback({ status: "error", message: "只能編輯自己的資訊." });
//   //   // req.flash("error_messages", "只能編輯自己的資訊")
//   //   // return res.redirect(`/users/${currentUser.id}`)
//   // }
//   return Promise.all([
//     User.findAll({
//       where: {
//         email: { [Op.not]: currentUser.email },
//       },
//     }),
//     User.findAll({
//       where: {
//         account: { [Op.not]: currentUser.account },
//       },
//     }),
//   ]).then(([usersEmail, usersAccount]) => {
//     let emailCheck = usersEmail.map((d) => d.email).includes(req.body.email);
//     let accountCheck = usersAccount
//       .map((d) => d.account)
//       .includes(req.body.account);
//     console.log("emailCheck", emailCheck, "accountCheck", accountCheck);
//     // if (
//     //   !req.body.name ||
//     //   !req.body.email ||
//     //   !req.body.account ||
//     //   !req.body.password ||
//     //   !req.body.checkPassword
//     // ) {
//     //   callback({
//     //     status: "error",
//     //     message: "名字，信箱，帳號，密碼，確認密碼不能為空!",
//     //   });

//     // req.flash( "error_messages", "名字，信箱，帳號，密碼，確認密碼不能為空!");
//     // return res.redirect("back");
//     // }

//     // if (req.body.password !== req.body.checkPassword) {
//     //   callback({ status: "error", message: "密碼與確認密碼不一致!" });
//     //   // req.flash("error_messages", "密碼與確認密碼不一致!");
//     //   // return res.redirect("back");
//     // }
//     if (emailCheck) {
//       callback({ status: "error", message: "此信箱己被註冊，請更改!" });
//     }
//     if (accountCheck) {
//       callback({
//         status: "error",
//         message: "帳戶名稱已被其他使用者使用，請更改!",
//       });
//     }
//     const { files } = req;
//     console.log("files", files);
//     imgur.setClientID(IMGUR_CLIENT_ID);
//     if (files.cover && !files.avatar) {
//       console.log("只有大頭照");
//       imgur.upload(files.cover[0].path, (err, coverImg) => {
//         if (err) console.log("Error: ", err);
//         return User.findByPk(req.params.id).then((user) => {
//           user
//             .update({
//               ...req.body,
//               cover: coverImg.data.link,
//               password: bcrypt.hashSync(
//                 req.body.password,
//                 bcrypt.genSaltSync(10),
//                 null
//               ),
//             })
//             .then((user) => {
//               callback({
//                 status: "success",
//                 message: "使用者資料編輯成功。",
//               });
//             });
//         });
//       });
//     } else if (!files.cover && files.avatar) {
//       console.log("只有背景照");
//       imgur.upload(files.avatar[0].path, (err, avatarImg) => {
//         if (err) console.log("Error: ", err);
//         return User.findByPk(req.params.id).then((user) => {
//           user
//             .update({
//               ...req.body,
//               avatar: avatarImg.data.link,
//               password: bcrypt.hashSync(
//                 req.body.password,
//                 bcrypt.genSaltSync(10),
//                 null
//               ),
//             })
//             .then((user) => {
//               callback({
//                 status: "success",
//                 message: "使用者資料編輯成功。",
//               });
//             });
//         });
//       });
//     } else if (files.cover && files.avatar) {
//       console.log("贡張都有");
//       imgur.upload(files.cover[0].path, (err, coverImg) => {
//         if (err) console.log("Error: ", err);
//         imgur.upload(files.avatar[0].path, (err, avatarImg) => {
//           if (err) console.log("Error: ", err);
//           return User.findByPk(req.params.id).then((user) => {
//             user
//               .update({
//                 ...req.body,
//                 cover: coverImg.data.link,
//                 avatar: avatarImg.data.link,
//                 password: bcrypt.hashSync(
//                   req.body.password,
//                   bcrypt.genSaltSync(10),
//                   null
//                 ),
//               })
//               .then((user) => {
//                 callback({
//                   status: "success",
//                   message: "使用者資料編輯成功。",
//                 });
//               });
//           });
//         });
//       });
//     } else {
//       console.log("都沒有照片");
//       return User.findByPk(req.params.id).then((user) => {
//         user
//           .update({
//             ...req.body,
//             cover: user.cover,
//             avatar: user.avatar,
//             password: bcrypt.hashSync(
//               req.body.password,
//               bcrypt.genSaltSync(10),
//               null
//             ),
//           })
//           .then(() => {
//             callback({
//               status: "success",
//               message: "使用者資料編輯成功。",
//             });
//           });
//       });
//     }
//   });
// };


//  編輯單張照片
  // putUser: (req, res, callback) => {
  //   const currentUser = req.user ? req.user : helpers.getUser(req);
  //   if (currentUser.id !== Number(req.params.id)) {
  //     callback({ status: "error", message: "只能編輯自己的資訊." });
  //     // req.flash("error_messages", "只能編輯自己的資訊")
  //     // return res.redirect(`/users/${currentUser.id}`)
  //   }
  //   const { file } = req;
  //   return Promise.all([
  //     User.findAll({
  //       where: {
  //         email: { [Op.not]: currentUser.email },
  //       },
  //     }),
  //     User.findAll({
  //       where: {
  //         account: { [Op.not]: currentUser.account },
  //       },
  //     }),
  //   ]).then(([usersEmail, usersAccount]) => {
  //     let emailCheck = usersEmail.map((d) => d.email).includes(req.body.email);
  //     let accountCheck = usersAccount
  //       .map((d) => d.account)
  //       .includes(req.body.account);
  //     console.log("emailCheck", emailCheck, "accountCheck", accountCheck);
  //     if (!req.body.name || !req.body.email || !req.body.account || !req.body.password ||
  //       !req.body.passwordCheck) 
  //       {
  //         callback({ status: 'error', message: '名字，信箱，帳號，密碼，確認密碼不能為空!' })
  //       // req.flash( "error_messages", "名字，信箱，帳號，密碼，確認密碼不能為空!");
  //       // return res.redirect("back");
  //     }
  //     if (req.body.password !== req.body.passwordCheck) {
  //       callback({ status: "error", message: "密碼與確認密碼不一致!" })
  //       // req.flash("error_messages", "密碼與確認密碼不一致!");
  //       // return res.redirect("back");
  //     }
  //     if (emailCheck) {
  //       callback({ status: "error", message: "此信箱己被註冊，請更改!" })
  //       // req.flash("error_messages", "此信箱己被註冊，請更改!");
  //       // return res.redirect("back");
  //     }
  //     if (accountCheck) {
  //       callback({ status: "error", message: "帳戶名稱已被其他使用者使用，請更改!" });
  //       // req.flash("error_messages", "帳戶名稱已被其他使用者使用，請更改!")
  //       // return res.redirect("back");
  //     }
  //     if (file) {
  //       // fs.readFile(file.path, (err, data) => {
  //       imgur.setClientID(IMGUR_CLIENT_ID);
  //       imgur.upload(file.path, (err, img) => {
  //         // if (err) console.log("Error: ", err);
  //         // fs.writeFile(`upload/${file.originalname}`, data, () => {
  //         return User.findByPk(req.params.id).then((user) => {
  //           user
  //             .update({
  //               ...req.body,
  //               cover: file ? img.data.link : user.cover,
  //               avatar: file ? img.data.link : user.avatar,
  //               // cover: file ? `/upload/${file.originalname}` : req.body.cover,
  //               // avatar: file ? `/upload/${file.originalname}` : req.body.avatar,
  //               password: bcrypt.hashSync(
  //                 req.body.password,
  //                 bcrypt.genSaltSync(10),
  //                 null
  //               ),
  //             })
  //             .then((user) => {
  //               callback({ status: "success", message: "使用者資料編輯成功。" });
  //               // req.flash("success_messages", "使用者資料編輯成功");
  //               // res.redirect(`/users/${req.params.id}`);
  //             });
  //         });
  //       });
  //       // });
  //     } else {
  //       return User.findByPk(req.params.id).then((user) => {
  //         user
  //           .update({
  //             ...req.body,
  //             cover: user.cover,
  //             avatar: user.avatar,
  //             password: bcrypt.hashSync(
  //               req.body.password,
  //               bcrypt.genSaltSync(10),
  //               null
  //             ),
  //           })
  //           .then(() => {
  //             callback({ status: "success", message: "使用者資料編輯成功。" });
  //             // req.flash("success_messages", "使用者編輯成功");
  //             // return res.redirect(`/users/${req.params.id}`);
  //           });
  //       });
  //     }
  //   });