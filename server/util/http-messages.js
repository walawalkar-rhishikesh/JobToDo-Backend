/* eslint-disable */
var messages =  {
    mstatus: {
        success: 200,
		error: 400,
		forbidden: 403,
    },
	msuccess : {		
		success : "Success",
		no_records : "No Record Found",
		insert : "Inserted Successfully",
		update : "Updated Successfully",
		delete : "Deleted Successfully",
		login : "Login Sucessfull",
		register :"Registration Sucessfull",
		updatePassword: "Password updated successfully",
		payment:"Payment received successfully "
	},
	merror : {
		request : "Invalid Request, Please Try Again.",
		database : "Server Error, Please Try Again.",
		userType: "Invalid user type",
		login : "Invalid credentials",
		forbidden: 'Access denied',
		no_records : "No Record Found",
		emailFormat: "Invalid email format",
		passwordPattern: "Invalid password pattern",
		userFName: "Invalid user first name",
		useraleadyExists: "User is already registered",
		googleID: "Invalid GoogleId",
		appointment_already: "Appointment is not available for the given time"
	}
};
module.exports = messages;

