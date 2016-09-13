var g_g = {};

function main() {
  // Frame rate.
  g_g.frameRate = 60;
  g_g.fps       = g_g.frameRate;
	g_g.thisTick  = new Date().getTime();
  g_g.lastTick  = g_g.thisTick;
  g_g.delta     = 60/g_g.frameRate;

  // The game canvas.
  g_g.canvas = document.getElementById('game');
  g_g.ctx    = g_g.canvas.getContext('2d');
	setScreenSize();

  g_g.camera = new trig.Coord(0, 0);

  g_g.mouse = new trig.Coord(0, 0);
	g_g.mouseButtons = { left:  new Key(),
		                   right: new Key() };
	g_g.keys = [];
	for (var i = 0; i < 222; ++i) {
		g_g.keys.push(new Key());
	}
	g_g.keyBinds = {
		spacebar: 32,
		shift: 16,
		escape: 27,
		key_p: 80
	};

  g_g.glitchness = {
    val: 1,
	  callbacks: [],

	  inc: function() {
		  this.incAmount(1);
	  },

	  incAmount: function(amount) {
		  this.val += amount;
		  for (var i = 0; i < this.callbacks.length; ++i) {
		  	this.callbacks[i][0](this.callbacks[i][1]);
		  }
		  amount--;

		  if (amount > 0)
		  	this.incAmount(amount);
	  },

	  addCallback: function(callback) {
	  	this.callbacks.push(callback);
	  },

    reset: function() {
      this.val = 1;
    }
  };

	g_g.audioContext = new AudioContext();
		// set the tempo
	var tempo = 100,
		// create an array of "note strings" that can be passed to a sequence
		lead = [
			'C4 s', 'C4 s', 'Eb4 s', 'E4 s', 'G3 s', 'G3 s', 'G3 s', 'G3 s', 'D4 s', 'D4 s', 'F4 s', 'F4 s', 'G3 s', 'G3 s', 'G3 s', 'G3 s', 'Eb4 s', 'E4 s', 'G4 s', 'G4 s', 'Ab4 s', 'G4 s', 'A4 s', 'G4 s', 'A4 s', 'G4 s', 'A4 s', 'G4 s', 'Bb4 s', 'G4 s', 'E4 s', 'D4 s'
		];

	// create 3 new sequences (one for lead, one for harmony, one for bass)
	g_g.music = new TinyMusic.Sequence(g_g.audioContext, tempo, lead);

	// set staccato and smoothing values for maximum coolness
	g_g.music.staccato = 0.55;

	// adjust the levels so the bass and harmony aren't too loud
	g_g.music.gain.gain.value = 1.0;

	// apply EQ settings
	g_g.music.mid.frequency.value = 800;
	g_g.music.mid.gain.value = 3;

	g_g.playingMusic = false;


	var highScoreCookie = getCookie("high-score");
	if (highScoreCookie == '') {
		g_g.highScore = 0;
		document.cookie = "high-score=0";
	}
	else {
		g_g.highScore = parseInt(highScoreCookie);
	}


  // Sets up everything.
  setInputCallbacks();
  loadMedia();

	// 0  Title screen
	// 1  Game
	// 2  Death
	// 3  Settings
	// 4  Instructions
	// 5  Pause
	// 6  Warning
	g_g.screen = 6;
	g_g.nextScreen = 6;

	g_g.warningStart = new Date().getTime();
	g_g.warningLength = 5000;

	g_g.titleScreen = new TitleScreen();

	g_g.startingMultiplier = 3;
	g_g.nextMultiplier = g_g.startingMultiplier;

	g_g.instructions = {};
	g_g.settings = new Settings();



	reset();


  // Sets up the game loop.
  if (typeof g_g.gameLoop != "undefined")
    clearInterval(g_g.gameLoop);
  g_g.gameLoop = setInterval(update, 1000/g_g.frameRate);
}

function screenChange(value) {
	g_g.nextScreen = value;

	if (g_g.nextScreen == 4) {
		g_g.instructions = new Instructions();
	}
}

function screenFinalize() {
	g_g.screen = g_g.nextScreen;
}

