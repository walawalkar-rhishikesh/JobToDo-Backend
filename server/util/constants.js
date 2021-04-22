/* eslint-disable */
module.exports = {
    jwtConst:{
        privatekey: "ThisIsJobToDoApp"
    },
    bcryptConst : {
        salt: 15
    },
    nodeMailerConst:{
        userCreation: (fname) => {
            let subject = `Welcome to JobToDo`;
            let body = `Hi ${fname},
                \nThank you for registrating at JobToDo. Your account has been successfully created. Please login with your registered email id. I hope you have an amazing experience with us.
                \nBest \nTeam ClinApp 
            `
            return { subject , body};
        },
        resetPinRequest: (fname, pin) => {
            let subject = `JobToDo: Request for password reset`;
            let body = `Hi ${fname},
                \n Your temperorary pin is ${pin}. Please enter the pin and your new password when prompted.
                \nBest \nTeam ClinApp 
            `
            return { subject , body};
        },
        passwordResetConfirmation: (fname) => {
            let subject = `JobToDo: Request for password reset`;
            let body = `Hi ${fname},
                \n Your password was successfully updated. If not done by you, contact admin asap.
                \nBest \nTeam ClinApp 
            `
            return { subject , body};
        }
    }
}