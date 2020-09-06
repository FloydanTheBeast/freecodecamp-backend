const express = require('express')
const requestIp = require('request-ip')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const urlRegex = require('url-regex')
const addProtocol = require('./utils/addProtocol')
const urlSchema = require('./schemas/url')

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

const apiRouter = express.Router()
const shortUrlRouter = express.Router()
const urlencodedParser = bodyParser.urlencoded({ extended: false })

const URL = mongoose.model('url', urlSchema)

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
	.post('/new', urlencodedParser, (req, res) => {
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

apiRouter.use('/shorturl', shortUrlRouter)
app.use('/api', apiRouter)

let listener = app.listen(process.env.PORT || 8080, function () {
	console.log('Your app is listening on port ' + listener.address().port)
})
