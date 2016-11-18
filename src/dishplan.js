var request = require( 'request' ),
	jQuery = require( 'jquery' ),
	jsdom = require( 'jsdom' );

var dishPlan = {};

var requestUrl = 'http://www.studentenwerk-muenchen.de/mensa/speiseplan/speiseplan_422_-de.html';

var monthNames = [
	'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli',
	'August', 'September', 'Oktober', 'November', 'Dezember'
];

/**
 * @param {function} cb
 */
function fetchDishPlan( cb ) {
	var date = new Date();

	// move into future to get new Mensaplan on evening of that day if not cached
	date.setHours( date.getHours() + 7 );

	if ( dishPlan.dayKey !== date.getDay() ) {
		console.log( 'Starting request for Mensa plan' );
		requestDishPlan( date, cb );
	}
	else {
		console.log( 'Fetch Mensaplan from cache' );
		cb && cb( 'Mensaplan vom ' + dishPlan.dateString + ':\n' + dishPlan.dishesString );
	}
}

/**
 * @param {Date} date
 * @param {function} cb
 */
function requestDishPlan( date, cb ) {
	request( requestUrl, function( error, response, body ) {
		var $ = jQuery( jsdom.jsdom( body ).defaultView ),
			dishes = [];

		var $table = $( 'a.heute_' + date.toISOString().substring( 0, 10 ) ).parents( 'table' );
		$table.find( 'tr' ).each( function() {
			dishes.push( $( this ).find( '.beschreibung span' ).eq( 0 ).text() );
		} );

		var dateString = date.getDate() + '. ' + monthNames[date.getMonth()] + ' ' + date.getFullYear(),
			dishesString = dishes.join( '\n' );

		dishPlan = {
			dateString: dateString,
			dishesString: dishesString,
			dayKey: date.getDay()
		};

		cb && cb( 'Mensaplan vom ' + dateString + ':\n' + dishesString );
	} );
}

module.exports.fetchDishPlan = fetchDishPlan;
