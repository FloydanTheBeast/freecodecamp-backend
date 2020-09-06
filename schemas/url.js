const mongoose = require('mongoose')
const autoIncrement = require('mongoose-auto-increment')

const connection = mongoose.createConnection('mongodb://localhost:27017/db', {
	useNewUrlParser: true,
	useUnifiedTopology: true,
})
const Schema = mongoose.Schema

autoIncrement.initialize(connection, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
})

const urlSchema = new Schema({
	url: {
		type: String,
		required: true,
	},
})

urlSchema.plugin(autoIncrement.plugin, 'Url')

module.exports = urlSchema
