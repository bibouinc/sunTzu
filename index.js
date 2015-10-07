function Shuffle(o) {
	for (var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x)	;
	return o;
};

var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var people = {};
var game = new Game();

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/index.html');
});
app.use(express.static(__dirname + '/public'));


io.on('connection', function (socket) {
	//information on color available
	var choice = [];
	if (!game.players["blue"].taken) choice.push("blue");
	if (!game.players["red"].taken) choice.push("red");
	
	socket.emit('pickAcolor', choice);
	socket.emit('round', game.round);
	socket.emit('region', game);
	
	//on disconnect remove the color choice
	socket.on('disconnect', function () {
		console.log(socket.color + "disconnected");
		if (socket.color) {
			game.players[socket.color].taken = false;
		}
	});
	
	// choose a color
	socket.on('chooseColor', function (msg) {
		socket.color = msg;
		game.players[msg].taken = true;
		socket.emit('yourHand', game.players[msg].hand);
	});
	
	socket.on('takeCard', function (msg) {
		//TODO update based on socket id
		game.players["blue"].takeCard(msg);
		socket.emit('yourHand', game.players[msg].hand);
	});
	
	//update the card selected
	socket.on('playCard', function (msg){
		game.region[msg.region].card[socket.color] = msg.card;
		io.emit('playedCard',[socket.color,msg.region]]);
	});
	
	socket.on('chat message', function (msg) {
		io.emit('chat message', msg);
	});
	
	//msg[0] > PlayerID
	//msg[1] > RegionID
	//msg[2] > Card Chosen
	socket.on('chosenCard', function (msg) {
		//TODO update based on socket id
		game.takeCard(msg[0], msg[1], msg[2]);
	//emit that one player has chosen one card on that region
	//io.emit('chosenCard', [game]);
	});
	
	socket.on('clientReady', function (msg) {
		console.log(socket.color + "ready");
		game.players[socket.color].ready = true;
		
		if (game.players["blue"].ready == true && game.players["red"].ready == true) {
			io.emit('region', game);
			io.emit('round', ++game.round);
			
			game.players["blue"].ready = false;
			game.players["red"].ready = false;
		}

		
	
		//console.log(game.Players["blue"].socketId);				
		//game.Players[socket.color].ready = true; 
		
		//if(game.Players["blue"].ready == true && game.Players["red"].ready == true){
		//	game.nextRound();	
		//}
		
	//check if both are ready 
	//settle round
	//update the results of the region
	
		
	
	});
});

http.listen(3000, function () {
	console.log('listening on *:3000');
	InitializeGame();
});

/* Game */
//Class Region
function Region(name, points, neighbors) {
	this.points = points
	this.name = name;
	this.neighbors = neighbors;
	
	this.color = "none";
	
	this.blueArmy = 0;
	this.redArmy = 0;
	
	this.sixPlayed = {};
	this.sixPlayed["blue"] = false;
	this.sixPlayed["red"] = false;
	
	this.card = {};
	
	this.toConsole = function () {
		console.log(this.name 
			+ ' Points:' + this.points[0] 
			+ ',' + this.points[1] 
			+ ',' + this.points[2] 
			+ ";B:" + this.sixPlayed["blue"] 
			+ ";R:" + this.sixPlayed["red"]);
	}
	
	this.settleBattle = function () {
		//ifPeste
		blueCard = game.Player["blue"].hand[this.blueCardID];
		redCard = game.Player["blue"].hand[this.redCardID];
		
		
		if (blueCard.isPeste || redCard.isPeste) {
			this.blueArmy = Math.floor(this.blueArmy / 2);
			this.redArmy = Math.floor(this.redArmy / 2);
			return;
		}
		
		sixPlayed["blue"] = (blueCard.points == 6) ? true: sixPlayed["blue"];
		sixPlayed["red"] = (redCard.points == 6) ? true: sixPlayed["red"];
		
		game.Player["blue"].extraCard = ((blueCard.points == 1) ? true: false);
		game.Player["blue"].extraCard = ((redCard.points == 1) ? true: false);
		
		if (blueCard.bonus & !redCard.bonus) {
			blueCard.points += redCard.points;
		}
		
		if (!blueCard.bonus & redCard.bonus) {
			redCard.points += blueCard.points;
		}
		
		this.blueArmy += blueCard.points;
		this.redArmy += redCard.points;
		
		this.blueArmy += blueCard.points - redCard.points;
		this.redArmy += redCard.points - blueCard.points;
		
		//if(stack=0)
		game.Player["blue"].updateStack(redCard.points - blueCard.points);
		game.Player["red"].updateStack(blueCard.points - redCard.points);
		game.Player["blue"].updateStack(-blueCard.penalty);
		game.Player["red"].updateStack(-redCard.penalty);
		
		if (this.blueArmy + this.redArmy == 0) {
			this.color = "none";
		} else {
			this.color = (this.blueArmy > this.redArmy ? "blue" : "red");
		}
	}
}

