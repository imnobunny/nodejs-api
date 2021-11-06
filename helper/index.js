const JWT = require("jsonwebtoken");
const bcrypt = require('bcrypt');

function decodeToken(token){
    const decoded = new Promise((resolve, reject) => {
        let user_token = token;
        if (token.includes("Bearer")) {
            user_token = token.substring(7);
        }
         JWT.verify(user_token, process.env.SECRET_KEY, (err, decoded) => {
             if (err) return reject({
                success: false,
                err,
            });
            decoded.token = user_token;
             return resolve({
                success: true,
                decoded
             }) ;
         });
     })
     return decoded;
}

function passwordBcrypt(password, action="hash", secondPassword=null) {

    let result = bcrypt.hash(password, 10);

    if (action === "compare") {
        result = bcrypt.compare(password, secondPassword);
    } 
    
    return result;
}

function generateTokenSignin(data){
    try {
        const token = JWT.sign({...data }, process.env.SECRET_KEY, {expiresIn: '1hr'});
        return {
            success: true, 
            token
        }
    } catch(err) {
        return {
            success: false,
            err
        }
    }
}

module.exports = {
    decodeToken,
    passwordBcrypt,
    generateTokenSignin
}