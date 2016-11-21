'use strict'

const request = require('request')

module.exports = function getTrending(next) {

    const requestUrl = 
	  {
	      uri: "http://www.thehawaiiproject.com/get_books_for_categories.php?format=json&whitelabel=0&l=10&o=0&categories=trending-books",
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
	    var parsedResult = JSON.parse(body)

	    // console.log(parsedResult)
	    next(parsedResult)
	} else {
	    next()
	}
    })
}
