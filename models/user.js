'use strict'
const { datatype } = require('faker')
const {
  Model
} = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    name: DataTypes.STRING(50),
    avatar: DataTypes.STRING,
    introduction: DataTypes.TEXT(160),
    role: DataTypes.STRING,
    account: DataTypes.STRING,
    cover: DataTypes.STRING
  }, {});
  User.associate = function (models) {
    User.hasMany(models.Tweet)
    User.hasMany(models.Reply)
    User.hasMany(models.Like)
    User.belongsToMany(User, {
      through: models.Followship,
      foreignKey: 'followingId',
      as: 'Followers'
    })
    User.belongsToMany(User, {
      through: models.Followship,
      foreignKey: 'followersId',
      as: 'Followings'
    })
  }

  return User;
};