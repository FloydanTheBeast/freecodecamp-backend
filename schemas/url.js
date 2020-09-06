const mongoose = require('mongoose')
const autoIncrement = require('mongoose-auto-increment-reworked')
	.MongooseAutoIncrementID

const Schema = mongoose.Schema

autoIncrement.initialise()

const urlSchema = new Schema({
	url: {
		type: String,
		required: true,
	},
})

urlSchema.plugin(autoIncrement.plugin, {
	modelName: 'Url',
	startAt: 1,
})

module.exports = urlSchema
