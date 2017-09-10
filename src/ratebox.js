var rateboxTimeout;
var currentExchange;
var ratebox_ms = 3000; // 3 second update interval
var globalRate = -1; // set upon first rate received

function setGlobalRate(rate) {
    if (globalRate === -1) {
        var checkbox = $("#showDollarCheckBox");
        checkbox.prop("disabled", false);
        checkbox.parent().removeClass("disabled");
    }
    if (currentExchange === "bitstamp")
        $("#rate").html(parseFloat(rate).toFixed(2));
    if (currentExchange === "poloniex")
        $("#rate").html(parseFloat(rate).toFixed(4));
    globalRate = rate;
}

rateboxGetRate = function() {
	$.getJSON("https://blockchain.info/ticker?cors=true", function(data) {
        setGlobalRate(data.USD.last);
    });
};

$(document).ready(function() {
	// Bitstamp websocket API
	var pusher = new Pusher('de504dc5763aeef9ff52');
	var channel = pusher.subscribe('live_trades');
	channel.bind('trade', function(ticker) {
		if (currentExchange === "bitstamp") 
			setGlobalRate(ticker.price);
		if (rateboxTimeout) clearTimeout(rateboxTimeout);
	});

	// Poloniex Push API
	var wsuri = "wss://api.poloniex.com";
	var connection = new autobahn.Connection({
		url: wsuri,
		realm: "realm1"
	});

	connection.onopen = function (session) {
		function tickerEvent (args,kwargs) {
			if (args[0] === 'BTC_DASH' && currentExchange === "poloniex") {
				// console.log('ticker: ' + args);
				setGlobalRate(args[1]);
			}
		}
		session.subscribe('ticker', tickerEvent);
	};

	connection.onclose = function () {
		console.log("Websocket connection closed");
	};

	connection.open();

});

switchExchange = function(exchangeName) {
	clearTimeout(rateboxTimeout);
	currentExchange = exchangeName;
	$("#rate").html("---");
	
	if (exchangeName === "poloniex") {
		$("#poloniexRate").css("color", "white");
		$("#bitstampRate").css("color", "gray");
		$("#units").html("BTC / DASH");
	} else if (exchangeName === "bitstamp") {
		$("#bitstampRate").css("color", "white");
		$("#poloniexRate").css("color", "gray");
		$("#units").html("USD / BTC");
		rateboxGetRate();
	}
};
