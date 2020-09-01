const express = require('express')
const app = express()
const requestIp = require('request-ip')

// enable CORS
const cors = require('cors')
app.use(cors({ optionSuccessStatus: 200 })) // some legacy browsers choke on 204

app.use(express.static('public'))
app.use(requestIp.mw())

const apiRouter = express.Router()

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

app.use('/api', apiRouter)

let listener = app.listen(process.env.PORT, function () {
	console.log('Your app is listening on port ' + listener.address().port)
})
