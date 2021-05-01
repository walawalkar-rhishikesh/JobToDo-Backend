'use strict';

let {
    generateHashPassword,
    matchUserPassword,
} = require("../util/bcrypt-functions");

let {
    mstatus,
    msuccess,
    merror,
} = require("../util/http-messages");

let { userTypes, nodeMailerConst } = require("../util/constants");
let { generateJWT } = require("../util/jwt-functions");
let { sendEmailViaNodeMailer } = require("../util/node-mailer");


var mresponseSuccess = {
    status: mstatus.success,
    message: msuccess.success,
    data: {},
};

var mresponseError = {
    status: mstatus.error,
    message: merror.request,
    data: {},
};


module.exports = function(Notifications) {
    Notifications.remoteMethod("addNotification", {
        http: { path: "/addNotification", verb: "post" },
        description: "This API is used for user signup",
        accepts: [
            {
                arg: "uid",
                type: "string",
            },
            {
                arg: "title",
                type: "string",
            }
        ],
        returns: { arg: "body", type: "object", root: true },
    });
    Notifications.addNotification = function (
        uid,
        title,
        callback
    ) {
        if (!uid) {
            mresponseError.message = "Invalid user id";
            callback(null, mresponseError);
            return;
        }
        if (!title) {
            mresponseError.message = "Invalid title";
            callback(null, mresponseError);
            return;
        }

        Notifications.create({uid, title, created_on: new Date()}, function(err, response){
            if (err) {
                // mresponseError.message = err;
                // callback(null, mresponseError);
            } else if(response){
                // mresponseSuccess.data = response;
                // callback(null, mresponseSuccess);
            } else{
                // mresponseError.message = merror.no_records;
                // callback(null, mresponseError);
            }
        })
        
    };

    Notifications.remoteMethod("getNotification", {
        http: { path: "/getNotification", verb: "post" },
        description: "This API is used for user signup",
        accepts: [
            {
                arg: "uid",
                type: "string",
            }
        ],
        returns: { arg: "body", type: "object", root: true },
    });

    Notifications.getNotification = function(
        uid,
        callback
    ){
        if (!uid) {
            mresponseError.message = "Invalid user id";
            callback(null, mresponseError);
            return;
        }
        Notifications.find({where: {uid}, order: ["id DESC"],}, function(err, response){
            if (err) {
                mresponseError.message = err;
                callback(null, mresponseError);
            } else if(response){
                mresponseSuccess.data = response;
                callback(null, mresponseSuccess);
            } else{
                mresponseError.message = merror.no_records;
                callback(null, mresponseError);
            }
        })
    }
};
