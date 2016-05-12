var request = require( 'request' );

var requestUrl = 'http://api.openweathermap.org/data/2.5/weather';

var cache = {};

function buildWeatherReport( data ) {
	return 'Wetter in ' + data.name + ': '
		+ data.weather[0].description + ' :weather-' + data.weather[0].icon + ': '
		+ 'bei ' + data.main.temp + '°C, einer Windgeschwindigkeit von '
		+ data.wind.speed + ' m/s und ' + data.clouds.all + '% Bewölkung.';
}

function fetchCurrentWeather( location, apiKey, cb ) {
	if ( cache && cache.timestamp && cache.timestamp - Date.now() < 1000 * 60 * 10 ) {
		console.log( 'Loading weather information from cache' );
		return cb && cb( cache.weatherReport, cache.icon );
	}

	console.log( 'Fetching weather information from openweathermap.org' );

	request(
		requestUrl + '?lang=de&units=metric&q=' + encodeURIComponent( location ) +
		'&appid=' + encodeURIComponent( apiKey ),
		function( error, response, body ) {
			if ( error ) {
				console.error( error );
				return;
			}

			var data = JSON.parse( body ),
				icon = data.weather[0].icon,
				weatherReport = buildWeatherReport( data );

			cache = {
				timestamp: Date.now(),
				weatherReport: weatherReport,
				icon: icon
			};

			cb && cb( weatherReport, icon );
		}
	);
}

module.exports.fetchCurrentWeather = fetchCurrentWeather;
