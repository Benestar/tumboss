var polls = {};

/**
 * Start a new poll for a channel with a set of available options.
 *
 * @param {String} channel
 * @param {String[]} options
 * @param {function} cb
 */
function startPoll( channel, options, cb ) {
	if ( polls.hasOwnProperty( channel ) ) {
		return cb && cb( 'Sorry, there can only be one poll at a time. To close the current poll type !endpoll' );
	}

	polls[channel] = {
		options: options,
		votes: {}
	};

	cb && cb( null, 'A new poll has been started. You can vote with !vote [option]. Available options are: ' + options );
}

/**
 *
 * @param {String} channel
 * @param {String} user
 * @param {String} option
 * @param {function} cb
 */
function vote( channel, user, option, cb ) {
	if ( !polls.hasOwnProperty( channel ) ) {
		return cb && cb( 'There is no active poll available. You can start one with !poll [options...]' );
	}

	if ( polls[channel].options.indexOf( option ) < 0 ) {
		return cb && cb( 'The provided option is invalid. Available options are: ' + polls[channel].options );
	}

	if ( polls[channel].votes.hasOwnProperty( user ) ) {
		return cb && cb( 'You already participated in this survey.' );
	}

	polls[channel].votes[user] = option;
}

/**
 *
 * @param {String} channel
 * @param {Object} userList
 * @param {function} cb
 */
function endPoll( channel, userList, cb ) {
	if ( !polls.hasOwnProperty( channel ) ) {
		return cb && cb( 'There is no active poll available. You can start one with !poll [options...]' );
	}

	var votes = polls[channel].votes,
		options = polls[channel].options,
		participants = Object.keys( votes ).length,
		counter = options.reduce( function( obj, key ) {
			obj[key] = 0;
			return obj;
		}, {} ),
		userNames = {},
		resultString = '',
		votesString = '';

	for ( var user in votes ) {
		counter[votes[user]]++;
	}

	userList.forEach( function( member ) {
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

	cb && cb( null, 'The poll has been ended with ' + participants + ' participants.' );
	cb && cb( null, 'Results:' + resultString );
	cb && cb( null, 'Votes: ' + votesString );

	delete polls[channel];
}

module.exports.startPoll = startPoll;
module.exports.vote = vote;
module.exports.endPoll = endPoll;
