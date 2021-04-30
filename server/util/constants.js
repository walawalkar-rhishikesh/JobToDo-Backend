/* eslint-disable */
module.exports = {
    jwtConst:{
        privatekey: "ThisIsJobToDoApp"
    },
    bcryptConst : {
        salt: 15
    },
    nodeMailerConst:{
        userCreation: (full_name) => {
            let subject = `Welcome to JobToDo`;
            let body = `Hi ${full_name},
                \nThank you for registrating at JobToDo. Your account has been successfully created. Please login with your registered email id. I hope you have an amazing experience with us.
                \nBest \nTeam JobToDo 
            `
            return { subject , body};
        },
        resetPinRequest: (full_name, pin) => {
            let subject = `JobToDo: Request for password reset`;
            let body = `Hi ${full_name},
                \n Your temperorary pin is ${pin}. Please enter the pin and your new password when prompted.
                \nBest \nTeam JobToDo 
            `
            return { subject , body};
        },
        passwordResetConfirmation: (full_name) => {
            let subject = `JobToDo: Request for password reset`;
            let body = `Hi ${full_name},
                \n Your password was successfully updated. If not done by you, contact admin asap.
                \nBest \nTeam JobToDo 
            `
            return { subject , body};
        },
        scheduleCreated: (full_name, title, time) => {
            let subject = `JobToDo: Request for password reset`;
            let body = `Hi ${full_name},
                \nYou have created a new schedule by the name ${title} which is on ${time}.
                \nBest \nTeam JobToDo 
            `
            return { subject , body};
        }
    }
}