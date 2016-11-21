'use strict'

module.exports = {
    recordBookSent: function(client, book) {

	var state = client.getConversationState()
	if(typeof state.sentBooks == 'undefined') {
	 client.updateConversationState({
	     sentBooks: []
	 })
	}

	state = client.getConversationState()
	var books = state.sentBooks;
	books.push(book.bookid);
	console.log('updated sent books with bookId: ' + book.bookid)

	client.updateConversationState({
	    sentBooks: books
	})
    },

    recordBookRead: function(client, book) {

	var state = client.getConversationState()
	if(typeof state.readBooks == 'undefined') {
	 client.updateConversationState({
	     readBooks: []
	 })
	}

	state = client.getConversationState()
	var books = state.readBooks;
	books.push(book.bookid);
	console.log('updated sent books')

	client.updateConversationState({
	    readBooks: books
	})
    },
    
    getLastReco: function(client) {
	var state = client.getConversationState()
	if(! (typeof state.readBooks == 'undefined') ) {
	    return state.sentBooks[state.sentBooks.length-1];
	}
	else {
	    return false;
	}
    }, 

    recordInterest: function(client, interest) {

	var state = client.getConversationState()
	if( !state.interests || (typeof state.interests == 'undefined')) {
	 client.updateConversationState({
	     interests: []
	 })
	}

	state = client.getConversationState()
	var interests = state.interests;

	console.log(interest)
	console.log(interests)
	console.log(interests.indexOf(interest))

	if(interests.indexOf(interest) < 0) {
	    interests.push(interest)
	    console.log('updated interests')
	    client.updateConversationState({ interests: interests })
	    client.updateConversationState({ new_interests_found: true })
	}
    },

    clearInterests: function (client) {
	
	//	var interests = client.getConversationState().interests
	client.updateConversationState({  interests: false })
    },

    removeSentBooks: function (client, parsedResult) {
	
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
	//	var interests = client.getConversationState().interests
	//client.updateConversationState({  interests: false })
	return parsedResult
    },

}
