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
            let body = `Hi ${fname} 
                \nThank you for registrating at JobToDo. Your account has been successfully created. Please login with your registered email id. I hope you have an amazing experience with us.
                \nBest \nTeam ClinApp 
            `
            return { subject , body};
        }
    }
}