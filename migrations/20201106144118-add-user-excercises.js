module.exports = {
	async up(db) {
		return db
			.collection('users')
			.updateMany({}, { $set: { exercises: [] } })
	},

	async down(db) {
		return db
			.collection('users')
			.updateMany({}, { $unset: { exercises: null } })
	},
}
