var rateboxTimeout;
var currentExchange;
var ratebox_ms = 3000; // 3 second update interval

$(document).ready(function() {
    // Bitstamp websocket API
    var pusher = new Pusher('de504dc5763aeef9ff52');
    var channel = pusher.subscribe('live_trades');
    channel.bind('trade', function(ticker) {
        if (currentExchange === "bitstamp")
            $("#rate").html(parseFloat(ticker.price).toFixed(2));
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
                $("#rate").html(parseFloat(args[1]).toFixed(4));
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
        $.getJSON("https://poloniex.com/public?command=returnTicker", function(data) {
            $("#rate").html(parseFloat(data.BTC_DASH.last).toFixed(4));
        });
    } else if (exchangeName === "bitstamp") {
        $("#bitstampRate").css("color", "white");
        $("#poloniexRate").css("color", "gray");
        $("#units").html("USD / BTC");
        $.getJSON("https://blockchain.info/ticker?cors=true", function(data) {
            $("#rate").html(parseFloat(data.USD.last).toFixed(2));
        });
    }
};
