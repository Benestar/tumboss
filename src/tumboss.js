var botkit = require( 'botkit' ),
	request = require( 'request' ),
	jQuery = require( 'jquery' ),
	jsdom = require( 'jsdom' ),
	exams = require( './exams.js' ),
	poll = require( './poll.js' );

var token = process.env.token;

if ( !token ) {
	console.log( 'You have to specify the token in the .env file' );
	process.exit( 1 );
}

var controller = botkit.slackbot( {
	debug: false
} );

var events = [ 'direct_message', 'direct_mention', 'mention', 'ambient' ];

var lastMessagesPerChannel = {};

var bot = controller.spawn( {
	token: token
} ).startRTM();

setInterval( function() {
	bot.closeRTM();
}, 1000 * 60 * 60 );

controller.on( 'rtm_open', function( bot ) {
	console.log( 'Hooray! We got connected \\o/' );
} );

controller.on( 'rtm_close', function( bot ) {
	console.log( 'Oh noes, we got disconnected /o\\ Try to reconnect...' );
	bot.startRTM();
} );

controller.hears( 'tumboss', events, function( bot, message ) {
	bot.reply( message, 'Hi, I\'m Der Zerstörer' );
} );

controller.hears( [ '\\bessen\\b', 'mensa', 'mittagessen', 'hunger', 'kohldampf' ], events, function( bot, message ) {
	console.log( 'Starting request for Mensa plan' );
	request( 'http://www.studentenwerk-muenchen.de/mensa/speiseplan/speiseplan_422_-de.html', function( error, response, body ) {
		var $ = jQuery( jsdom.jsdom( body ).defaultView ),
			date = new Date(),
			dishes = [];

		// move into future to get new Mensaplan on evening of that day
		date.setHours( date.getHours() + 7 );

		var $table = $( 'a.heute_' + date.toISOString().substring( 0, 10 ) ).parents( 'table' );
		$table.find( 'tr' ).each( function() {
			dishes.push( $( this ).find( '.beschreibung span' ).eq( 0 ).text() );
		} );
		
		var dateString = date.getDate() + '. ' + ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'][date.getMonth()] + ' ' + date.getFullYear(),
			dishesString = dishes.join( '\n' ).replace( 'Polenta', 'Raphaela Polenta :tf:' ).replace( 'polenta', '-Raphaela Polenta :tf:' );
		bot.reply( message, 'Mensaplan vom ' + dateString + ':\n' + dishesString );
	} );
	bot.reply( message, { type: 'typing' } );
	bot.api.reactions.add( {
		name: 'essen',
		channel: message.channel,
		timestamp: message.ts
	} );
} );

controller.hears( [ 'lernen', 'klausur' ], events, function( bot, message ) {
	var examString = exams.getExamString();

	if ( examString !== false ) {
		bot.reply( message, examString );
	}
} );

controller.hears( '^\!poll ', events, function( bot, message ) {
	poll.startPoll(
		message.channel,
		message.text.substr( 6 ).split( /\s+/ ),
		function( error, result ) {
			bot.reply( message, error || result );
		}
	);
} );

controller.hears( '^\!vote ', events, function( bot, message ) {
	poll.vote(
		message.channel,
		message.user,
		message.text.substr( 6 ).trim(),
		function( error, result ) {
			bot.reply( message, error || result );
		}
	);
} );

controller.hears( '^\!endpoll', events, function( bot, message ) {
	bot.api.users.list( {}, function( error, result ) {
		poll.endPoll( message.channel, result.members, function( error, result ) {
			bot.reply( message, error || result );
		} );
	} );
} );
