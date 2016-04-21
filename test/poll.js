var expect = require( 'chai' ).expect,
	poll = require( '../src/poll.js' );

describe( 'Poll', function() {
	describe( '#startPoll', function() {
		it( 'should start a new poll with the given options', function() {
			poll.startPoll( 'poll', [ 'foo', 'bar', 'baz' ], function( error, result ) {
				expect( error ).to.be.null;
				expect( result ).to.have.string( 'foo,bar,baz' );
			} );
		} );

		it( 'should fail to start a new poll when a poll is still open in the same channel', function() {
			poll.startPoll( 'poll', [ 'fu', 'bah' ], function( error, result ) {
				expect( error ).to.have.string( '!endpoll' );
				expect( result ).to.be.undefined;
			} );
		} );

		it( 'should be able to start a new poll in another channel', function() {
			poll.startPoll( 'another_poll', [ 'abc', 'def' ], function( error, result ) {
				expect( error ).to.be.null;
				expect( result ).to.have.string( 'abc,def' );
			} );
		} );
	} );

	describe( '#vote', function() {
		it( 'should be possible to vote a valid option', function() {
			poll.vote( 'poll', 'user', 'foo', function( error, result ) {
				expect( error ).to.be.null;
			} );
		} );

		it( 'should be disallowed to vote again', function() {
			poll.vote( 'poll', 'user', 'bar', function( error, result ) {
				expect( error ).to.have.string( 'already participated' );
				expect( result ).to.be.undefined;
			} );
		} );

		it( 'should be allowed for other users to still participate', function() {
			poll.vote( 'poll', 'another_user', 'bar', function( error, result ) {
				expect( error ).to.be.null;
			} );
		} );

		it( 'should be allowed for a third user to participate', function() {
			poll.vote( 'poll', 'third_user', 'foo', function( error, result ) {
				expect( error ).to.be.null;
			} );
		} );

		it( 'should not recognize invalid options', function() {
			poll.vote( 'another_poll', 'user', 'foo', function( error, result ) {
				expect( error ).to.have.string( 'abc,def' );
				expect( result ).to.be.undefined;
			} )
		} );

		it( 'should not be possible to participated in a non-existing survey', function() {
			poll.vote( 'non_existing_poll', 'user', 'foo', function( error, result ) {
				expect( error ).to.have.string( '!poll' );
				expect( result ).to.be.undefined;
			} )
		} );
	} );

	describe( '#endPoll', function() {
		var userList = [
			{ id: 'user', real_name: 'real_user' },
			{ id: 'another_user', real_name: 'real_another_user' },
			{ id: 'third_user', real_name: 'real_third_user' }
		];

		it( 'should be possible to end a running survey', function() {
			var i = 0;

			poll.endPoll( 'poll', userList, function( error, result ) {
				expect( error ).to.be.null;

				switch ( i++ ) {
					case 0:
						expect( result ).to.have.string( "3 participants" );
						break;
					case 1:
						expect( result ).to.have.string( 'Results:' );
						expect( result ).to.have.string( 'foo: 2 (66.7%)' );
						expect( result ).to.have.string( 'bar: 1 (33.3%)' );
						expect( result ).to.have.string( 'baz: 0 (0%)' );
						expect( result ).to.match( /foo[\s\S]*bar[\s\S]*baz/ );
						break;
					case 2:
						expect( result ).to.have.string( 'Votes:' );
						expect( result ).to.have.string( 'real_user: foo' );
						expect( result ).to.have.string( 'real_another_user: bar' );
						expect( result ).to.have.string( 'real_third_user: foo' );
						break;
					default:
						expect.fail( null, null, 'Unexpected call' );
				}
			} );
		} );

		it( 'should not be possible to close a non-existing survey', function() {
			poll.endPoll( 'non-existing survey', userList, function( error, result ) {
				expect( error ).to.have.string( '!poll' );
				expect( result ).to.be.undefined;
			} );
		} )
	} );
} );