//Class Region
function Carte(points, always, peste, bonus, penalty, id) {
	this.points = points;
	this.always = always;
	this.isPeste = peste;
	this.bonus = bonus;
	this.penalty = penalty;
	this.descriptionText = this.description;
	this.id = id;
	
	this.description = function () {
		if (this.isPeste) {
			return "Pest Card";
		} else if (bonus) {
			return "Bonus Card - " + this.points + "; Penalty of " + this.penalty + " units";
		} else {
			return "Normal Card - " + this.points;
		}
	}
}

function Event() {
}

function Game() {
	this.round = 1;
	this.regions = [];
	
	this.findColor = function (id) {
		if (this.players["blue"].socketID == id) return "blue";
		if (this.players["red"].socketID == id) return "red";
		return "";
	}
	
	this.nextRound = function () {
		this.round++;
		this.players["blue"].ready = false;
		this.players["red"].ready = false;
	}
	
	this.players = [];
	this.players["blue"] = new Player("Chu", "blue");
	this.players["red"] = new Player("Sun Tzu", "red");
	
	this.endRound = function () {
		if (this.round == 3 || this.round == 6 || this.round == 9) {
			if (this.game.Regions[i].color == "blue") {
				this.game.players["blue"].points[this.round / 3 - 1] += "blue"
			} else if (this.game.Regions[i].color == "red") {
				this.game.players["blue"].points[this.round / 3 - 1] += "red"
			}
		}
		if (Math.Abs(game.players["blue"].points - game.players["red"].points) > 10) {
			victory(game.players["blue"] - points - game.players["red"].points > 0 ? "blue" : "red");
			io.emit('victory', msg);
		}
	}
	
	//msg[0] > PlayerID
	//msg[1] > RegionID
	//msg[2] > Card Chosen
	this.chosenCard = function (playerID, regionID, cardID) {
		//
		//this.Region[regionID].
	}
}

function Player(name, color) {
	this.name = (name);
	this.deck = [];
	this.hand = [];
	this.color;
	this.point = 0;
	this.stackArmy = 18;
	this.extraCard = false;
	this.taken = false;
	this.ready = false;
	
	this.updateStack = function (i) {
		stackArmy = stackArmy + i;
		
		if (stackArmy == -1) {
		//handle
		}
	}
	
	this.takeNextCard = function (bool) {
		bool ? this.hand.push(this.deck.shift()) : this.deck.push(this.deck.shift());
	}
}

