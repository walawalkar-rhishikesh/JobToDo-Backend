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

module.exports = function (Users) {
    Users.remoteMethod("register", {
        http: { path: "/register", verb: "post" },
        description: "This API is used for user signup",
        accepts: [
            {
                arg: "full_name",
                type: "string",
            },
            {
                arg: "email",
                type: "string",
            },
            {
                arg: "password",
                type: "string",
            },
            {
                arg: "phone",
                type: "string",
            }
        ],
        returns: { arg: "body", type: "object", root: true },
    });
    Users.register = function (
        full_name,
        email,
        password,
        phone,
        callback
    ) {
        email = email.toLowerCase();
        if (!full_name) {
            mresponseError.message = merror.userFName;
            callback(null, mresponseError);
            return;
        }
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            mresponseError.message = merror.emailFormat;
            callback(null, mresponseError);
            return;
        }
        if (
            !password.match(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
            )
        ) {
            mresponseError.message = merror.passwordPattern;
            callback(null, mresponseError);
            return;
        }
        generateHashPassword(password.trim()).then((hash) => {
            var userData = {
                full_name: full_name.trim(),
                email: email.toLowerCase().trim(),
                password: hash,
                reset_pin: 0
            };
            Users.find({ where: { email } }, (err, response) => {
                if (err) {
                    mresponseError.message = err;
                    callback(null, mresponseError);
                } else if (response && response.length > 0) {
                    mresponseError.message = merror.useraleadyExists;
                    callback(null, mresponseError);
                } else {
                    Users.create(userData, (err, response) => {
                        if (err) {
                            mresponseError.message = err;
                            callback(null, mresponseError);
                        } else if (response) {
                            var mailAttachment = nodeMailerConst.userCreation(
                                full_name
                            );
                            sendEmailViaNodeMailer(
                                email,
                                mailAttachment.subject,
                                mailAttachment.body
                            );
                            response.password = "";
                            mresponseSuccess.message = msuccess.register;
                            response["accessToken"] = generateJWT({ id: response.id });
                            mresponseSuccess.data = response;
                            callback(null, mresponseSuccess);
                        } else {
                            mresponseError.message = merror.no_records;
                            callback(null, mresponseError);
                        }
                    });
                }
            });
        });
    };

    Users.remoteMethod("signin", {
        http: { path: "/signin", verb: "get" },
        description: "This API is used for user signin",
        accepts: [
            {
                arg: "email",
                type: "string",
                required: true,
            },
            {
                arg: "password",
                type: "string",
                required: true,
            },
        ],
        returns: { arg: "body", type: "object", root: true },
    });
    Users.signin = function (email, password, callback) {
        email = email.toLowerCase();
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            mresponseError.message = merror.emailFormat;
            callback(null, mresponseError);
            return;
        }
        if (
            !password.match(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
            )
        ) {
            mresponseError.message = merror.passwordPattern;
            callback(null, mresponseError);
            return;
        }
        Users.findOne({ where: { email } }, (err, response) => {
            if (err) {
                mresponseError.message = err;
                callback(null, mresponseError);
            } else if (response && response.password) {
                matchUserPassword(password, response.password).then((result) => {
                    if (result) {
                        mresponseSuccess.message = msuccess.login;
                        response["accessToken"] = generateJWT({ id: response.id });
                        response.password = "";
                        // response.id = '';
                        mresponseSuccess.data = response;
                        callback(null, mresponseSuccess);
                    } else {
                        mresponseError.message = merror.login;
                        callback(null, mresponseError);
                    }
                });
            } else {
                mresponseError.message = merror.no_records;
                callback(null, mresponseError);
            }
        });
    };
    Users.remoteMethod("requestResetPin", {
        http: { path: "/requestResetPin", verb: "post" },
        description: "",
        accepts: [
            {
                arg: "email",
                type: "string",
                required: true,
            }
        ],
        returns: { arg: "body", type: "object", root: true },
    });
    Users.requestResetPin = function (email, callback) {
        email = email.toLowerCase();
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            mresponseError.message = merror.emailFormat;
            callback(null, mresponseError);
            return;
        }
        Users.findOne({ where: { email } }, (err, response) => {
            if (err) {
                mresponseError.message = err;
                callback(null, mresponseError);
            } else if (response && response.password) {
                var result = response;
                result.reset_pin = Math.floor(Math.random() * 90000) + 10000;
                response.updateAttributes(result, (response) => {
                    var mailAttachment = nodeMailerConst.resetPinRequest(result.full_name, result.reset_pin);
                    sendEmailViaNodeMailer(
                        result.email,
                        mailAttachment.subject,
                        mailAttachment.body
                    );
                    mresponseSuccess.message = msuccess.updatePassword;
                    mresponseSuccess.data = result;
                    callback(null, mresponseSuccess);
                });
            } else {
                mresponseError.message = merror.no_records;
                callback(null, mresponseError);
            }
        });
    };
    Users.remoteMethod("passwordReset", {
        http: { path: "/passwordReset", verb: "post" },
        description: "",
        accepts: [
            {
                arg: "email",
                type: "string",
                required: true,
            },
            {
                arg: "password",
                type: "string",
                required: true,
            },
            {
                arg: "reset_pin",
                type: "number",
                required: true,
            }
        ],
        returns: { arg: "body", type: "object", root: true },
    });
    Users.passwordReset = function (email, password, reset_pin, callback) {
        email = email.toLowerCase();
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            mresponseError.message = merror.emailFormat;
            callback(null, mresponseError);
            return;
        }
        if (
            !password.match(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
            )
        ) {
            mresponseError.message = merror.passwordPattern;
            callback(null, mresponseError);
            return;
        }
        if (!reset_pin) {
            mresponseError.message = merror.invalidResetPin;
            callback(null, mresponseError);
            return;
        }
        Users.findOne({ where: { email } }, (err, response) => {
            if (err) {
                mresponseError.message = err;
                callback(null, mresponseError);
            } else if (response && response.email) {

                if (response.reset_pin === reset_pin) {
                    var result = response;
                    generateHashPassword(password.trim()).then((hash) => {
                        response.password = hash;
                        response.reset_pin = 0
                        response.updateAttributes(result, (response) => {
                            var mailAttachment = nodeMailerConst.passwordResetConfirmation(result.full_name);
                            sendEmailViaNodeMailer(
                                result.email,
                                mailAttachment.subject,
                                mailAttachment.body
                            );
                            mresponseSuccess.message = msuccess.updatePassword;
                            mresponseSuccess.data = result;
                            callback(null, mresponseSuccess);
                        });
                    })
                } else {
                    mresponseError.message = merror.invalidResetPin;
                    callback(null, mresponseError);
                    return;
                }
            } else {
                mresponseError.message = merror.no_records;
                callback(null, mresponseError);
            }
        });
    };

    Users.remoteMethod("sendScheduleNotification", {
        http: { path: "/sendScheduleNotification", verb: "post" },
        description: "This API is used for sendScheduleNotification",
        accepts: [
            {
                arg: "id",
                type: "string",
                required: true,
            },
            {
                arg: "title",
                type: "string",
                required: true,
            },
            {
                arg: "time",
                type: "String",
                required: true,
            },
        ],
        returns: { arg: "body", type: "object", root: true },
    });
    Users.sendScheduleNotification = function (
        id,
        title,
        time,
        callback
    ) {
        Users.findOne({ where: { id } }, (err, response) => {
            if (err) {
                // mresponseError.message = err;
                // callback(null, mresponseError);
            } else if (response && response.email) {
                var mailAttachment = nodeMailerConst.scheduleCreated(
                    response.full_name,
                    title,
                    time
                );
                sendEmailViaNodeMailer(
                    response.email,
                    mailAttachment.subject,
                    mailAttachment.text
                );
                // mresponseSuccess.message = msuccess.success;
                // mresponseSuccess.data = response;
                // callback(null, mresponseSuccess);
            } else {
                // mresponseError.message = merror.request;
                // callback(null, mresponseError);
            }
        });
    };
};
