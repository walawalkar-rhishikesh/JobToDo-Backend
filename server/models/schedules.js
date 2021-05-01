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

const schedule = require('node-schedule');

let { nodeMailerConst } = require("../util/constants");
let { generateJWT } = require("../util/jwt-functions");
let { sendEmailViaNodeMailer } = require("../util/node-mailer");

var moment = require("moment");

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

module.exports = function (Schedules) {

    Schedules.remoteMethod("add", {
        http: { path: "/add", verb: "post" },
        description: "Create Schedule",
        accepts: [
            {
                arg: "uid",
                type: "string",
            },
            {
                arg: "title",
                type: "string",
            },
            {
                arg: "company",
                type: "string",
            },
            {
                arg: "contact",
                type: "string",
            },
            {
                arg: "method",
                type: "string",
            },
            {
                arg: "description",
                type: "string",
            },
            {
                arg: "notes",
                type: "string",
            },
            {
                arg: "meeting_link",
                type: "string",
            },
            {
                arg: "scheduled_on",
                type: "string",
            }
        ],
        returns: { arg: "body", type: "object", root: true },
    });
    Schedules.add = function (
        uid,
        title,
        company,
        contact,
        method,
        description,
        notes,
        meeting_link,
        scheduled_on,
        callback
    ) {
        if (!uid) {
            mresponseError.message = "Invalid user id";
            callback(null, mresponseError);
            return;
        }
        if (!title) {
            mresponseError.message = "Title cannot be blank";
            callback(null, mresponseError);
            return;
        }
        if (!description) {
            mresponseError.message = "Description cannot be blank";
            callback(null, mresponseError);
            return;
        }
        if (!scheduled_on) {
            mresponseError.message = "scheduled_on cannot be blank";
            callback(null, mresponseError);
            return;
        }

        var scheduleData = {
            uid,
            title,
            company,
            contact,
            method,
            description,
            notes,
            meeting_link,
            scheduled_on : new Date(scheduled_on)
        }

        Schedules.create(scheduleData, (err, response) => {
            if (err) {
                mresponseError.message = err;
                callback(null, mresponseError);
            } else if (response) {
                Schedules.app.models.Users.sendScheduleNotification(
                    uid,
                    title,
                    scheduleData.scheduled_on
                );
                mresponseSuccess.data = response;
                mresponseSuccess.message = msuccess.insert
                callback(null, mresponseSuccess);
            } else {
                mresponseError.message = merror.no_records;
                callback(null, mresponseError);
            }
        });
    };

    Schedules.remoteMethod("updateSchedule", {
        http: { path: "/updateSchedule", verb: "post" },
        description: "",
        accepts: [
            {
                arg: "id",
                type: "string",
            },
            {
                arg: "title",
                type: "string",
            },
            {
                arg: "company",
                type: "string",
            },
            {
                arg: "contact",
                type: "string",
            },
            {
                arg: "method",
                type: "string",
            },
            {
                arg: "description",
                type: "string",
            },
            {
                arg: "notes",
                type: "string",
            },
            {
                arg: "meeting_link",
                type: "string",
            }
        ],
        returns: { arg: "body", type: "object", root: true },
    });
    Schedules.updateSchedule = function (
        id,
        title,
        company,
        contact,
        method,
        description,
        notes,
        meeting_link,
        callback
    ) {
        if (!id) {
            mresponseError.message = "Invalid id";
            callback(null, mresponseError);
            return;
        }
        // if (!title) {
        //     mresponseError.message = "Title cannot be blank";
        //     callback(null, mresponseError);
        //     return;
        // }
        // if (!description) {
        //     mresponseError.message = "Description cannot be blank";
        //     callback(null, mresponseError);
        //     return;
        // }

        Schedules.findOne(
            {
              where: {
                id
              },
            },
            function (err, response) {
                if (err) {
                    mresponseError.message = err;
                    callback(null, mresponseError);
                } else if(response){
                    var userID = response.uid
                    var result = response
                    result.title = title ? title : result.title,
                    result.company = company ? company : result.company
                    result.contact = contact ? contact : result.contact
                    result.method = method ? method : result.method
                    result.description = description ? description : result.description
                    result.notes = notes ? notes : result.notes
                    result.meeting_link = meeting_link ? meeting_link : result.meeting_link
                    response.updateAttributes(result, (response) => {

                        Schedules.app.models.Notifications.addNotification(
                            userID,
                            `You have updated a schedule by the name ${result.title} which is scheduled for ${result.scheduled_on}`
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

    Schedules.remoteMethod("getSchedules", {
        http: { path: "/getSchedules", verb: "post" },
        description: "",
        accepts: [
            {
                arg: "uid",
                type: "string",
            },
            {
                arg: "type",
                type: "string",
                description: "today, weekly, monthly"
            }
        ],
        returns: { arg: "body", type: "object", root: true },
    });
    Schedules.getSchedules = function (
        uid,
        type,
        callback
    ) {
        if (!uid) {
            mresponseError.message = "Invalid user id";
            callback(null, mresponseError);
            return;
        }
        if (!type) {
            mresponseError.message = "Type cannot be blank";
            callback(null, mresponseError);
            return;
        }
        var searchRequest = {
        }

        if(type === "today"){
            var start = new Date();
            start.setHours(0, 1, 1);

            var end = new Date();
            end.setHours(23, 59, 59);
            searchRequest = {
                where: {
                    and: [{ scheduled_on: { between: [start, end] } }, { uid }],
                },
                order: ["scheduled_on ASC"],
            };
        }else if(type === "weekly"){

            var start = new Date();
            start.setHours(0, 1, 1);

            let currentDate = moment();
            var weekStart = currentDate.clone().startOf('week');
            var weekEnd = currentDate.clone().endOf('week');
            weekStart = moment(weekStart).utc().format();
            weekEnd = moment(weekEnd).utc().format();

            searchRequest = {
                where: {
                    and: [{ scheduled_on: { between: [start, weekEnd] } }, { uid }],
                },
                order: ["scheduled_on ASC"],
            };
        }else if(type === "monthly"){

            var start = new Date();
            start.setHours(0, 1, 1);

            var monthStart = new moment().startOf('month');
            var monthEnd = new moment().endOf("month");
            monthStart = moment(monthStart).utc().format()
            monthEnd = moment(monthEnd).utc().format();

            searchRequest = {
                where: {
                    and: [{ scheduled_on: { between: [start, monthEnd] } }, { uid }],
                },
                order: ["scheduled_on ASC"],
            };
        }else{
            mresponseError.message = "Invalid type";
            callback(null, mresponseError);
            return;
        }

        Schedules.find(
            searchRequest,
            function (err, response) {
                if (err) {
                    mresponseError.message = err;
                    callback(null, mresponseError);
                } else if(response){
                    mresponseSuccess.data = response;
                    mresponseSuccess.message = msuccess.success
                    callback(null, mresponseSuccess);
                } else {
                    mresponseError.message = merror.no_records;
                    callback(null, mresponseError);
                }
            });
    };




};
