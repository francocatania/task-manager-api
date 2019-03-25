const express = require('express')
const router = new express.Router()
const User = require('../db/models/user')
const authenticate = require('../middleware/authentication')
const multer = require('multer')
const sharp = require('sharp')
const { sendWelcomeEmail, sendGoodbyeEmail } = require('../emails/account')

const upload = multer({
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload a JPG, JPEG or PNG file'))
    }
    cb(undefined, true)
  }
})

router.post('/users', async (req, res) => {
  const user = new User(req.body)
  try {
    await user.save()
    sendWelcomeEmail(user.email, user.name)
    const token = await user.generateAuthToken()
    res.status(201).send({ user, token})
  } catch (e) {
    res.status(400).send(e)
  }
})

router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findUserByCredentials(req.body.email, req.body.password)
    const token = await user.generateAuthToken()

    res.send({ user, token })
  } catch (e) {
    res.status(400).send(e)
  }
})

router.post('/users/logout', authenticate, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token
    })
    await req.user.save()
    res.send()

  } catch (e) {
    res.status(500).send()
  }
})

router.post('/users/logoutAll', authenticate, async (req, res) => {
  try {
    req.user.tokens = []
    await req.user.save()
    res.send()
  } catch(e) {
    res.status(500).send()
  }
})

router.get('/users/me', authenticate, async (req, res) => {
  res.send(req.user)
})

router.patch('/users/me', authenticate ,async (req, res) => {
  const validKeysToUpdate = ['name', 'email', 'password', 'age']
  const keysToUpdate = Object.keys(req.body)
  const isValidUpdate = keysToUpdate.every((key) => {
    return validKeysToUpdate.includes(key)
  })

  if (!isValidUpdate) {
    return res.status(400).send({"error": "Cannot update given key"})
  }

  try {
    keysToUpdate.forEach((key) => req.user[key] = req.body[key])
    await req.user.save()
    res.send(req.user)
    
  } catch (e) {
    res.status(400).send(e)
  }
})

router.delete('/users/me', authenticate, async (req, res) => {
  try {
    await req.user.remove()
    sendGoodbyeEmail(req.user.email, req.user.name)
    res.send(req.user)
  } catch (e) {
    res.status(500).send(e)
  }
})

router.post('/users/me/avatar', authenticate , upload.single('avatar'), async (req, res) => {
    const buffer = req.file.buffer
    const sharpennedBuffer = await sharp(buffer).resize({ width: 250, height: 250}).png().toBuffer()

    req.user.avatar = sharpennedBuffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
  res.status(400).send({ error: error.message })
})

router.delete('/users/me/avatar', authenticate, async (req, res) => {
  try {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
  } catch (e) {
    res.status(500).send({ error: "Couldn't delete image"})
  }
})

router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user || !user.avatar) {
      throw new Error('User or Avatar not found')
    }

    res.set('Content-Type', "image/png")
    res.send(user.avatar)
  } catch (e) {
    res.status(400).send(e)
  }
})

module.exports = router