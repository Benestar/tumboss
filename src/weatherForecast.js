var request = require( 'request' );

var requestUrl = 'http://api.openweathermap.org/data/2.5/forecast';

var cache = {};

var GARCHING_ID = '2922582';

function fetch( weatherApiKey , cb ) {

  if( cache && cache.timestamp &&  Date.now() - cache.timestamp < 1000 * 60 * 30 ) {
    console.log( 'Fetching weather for tomorrow from cache' );
    return cb & cb( cache.weatherText );
  }

  console.log( 'Requesting weather data for tomorrow' );
  request( requestUrl + '?id=' + encodeURIComponent( GARCHING_ID )
    + '&appid=' + encodeURIComponent( weatherApiKey )
    + '&lang=de&units=metric',

    function(error, response, body ) {
      if( error ) {
        console.log( error );
        return;
      }

      var data = JSON.parse( body );
      var weatherData = buildWeatherForecast(data);

      cache = {
        weatherText : weatherData,
        timestamp : Date.now()
      };

      return cb & cb( weatherData );
    });
}

function buildWeatherForecast( data ) {
  return 'Wetter in ' + data.city.name + ' am ' + data.list[8].dt_txt
  + ': ' + data.list[8].weather[0].description + ' bei ' + data.list[8].main.temp
  + '°C, einer Windgeschwindigkeit von ' + data.list[8].wind.speed + ' m/s'
  + ' und ' + data.list[8].clouds.all + '% Bewölkung.';
}

module.exports.fetch = fetch;
