var satoshi = 100000000;
var DELAY_CAP = 20000;
var lastBlockHeight = 0;

var provider_name = "dash.org";

var transactionSocketDelay = 1000;

/** @constructor */
function TransactionSocket() {

}

TransactionSocket.init = function() {
	// Terminate previous connection, if any
	if (TransactionSocket.connection)
		TransactionSocket.connection.close();

	var connection = io.connect('https://insight.dash.org');
	TransactionSocket.connection = connection;

	StatusBox.reconnecting("blockchain");

	connection.on('connect', function () {
		console.log('insight.dash.org: Connection open!');
		StatusBox.connected("blockchain");
		connection.emit('subscribe', 'inv');
	});

	connection.on('disconnect', function() {
		console.log('insight.dash.org: Connection closed');
		if ($("#blockchainCheckBox").prop("checked"))
			StatusBox.reconnecting("blockchain");
		else
			StatusBox.closed("blockchain");
	});

	connection.on('error', function(error) {
		console.log('insight.dash.org: Connection Error: ' + error);
	});


	function newTx(bitcoins, isDonation, currency, currencyName, isIX) {
		new Transaction(bitcoins, isDonation, currency, currencyName, isIX);
	}

	function spawnTransaction(data, isIX){
		// console.log('insight.dash.org: tx data: ' + JSON.stringify(data) + ' vout length: ' + data.vout.length);

		// Dash volume is quite low - show bubble for every output
		// var transacted = 0;
		var vout = data.vout;
		for (var i = 0; i < vout.length; i++) {
			// transacted += vout[i][Object.keys(vout[i])];
			// console.log('insight.dash.org: tx data: ' + Object.keys(vout[i]) + ' ' + vout[i][Object.keys(vout[i])]);
			var bitcoins = vout[i][Object.keys(vout[i])] / satoshi;
			setTimeout(newTx(bitcoins,
							Object.keys(vout[i]) == DONATION_ADDRESS,
							'', '', isIX),
				isIX ? 0 : Math.random() * DELAY_CAP);
			// console.log('insight.dash.org: tx data: ' + transacted);
		}



	}

	connection.on("tx", function(data){
		spawnTransaction(data, false);
	});

	connection.on("ix", function(data){
		spawnTransaction(data, true);
	});

	connection.on("block", function(blockHash){
		// console.log('insight.dash.org: blockHash: ' + blockHash);
		$.getJSON('https://insight.dash.org/api/block/' + blockHash, function(blockData) {
			// console.log('insight.dash.org: blockData: ' + JSON.stringify(blockData));
			var blockHeight = blockData.height;
			var transactions = blockData.tx.length;
			// no such info in insight-api :(
			// var volumeSent = blockData.total_out;
			// let's show difficulty instead
			var difficulty = blockData.difficulty;
			var blockSize = blockData.size;
			// Filter out the orphaned blocks.
			if (blockHeight > lastBlockHeight) {
				lastBlockHeight = blockHeight;
				console.log("New Block");
				new Block(blockHeight, transactions, /*volumeSent*/difficulty, blockSize);
			}
		});
	});
};

TransactionSocket.close = function() {
	if (TransactionSocket.connection)
		TransactionSocket.connection.close();
	StatusBox.closed("blockchain");
};
