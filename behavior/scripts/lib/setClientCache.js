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
    }
}
