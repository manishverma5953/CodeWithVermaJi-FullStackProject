const mongoose = require("mongoose");
require("dotenv").config();

const { MONGODB_URL } = process.env;

exports.connect = () => {
	mongoose
		.connect(MONGODB_URL, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		})
		// Pass a callback (not an immediately-invoked console.log) so this only
		// prints on an ACTUAL successful connection, not on every startup.
		.then(() => console.log(`DB Connection Success`))
		.catch((err) => {
			console.log(`DB Connection Failed`);
			console.log(err);
			// Do NOT process.exit here. Exiting kills the web server before it
			// binds its port, which makes Render report "no open ports detected"
			// and hides the real DB error. Let the server stay up and surface
			// the DB error instead.
		});
};
