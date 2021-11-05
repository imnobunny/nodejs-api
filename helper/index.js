const JWT = require("jsonwebtoken");

function decodeToken(token){
    const decoded =  new Promise((resolve, reject) => {
        const user_token = token.substring(7);
         const decoded = JWT.verify(user_token, process.env.SECRET_KEY, (err, decoded) => {
             if (err) return null;
             return decoded;
         });

         if (!decoded) reject('err');
         resolve(decoded) 
     })
     return decoded
}

module.exports = {
    decodeToken,
}