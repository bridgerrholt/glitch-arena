// Button

Button = function(text) {
	this.text = text;
	this.rect = new trig.Rect(new trig.Coord(0, 0), 0, 0);
	this.hover = false;
};

Button.prototype.update = function() {
	this.hover = this.rect.getIfHover(g_g.mouse);
};

Button.prototype.draw = function() {
	if (this.hover)
		g_g.ctx.strokeStyle = "#0f0";
	else
		g_g.ctx.strokeStyle = "#fff";

	g_g.ctx.textBaseline = "middle";
	g_g.ctx.strokeRect(this.rect.pos.x, this.rect.pos.y, this.rect.width, this.rect.height);
	g_g.ctx.fillText(this.text,
		this.rect.pos.x + this.rect.width  / 2,
		this.rect.pos.y +this. rect.height / 2);
	g_g.ctx.textBaseline = "top";
};

Button.prototype.conformSize = function(size, font) {
	g_g.ctx.font = size.toString() + "px " + font;
	this.rect.width = g_g.ctx.measureText(this.text).width*2 + 8;
	this.rect.height = size + 16;
};



// TitleScreen

TitleScreen = function() {
	this.titleY = 0.5;
	this.titleYDesired = 0.25;

	this.done = false;
	this.toBeDone = false;
	this.playing = false;
	this.toBePlaying = false;

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
			this.toBeDone = true;
		}

		if (this.titleY > this.titleYDesired) {
			this.titleY -= 0.001;
		}
		else {
			this.toBeDone = true;
		}

		if (this.toBeDone)
			this.titleY = this.titleYDesired;
	}

	else {
		var y = g_g.canvas.height * (2 / 3);
		var middleX = g_g.canvas.width / 2;
		var marginX = 0.01;
		var unit = g_g.canvas.width * 0.05;
		var heights = this.buttonTextSize;
		var paddingX = 4;
		var paddingY = 8;

		this.buttons[0].rect.pos.x = middleX - this.buttonWidth * 2 - paddingX * 3;
		this.buttons[1].rect.pos.x = middleX - this.buttonWidth * (1 / 2) - paddingX;
		this.buttons[2].rect.pos.x = middleX + this.buttonWidth * (2 / 2) + paddingX;

		for (var i = 0; i < this.buttons.length; ++i) {
			this.buttons[i].rect.pos.y = y;
			this.buttons[i].rect.width = this.buttonWidth + 2 * paddingX;
			this.buttons[i].rect.height = heights + 2 * paddingY;
			this.buttons[i].update();
		}

		if (g_g.mouseButtons.left.pressed) {
			if (this.buttons[0].hover) {
				screenChange(3);
			}
			else if (this.buttons[2].hover) {
				screenChange(4);
			}
			else {
				this.playGame();
			}
		}
		else if (TitleScreen.getActionPressed()) {
			this.playGame();
		}
	}
};


TitleScreen.prototype.draw = function() {
	// Different text based on if paused or the title screen.
	var text = (this.playing) ? "PAUSED" : "GLITCH ARENA";

	g_g.ctx.fillStyle = "#fff";
	g_g.ctx.textAlign = "center";

	g_g.ctx.textBaseline = "middle";
	drawResponsiveText(
		text,
		g_g.canvas.width / 2,
		g_g.canvas.height * this.titleY,
		0.5,
		"Arial Black"
	);


	if (this.done) {
		g_g.ctx.fillStyle = "#fff";
		g_g.ctx.font = this.buttonFont;
		for (var i = 0; i < this.buttons.length; ++i) {
			this.buttons[i].draw();
		}

		g_g.ctx.textBaseline = "top";
	}

	else if (this.toBeDone) this.done = true;

	if (this.toBePlaying) {
		this.playing = true;
		this.buttons[1].text = "Continue";
	}

};


TitleScreen.prototype.playGame = function() {
	screenChange(1);
	if (!this.playing) {
		this.toBePlaying = true;
	}
};