function calcText(text, widthRatio, fontName) {
	var size = 12;
	var fontEnd = "px " + fontName;
	g_g.ctx.font = size.toString() + fontEnd;
	var width = g_g.ctx.measureText(text).width;
	var sizeToWidth = size / width;

	size = sizeToWidth * g_g.canvas.width * widthRatio;

	return { width: width, size: size};
}

function drawResponsiveText(text, x, y, widthRatio, fontName) {
	var data = calcText(text, widthRatio, fontName);

	g_g.ctx.font = data.size.toString() + "px " + fontName;

	g_g.ctx.fillText(text, x, y);

	return data;
}


function reset() {
	g_g.glitchness.reset();
	g_g.center         = new trig.Coord(0, 0);
	g_g.boundsDistance = 5000;
	g_g.averageFps = g_g.frameRate;
	g_g.score = 0;
	g_g.multiplier = 1;
	g_g.currentMultiplierCount = 0;
	g_g.nextMultiplier = g_g.startingMultiplier;

	g_g.player = new Player();
	g_g.particleSystem = new ParticleSystem();
	g_g.level = new Level();
}


function update() {
	g_g.thisTick = new Date().getTime();
	g_g.fps = 1000 / (g_g.thisTick-g_g.lastTick);
	if (g_g.fps == 0)
		g_g.delta = 0;
	else
		g_g.delta = 60 / g_g.fps;

	var smoothing = 0.9; // larger=more smoothing
	g_g.averageFps = (g_g.averageFps * smoothing) + (g_g.fps * (1.0-smoothing));

	// Update

	// Title Screen
	if (g_g.screen == 0) {
		if (!g_g.playingMusic) {
			g_g.music.play(g_g.audioContext.currentTime);
			g_g.playingMusic = true;
		}
		g_g.titleScreen.update();
	}

	// Game
	else if (g_g.screen == 1) {
		if (g_g.keyPause())
			screenChange(5);
		g_g.player.update();
		g_g.camera.x = g_g.player.pos.x - g_g.canvas.width/2;
		g_g.camera.y = g_g.player.pos.y - g_g.canvas.height/2;

		g_g.particleSystem.update();
		g_g.level.update();

	}

	// Death
	else if (g_g.screen == 2) {
		if (new Date().getTime() > g_g.gameOverTime + 1500 && TitleScreen.getActionPressed()) {
			screenChange(1);
			reset();
		}
	}

	// Settings
	else if (g_g.screen == 3) {
		g_g.settings.update();
	}

	// Instructions
	else if (g_g.screen == 4) {
		g_g.instructions.update();
	}

	// Pause
	else if (g_g.screen == 5) {
		g_g.titleScreen.update();
	}

	// Warning
	else if (g_g.screen == 6) {
		var time = new Date().getTime() - g_g.warningStart;
		if (time > g_g.warningLength || (time > 1000 && TitleScreen.getActionPressed()))
			screenChange(0);
	}




  // Draw
  g_g.ctx.fillStyle = "#000";
  g_g.ctx.fillRect(0, 0, g_g.canvas.width, g_g.canvas.height);

	var leftX = 10;
	var leftTopY = 10;
	var fontSize = 36;

	// Title screen
	if (g_g.screen == 0) {
		g_g.titleScreen.draw();
	}

	// Game
	else if (g_g.screen == 1) {
		g_g.particleSystem.draw();
		g_g.level.draw();
		g_g.player.draw();

		// Draw bounds barrier.
		if (g_g.center.disTo(g_g.player.pos) > g_g.boundsDistance - 2000) {
			drawing.drawCircleForced(g_g.center.calcSub(g_g.camera), g_g.boundsDistance + 4);
			g_g.ctx.strokeStyle = "#0af";
			g_g.ctx.lineWidth = 6;
			g_g.ctx.stroke();
			g_g.ctx.lineWidth = 1;
		}

		g_g.particleSystem.drawLast();


		g_g.ctx.font = fontSize.toString() + "px Arial";
		g_g.ctx.fillStyle = "#fff";
		g_g.ctx.textAlign = "left";
		g_g.ctx.textBaseline = "top";
		g_g.ctx.fillText(g_g.score, leftX, leftTopY);
		leftTopY += fontSize + 5;
		g_g.ctx.fillText(
			"x " + g_g.multiplier.toString() + " (" + (g_g.nextMultiplier - g_g.currentMultiplierCount) + ")",
			leftX, leftTopY);

		g_g.ctx.fillStyle = "#f00";
		g_g.ctx.font = "30px Arial";
		g_g.ctx.textAlign = "right";
		g_g.ctx.fillText("Level " + g_g.glitchness.val.toString(), g_g.canvas.width - 45, 40);
	}

	// Death
	else if (g_g.screen == 2) {
		/*var size = 30;
		var fontEnd = "px Georgia";
		g_g.ctx.font = size.toString() + fontEnd;
		var text = "YOU DIED";
		var width = g_g.ctx.measureText(text).width;
		var sizeToWidth = size / width;
		console.log(sizeToWidth);

		if (g_g.canvas.width < 450) {
			size = sizeToWidth * Math.max(1, g_g.canvas.width - 30);
			console.log(size);
		}
		else {
			size = sizeToWidth * (g_g.canvas.width / 2);
			console.log(size);
		}

		g_g.ctx.font = size.toString() + fontEnd;
		console.log(g_g.ctx.font);
;
		g_g.ctx.fillText(text, g_g.canvas.width / 2, g_g.canvas.height / 2);*/

		g_g.ctx.fillStyle = "#f00";
		g_g.ctx.textAlign = "center";
		g_g.ctx.textBaseline = "middle";

		var y = g_g.canvas.height * (1/3);
		var x = g_g.canvas.width  * (1/2);

		y += drawResponsiveText(
			"YOU DIED",
			x, y, 0.5,
			"Georgia"
		).size + 40;

		g_g.ctx.fillStyle = "#fff";

		y += drawResponsiveText(
				"Score: " + g_g.score.toString(),
				x, y, 0.15,
				"Arial"
		).size + 40;

		y += drawResponsiveText(
			"Level: " + g_g.glitchness.val.toString(),
			x, y, 0.15,
			"Arial"
		).size + 40;

		y += drawResponsiveText(
			"High Score: " + g_g.highScore.toString(),
			x, y, 0.125,
			"Arial"
		).size + 40;

		g_g.ctx.textBaseline = "top";

	}

	// Settings
	else if (g_g.screen == 3) {
		g_g.settings.draw();
	}

	// Instructions
	else if (g_g.screen == 4) {
		g_g.instructions.draw();
	}

	// Pause
	else if (g_g.screen == 5) {
		g_g.titleScreen.draw();
	}

	// Warning
	else if (g_g.screen == 6) {
		g_g.ctx.fillStyle = "#fff";
		g_g.ctx.textAlign = "center";

		g_g.ctx.globalAlpha = 1 - (new Date().getTime() - g_g.warningStart) / (g_g.warningLength);

		//console.log(g_g.ctx.globalAlpha);

		drawResponsiveText(
			"Do not play if you have a history of epilepsy",
			g_g.canvas.width / 2,
			g_g.canvas.height / 2,
			0.3,
			"Georgia"
		);

		g_g.ctx.globalAlpha = 1;
	}


	var n = -1;
	function num() {
		n++;
		return 15 + 25*n;
	}


	if (false) {
		g_g.ctx.fillStyle = "#f00";
		g_g.ctx.font = "20px Times";
		g_g.ctx.textBaseline = "top";
		g_g.ctx.textAlign = "left";
		g_g.ctx.fillText(Math.round(g_g.averageFps * 10) / 10, 15, num());
	}


	// End drawing
	// Keys
	g_g.mouseButtons.left.update();
	g_g.mouseButtons.right.update();
	loopCall(g_g.keys, "update");

	screenFinalize();

	g_g.lastTick = g_g.thisTick;
}


