const ExpressError = require("../expressError");
const { ensureLoggedIn } = require("../middleware/auth");
const Message = require("../models/message");


const Router = require("express").Router;
const router = new Router();



/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/



router.get("/:id", ensureLoggedIn, async function(req, res, next) {
    let username = req.user.username
    let requested_message = await Message.get(req.params.id)

    let fromUser = message.from_user
    let toUser = message.to_user

    if (username !== fromUser && username !== toUser) {
        throw new ExpressError("Cannot view message", 401);
    }

    return res.json({message: requested_message})
})
/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", ensureLoggedIn, async function(req, res, next){
    try {
        let created_message = await Message.create({from_username: req.user.username, to_username: req.body.to_username, body: req.body.body})
    
        return res.json({message: created_message})

    } catch (err) {
        return next(err);
    }

})

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post("/:id/read", ensureLoggedIn, async function (req, res, next) {
    try {
        let msg = await Message.get(req.params.id);

        if (msg.to_user.username !== req.user.username) {
            throw new ExpressError("Cannot set this message to read", 401);
          }
    let message = await Message.markRead(req.params.id);

    return res.json({message});
          
    } catch (err) {
        return next(err)
    }
})

module.exports = router;