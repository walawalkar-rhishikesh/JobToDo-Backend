/* eslint-disable */
var nodemailer = require('nodemailer');
var mailOptions = {
  from: 'example@nodemailer.com',
  to: '',
  subject: '',
  text: ``
};

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.user,
    pass: process.env.pass
  }
});

module.exports = {
  sendEmailViaNodeMailer: (email, subject, text) => {
    mailOptions.to = email;
    mailOptions.subject = subject;
    mailOptions.text = text;
    console.log("EMAIL NODE MAILER PAYLOAD: ", JSON.stringify(mailOptions));
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log("Email error: ", error);
      } else {
        console.log('Email success: ' + info.response);
        console.log('Email success: ' + nodemailer.getTestMessageUrl(info));
      }
    });
  }
}