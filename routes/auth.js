const jwt = require("jsonwebtoken");
const Router = require("express").Router;
const router = new Router();

const User = require("../models/user");
const {SECRET_KEY} = require("../config");
const ExpressError = require("../expressError");

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post("/login", async function(req, res, next) {
    try {
        let {username, password} = req.body;
        // First we have to make sure user is inside of the database. User.authenticate
        if(User.authenticate(username, password)) {
            // If that's the case we create a token for that user
        let token = jwt.sign({username}, SECRET_KEY)

        // Update loginTimestamp 
        User.updateLoginTimestamp(username)
        return res.json({token})
        } else {
            throw new ExpressError("Invalid username/password", 400);
        }
    } catch (err) {
        return next(err)
    }
})


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post("/register", async function(req, res, next) {
    //let {username, password, first_name, last_name, phone} = req.body; (How I originally did it. Still works but solution has a more organized approach)
try {
    let {username} = await User.register(req.body)

    let token = jwt.sign({username}, SECRET_KEY)

    User.updateLoginTimestamp(username)

    return res.json({token})
} catch (err) {
    return next(err);
}
})
