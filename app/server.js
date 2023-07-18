'use strict'

const express = require('express')
const session = require('express-session')
const mongoose = require('mongoose')
const passport = require('passport')
const cors = require('cors')
require('dotenv').config()

require('./auth')

// Constants
const PORT = 8080
const HOST = '0.0.0.0'
const URI = process.env.ATLAS_URI

// App
const app = express()

// CORS options
const options = {
  allowedHeaders: [
    'X-ACCESS_TOKEN',
    'Access-Control-Allow-Origin',
    'Authorization',
    'Origin',
    'x-requested-with',
    'Content-Type',
    'Content-Range',
    'Content-Disposition',
    'Content-Description',
],
credentials: true,
methods: 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
origin: [
    'http://localhost:3000',
],
preflightContinue: false,
}

main().catch(err => console.log(err))
async function main () {
  await mongoose.connect(URI, { useNewUrlParser: true })
  const db = mongoose.connection
  db.on('error', error => console.error(error))
  db.once('open', () => console.log('Connected to database'))
}

function isLoggedIn (req, res, next) {
  req.user ? next() : res.sendStatus(401)
}

app.use(express.json())
app.use(session({ secret: process.env.SESSION_SECRET }))
app.use(passport.initialize())
app.use(passport.session())
app.use(cors(options))

const usersRouter = require('./routes/users.js')
app.use('/user', usersRouter)

app.get('/', (req, res) => {
  res.send('<a href="/auth/google">Login with Google</a>')
})

app.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['email', 'profile'],
    accessType: 'offline' // This property is required for Google to provide a refresh token
  })
)

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/failure' }),
  function(req, res) {
    // Success
    res.redirect('/protected')
  }
)

app.get('/protected', isLoggedIn, (req, res) => {
  res.send(`Hello ${req.user.username}`)
})

app.get('/auth/failure', (req, res) => {
  res.send('Something went wrong')
})

app.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) {
      return next(err)
    }
    req.session.destroy()
    res.send('Goodbye!')
  })
})

app.listen(PORT, HOST, () => {
  console.log(`Running on http://${HOST}:${PORT}`)
})
