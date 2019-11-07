require('dotenv').config()
const express = require('express')
const path = require('path')
const morgan = require('morgan')
const cors = require('cors')
const bodyParser = require('body-parser')
const session = require('express-session')
const { ExpressOIDC } = require('@okta/oidc-middleware')
const helmet = require('helmet')
const { NODE_ENV } = require('./config')

const app = express()

const morganOption = (NODE_ENV === 'production')
    ? 'tiny'
    : 'common'; 

app.use(session({
    secret: process.env.RANDOM_SECRET_WORD,
    resave: true,
    saveUninitialized: false
}))

const oidc = new ExpressOIDC({
    issuer: `${process.env.OKTA_ORG_URL}/oauth2/default`,
    client_id: process.env.OKTA_CLIENT_ID,
    client_secret: process.env.OKTA_CLIENT_SECRET,
    redirect_uri: process.env.REDIRECT_URL,
    scope: 'openid profile',
    routes: {
        callback: {
            path: '/authorization-code/callback',
            defaultRedirect: '/admin'
        }
    }
})

app.use(morgan(morganOption))
app.use(cors())
app.use(helmet())
app.use(oidc.router)
app.use(bodyParser.json())

app.use(function errorHandler(error, req, res, next) {
    let response
    if (NODE_ENV === 'production') {
    response = { error: { message: 'server error' } }
    } else {
    console.error(error)
    response = { message: error.message, error }
    }
    res.status(500).json(response)
})

app.get('/', (req, res) => {
    res.send('Hello, world!')
})

app.get('/home', (req, res) => {
    res.send('<h1>Welcome!!</div><a href="/login">Login</a>');
})
   
app.get('/admin', oidc.ensureAuthenticated(), (req, res) =>{
    res.send('Admin page');
})

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/home');
});
  
app.get('/', (req, res) => {
    res.redirect('/home');
});


module.exports = app