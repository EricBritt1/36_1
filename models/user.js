/** User class for message.ly */

const db = require("../db");
const bcrypt = require("bcrypt");
const ExpressError = require("../expressError")
const { DB_URI } = require("../config");

const { BCRYPT_WORK_FACTOR } = require("../config");


/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) { 
  let hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
  const result = await db.query(
    ` INSERT INTO users (
          username,
          password,
          first_name,
          last_name,
          phone,
          join_at,
          last_login_at
          )
          VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
          RETURNING username, password, first_name, last_name, phone`,
          [username, hashedPassword, first_name, last_name, phone]);

    return result.rows[0]
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) { 
    const result = await db.query(
      `SELECT password FROM users WHERE username=$1
      `, [username])
      let user = result.rows[0]

      return user && await bcrypt.compare(password, user.password);
  }


  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) { 
    const result = await db.query(
    `UPDATE users
     SET last_login_at = current_timestamp
     WHERE username = $1
     RETURNING username, last_login_at`,
     [username])

     if (!result.rows[0]) {
      throw new ExpressError(`No such user: ${username}`, 404);
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() { 
    const result = await db.query(`
    SELECT username, first_name, last_name, phone FROM users
    `)

    if (!result) {
      throw new ExpressError(`Currently no users in database`, 404)
    }

    return result.rows
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) { 
    const result = await db.query(`
    SELECT username, first_name, last_name, phone, join_at, last_login_at FROM users WHERE username=$1
    `, [username])

    if(!result) {
      throw new ExpressError(`User not found`, 404)
    }

    return result.rows[0]
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) { 
    const result = await db.query(
    `
    SELECT messages.id, messages.to_username AS to_user, messages.body, messages.sent_at, messages.read_at, users.username, users.first_name, users.last_name, users.phone
    FROM messages
    INNER JOIN users ON messages.to_username = users.username
    WHERE messages.from_username = $1;
    `, [username])

    let user = result.rows[0]

    if(!user) {
      throw new ExpressError(`No such user: ${username}`, 404);
    }

    return result.rows.map( m => ({
      id : m.id,
      to_user : { username: m.username, first_name: m.first_name, last_name: m.last_name, phone: m.phone},
      body : m.body,
      sent_at : m.sent_at,
      read_at : m.read_at
    }))
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {

    const result = await db.query(`
    SELECT messages.id, messages.from_username, messages.body, messages.sent_at, messages.read_at, users.username, users.first_name, users.last_name, users.phone
    FROM messages
    INNER JOIN users ON messages.from_username = users.username
    WHERE messages.to_username = $1;
    `, [username])

    let user = result.rows[0]

    if(!user) {
      throw new ExpressError(`No such user: ${username}`, 404);
    }

    return result.rows.map( m => ({
      id : m.id,
      from_user : { username: m.username, first_name: m.first_name, last_name: m.last_name, phone: m.phone},
      body : m.body,
      sent_at : m.sent_at,
      read_at : m.read_at
    }));
    
    
  }
}


module.exports = User;