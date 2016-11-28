'use strict'

const request = require('request')

module.exports = function getBooksSimilarAuthor(author, client, next) {
    
    var url = "https://www.thehawaiiproject.com/get_books_for_categories.php?format=json&whitelabel=0&l=10&o=0&similarauthor="+author

    const requestUrl = 
	  {
	      uri: url,
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
