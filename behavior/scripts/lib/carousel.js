'use strict'

const setClientCache = require('./setClientCache')
const urlTools = require('./urls')
const striptags = require('striptags')
;
module.exports = {
    addCarousel: function(client, books, n_books, carousel_message) {
	
	// console.log(books)
	if(books && !(books.length>0) ) {	
	    client.addTextResponse('I seem to be out of books on that topic. Can you try something else?')
	}
	else {
	    var carousel_items = []
	    
	    for(var i = 0; i < Math.min(books.length, n_books); i++) {
		const book1 = books[i];
		const shortdesc1 = striptags(book1.description).substring(0, 50) + "..."
		const bookData1 = {
		    BookTitle: book1.title, 
		    AuthorName: book1.authorstring,
		    // BookLink: 'https://www.thehawaiiproject.com/' + urlTools.book_url_short(book1.title,book1.authorstring,book1.bookid),
		    BookLink: book1.amazonurl,
		    AmazonURL: book1.amazonurl
		}

		console.log('sending book data:', bookData1)
		setClientCache.recordBookSent(client, book1)
		if(i < 1) {
		    console.log('sending response_reco') 
		    console.log(bookData1)
		    client.addResponse('app:response:name:provide_response_recommendation', bookData1)

		    if(carousel_message == '') carousel_message = bookData1.BookTitle + ' and some other related books:'
		    client.addTextResponse(carousel_message)
		}

		carousel_items.push(
		    {
			'media_url': book1.coverarturl,
			'media_type': 'image/jpeg', 
			'description': shortdesc1,
			title: book1.title.substring(0,78),
			actions: [
			    {
				type: 'link',
				text: 'Amazon',
				uri: bookData1.AmazonURL,
			    },
			],
		    }
		)
		    
	    }
	    
	    client.addCarouselListResponse({items: carousel_items})
	}
    },
}
