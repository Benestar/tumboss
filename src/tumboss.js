var botkit = require( 'botkit' ),
	dishplan = require( './dishplan.js' ),
	exams = require( './exams.js' ),
	poll = require( './poll.js' ),
	triggers = require( './triggers.js' );

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

var trigger;

triggers.loadTriggers( function( t ) {
	trigger = t;
} );

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
	bot.startTyping( message );
	bot.api.reactions.add( {
		name: 'essen',
		channel: message.channel,
		timestamp: message.ts
	} );

	dishplan.fetchDishPlan( function( result ) {
		bot.reply( message, result );
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

controller.hears( '^\!addtrigger ', events, function( bot, message ) {
	var parts = message.text.substr( 12 ).trim().split( /\s+/ ),
		key = parts.shift(),
		result = parts.join( ' ' );

	trigger.addTrigger( key, result );
	triggers.saveTriggers( trigger );
} );

controller.hears( '^\!removetriggers ', events, function( bot, message ) {
	trigger.removeTriggers( message.text.substr( 16 ).trim() );
	triggers.saveTriggers( trigger );
} );

controller.on( events, function( bot, message ) {
	trigger.trigger( message.text, function( result ) {
		bot.reply( message, result );
	} );
} );
