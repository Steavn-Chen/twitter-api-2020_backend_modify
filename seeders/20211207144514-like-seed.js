'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Likes', [{
      TweetId: 10,
      UserId: 10,
      isLike: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      TweetId: 110,
      UserId: 20,
      isLike: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      TweetId: 210,
      UserId: 30,
      isLike: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      TweetId: 310,
      UserId: 40,
      isLike: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      TweetId: 410,
      UserId: 50,
      isLike: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      TweetId: 20,
      UserId: 10,
      isLike: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      TweetId: 120,
      UserId: 20,
      isLike: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      TweetId: 220,
      UserId: 30,
      isLike: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      TweetId: 320,
      UserId: 40,
      isLike: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      TweetId: 420,
      UserId: 50,
      isLike: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }], {})
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Likes', null, {})
  }
}