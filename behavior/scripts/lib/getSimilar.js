'use strict'

const request = require('request')

module.exports = function getSimilar(bookTitle, bookAuthor, next) {

    const title = bookTitle
    const author = bookAuthor
    
    const requestUrl = 
	  {
	      uri: `http://www.thehawaiiproject.com/get_book_details.php?format=json&stories=0&title=${title}&author=${author}`,
	      method: "GET",
	      timeout: 30000,
	      followRedirect: true,
	      maxRedirects: 10
	  }

    console.log('Making HTTP GET request to:', requestUrl)

    request(requestUrl, (err, res, body) => {
	if (err || (res.statusCode != 200)) {
	    console.log('error: error code ' + res.statusCode)
	    console.log(err)
	    throw new Error(err)
	}
	
	if (body) {
	    const parsedResult = JSON.parse(body)
	    next(parsedResult)
	} else {
	    next()
	}
    })
}
