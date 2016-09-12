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
		shift: 16
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

  var audioEncoder = new AudioEncoder(132/16./4, ['C4:16 C4:16 Eb4:16 E4:16 G3:16 G3:16 G3:16 G3:16 D4:16 D4:16 F4:16 F4:16 G3:16 G3:16 G3:16 G3:16 Eb4:16 E4:16 G4:16 G4:16 Ab4:16 G4:16 A4:16 G4:16 A4:16 G4:16 A4:16 G4:16 Bb4:16 G4:16 E4:16 D4:16']);
  audioEncoder.audio.addEventListener('ended', function() {
      this.currentTime = 0;
      this.play();
  }, false);
  //audioEncoder.audio.play();


  // Sets up everything.
  setInputCallbacks();
  loadMedia();
	reset();

	// 0  Instructions
	// 1  Game
	// 2  Death
	g_g.screen = 0;
	g_g.nextScreen = 0;

	g_g.titleScreen = new TitleScreen();

	g_g.startingMultiplier = 3;
	g_g.nextMultiplier = g_g.startingMultiplier;


  // Sets up the game loop.
  if (typeof g_g.gameLoop != "undefined")
    clearInterval(g_g.gameLoop);
  g_g.gameLoop = setInterval(update, 1000/g_g.frameRate);
}

function screenChange(value) {
	g_g.nextScreen = value;
}

function screenFinalize() {
	g_g.screen = g_g.nextScreen;
}