function InitializeGame() {
	//list of points combination
	var allPoints = [];
	allPoints.push([1, 4, 3]);
	allPoints.push([1, 2, 4]);
	allPoints.push([2, 5, 2]);
	allPoints.push([3, 1, 5]);
	allPoints.push([2, 3, 2]);
	allPoints.push([4, 1, 4]);
	allPoints.push([3, 2, 3]);
	allPoints.push([4, 3, 2]);
	allPoints.push([2, 3, 4]);
	allPoints.push([1, 3, 5]);
	
	Shuffle(allPoints);
	
	game.regions.push(new Region("qin", allPoints[1], [1, 3]));
	game.regions.push(new Region("jinyan", allPoints[2], [0, 3]));
	game.regions.push(new Region("hanqi", allPoints[3], [1, 3, 4]));
	game.regions.push(new Region("chu", allPoints[4], [0, 1, 2, 4]));
	game.regions.push(new Region("wu", allPoints[5], [2, 3]));
	
	game.regions[1].toConsole();
	
	var cardId = 0;
	
	//game.player["blue"].deck.push(new Carte(points,always,peste,bonus,penalty));
	game.players["blue"].hand.push(new Carte(1, true, false, false, 0,cardId++));
	game.players["blue"].hand.push(new Carte(2, true, false, false, 0,cardId++));
	game.players["blue"].hand.push(new Carte(3, true, false, false, 0,cardId++));
	game.players["blue"].hand.push(new Carte(4, true, false, false, 0,cardId++));
	game.players["blue"].hand.push(new Carte(5, true, false, false, 0,cardId++));
	game.players["blue"].hand.push(new Carte(6, true, false, false, 1,cardId++));
	
	game.players["blue"].deck.push(new Carte(7, false, false, false, 0,cardId++));
	game.players["blue"].deck.push(new Carte(8, false, false, false, 0,cardId++));
	game.players["blue"].deck.push(new Carte(9, false, false, false, 0,cardId++));
	game.players["blue"].deck.push(new Carte(10, false, false, false, 0,cardId++));
	game.players["blue"].deck.push(new Carte(0, false, true, false, 0,cardId++));
	game.players["blue"].deck.push(new Carte(0, false, true, false, 0,cardId++));
	game.players["blue"].deck.push(new Carte(1, false, false, true, 0,cardId++));
	game.players["blue"].deck.push(new Carte(1, false, false, true, 0,cardId++));
	game.players["blue"].deck.push(new Carte(1, false, false, true, 0,cardId++));
	game.players["blue"].deck.push(new Carte(-1, false, false, true, 0,cardId++));
	game.players["blue"].deck.push(new Carte(-1, false, false, true, 0,cardId++));
	game.players["blue"].deck.push(new Carte(-1, false, false, true, 0,cardId++));
	game.players["blue"].deck.push(new Carte(2, false, false, true, 1,cardId++));
	game.players["blue"].deck.push(new Carte(3, false, false, true, 2,cardId++));
	
	game.players["red"].hand.push(new Carte(1, true, false, false, 0,cardId++));
	game.players["red"].hand.push(new Carte(2, true, false, false, 0,cardId++));
	game.players["red"].hand.push(new Carte(3, true, false, false, 0,cardId++));
	game.players["red"].hand.push(new Carte(4, true, false, false, 0,cardId++));
	game.players["red"].hand.push(new Carte(5, true, false, false, 0,cardId++));
	game.players["red"].hand.push(new Carte(6, true, false, false, 1,cardId++));
	game.players["red"].deck.push(new Carte(7, false, false, false, 0,cardId++));
	game.players["red"].deck.push(new Carte(8, false, false, false, 0,cardId++));
	game.players["red"].deck.push(new Carte(9, false, false, false, 0,cardId++));
	game.players["red"].deck.push(new Carte(10, false, false, false, 0,cardId++));
	game.players["red"].deck.push(new Carte(0, false, true, false, 0,cardId++));
	game.players["red"].deck.push(new Carte(0, false, true, false, 0,cardId++));
	game.players["red"].deck.push(new Carte(1, false, false, true, 0,cardId++));
	game.players["red"].deck.push(new Carte(1, false, false, true, 0,cardId++));
	game.players["red"].deck.push(new Carte(1, false, false, true, 0,cardId++));
	game.players["red"].deck.push(new Carte(-1, false, false, true, 0,cardId++));
	game.players["red"].deck.push(new Carte(-1, false, false, true, 0,cardId++));
	game.players["red"].deck.push(new Carte(-1, false, false, true, 0,cardId++));
	game.players["red"].deck.push(new Carte(2, false, false, true, 1,cardId++));
	game.players["red"].deck.push(new Carte(3, false, false, true, 2,cardId++));
	
	Shuffle(game.players["blue"].deck);
	Shuffle(game.players["red"].deck);
	
	var i = 0;
	while (i < 4) {
		game.players["blue"].hand.push(game.players["blue"].deck.shift());
		i++;
	}
	
	i = 0
	while (i < 4) {
		game.players["red"].hand.push(game.players["blue"].deck.shift());
		i++;
	}
	
	console.log(game.players["red"].hand);

}