function gameOver() {
	screenChange(2);
	g_g.gameOverTime = new Date().getTime();
	if (g_g.score > g_g.highScore) {
		g_g.highScore = g_g.score;
		document.cookie = "high-score=" + g_g.score.toString();
	}
}


function loadMedia() {

}


function setScreenSize() {
	g_g.canvas.width  = Math.min(1920, window.innerWidth);
	g_g.canvas.height = Math.min(1080, window.innerHeight);
}


function screenX(x) {
  return x - g_g.camera.x;
}

function screenY(y) {
  return y - g_g.camera.y;
}

function realX(x) {
  return x + g_g.camera.x;
}

function realY(y) {
  return y + g_g.camera.y;
}


function stayInGameBounds(coord, radius) {
	if (checkOutGameBounds(coord, radius)) {
		var dir = g_g.center.dirTo(coord);
		coord.resetPos(g_g.center.calcMove(dir, g_g.boundsDistance - radius));
	}
}

function checkOutGameBounds(coord, radius) {
	return (g_g.center.disTo(coord) + radius > g_g.boundsDistance);
}


// Common

RgbColor = function(r, g, b) {
  this.r = r;
  this.g = g;
  this.b = b;
};

RgbColor.prototype.get = function() {
  return "rgb(" + this.r.toString() + "," + this.g.toString() + "," + this.b.toString() + ")";
};


