const express = require('express')
const requestIp = require('request-ip')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const urlRegex = require('url-regex')
const addProtocol = require('./utils/addProtocol')
const urlSchema = require('./schemas/url')
const userSchema = require('./schemas/user')

const app = express()

mongoose
	.connect(process.env.DB_URI || 'mongodb://localhost:27017/db', {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => {
		console.log('MongoDB is running')

		URL.collection
			.drop()
			.catch(() => console.log('Error while dropping the table'))

		URL._resetCount()
	})

// enable CORS
const cors = require('cors')

app.use(cors({ optionSuccessStatus: 200 })) // some legacy browsers choke on 204
app.use(express.static('public'))
app.use(requestIp.mw())

// use urlencoded parser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const apiRouter = express.Router()
const shortUrlRouter = express.Router()
const exerciseRouter = express.Router()

const URL = mongoose.model('url', urlSchema)
const User = mongoose.model('user', userSchema)

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/views/index.html')
})

apiRouter.get('/hello', function (req, res) {
	res.json({ greeting: 'hello API' })
})

apiRouter.get('/timestamp/', (req, res) => {
	res.json({ unix: Date.now(), utc: Date() })
})

apiRouter.get('/timestamp/:timestamp', (req, res) => {
	let timestamp = req.params.timestamp,
		date,
		hasError = false

	if (Number(timestamp)) {
		try {
			date = new Date(Number(timestamp))
		} catch {
			hasError = true
		}
	} else {
		date = new Date(timestamp)

		if (date.toString() === 'Invalid Date') hasError = true
	}

	!hasError
		? res.json({
				unix: date.getTime(),
				utc: date.toUTCString(),
		  })
		: res.json({ error: 'Invalid Date' })
})

apiRouter.get('/whoami', (req, res) => {
	const ipaddress = req.clientIp
	const language = req.headers['accept-language']
	const software = req.headers['user-agent']

	res.json({
		ipaddress,
		language,
		software,
	})
})

shortUrlRouter
	.post('/new', (req, res) => {
		const url = req.body.url
		const urlObject = new URL({ url })

		// HINT: Could have used dns.lookup instead
		if (urlRegex({ exact: true }).test(url))
			urlObject.save((err, obj) => {
				if (err) {
					res.json({
						error: 'Error while saving a URL to the database',
					})
					return console.error(
						'Error while saving url to the database'
					)
				}

				res.json({
					original_url: obj.url,
					short_url: obj._id,
				})
				console.log(
					`Successfuly saved a url to the database: ${obj.url}`
				)
			})
		else
			res.json({
				error: 'invalid URL',
			})
	})
	.get('/:urlId', (req, res) => {
		const { urlId } = req.params
		console.log(urlId)

		URL.findById(urlId, (err, url) => {
			console.log(err, url)
			if (err || !url) res.json({ error: 'Url was not found' })
			else {
				console.log(url.url)
				res.redirect(301, addProtocol(url.url))
			}
		})
	})

exerciseRouter.post('/new-user', (req, res) => {
	const username = req.body['username']

	if (!username) {
		res.sendStatus(400)
		return
	}
	const user = new User({ username })

	user.save()
		.then((newUser) =>
			res
				.status(200)
				.send({ _id: newUser._id, username: newUser.username })
		)
		.catch(() => res.status(400).send('Username already taken'))
})

exerciseRouter.get('/users', (req, res) => {
	User.find({}, (err, users) => {
		res.send(
			users.map((user) => ({ _id: user._id, username: user.username }))
		)
	})
})

exerciseRouter.post('/add', (req, res) => {
	const _id = req.body['userId']

	if (!_id) {
		res.sendStatus(400)
		return
	}

	User.findById(_id, (err, user) => {
		if (err) res.status(404).send('No user found')

		// TODO: Validate all form values
		let { description, duration, date } = req.body

		if (!date) date = new Date()

		user.exercises.push({ description, duration, date })

		res.status(200).json({
			_id: user._id,
			username: user.username,
			date,
			duration,
			description,
		})

		user.save()
	})
})

exerciseRouter.get('/log', (req, res) => {
	const { userId } = req.query

	User.findById(userId, (err, user) => {
		if (err) {
			res.send(err)
			return
		}

		if (!user) {
			res.status(403).send('Unknown userId')
			return
		}

		const { from, to, limit } = req.query
		console.log(user)

		let counter = 0

		let { exercises } = user

		if (from || to || limit)
			exercises = exercises.filter((exercise) => {
				return (
					from ^ (exercise.date >= new Date(from)) &&
					to ^ (exercise.date <= new Date(to)) &&
					counter++ < limit
				)
			})

		res.status(200).json({
			_id: user._id,
			username: user.username,
			count: exercises.length,
			log: exercises,
		})
	})
})

apiRouter.use('/exercise', exerciseRouter)
apiRouter.use('/shorturl', shortUrlRouter)
app.use('/api', apiRouter)

let listener = app.listen(process.env.PORT || 8080, function () {
	console.log('Your app is listening on port ' + listener.address().port)
})