TitleScreen.prototype.calcButtonText = function(index) {
	return g_g.ctx.measureText(this.buttons[index]);
};


TitleScreen.getActionPressed = function() {
	return (g_g.keys[g_g.keyBinds.spacebar].pressed || g_g.mouseButtons.left.pressed);
};



// Instructions

Instructions = function() {
	//this.orb = new Level.Orb();
	this.text = [
		"Your character follows the mouse.",
		"Hold shift to aim away from your traveling direction.",
		"Travel toward the keys (highlighted in pink) to collect them,",
		"once you have all the keys, travel to the orb (indicated as a star).",
		"Enemies will attack you, once you get the first orb you can",
		"shoot at them by clicking or pressing space.",
		"The top left number is your score and the number under it is your multiplier,",
		"kill enemies without missing to increase it.",
		"Press P or ESC to pause."
	];
	this.font = "Georgia";
	this.size = 0;
	this.buttonSize = 30;
	this.textMargin = 25;
	this.widthRatio = 0.6;
	this.y = 0;

	this.buttonTopMargin = 20;
	this.button = new Button("Exit");
	this.button.conformSize(this.buttonSize, this.font);
};

Instructions.prototype.update = function() {
	var totalMargin = this.textMargin * (this.text.length-1);

	var propBiggest = calcText(this.text[0], this.widthRatio, this.font);

	for (var i = 1; i < this.text.length; ++i) {
		var prop = calcText(this.text[i], this.widthRatio, this.font);

		if (prop.width > propBiggest.width) {
			propBiggest = prop;
		}
	}

	this.size = propBiggest.size;

	var screenDegree = 0.8;
	var fontHeight = this.text.length*this.size;
	if (totalMargin + fontHeight > g_g.canvas.height * screenDegree) {
		this.size = (g_g.canvas.height*screenDegree - totalMargin) / this.text.length;
	}


	var canvasHeightHalf = g_g.canvas.height/2;
	var totalHeight = totalMargin + (this.text.length+1)*this.size + this.buttonTopMargin;
	this.button.rect.pos.y = canvasHeightHalf + totalHeight/2 - this.button.rect.height;
	totalHeight += this.button.rect.height;

	this.y = canvasHeightHalf - totalHeight/2;
	this.button.rect.pos.x = g_g.canvas.width / 2 - this.button.rect.width / 2;

	this.button.update();

	if (g_g.mouseButtons.left.released) {
		if (this.button.hover) {
			screenChange(0);
		}
	}
};

Instructions.prototype.draw = function() {
	var x = g_g.canvas.width / 2;

	g_g.ctx.fillStyle = "#fff";
	g_g.ctx.font = this.size.toString() + "px Georgia";
	g_g.ctx.textAlign = "center";


	for (var i = 0; i < this.text.length; ++i) {
		g_g.ctx.fillText(this.text[i], x, this.yInc());
	}

	g_g.ctx.textAlign = "center";

	g_g.ctx.font = this.buttonSize.toString() + "px Georgia";
	this.button.draw();

};

Instructions.prototype.yInc = function() {
	var yOld = this.y;
	this.y += this.size + this.textMargin;
	return yOld;
};



// Settings

Settings = function() {
	this.options = {
		particles: new Settings.Option(3, 1, 3, "Particles"),
		difficulty: new Settings.Option(2, 1, 3, "Difficulty")
	};

	this.inOptions(function(option, key) {
		var str = getCookie(key);
		if (str != '') {
			option.current = parseInt(str);
		}
	});

	this.exit = new Button("Exit");
	this.exit.conformSize(30, "Georgia");
};