function randomRange(min, max) {
  //return Math.floor(Math.random() * (max - min) + min);
	return Math.floor(randomRangeReal(min, max));
  //return Math.floor(min + (Math.random() % Math.floor((max - min + 1))));
}

function randomRangeReal(min, max) {
  return Math.random() * (max - min) + min;
}

function loopCall(arr, functionName) {
  for (var i = 0; i < arr.length; ++i) {
    arr[i][functionName]();
  }
}

function getCookie(name) {
	name += "=";
	var ca = document.cookie.split(';');

	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length,c.length);
		}
	}

	return "";
}



g_g.enemyKilled = function() {
	g_g.currentMultiplierCount++;

	if (g_g.currentMultiplierCount == g_g.nextMultiplier) {
		g_g.nextMultiplier *= 2;
		g_g.currentMultiplierCount = 0;
		g_g.multiplier++;
	}

	//console.log("enemyKilled");
	//console.log(g_g.currentMultiplierCount);
};

g_g.resetMultiplier = function() {
	g_g.multiplier = 1;
	g_g.nextMultiplier = g_g.startingMultiplier;
	g_g.currentMultiplierCount = 0;

	//console.log("reset");
};

g_g.increaseScore = function(value) {
	//console.log(value * g_g.multiplier);
	g_g.increaseScorePure(value * g_g.multiplier);
};

g_g.increaseScorePure = function(value) {
	g_g.score += value * g_g.settings.options.difficulty.current;
};


// Events

Key = function() {
	this.pressed  = false;
	this.released = false;
	this.down     = false;
};

Key.prototype.press = function() {
	if (this.down == false) {
		this.pressed = true;
		this.down    = true;
	}
};

Key.prototype.release = function() {
	this.released = true;
	this.down     = false;
};

Key.prototype.update = function() {
	this.pressed  = false;
	this.released = false;
};


function getMouseButtonIsLeft(num) {
	var left = (navigator.appName == "Microsoft Internet Explorer") ? 1 : 0;
	return (num == left);
}


g_g.keyPause = function() {
	return (g_g.keys[g_g.keyBinds.escape].pressed || g_g.keys[g_g.keyBinds.key_p].pressed);
};

function setInputCallbacks() {
	document.addEventListener("mousemove", function (evt) {
		var rect = g_g.canvas.getBoundingClientRect();
		g_g.mouse.x = evt.clientX - rect.left;
		g_g.mouse.y = evt.clientY - rect.top;
		//var message = 'Mouse position: ' + g_g.mouse.x + ',' + g_g.mouse.y;
		//console.log(message);
	}, false);


	window.onresize = function() {
		setScreenSize();
	};

	document.onmousedown = function(e) {
		if (getMouseButtonIsLeft(e.button)) {
			g_g.mouseButtons.left.press();
		}
		else {
			g_g.mouseButtons.right.press();
		}
	};

	document.onmouseup = function(e) {
		if (getMouseButtonIsLeft(e.button)) {
			g_g.mouseButtons.left.release();
		}
		else {
			g_g.mouseButtons.right.release();
		}
	};

	document.onkeydown = function(e) {
		g_g.keys[e.which].press();
	};

	document.onkeyup = function(e) {
		g_g.keys[e.which].release();
	};

}

// Must be at bottom.
main();