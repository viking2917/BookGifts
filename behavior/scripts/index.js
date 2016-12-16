'use strict'

const urlTools = require('./lib/urls')
const getTrending = require('./lib/getTrending')
const getSimilar = require('./lib/getSimilar')
const getBooksInterests = require('./lib/getBooksInterests')
const getBooksAuthor = require('./lib/getBooksAuthors')
const setClientCache = require('./lib/setClientCache')
const carousel = require('./lib/carousel')
var striptags = require('striptags')

// process._debugProcess(process.pid); debugger;

const firstOfEntityRole = function(message, entity, role) {
    role = role || 'generic';
    const slots = message.slots
    console.log('slots:'); 
    console.log(slots);
    const entityValues = message.slots[entity]
    const valsForRole = entityValues ? entityValues.values_by_role[role] : null

    return valsForRole ? valsForRole[0] : null
}

exports.handle = function handle(client) {

    const sendGreeting = client.createStep({
	satisfied() {
	    return Boolean(client.getConversationState().greetingSent)
	},
	
	next() {
	    return 'giftOrPersonalStream'
	},

	prompt() {

	    client.updateConversationState({ sentBooks: [] })
	    client.addResponse('app:response:name:welcome')
	    client.updateConversationState({
		greetingSent: true
	    })

	    return 'init.proceed' // `next` from this step will get called
	}
    })

    const startOver = client.createStep({
	satisfied() {
	    return (client.getConversationState().isGift === -1)
	    //return false
	},
	
	next() {
	    return 'giftOrPersonalStream'
	},

	prompt() {
	    console.log('starting over')
	    client.resetConversationState()
	    // client.updateConversationState({ isGift: -1})
	    // client.updateConversationState({ greetingSent: true })
	    // client.updateConversationState({ interests: []})
	    // client.updateConversationState({ sentBooks: []})
	    // client.updateConversationState({ readBooks: []})
	    console.log(client.getConversationState())

	    client.addTextResponse('OK, let\'s start over. I might be confused.')
	    // client.updateConversationState({state: {}})
	    return 'init.proceed' // `next` from this step will get called
	}
    })

    const giftOrPersonal = client.createStep({
	satisfied() {
	    console.log('checking gift satisfied')
	    console.log(client.getConversationState())
	    var foo = (client.getConversationState().isGift === false) || (client.getConversationState().isGift === true)
	    // ((typeof client.getConversationState().isGift !== 'undefined') || (client.getConversationState().isGift == -2))
	    console.log('returning: ' + foo)
	    return foo
	},

	next() {
	    const isGift = client.getConversationState().isGift
	    if (isGift === true) {
		return 'gift'
	    } else if (isGift === false) {
		return 'personal'
	    }
	},
	
	prompt() {
	    console.log('doing giftOrPersonal prompt')
	    let baseClassification = client.getMessagePart().classification.base_type.value
	    if (baseClassification === 'looking_for_gift') {
		console.log('setting')
		client.updateConversationState({
		    isGift: true,
		})
		return 'init.proceed' // `next` from this step will get called
	    } else if (baseClassification === 'looking_for_myself') {
		console.log('setting')
		client.updateConversationState({
		    isGift: false,
		})
		return 'init.proceed' // `next` from this step will get called
	    }
	    
	    //client.addResponse('ask_over_eighteen')
	    // if(!Boolean(client.getConversationState().greetingSent)){
	    // 	client.addResponse('app:response:name:welcome')
	    // }
	    console.log('asking question')
	    client.addResponse('app:response:name:askgift')

	    // If the next message is a 'decline', like 'don't know'
	    // or an 'affirmative', like 'yeah', or 'that's right'
	    // then the current stream will be returned to


	    // maybe need this?
	    //	    client.expect(client.getStreamName(), ['looking_for_gift', 'looking_for_myself'])



	    client.done()
	}
    })


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
	    client.addTextResponse('OK Signing off... Aloha til next time!')
	    client.done()
	}
    })

    const provideTrendingBook = client.createStep({
	satisfied() {
	    return false
	},

	prompt(callback) {
	    getTrending( (resultBody) => {
		if (!resultBody) {
		    console.log('Error getting trending book.')
		    callback()
		    return
		}

		setClientCache.removeSentBooks(client, resultBody);

		if(resultBody.books && !(resultBody.books.length>0) ) {	
		    client.addTextResponse('I seem to be out of books on that topic. Can you try something else?')
		}
		else {
		    const bookData = {
			BookTitle: resultBody.books[0].title,
			AuthorName: resultBody.books[0].authorstring,
			BookLink: 'https://www.thehawaiiproject.com/' + urlTools.book_url_short(resultBody.books[0].title,resultBody.books[0].authorstring,resultBody.books[0].bookid),
		    }
		    
		    console.log('sending book data:', bookData)
		    setClientCache.recordBookSent(client, resultBody.books[0])
		    client.addResponse('app:response:name:provide_popular_book', bookData)
		    carousel.addCarousel(client, resultBody.books, 3, '')
		}
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
	    if(!bookTitle) bookTitle = client.getMessagePart().content
	    else bookTitle = bookTitle.value
	    console.log('Title: ' + bookTitle)
	    var bookAuthor = firstOfEntityRole(client.getMessagePart(), 'authorname')
	    if(!bookAuthor) bookAuthor = ""
	    else bookAuthor = bookAuthor.value
	    console.log('Author: ' + bookAuthor)
	    
	    getSimilar(bookTitle, bookAuthor, resultBody => {
		if (!resultBody) {
		    console.log('Error getting a similar book.')
		    client.addResponse('app:response:name:apology/untrained')
		    client.done()
		    callback()
		    return
		}


		client.addTextResponse('(I think you typed a title of <' + bookTitle + '> and an author of <' + bookAuthor + '> so I assume you meant ' + resultBody.title + ' by ' + resultBody.authorstring + '.)')
		carousel.addCarousel(client, resultBody.relatedbooks, 3, 'Some books related to ' + resultBody.title + ' you may enjoy:' )
		client.done()
		callback()
	    })
	},
    })

   const provideAuthorBook = client.createStep({
	satisfied() {
	    return false
	},

	prompt(callback) {
	    console.log('extracting slots')
	    var author = firstOfEntityRole(client.getMessagePart(), 'authorname')
	    author = author ? author.value : ""
	    console.log('Author: ' + author)
	    
	    getBooksAuthor(author, client, resultBody => {
		if (!resultBody) {
		    console.log('Error getting a similar book.')
		    client.addResponse('app:response:name:apology/untrained')
		    client.done()
		    callback()
		    return
		}

		console.log(resultBody.books[0])

		const bookData = {
		    BookTitle: resultBody.books[0].title,
		    AuthorName: resultBody.books[0].authorstring,
		    BookLink: 'https://www.thehawaiiproject.com/' + urlTools.book_url_short(resultBody.books[0].title,resultBody.books[0].authorstring,resultBody.books[0].bookid),
		}
		
		console.log('sending book data:', bookData)
		setClientCache.recordBookSent(client, resultBody.books[0])
		client.addResponse('app:response:name:provide_author_book', bookData)
		carousel.addCarousel(client, resultBody.books, 3, 'Other books by ' + bookData.AuthorName + ':')
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
	    console.log('recommending books on interests')

	    var interests = client.getConversationState().interests;
	    console.log('interests: ')
	    console.log(interests)

	    if(interests) {
		var interests2 = interests.slice();
		for(var i=0; i<interests2.length; i++) {
		    interests2[i] = '<' + interests2[i] + '>'
		}
		var interestsstring = interests2.join(",")
		var response = '(Looking for books about ' + interestsstring + "."
		client.addTextResponse(response)

		getBooksInterests(interests, client, resultBody => {
		    if (!resultBody) {
			console.log('Error getting books on interests.')
			client.addResponse('app:response:name:apology/untrained')
			client.done()
			callback()
			return
		    }
		    
		    setClientCache.removeSentBooks(client, resultBody)
		    carousel.addCarousel(client, resultBody.books, 3, '')
		    client.expect('provideBookonInterests', ['decline_recommendation'])
		    // a nope should generate more recommendations
		    //client.expect('provideSimilarBook', ['liked_book'])

		    client.done()
		})
	    }
	},
    })

    const askBook = client.createStep({
	satisfied() {
	    return false
	},
	
	prompt() {
	    client.addResponse('app:response:name:ask_liked_book')
	    // client.expect('liked_book', ['decline', 'similar1'])  // these are streams, not message classifications.
	    client.done()
	}
    })
    
    const collectInterests = client.createStep({
	satisfied() {

	    var new_interests = (typeof Boolean(client.getConversationState().new_interests_found))
	    var interests = client.getConversationState().interests
	    var any_interests = (typeof interests !== 'undefined') && Boolean(interests.length)

	    console.log('----------------------------------------checking if collectInterests is done')
	    console.log( any_interests && !new_interests)
	    return (any_interests && new_interests)
	    // return false;
	},
	
	next() {
	    return 'provideBookonInterests'
	},

	extractInfo() {
	    console.log('extracting interests from:')
	    console.log(client.getMessagePart().content)
	    
	    // are there pre-existing interests? If so record that so we don't satisfy this step
	    client.updateConversationState({  new_interests_found: false })
	    // if( (typeof client.getConversationState().interests !== 'undefined') && 
	    // 	client.getConversationState().interests && (client.getConversationState().interests.count > 0))	{
	    // 	client.updateConversationState({  new_interests_found: true })
	    // }
		    
	    var interest1 = firstOfEntityRole(client.getMessagePart(), 'interest1')
	    var interest2 = firstOfEntityRole(client.getMessagePart(), 'interest2')
	    var interest3 = firstOfEntityRole(client.getMessagePart(), 'interest3')
	    console.log(interest1); console.log(interest2);console.log(interest3);
	    console.log(client.getMessagePart());

	    let baseClassification = client.getMessagePart().classification.base_type.value

	    // this step is re-entrant. if they ask for more recommendations, don't flush the interest set unless we find new ones.
	    if(client.getConversationState().interests && (interest1||interest2||interest3)) {
		console.log('resetting interests')
		setClientCache.clearInterests(client)
	    }
	    else { // there's no interests. but it thinks is an interests answer. if it's short, take it as the interest.
	    	if((baseClassification === 'provide_interest_list') &&
		   client.getMessagePart().content &&
		   ( (client.getMessagePart().content.match(/ /g)||[]).length <= 3 ) ) {
		    console.log('resetting interests')
		    setClientCache.clearInterests(client)
	    	    console.log('had to extrapolate interest1 as: ' + client.getMessagePart().content)
		    client.addTextResponse('Interpolating interests')
	    	    setClientCache.recordInterest(client, client.getMessagePart().content)
	    	}
	    }

	    if(interest1) { 
		interest1 = interest1.value
		console.log('interest1: ' + interest1)
		setClientCache.recordInterest(client, interest1)
	    }

	    if(interest2) {
		interest2 = interest2.value
		console.log('interest2: ' + interest2)
		setClientCache.recordInterest(client, interest2)
	    }

	    if(interest3) {
		interest3 = interest3.value
		console.log('interest3: ' + interest3)
		setClientCache.recordInterest(client, interest3)
	    }
	},
	
	prompt() {
	    client.addResponse('app:response:name:request_interest_list')
	    client.done()
	},
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
	    //greeting: 'greetingStream',
	    goodbye: 'goodbyeStream',

	    request_start_over: 'startOverStream',
	    out_of_domain: 'startOverStream',
	    // goodbye: 'startOverStream',

	    ask_trending_book: 'trendingStream',
	    liked_book: 'similarStream',
	    likes_author: 'provideAuthorBookStream',
	    request_for_help: 'helpStream',
	    turing: 'turingStream',
	    // disagree: 'rejectRecoStream',
	},
	autoResponses: {
	    // configure responses to be automatically sent as predicted by the machine learning model
	    //provide_popular_book: 'getTrending',
	},
	streams: {
	    main: 'sendGreetingStream', 
	    sendGreetingStream: [sendGreeting],
	    giftOrPersonalStream: [giftOrPersonal],
	    gift: [collectInterests],
	    personal: [askBook],
	    provideBookonInterests: [provideBookonInterests],
	    provideAuthorBookStream: [provideAuthorBook],

	    // greetingStream: [askIfGift, collectInterests],
	    turingStream: handleTuring,
	    similarStream: provideSimilarBook,
	    trendingStream: provideTrendingBook,
	    rejectRecoStream: rejectReco,
	    helpStream: [provideHelp],
	    // decline: handleGoodbye,
	    //main: [askBook],
	    //onboarding: [sayHello],
	    
	    // end: [untrained],
	    goodbyeStream: handleGoodbye,

	    startOverStream: startOver,
	    end: [provideHelp],
	}
    })
}
