const JWT = require("jsonwebtoken");
const Session = require("../models/session.model");
const { decodeToken } = require("../helper/index");
const { session } = require("passport");

const verifyToken = async(req, res, next) => {
    try {        
        const headerAuth = req.headers.authorization;
        // headerAuth and userId are required
        if (!headerAuth) {
            return res.status(401).json({
                success133: false,
                message: "Access Not Authorized"
            });
        }

        // decode the token 
        const token_valid = await decodeToken(headerAuth).then(data => data).catch(err => err);
       
        if (!token_valid.success) return res.status(400).json({ success: false, message: token_valid.err });

        const { userid, token } = token_valid.decoded

        if (userid) {
            // check the session db if the user id exists
            const  hasSession = await Session.findOne({ userid }).then(user => user).catch(err => err);
            
            if (!hasSession || hasSession.token !== token) return res.status(401).json({ success: false, message: "Access Not Authorized" });
             // if user has session
            return next();
        
        } else {
            // return invalid token if not same
            //401 is invalid token , not authorize to access api
            return res.status(401).json({
                success: false,
                message: "Access Not Authorized"
            });
        }
    } catch (err) {
        //401 is invalid token , not authorize to access api
        return res.status(401).send({
            success: false,
            message: err
        });
    }
   
}

module.exports = verifyToken;