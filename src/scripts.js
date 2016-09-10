var g_g = {};

function main() {
  // Frame rate.
  g_g.frameRate = 60;
  g_g.fps       = g_g.frameRate;
	g_g.thisTick  = new Date().getTime();
  g_g.lastTick  = g_g.thisTick;
  g_g.delta     = 60/g_g.frameRate;

  // The game canvas.
  g_g.canvas        = document.getElementById('game');
  g_g.ctx           = g_g.canvas.getContext('2d');
  g_g.canvas.width  = window.innerWidth;
  g_g.canvas.height = window.innerHeight;
  g_g.canvasW       = g_g.canvas.width;
  g_g.canvasH       = g_g.canvas.height;

  g_g.camera = new trig.Coord(0, 0);

  g_g.mouse = new trig.Coord(0, 0);
	g_g.mouseButtons = { left:  new Key(),
		                   right: new Key() };
	g_g.keys = [];
	for (var i = 0; i < 222; ++i) {
		g_g.keys.push(new Key());
	}
	g_g.keyBinds = {
		spacebar: 32
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


  // Sets up the game loop.
  if (typeof g_g.gameLoop != "undefined")
    clearInterval(g_g.gameLoop);
  g_g.gameLoop = setInterval(update, 1000/g_g.frameRate);
}

function update() {
	g_g.thisTick = new Date().getTime();
	g_g.fps = 1000/(g_g.thisTick-g_g.lastTick);
	if (g_g.fps == 0)
		g_g.delta = 0;
	else
		g_g.delta = 60 / g_g.fps;

  g_g.particleSystem.update();
  g_g.player.update();
  g_g.level.update();



  g_g.camera.x = g_g.player.pos.x - g_g.canvas.width/2;
  g_g.camera.y = g_g.player.pos.y - g_g.canvas.height/2;

  // Draw
  g_g.ctx.fillStyle = "#000";
  g_g.ctx.fillRect(0, 0, g_g.canvas.width, g_g.canvas.height);

  /*for (var i = 0; i < 100; ++i) {
    var r = randomRange(2, 5);
    var x = randomRange(0, g_g.canvas.width - r);
    var y = randomRange(0, g_g.canvas.height - r);
    var color = "#fff";

    g_g.ctx.fillStyle = color;
    g_g.ctx.fillRect(x, y, x+r, x+r);
  }*/

  g_g.particleSystem.draw();
  g_g.level.draw();
  g_g.player.draw();

	// Draw bounds barrier.
	drawing.drawCircleForced(g_g.center.calcSub(g_g.camera), g_g.boundsDistance + 4);
	g_g.ctx.strokeStyle = "#0af";
	g_g.ctx.lineWidth   = 6;
	g_g.ctx.stroke();
	g_g.ctx.lineWidth   = 1;

	g_g.mouseButtons.left.update();
	g_g.mouseButtons.right.update();
	loopCall(g_g.keys, "update");

	g_g.lastTick = g_g.thisTick;
}

function reset() {
	g_g.center         = new trig.Coord(0, 0);
	g_g.boundsDistance = 5000;

  g_g.player = new Player();
  g_g.particleSystem = new ParticleSystem();
  g_g.level = new Level();
  g_g.glitchness.reset();

}

function loadMedia() {

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


	document.onmousedown = function (e) {
		if (getMouseButtonIsLeft(e.button)) {
			g_g.mouseButtons.left.press();
		}
		else {
			g_g.mouseButtons.right.press();
		}
	};

	document.onmouseup = function (e) {
		if (getMouseButtonIsLeft(e.button)) {
			g_g.mouseButtons.left.release();
		}
		else {
			g_g.mouseButtons.right.release();
		}
	};

	document.onkeydown = function (e) {
		g_g.keys[e.which].press();
	};

	document.onkeyup = function (e) {
		g_g.keys[e.which].release();
	};

}

// Must be at bottom.
main();