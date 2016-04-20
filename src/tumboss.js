var botkit = require( 'botkit' ),
	request = require( 'request' ),
	jQuery = require( 'jquery' ),
	jsdom = require( 'jsdom' );

var token = process.env.token;

if ( !token ) {
	console.log( 'You have to specify the token in the .env file' );
	process.exit( 1 );
}

var controller = botkit.slackbot( {
	debug: false
} );

var klausuren = [
	[ '2016-08-06', 'GAD' ]
];

var lastMessagesPerChannel = {};

var polls = {};

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

controller.hears( 'tumboss', 'direct_message,direct_mention,mention,ambient', function( bot, message ) {
	bot.reply( message, 'Hi, I\'m Der Zerstörer' );
} );

controller.hears( [ '\\bessen\\b', 'mensa', 'mittagessen', 'hunger', 'kohldampf' ], 'direct_message,direct_mention,mention,ambient', function( bot, message ) {
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

controller.hears( [ 'lernen', 'klausur' ], 'direct_message,direct_mention,mention,ambient', function( bot, message ) {
	if ( !klausuren.length ) {
		return;
	}

	var geschaffteKlausuren = [],
		kommendeKlausuren = []
		date = new Date(),
		day = 24 * 60 * 60 * 1000;
	
	klausuren.forEach( function( klausur ) {
		var data = {
			name: klausur[1],
			days: Math.floor( ( new Date( klausur[0] ) - date ) / day )
		};

		if ( data.days < 0 ) {
			geschaffteKlausuren.push( data );
		} else {
			kommendeKlausuren.push( data );
		}
	} );
	
	var geschaffteKlausurenString = geschaffteKlausuren.map( function( value ) {
		return value.name;
	} ).join( ' und ' );
	
	var kommendeKlausurenString = kommendeKlausuren.map( function( value ) {
		return value.days + ' Tage bis ' + value.name;
	} ).join( ' und ' );

	bot.reply(
		message,
		'Hurry hurry!!! Zwar ist ' + geschaffteKlausurenString + ' schon geschafft, ' +
		'aber es sind nur noch ' + kommendeKlausurenString + '.'
	);
} );

controller.hears( '^\!poll ', 'direct_message,direct_mention,mention,ambient', function( bot, message ) {
	if ( polls.hasOwnProperty( message.channel ) ) {
		bot.reply( message, 'Sorry, there can only be one poll at a time. To close the current poll type !endpoll' );
		return;
	}

	polls[message.channel] = {
		options: message.text.substr( 6 ).split( /\s+/ ),
		votes: {}
	};

	bot.reply( message, 'A new poll has been started. You can vote with !vote [option]. Available options are: ' + polls[message.channel].options );
} );

controller.hears( '^\!vote ', 'direct_message,direct_mention,mention,ambient', function( bot, message ) {
	var option = message.text.substr( 6 ).trim();

	if ( !polls.hasOwnProperty( message.channel ) ) {
		bot.reply( message, 'There is no active poll available. You can start one with !poll [options...]' );
		return;
	}

	if ( polls[message.channel].options.indexOf( option ) < 0 ) {
		bot.reply( message, 'The provided option is invalid. Available options are: ' + polls[message.channel].options );
		return;
	}

	if ( polls[message.channel].votes.hasOwnProperty( message.user ) ) {
		bot.reply( message, 'You already participated in this survey.' );
		return;
	}

	polls[message.channel].votes[message.user] = option;
} );

controller.hears( '^\!endpoll', 'direct_message,direct_mention,mention,ambient', function( bot, message ) {
	if ( !polls.hasOwnProperty( message.channel ) ) {
		bot.reply( message, 'There is no active poll available. You can start one with !poll [options...]' );
		return;
	}

	var votes = polls[message.channel].votes,
		options = polls[message.channel].options,
		participants = Object.keys( votes ).length,
		counter = options.reduce( function( obj, key ) {
			obj[key] = 0;
			return obj;
		}, {} );

	for ( var user in votes ) {
		counter[votes[user]]++;
	}

	bot.api.users.list( {}, function( error, result ) {
		var resultString = '',
			votesString = '',
			userNames = {};

		result.members.forEach( function( member ) {
			userNames[member.id] = member.real_name;
		} );

		options.sort( function( x, y ) {
			return counter[y] - counter[x];
		} ).forEach( function( option ) {
			var count = counter[option],
				percent = Math.round( count / participants * 1000 ) / 10;

			resultString += '\n* ' + option + ': ' + count + ' (' + percent + '%)';
		} );

		Object.keys( votes ).forEach( function( user ) {
			votesString += '\n* ' + userNames[user] + ': ' + votes[user];
		} );

		bot.reply( message, 'The poll has been ended with ' + participants + ' participants.' );
		bot.reply( message, 'Results:' + resultString );
		bot.reply( message, 'Votes: ' + votesString );

		delete polls[message.channel];
	} );
} );
