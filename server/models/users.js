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

                            Users.app.models.Notifications.addNotification(
                                response.id,
                                "Account created"
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

    Users.remoteMethod("updateUser", {
        http: { path: "/updateUser", verb: "post" },
        description: "This API is used for user signup",
        accepts: [
            {
                arg: "id",
                type: "string",
            },
            {
                arg: "full_name",
                type: "string",
            },
            {
                arg: "email",
                type: "string",
            },
            {
                arg: "phone",
                type: "string",
            }
        ],
        returns: { arg: "body", type: "object", root: true },
    });
    Users.updateUser = function (
        id,
        full_name,
        email,
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
            Users.findOne({ where: { id } }, (err, response) => {
                
                if (err) {
                    mresponseError.message = err;
                    callback(null, mresponseError);
                } else if (response) {
                    console.log(response)
                    var result = response
                    result.full_name = full_name
                    result.email = email
                    response.updateAttributes(result, (response) => {
                        Users.app.models.Notifications.addNotification(
                            id,
                            `You have updated a your profile.`
                        );
                        mresponseSuccess.message = msuccess.update;
                        mresponseSuccess.data = result;
                        callback(null, mresponseSuccess);
                    });
                } else {
                    
                            mresponseError.message = merror.no_records;
                            callback(null, mresponseError);
                }
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
                            Users.app.models.Notifications.addNotification(
                                response.id,
                                "Password updated"
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
                    mailAttachment.body
                );
                Users.app.models.Notifications.addNotification(
                    response.id,
                    `You have created a new schedule by the name ${title} which is scheduled for ${time}`
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
    Users.remoteMethod("chatBot", {
        http: { path: "/chatBot", verb: "post" },
        description: "This API is used for chatBot",
        accepts: [
            {
                arg: "id",
                type: "string",
                required: true,
            },
            {
                arg: "text",
                type: "string",
                required: false,
            }
        ],
        returns: { arg: "body", type: "object", root: true },
    });
    Users.chatBot = function (
        id,
        text,
        callback
    ) {

        if (!id) {
            mresponseError.message = "Invalid id";
            callback(null, mresponseError);
            return;
        }
        if (!text) {
            mresponseError.message = "Enter some text";
            callback(null, mresponseError);
            return;
        }

        Users.findOne({ where: { id } }, (err, response) => {
            if (err) {
                mresponseError.message = err;
                callback(null, mresponseError);
            } else if (response && response.email) {
                if(text.includes("my current weeks schedule")){
                    Users.app.models.Schedules.getSchedules(
                        id, 
                        'weekly',
                        function(err, data){
                            getChatsForSchedules(err, data, callback)
                        }
                    )
                }else if(text.includes("my todays schedule")){
                    Users.app.models.Schedules.getSchedules(
                        id, 
                        'today',
                        function(err, data){
                            getChatsForSchedules(err, data, callback)
                        }
                    )
                    
                }else if(text.includes("my current months schedule")){
                    Users.app.models.Schedules.getSchedules(
                        id, 
                        'monthly',
                        function(err, data){
                            getChatsForSchedules(err, data, callback)
                        }
                    )
                }else if(text.includes("my name")){
                    mresponseSuccess.message = `You name is ${response.full_name}`;
                    callback(null, mresponseSuccess);
                    return;
                }else if(text.includes("my email")){
                    mresponseSuccess.message = `You name is ${response.email}`;
                    callback(null, mresponseSuccess);
                    return;
                }else if(text.includes("send me notification")){
                    var mailAttachment = nodeMailerConst.chatBotNotification(
                        response.full_name,
                    );
                    sendEmailViaNodeMailer(
                        response.email,
                        mailAttachment.subject,
                        mailAttachment.body
                    );
                    Users.app.models.Notifications.addNotification(
                        response.id,
                        `Thank you for chatting with JobToDo Bot. Kindly try asking me about your days, weeks or months schedule.`
                    );
                    mresponseSuccess.message = `Done, I have sent you a notification`;
                    callback(null, mresponseSuccess);
                    return;
                }else { 
                    mresponseSuccess.message = "I am not able to process at the moment. Kindly try asking me about your days, weeks or months schedule";
                    callback(null, mresponseSuccess);
                    return;
                }
            } else {
                mresponseSuccess.message = "I am not able to process at the moment. Kindly try asking me about your days, weeks or months schedule";
                callback(null, mresponseSuccess);
            }
        });

        
    };
};
function getChatsForSchedules(err, data, callback){

    if(err){
        mresponseSuccess.message = "I am not able to process at the moment. Kindly try asking me about your days, weeks or months schedule";
        callback(null, mresponseSuccess);
        return;
    }else if(data && data.status == 200){
        if(data.data && data.data.length > 0){
            var responseMessage = `You have ${data.data.length} schedules.`
            // data.data.map(function(currentValue, index){
            //     responseMessage+= `${currentValue.title} on ${currentValue.scheduled_on} \n`
            // })
            mresponseSuccess.message = responseMessage;
            callback(null, mresponseSuccess);
            return;
        }else{
            mresponseSuccess.message = "You don't have any schedules. Please add some schedules.";
            callback(null, mresponseSuccess);
            return;
        }
    } else{
        mresponseSuccess.message = "I am not able to process at the moment. Kindly try asking me about your days, weeks or months schedule";
        callback(null, mresponseSuccess);
        return;
    }    
}
