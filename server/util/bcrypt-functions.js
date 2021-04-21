/* eslint-disable */
'use strict';

var { bcryptConst } = require("./constants");
var bcrypt = require('bcrypt');

module.exports = {
    generateHashPassword: (password) =>{
        return bcrypt.hash(password, bcryptConst.salt)
    },
    matchUserPassword: ( plain, hash) => {
        return bcrypt.compare(plain, hash)
    }
}