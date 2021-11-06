const JWT = require("jsonwebtoken");

function decodeToken(token){
    const decoded =  new Promise((resolve, reject) => {
        const user_token = token.substring(7);
         const decoded = JWT.verify(user_token, process.env.SECRET_KEY, (err, decoded) => {
             if (err) return reject({
                success: false,
                err,
            });;
            decoded.token = user_token;
             return resolve({
                success: true,
                decoded
             }) ;
         });
     })
     return decoded
}

module.exports = {
    decodeToken,
}