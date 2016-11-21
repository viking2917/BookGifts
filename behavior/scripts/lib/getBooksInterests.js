'use strict'

const request = require('request')

module.exports = function getBooksInterests(interests, client, next) {
    
    var url = "https://www.thehawaiiproject.com/get_books_for_categories.php?format=json&whitelabel=0&l=10&o=0&interests="+stringize_interests(interests)

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
	    
	    //setClientCache.removeSentBooks(client, parsedResult);

	    console.log(parsedResult.books.length)

	    var newbooks = []
	    var sentBooks = client.getConversationState().sentBooks
	    var testBook
	    for(var i=0; i<parsedResult.books.length; i++) {
		testBook = parsedResult.books[i]
		if(sentBooks.indexOf(testBook.bookid) < 0) {
		    console.log(testBook.bookid + ' not in sent books, sending')
		    newbooks.push(testBook)
		}
		else {
		    console.log(testBook.bookid + ' in sent books, dropping')
		}
	    }

	    parsedResult.books = newbooks;
	    next(parsedResult)
	} else {
	    next()
	}
    })
}

function stringize_interests(interests) {

    return interests.join("|");
}
