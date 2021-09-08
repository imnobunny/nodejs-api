const jwt = require('jsonwebtoken');

function JWTVerify(token){
    if (token) {
        jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
            if (err) {
                console.log(err);
            } else {
                console.log(decoded)
            }
        })
    }
}

module.exports = JWTVerify;

