const express = require('express')
const Task = require('../db/models/task')
const authenticate = require('../middleware/authentication')
const router = new express.Router()

router.post('/tasks', authenticate, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id
  })
  try {
    await task.save()
    res.status(201).send(task)
  } catch (e) {
    res.status(400).send(e)
  }
})

router.get('/tasks', authenticate, async (req, res) => {
  const match = {}
  const sort = {}

  if (req.query.completed) {
    match.completed = req.query.completed === 'true'
  } 

  if(req.query.sortBy) {
    const parts = req.query.sortBy.split(':')
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
  }

  try {
    // let tasks = await Task.find({ owner: req.user._id})
    await req.user.populate({
      path: 'tasks',
      match,
      options: {
        limit: parseInt(req.query.limit) || 10,
        skip: parseInt(req.query.skip),
        sort
      }
    }).execPopulate()
    res.send(req.user.tasks)
  } catch (e) {
    res.status(500).send()
  }
})

router.get('/tasks/:id', authenticate, async (req, res) => {
  const _id = req.params.id
  try {
    const task = await Task.findOne({ _id, owner: req.user._id })
    if (!task) {
      return res.status(404).send()
    }
    res.send(task)
  } catch (e) {
    res.status(500).send(e)
  }
})

router.patch('/tasks/:id', authenticate, async (req, res) => {
  const _id = req.params.id
  const validKeysToUpdate = ['description', 'completed']
  const keysToUpdate = Object.keys(req.body)
  const isValidUpdate = keysToUpdate.every((key) => {
    return validKeysToUpdate.includes(key)
  })

  if (!isValidUpdate) {
    return res.status(400).send({"error": 'You cannot update that keys'})
  }

  try {
    const task = await Task.findOne({ _id, owner: req.user._id })
    
    if (!task) {
      return res.status(400).send()
    }

    keysToUpdate.forEach((key) => task[key] = req.body[key])
    await task.save()
    res.send(task)
  
  } catch (e) {
    res.status(400).send(e)
  }
})

router.delete('/tasks/:id', authenticate, async (req, res) => {
  const _id = req.params.id

  try {
    const task = await Task.findOneAndDelete({ _id, owner: req.user._id })
    if (!task) {
      return res.status(400).send()
    }
    res.send(task)
  } catch (e) {
    res.status(500).send(e)
  }
})

module.exports = router