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

}
