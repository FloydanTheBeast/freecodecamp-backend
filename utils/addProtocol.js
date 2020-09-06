module.exports = (url) => {
	if (!/^(?:f|ht)tps?:\/\//.test(url)) {
		url = 'http://' + url
	}
	return url
}
