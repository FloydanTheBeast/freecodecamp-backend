const config = {
	mongodb: {
		url: process.env.DB_URI || 'mongodb://localhost:27017/db',
		// databaseName: process.env.mongo.dbname,

		options: {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		},
	},
	migrationsDir: 'migrations',
	changelogCollectionName: 'changelog',
	migrationFileExtension: '.js',
}

module.exports = config
