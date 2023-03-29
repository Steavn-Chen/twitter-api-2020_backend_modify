'use strict'
const bcrypt = require('bcryptjs')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const mockAdmin = {
      id: 6 * 10,
      account: 'root',
      email: 'root@example.com',
      password: bcrypt.hashSync('12345678', bcrypt.genSaltSync(10), null),
      name: 'root',
      role: 'admin',
      cover: `https://loremflickr.com/320/240/view/?random=${Math.random() * 100}`,
      avatar: `https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/${Math.floor(Math.random() * 1000)}.jpg`,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    const mockUsers = Array.from({ length: 5 }).map((d, i) => ({
      id: Number(i + 1) * 10,
      account: `user${i + 1}`,
      email: `user${i + 1}@example.com`,
      password: bcrypt.hashSync(String(i + 1), bcrypt.genSaltSync(10), null),
      name: `user${i + 1}`,
      role: 'user',
      cover: `https://loremflickr.com/320/240/view/?random=${Math.random() * 100}`,
      avatar: `https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/${Math.floor(Math.random() * 1000)}.jpg`,
      createdAt: new Date(),
      updatedAt: new Date()
    }))
    await queryInterface.bulkInsert('Users', [...mockUsers, mockAdmin])
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {})
  }
}