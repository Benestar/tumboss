var exams = [
	[ '2016-08-06', 'GAD' ]
];

/**
 * @returns {Array}
 */
function getExams() {
	return exams;
}

/**
 * @returns {boolean|String}
 */
function getExamString() {
	if ( !exams.length ) {
		return false;
	}

	var doneExams = [],
		upcomingExams = [],
		date = new Date(),
		day = 24 * 60 * 60 * 1000;

	exams.forEach( function( exam ) {
		var data = {
			name: exam[1],
			days: Math.floor( ( new Date( exam[0] ) - date ) / day )
		};

		if ( data.days < 0 ) {
			doneExams.push( data );
		} else {
			upcomingExams.push( data );
		}
	} );

	var upcomingExamsString = doneExams.map( function( value ) {
		return value.name;
	} ).join( ' und ' );

	var doneExamsString = upcomingExams.map( function( value ) {
		return value.days + ' Tage bis ' + value.name;
	} ).join( ' und ' );

	return 'Hurry hurry!!! Zwar ist ' + upcomingExamsString + ' schon geschafft, ' +
		'aber es sind nur noch ' + doneExamsString + '.';
}

module.exports.getExams = getExams;
module.exports.getExamString = getExamString;
