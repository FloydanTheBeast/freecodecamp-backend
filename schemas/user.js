const mongoose = require('mongoose')

const Schema = mongoose.Schema

const userSchema = new Schema({
	username: {
		type: String,
		required: true,
		unique: true,
	},
	exercises: {
		type: [
			{
				description: String,
				duration: Number,
				date: Date,
			},
		],
	},
})

module.exports = userSchema
