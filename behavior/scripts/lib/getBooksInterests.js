'use strict'

const request = require('request')

module.exports = function getBooksInterests(interests, next) {
    
    var url = "http://local.thehawaiiproject.com/get_books_for_categories.php?format=json&whitelabel=0&l=2&o=0&interests="+stringize_interests(interests)

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
	    // console.log(parsedResult)
	    next(parsedResult)
	} else {
	    next()
	}
    })
}

function stringize_interests(interests) {

    return interests.join("|");
}