Settings.prototype.update = function() {
	var x = g_g.canvas.width / 2;
	var y = g_g.canvas.height * 0.1;

	this.inOptions(function(option) {
		option.updateDimensions(new trig.Coord(x, y),
			Math.min(50, g_g.canvas.width*0.1),
			Math.min(25, g_g.canvas.height*0.05));

		option.update();
		y += 100;
	});

	this.exit.rect.pos.x = x - this.exit.rect.width / 2;
	this.exit.rect.pos.y = y;

	this.exit.update();

	if (g_g.mouseButtons.left.released) {
		if (this.exit.hover) {
			screenChange(0);

			this.inOptions(function(option, key) {
				document.cookie = key + '=' + option.current.toString();
			});
		}
	}
};

Settings.prototype.draw = function() {
	this.inOptions(function(option) {
		option.draw();
	});

	this.exit.draw();
};

Settings.prototype.inOptions = function(func) {
	for (var key in this.options) {
		if (this.options.hasOwnProperty(key)) {
			func(this.options[key], key);
		}
	}
};



Settings.Option = function(currentVal, minVal, maxVal, name) {
	this.current = currentVal;
	this.min = minVal;
	this.max = maxVal;
	this.name = name;

	this.marginX = 4;
	this.marginY = 10;

	this.buttons = [];
	for (var i = this.min; i <= this.max; ++i) {
		this.buttons.push(new EmptyButton());
	}
};


Settings.Option.prototype.update = function() {
	for (var i = 0; i < this.buttons.length; ++i) {
		if (this.buttons[i].update())
			this.current = i + this.min;
	}
};


Settings.Option.prototype.draw = function() {
	for (var i = 0; i < this.buttons.length; ++i) {
		this.buttons[i].draw(this.current - this.min == i);
	}

	var firstRect = this.buttons[0].rect,
	    lastRect  = this.buttons[this.buttons.length-1].rect,

	    left =  firstRect.pos.x - 10,
			right = lastRect.pos.x + lastRect.width + 10;

	g_g.ctx.fillStyle = "#fff";
	g_g.ctx.font = firstRect.height.toString() + "px Georgia";
	g_g.ctx.textAlign = "right";
	g_g.ctx.fillText("Low", left, firstRect.pos.y - 3);

	g_g.ctx.textAlign = "left";
	g_g.ctx.fillText("High", right, firstRect.pos.y - 3);

	g_g.ctx.textAlign = "center";
	g_g.ctx.textBaseline = "bottom";
	g_g.ctx.fillText(this.name, left + (right - left) / 2, firstRect.pos.y - 10);

	g_g.ctx.textBaseline = "top";
};


Settings.Option.prototype.updateDimensions = function(pos, width, height) {
	var buttonLength = this.buttons.length;
	var halfLength = buttonLength/2;
	var farLeft = pos.x - width*halfLength - this.marginX*Math.floor(halfLength);
	for (var i = 0; i < buttonLength; ++i) {
		var rect = this.buttons[i].rect;
		rect.pos.x = farLeft + i * (width + this.marginX);
		rect.pos.y = pos.y;
		rect.width = width;
		rect.height = height;
	}
};



// EmptyButton

EmptyButton = function(active) {
	this.rect = new trig.Rect(new trig.Coord(0, 0), 0, 0);
	this.hover = false;
	//console.log(this.active);
};

EmptyButton.prototype.update = function() {
	this.hover = this.rect.getIfHover(g_g.mouse);

	if (this.hover) {
		if (g_g.mouseButtons.left.released) {
			return true;
		}
	}

	return false;
};

EmptyButton.prototype.draw = function(active) {
	if (active)
		g_g.ctx.fillStyle = "#0f0";
	else
		g_g.ctx.fillStyle = "#fff";

	if (this.hover)
		g_g.ctx.strokeStyle = "#f0f";
	else
		g_g.ctx.strokeStyle = "#bbb";

	//console.log(this.active);

	g_g.ctx.beginPath();
	g_g.ctx.rect(this.rect.pos.x, this.rect.pos.y, this.rect.width, this.rect.height);
	g_g.ctx.fill();
	g_g.ctx.stroke();
};