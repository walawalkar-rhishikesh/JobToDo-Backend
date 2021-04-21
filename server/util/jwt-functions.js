/* eslint-disable */
'use strict';

var { jwtConst } = require("./constants");
var jwt = require('jsonwebtoken');

module.exports = {
    generateJWT: (object) =>{ 
        return jwt.sign(object, jwtConst.privatekey);
    },
    verifyToken: ( accessToken ) => {
        return jwt.verify(accessToken, jwtConst.privatekey);
    }
}