'use strict'

const urlTools = require('./lib/urls')
const getTrending = require('./lib/getTrending')
const getSimilar = require('./lib/getSimilar')
const setClientCache = require('./lib/setClientCache')

var striptags = require('striptags');

// process._debugProcess(process.pid); debugger;

const firstOfEntityRole = function(message, entity, role) {
  role = role || 'generic';
  const slots = message.slots
  const entityValues = message.slots[entity]
  const valsForRole = entityValues ? entityValues.values_by_role[role] : null

  return valsForRole ? valsForRole[0] : null
}

exports.handle = function handle(client) {

    // const sayHello = client.createStep({
    // 	satisfied() {
    // 	    return Boolean(client.getConversationState().helloSent)
    // 	},
	
    // 	prompt() {
    // 	    client.addResponse('app:response:name:welcome')
    // 	    client.addResponse('app:response:name:provide/documentation', {
    // 		documentation_link: 'http://docs.init.ai',
    // 	    })
    // 	    client.addResponse('app:response:name:provide/instructions')
    // 	    client.updateConversationState({
    // 		helloSent: true
    // 	    })
    // 	    client.done()
    // 	}
    // })
    
    const provideHelp = client.createStep({
	satisfied() {
	    return Boolean(client.getConversationState().helpSent)
	},
	
	prompt() {
	    if(!client.getConversationState().initialHelpSent) {
		client.addResponse('app:response:name:help')
		client.updateConversationState({
		    initialHelpSent: true
		})
	    }
	    else {
		client.addResponse('app:response:name:more_help')
		client.updateConversationState({
		    helpSent: true
		})
	    }
	    client.done()
	}
    })
    
    const untrained = client.createStep({
	satisfied() {
	    return false
	},
	
	prompt() {
	    client.addResponse('app:response:name:apology/untrained')
	    client.done()
	}
    })
    
    const handleTuring = client.createStep({
	satisfied() {
	    return Boolean(client.getConversationState().imabotSent)

	},

	prompt() {
	    client.addResponse('app:response:name:not_human')
	    client.updateConversationState({
		imabotSent: true
	    })
	    client.done()
	}
    })

    const handleGoodbye = client.createStep({
	satisfied() {
	    return false
	},

	prompt() {
	    client.addTextResponse('Mahalo and Aloha!')
	    client.done()
	}
    })

    const provideTrendingBook = client.createStep({
	satisfied() {
	    return false
	},

	prompt(callback) {
	    getTrending(resultBody => {
		if (!resultBody) {
		    console.log('Error getting trending book.')
		    callback()
		    return
		}

		const bookData = {
		    BookTitle: resultBody.books[0].title,
		    AuthorName: resultBody.books[0].authorstring,
		    BookLink: 'https://www.thehawaiiproject.com/' + urlTools.book_url(resultBody.books[0].title,resultBody.books[0].authorstring,resultBody.books[0].bookid),
		}

		console.log('sending book data:', bookData)
		setClientCache.recordBookSent(client, resultBody.books[0])
		client.addResponse('app:response:name:provide_popular_book', bookData)
		client.addImageResponse( resultBody.books[0].coverarturl, 'The product')
		client.done()
		callback()
	    })
	},
    })

    const provideSimilarBook = client.createStep({
	satisfied() {
	    return false
	},

	prompt(callback) {
	    console.log('extracting slots')

	    var bookTitle = firstOfEntityRole(client.getMessagePart(), 'booktitle')
	    if(!bookTitle) bookTitle = ""
	    else bookTitle = bookTitle.value
	    console.log('Title: ' + bookTitle)
	    var bookAuthor = firstOfEntityRole(client.getMessagePart(), 'authorname')
	    if(!bookAuthor) bookAuthor = ""
	    else bookAuthor = bookAuthor.value
	    console.log('Author: ' + bookAuthor)

	    getSimilar(bookTitle, bookAuthor, resultBody => {
		if (!resultBody) {
		    console.log('Error getting trending book.')
		    client.addResponse('app:response:name:apology/untrained')
		    client.done()
		    callback()
		    return
		}

		const theBook = resultBody;
		setClientCache.recordBookRead(client, theBook)

		const relBook1 = resultBody.relatedbooks[0];
		const relBook2 = resultBody.relatedbooks[1];

		const shortdesc1 = striptags(relBook1.description).substring(0,  50) + "..."
		const shortdesc2 = striptags(relBook2.description).substring(0, 50) + "..."

		console.log(relBook1)
		const bookData1 = {
		    BookTitle: relBook1.title,
		    AuthorName: relBook1.authorstring,
		    BookLink: 'https://www.thehawaiiproject.com/' + urlTools.book_url(relBook1.title,relBook1.authorstring,relBook1.bookid),
		}
		const bookData2 = {
		    BookTitle: relBook2.title,
		    AuthorName: relBook2.authorstring,
		    BookLink: 'https://www.thehawaiiproject.com/' + urlTools.book_url(relBook2.title,relBook2.authorstring,relBook2.bookid),
		}

		console.log('sending book data:', bookData1)
		console.log('sending book data:', bookData2)
		setClientCache.recordBookSent(client, relBook1)
		setClientCache.recordBookSent(client, relBook2)
		// client.addTextResponse('(I think you said ' + bookTitle + ' by ' + bookAuthor + '.)')
		client.addTextResponse('(I think you typed a title of <' + bookTitle + '> and an author of <' + bookAuthor + '> so I assume you meant ' + resultBody.title + ' by ' + resultBody.authorstring + '.)')
		client.addResponse('app:response:name:provide_response_recommendation', bookData1)
		client.addImageResponse( relBook1.coverarturl, 'The product')

		client.addCarouselListResponse({
		    items: [
			{
			    'media_url': relBook1.coverarturl,
			    'media_type': 'image/jpeg', 
			    'description': shortdesc1,
			    title: relBook1.title.substring(0,78),
			    actions: [
				{
				    type: 'link',
				    text: 'See More',
				    uri: bookData1.BookLink,
				},
			    ],
			},
			{
			    'media_url': relBook2.coverarturl,
			    'media_type': 'image/jpeg', 
			    'description': shortdesc2,
			    title: relBook2.title.substring(0,78),
			    actions: [
				{
				    type: 'link',
				    text: 'See More',
				    uri: bookData2.BookLink,
				},
			    ],
			},
		    ],
		})


		client.done()
		callback()
	    })
	},
    })

    const provideBookonInterests = client.createStep({
	satisfied() {
	    return false
	},

	prompt(callback) {
	    console.log('extracting slots')

	    var bookTitle = firstOfEntityRole(client.getMessagePart(), 'booktitle')
	    if(!bookTitle) bookTitle = ""
	    else bookTitle = bookTitle.value
	    console.log('Title: ' + bookTitle)
	    var bookAuthor = firstOfEntityRole(client.getMessagePart(), 'authorname')
	    if(!bookAuthor) bookAuthor = ""
	    else bookAuthor = bookAuthor.value
	    console.log('Author: ' + bookAuthor)

	    getSimilar(bookTitle, bookAuthor, resultBody => {
		if (!resultBody) {
		    console.log('Error getting trending book.')
		    client.addResponse('app:response:name:apology/untrained')
		    client.done()
		    callback()
		    return
		}

		const theBook = resultBody;
		setClientCache.recordBookRead(client, theBook)

		const relBook1 = resultBody.relatedbooks[0];
		const relBook2 = resultBody.relatedbooks[1];

		const shortdesc1 = striptags(relBook1.description).substring(0,  50) + "..."
		const shortdesc2 = striptags(relBook2.description).substring(0, 50) + "..."

		console.log(relBook1)
		const bookData1 = {
		    BookTitle: relBook1.title,
		    AuthorName: relBook1.authorstring,
		    BookLink: 'https://www.thehawaiiproject.com/' + urlTools.book_url(relBook1.title,relBook1.authorstring,relBook1.bookid),
		}
		const bookData2 = {
		    BookTitle: relBook2.title,
		    AuthorName: relBook2.authorstring,
		    BookLink: 'https://www.thehawaiiproject.com/' + urlTools.book_url(relBook2.title,relBook2.authorstring,relBook2.bookid),
		}

		console.log('sending book data:', bookData1)
		console.log('sending book data:', bookData2)
		setClientCache.recordBookSent(client, relBook1)
		setClientCache.recordBookSent(client, relBook2)
		// client.addTextResponse('(I think you said ' + bookTitle + ' by ' + bookAuthor + '.)')
		client.addTextResponse('(I think you typed a title of <' + bookTitle + '> and an author of <' + bookAuthor + '> so I assume you meant ' + resultBody.title + ' by ' + resultBody.authorstring + '.)')
		client.addResponse('app:response:name:provide_response_recommendation', bookData1)
		client.addImageResponse( relBook1.coverarturl, 'The product')

		client.addCarouselListResponse({
		    items: [
			{
			    'media_url': relBook1.coverarturl,
			    'media_type': 'image/jpeg', 
			    'description': shortdesc1,
			    title: relBook1.title.substring(0,78),
			    actions: [
				{
				    type: 'link',
				    text: 'See More',
				    uri: bookData1.BookLink,
				},
			    ],
			},
			{
			    'media_url': relBook2.coverarturl,
			    'media_type': 'image/jpeg', 
			    'description': shortdesc2,
			    title: relBook2.title.substring(0,78),
			    actions: [
				{
				    type: 'link',
				    text: 'See More',
				    uri: bookData2.BookLink,
				},
			    ],
			},
		    ],
		})


		client.done()
		callback()
	    })
	},
    })


    const sendGreeting = client.createStep({
	satisfied() {
	    return Boolean(client.getConversationState().greetingSent)
	},
	
	prompt() {
	    client.addResponse('app:response:name:welcome')
	    client.updateConversationState({
		greetingSent: true
		})
	    client.done()
	}
    })
    
    const askBook = client.createStep({
	satisfied() {
	    return false
	},
	
	prompt() {
	    client.addResponse('app:response:name:welcome')
	    client.addResponse('app:response:name:ask_liked_book')
	    // client.expect('liked_book', ['decline', 'similar1'])  // these are streams, not message classifications.
	    client.done()
	}
    })
    
    const askInterests = client.createStep({
	satisfied() {
	    return false
	},
	
	prompt() {
	    client.addResponse('app:response:name:welcome')
	    client.addResponse('app:response:name:askgift')
	    // client.expect('liked_book', ['decline', 'similar1'])  // these are streams, not message classifications.
	    client.done()
	}
    })
    
    const rejectReco = client.createStep({
	satisfied() {
	    return false
	},

	prompt(callback) {

	    // if rejection type is bad book, add it to the banned list.
	    // if rejection type is already read, add it to the read list. 
	    // then cough up another one.


	    var base_type = client.getMessagePart().classification.base_type.value
	    var sub_type = client.getMessagePart().classification.sub_type.value
	    console.log(sub_type)
	    if(sub_type == 'bad_recommendation') {
		console.log('bad reco. forget')
	    }
	    else if (sub_type == 'already_read') {
		var bookid = setClientCache.getLastReco(client)
		console.log('recording read of: ' + bookid)
		// this takes book, not bookid
		setClientCache.recordBookRead(client, bookid)
	    }
	    
	    client.addResponse('app:response:name:provide_popular_book', bookData)
	    client.done()
	    callback()
	},
    })

    client.runFlow({
	classifications: {
	    // map inbound message  classifications to names of streams
	    greeting: 'greetingStream',
	    goodbye: 'goodbyeStream',
	    ask_trending_book: 'trendingStream',
	    looking_for_gift: 'similarStream',
	    liked_book: 'similarStream',
	    request_for_help: 'helpStream',
	    turing: 'turingStream',
	    disagree: 'rejectRecoStream',
	},
	autoResponses: {
	    // configure responses to be automatically sent as predicted by the machine learning model
	    //provide_popular_book: 'getTrending',
	},
	streams: {
	    greetingStream: [askInterests],
	    goodbyeStream: handleGoodbye,
	    turingStream: handleTuring,
	    trendingStream: provideTrendingBook,
	    similarStream: provideSimilarBook,
	    rejectRecoStream: rejectReco,
	    helpStream: [provideHelp],
	    decline: handleGoodbye,
	    //main: [askBook],
	    //onboarding: [sayHello],
	    
	    // end: [untrained],
	    end: [provideHelp],
	}
    })
}
