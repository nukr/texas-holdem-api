import Router from 'koa-router';
import r from '../utils/rdb'
import config from '../config'
import parse from 'co-body'
import uuid from 'node-uuid'
import hasher from '../utils/hasher'
import redis from '../utils/redis'

let router = Router();

router.post('/login', login)
router.get('/logout', logout)
router.post('/signup', signup)

function * login (next) {
  let body = yield parse.json(this)
  let {username, password} = body
  password = yield hasher(password)
  let result = yield r.db(config.rethinkdb.db).table('accounts').filter({username, password})
  if (result.length === 1) {
    this.body = {accessToken: result[0].accessToken}
    redis.set(uuid.v4(), username)
  } else {
    this.throw(400, 'user not exists')
  }
  yield next
}

function * logout (next) {
  this.body = 'logout'
  yield next
}

function * signup (next) {
  let accessToken = uuid.v4()
  let body = yield parse.json(this)

  let usernameRegex = /[a-zA-Z0-9_]{4,255}/
  let passwordRegex = /.{4,255}/
  // 要對 body 做一點檢查
  // 1. is username exists
  // 2. is password exists
  if (!usernameRegex.test(body.username) || !passwordRegex.test(body.password)) {
    this.status = 400
    this.message = JSON.stringify({status: 400, message: 'username or password error'})
    return yield next
  }

  let users = yield r.db(config.rethinkdb.db).table('accounts').filter({username: body.username})
  if (users.length) {
    this.status = 400
    this.message = JSON.stringify({status: 400, message: 'user is exists'})
    return yield next
  }

  let result = yield r
    .db(config.rethinkdb.db)
    .table('accounts')
    .insert({
      username: body.username,
      password: yield hasher(body.password),
      accessToken
    })

  if (result.inserted) {
    let id = result.generated_keys[0]
    this.body = {id, accessToken}
  } else {
    this.status = 500
  }
  yield next
}

export default router.middleware()
