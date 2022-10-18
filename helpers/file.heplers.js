const imgur = require('imgur')
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID
imgur.setClientId(IMGUR_CLIENT_ID)

const imgurFileHandler = async (img) => {
  try {
    if (img === undefined || img.length < 1) return null
    const newImg = await imgur.uploadFile(img[0].path)
    return newImg
  } catch (err) {
    console.log(err)
  }
}

module.exports = { imgurFileHandler }