function drawResponsiveText(text, x, y, widthRatio, fontName) {
	var size = 12;
	var fontEnd = "px " + fontName;
	g_g.ctx.font = size.toString() + fontEnd;
	var width = g_g.ctx.measureText(text).width;
	var sizeToWidth = size / width;

	size = sizeToWidth * g_g.canvas.width * widthRatio;

	g_g.ctx.font = size.toString() + fontEnd;

	g_g.ctx.fillText(text, x, y);

	return { width: width, size: size};
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
	g_g.fps = 1000/(g_g.thisTick-g_g.lastTick);
	if (g_g.fps == 0)
		g_g.delta = 0;
	else
		g_g.delta = 60 / g_g.fps;

	var smoothing = 0.9; // larger=more smoothing
	g_g.averageFps = (g_g.averageFps * smoothing) + (g_g.fps * (1.0-smoothing));

	// Update
	if (g_g.screen == 0) {
		g_g.titleScreen.update();
	}

	else if (g_g.screen == 1) {
		g_g.player.update();
		g_g.camera.x = g_g.player.pos.x - g_g.canvas.width/2;
		g_g.camera.y = g_g.player.pos.y - g_g.canvas.height/2;

		g_g.particleSystem.update();
		g_g.level.update();

	}

	else if (g_g.screen == 2) {
		if (new Date().getTime() > g_g.gameOverTime + 1500 && TitleScreen.getActionPressed()) {
			screenChange(1);
			reset();
		}
	}




  // Draw
  g_g.ctx.fillStyle = "#000";
  g_g.ctx.fillRect(0, 0, g_g.canvas.width, g_g.canvas.height);

	var leftX = 10;
	var leftTopY = 10;
	var fontSize = 36;


	if (g_g.screen == 0) {
		g_g.titleScreen.draw();
	}

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
		g_g.ctx.fillText("x " + g_g.multiplier.toString(), leftX, leftTopY);
	}

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
			x,
			y,
			0.5,
			"Georgia"
		).size + 40;

		g_g.ctx.fillStyle = "#fff";

		drawResponsiveText(
			"Score: " + g_g.score.toString(),
			x, y,
			0.1,
			"Georgia"
		);

		g_g.ctx.textBaseline = "top";

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


	if (g_g.screen != 0) {
		g_g.ctx.fillStyle = "#f00";
		g_g.ctx.font = "30px Arial";
		g_g.ctx.textAlign = "right";
		g_g.ctx.fillText("Level " + g_g.glitchness.val.toString(), g_g.canvas.width - 45, 40);
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



// TitleScreen

TitleScreen = function() {
	this.titleY = 0.5;
	this.titleYDesired = 0.25;

	this.done = false;

	this.buttonTextSize = 34;
	this.buttonFont = this.buttonTextSize.toString() + "px Arial";
	this.buttons = [
		new Button("Settings"),
		new Button("Play"),
		new Button("Instructions")
	];

	g_g.ctx.font = this.buttonFont;
	this.buttonWidth = this.calcButtonText(0).width;
	for (var i = 1; i < this.buttons.length; ++i) {
		var width = this.calcButtonText(i);
		if (width > this.buttonWidth)
			this.buttonWidth = width;
	}
};


TitleScreen.prototype.update = function() {
	if (!this.done) {
		if (TitleScreen.getActionPressed()) {
			this.done = true;
		}

		if (this.titleY > this.titleYDesired) {
			this.titleY -= 0.001;
		}
		else {
			this.done = true;
		}

		if (this.done)
			this.titleY = this.titleYDesired;
	}

	else {
		if (TitleScreen.getActionPressed())
			screenChange(1);

		var y = g_g.canvas.height * (2/3);
		var middleX = g_g.canvas.width / 2;
		var marginX = 0.01;
		var unit = g_g.canvas.width * 0.05;
		var heights = this.buttonTextSize;
		var paddingX = 4;
		var paddingY = 8;

		this.buttons[0].rect.pos.x = middleX - this.buttonWidth * 2 - paddingX * 3;
		this.buttons[1].rect.pos.x = middleX - this.buttonWidth * (1/2) - paddingX;
		this.buttons[2].rect.pos.x = middleX + this.buttonWidth * (2/2) + paddingX;

		for (var i = 0; i < this.buttons.length; ++i) {
			this.buttons[i].rect.pos.y = y;
			this.buttons[i].rect.width = this.buttonWidth + 2*paddingX;
			this.buttons[i].rect.height = heights + 2*paddingY;
		}
	}
};


TitleScreen.prototype.draw = function() {
	g_g.ctx.fillStyle = "#fff";
	g_g.ctx.textAlign = "center";
	g_g.ctx.textBaseline = "middle";

	drawResponsiveText(
		"GLITCH ARENA",
		g_g.canvas.width / 2,
		g_g.canvas.height * this.titleY,
		0.5,
		"Arial Black"
	);


	g_g.ctx.strokeStyle = "#fff";
	g_g.ctx.fillStyle = "#fff";
	g_g.ctx.font = this.buttonFont;
	for (var i = 0; i < this.buttons.length; ++i) {
		var button = this.buttons[i];
		var rect = button.rect;
		g_g.ctx.strokeRect(rect.pos.x, rect.pos.y, rect.width, rect.height);
		g_g.ctx.fillText(button.text,
			rect.pos.x + rect.width/2, rect.pos.y + rect.height/2);
	}

	g_g.ctx.textBaseline = "top";

};


TitleScreen.prototype.calcButtonText = function(index) {
	return g_g.ctx.measureText(this.buttons[index]);
};


TitleScreen.getActionPressed = function() {
	return (g_g.keys[g_g.keyBinds.spacebar].pressed || g_g.mouseButtons.left.pressed);
};



// Button

Button = function(text) {
	this.text = text;
	this.rect = new trig.Rect(new trig.Coord(0, 0), 0, 0);
};

Button.prototype.update = function() {

};



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



g_g.enemyKilled = function() {
	g_g.currentMultiplierCount++;

	if (g_g.currentMultiplierCount == g_g.nextMultiplier) {
		g_g.nextMultiplier *= 2;
		g_g.currentMultiplierCount = 0;
		g_g.multiplier++;
	}

	console.log("enemyKilled");
	console.log(g_g.currentMultiplierCount);
};

g_g.resetMultiplier = function() {
	g_g.multiplier = 1;
	g_g.nextMultiplier = g_g.startingMultiplier;
	g_g.currentMultiplierCount = 0;

	console.log("reset");
};

g_g.increaseScore = function(value) {
	console.log(value * g_g.multiplier);
	g_g.increaseScorePure(value * g_g.multiplier);
};

g_g.increaseScorePure = function(value) {
	g_g.score += value;
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