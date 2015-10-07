var socket = io();
var game;

$('form').submit(function () {
	socket.emit('chat message', $('#m').val());
	$('#m').val('');
	return false;
});

socket.on('chat message', function (msg) {
	$('#messages').append($('<li>').text(msg));
});

socket.on('connect', function () {
	console.log('connected');
});

$('#blue').click(function () {
	console.log("hello");
	socket.emit('chooseColor', 'blue');
	$('#pickAcolor-background').remove();
});

$('#red').click(function () {
	socket.emit('chooseColor', 'red');
	$('#pickAcolor-background').remove();
});

$('#status').click(function () {
	$('#status').text("wait");
	$('#status').removeClass("ready").addClass("wait");
	socket.emit('clientReady', true);
});

function newRound(round) {
	//update the sticker for the number of rounds
	var table = [0.04, 0.14, 0.25, 0.33, 0.41, 0.50, 0.59, 0.70, 0.80];
	if (round < 10) {
		$('#round').css('top', table[round - 1] * parseInt($('#container').css('height')));
		$('#round-child').text(round);
	}
	
	var roundMod3 = Math.ceil(round / 3);
	
	// display the right box in the score		
	$('.1count').each(function (index, value) {
		if (roundMod3 == 1) {
			$(value).addClass("not").removeClass("yes");
		} else {
			$(value).addClass("yes").removeClass("not");
		}
	});
	$('.2count').each(function (index, value) {
		if (roundMod3 == 2) {
			$(value).addClass("not").removeClass("yes");
		} else {
			$(value).addClass("yes").removeClass("not");
		}
	});
	$('.3count').each(function (index, value) {
		if (roundMod3 == 3) {
			$(value).addClass("not").removeClass("yes");
		} else {
			$(value).addClass("yes").removeClass("not");
		}
	});
}

//bouton to validate the readyness of players
socket.on('round', function (msg) {
	$('#status').text("ready?");
	$('#status').removeClass("wait").addClass("ready");
	newRound(msg);
});

socket.on('yourHand', function (msg) {
	$('#cartes').empty();
	
	for (card in msg) {
		
		card = msg[card];
		
		var text;
		var block;
		
		if (card.isPeste) {
			text = "Pest Card";
			block = "P";
		}
		else if (card.bonus) {
			text = "Bonus Card; Total Points " + card.points + "; Penalty of " + card.penalty + " units";
			block = (card.points > 0) ? "+" + card.points : card.points;
		}
		else {
			text = "Normal Card; Total Points " + card.points;
			block = card.points;
		}
		
		var newLi = $('<div>');
		var blockDiv = $('<div>');
		var textDiv = $('<div>');
		
		blockDiv.addClass("card-square").text(block);
		textDiv.addClass("card-text").text(text);
		
		
		newLi.addClass("card");
		newLi.append(blockDiv).append(textDiv);
		
		$('#cartes').append(newLi);

		$(newLi).attr('id', card.id);
	}
	
	$('div[id^="card-"]').children().remove();

	$("#cartes,#card-0,#card-1,#card-2,#card-3,#card-4").sortable({ connectWith: "#cartes,#card-0,#card-1,#card-2,#card-3,#card-4" });

	$("#card-0,#card-1,#card-2,#card-3,#card-4").on("sortreceive", function (event, ui) {
		console.log($(this));
		console.log($(this).children("div").length);
		
		//ensure only one card per slot
		if ($(this).children("div").length > 1) {
			$(ui.sender).sortable('cancel');
		}	
	});
});

function validationButton() {
	var ready = false;

	//if 5 cards picked; we can validate the round
	if ($('div[id^="card-"]').children().length < 5) {
		$('#status').text("select 5 cards");
	} else {
		$('#status').text("Click when ready!");
	}

	if (ready) {
		$('#status').addClass("ready").removeClass("wait");
	} else {
		$('#status').addClass("wait").removeClass("ready");
	}

}


/* Update the game */		  		  
socket.on('region', function (msg) {
	game = msg;

	var round = msg.round;
	var regions = msg.regions;
	
	regions[0].redArmy = 10;
	regions[0].color = "red";
	
	regions[1].redArmy = 2;
	regions[1].color = "blue";
	
	var i = 0;
	
	for (i = 0; i < 5; i++) {
		$('#region-' + i).removeClass("red none blue").addClass(regions[i].color);
		
		if (regions[i].color != "none") {
			$('#region-' + i).text(Math.max(regions[i].blueArmy, regions[i].redArmy));
		} else {
			$('#region-' + i).text("");
		}
		
		console.log(regions[i].sixPlayed["blue"]);
		console.log(regions[i].sixPlayed["red"]);
		
		if (regions[i].sixPlayed["blue"]) {
			$('#marker' + i + 'blue').show();
		} else {
			$('#marker' + i + 'blue').hide();
		}
		if (regions[i].sixPlayed["red"]) {
			$('#marker' + i + 'red').show();
		} else {
			$('#marker' + i + 'red').hide();
		}
	}
});

socket.on('pickAcolor', function (msg) {
	if (msg.length == 0) {
		$('#pickAcolor-background').remove();
	}
	
	if (jQuery.inArray("blue", msg) > -1) {
	} else {
		console.log("no");
		$('#blue').removeClass("blue-enabled").addClass("disabled");
		$('#blue').off();
	}
	
	if (jQuery.inArray("red", msg) > -1) {	
	} else {
		$('#red').removeClass("red-enabled").addClass("disabled");
		$('#red').off();
	}
});