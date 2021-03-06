var fs = require( 'fs' );

function Trigger( triggers ) {
	this._triggers = triggers || [];
}

function buildRegExp( str ) {
	if ( str.indexOf( '/' ) === 0 &&
		str.lastIndexOf( '/' ) === str.length - 1
	) {
		try {
			return new RegExp( str.substr( 1, str.length - 2 ) );
		}
		catch ( e ) {
		}
	}

	return new RegExp( '\\b' + escapeRegExp( str ) + '\\b' );
}

function escapeRegExp( str ) {
	return str.replace( /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&' );
}

Trigger.prototype = {

	/**
	 *
	 * @param {string} message
	 * @param {function} cb
	 *
	 * @return {string[]}
	 */
	trigger: function( message, cb ) {
		this._triggers.forEach( function( trigger ) {
			var regex = buildRegExp( trigger[0] );

			if ( regex.exec( message ) ) {
				cb( trigger[1] );
			}
		} );
	},

	/**
	 *
	 * @param {string} key
	 * @param {string} result
	 */
	addTrigger: function( key, result ) {
		if ( key && result ) {
			this._triggers.push( [ key, result ] );
		}
	},

	/**
	 *
	 * @param {string} key
	 */
	removeTriggers: function( key ) {
		this._triggers = this._triggers.filter( function( trigger ) {
			return trigger[0] !== key;
		} );
	},

	/**
	 *
	 * @returns {array[]}
	 */
	getTriggers: function() {
		return this._triggers;
	}

};

/**
 *
 * @param {function} cb
 */
function loadTriggers( cb ) {
	fs.readFile( 'config/triggers.json', function( err, data ) {
		if ( err ) {
			cb && cb( new Trigger() );
		} else {
			cb && cb( new Trigger( JSON.parse( data ) ) );
		}
	} );
}

/**
 *
 * @param {Trigger} trigger
 */
function saveTriggers( trigger ) {
	fs.writeFile( 'config/triggers.json', JSON.stringify( trigger.getTriggers() ) );
}

module.exports.Trigger = Trigger;
module.exports.loadTriggers = loadTriggers;
module.exports.saveTriggers = saveTriggers;
