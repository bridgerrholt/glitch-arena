ParticleSystem = function() {
	this.particlesFront = [];
	this.particlesBack = [];
	this.countFront = 7;
	this.countBack = 26;

	for (var i = 0; i < this.countFront; ++i) {
		this.pushToFront();
	}

	for (i = 0; i < this.countBack; ++i) {
		this.pushToBack();
	}

	g_g.glitchness.addCallback([ParticleSystem.glitchnessIncrease, this]);
};

ParticleSystem.prototype.update = function() {
	loopCall(this.particlesFront, "update");
	loopCall(this.particlesBack, "update");

	var particles = g_g.settings.options.particles.current;
	var frontCount = this.countFront * particles;
	var backCount = this.countFront * particles;

	var frontDiff = this.particlesFront.length - frontCount;
	if (frontDiff < 0 && randomRange(0, 10) == 0) {
		this.pushToFront();
	}
	else if (frontDiff > 0) {
		this.particlesFront.splice(-1, frontDiff);
	}

	var backDiff = this.particlesBack.length - backCount;
	if (backDiff < 0 && randomRange(0, 10) == 0) {
		this.pushToBack();
	}
	else if (backDiff > 0) {
		this.particlesBack.splice(-1, backDiff);
	}
};

ParticleSystem.prototype.draw = function() {
	loopCall(this.particlesBack, "draw");
};

ParticleSystem.prototype.drawLast = function() {
	loopCall(this.particlesFront, "draw");
};

ParticleSystem.prototype.increaseCount = function() {
	if (g_g.settings.options.particles.current > 1) {
		this.countFront += 1;
		this.countBack += 2;
	}
};

ParticleSystem.glitchnessIncrease = function(obj) {
	obj.increaseCount();
};

ParticleSystem.prototype.pushToFront = function() {
	this.particlesFront.push(new Particle(randomRangeReal(1, 2)));
};

ParticleSystem.prototype.pushToBack = function() {
	this.particlesBack.push(new Particle(randomRangeReal(0.25, 1)));
};



// Particle

Particle = function(distance) {
	this.distance = distance;
	this.init();
};

Particle.prototype.init = function() {
	this.pos = new trig.Coord(
		randomRange(0, g_g.canvas.width),
		randomRange(0, g_g.canvas.height)
	);
	this.width = 1;
	this.height = 1;
	this.randomSize();
	this.side = randomRange(0, 2);

	var degree = 20;
	if (this.side == 0)
		this.bias = randomRange(0, degree);
	else
		this.bias = randomRange(101-degree, 101);
	//console.log(this.bias);

	var colorArray = [0, 0, 0];
	var channelCount = randomRange(1, 3);
	if (channelCount == 1) {
		colorArray[randomRange(0, 3)] = 1;
	}
	else {
		var count = 0;
		while (count < 2) {
			var index = randomRange(0, 3);
			if (colorArray[index] == 0) {
				colorArray[index] = 1;
				count++;
			}
		}
	}

	/*if (colorArray[0] == 0 && colorArray[1] == 0 && colorArray[2] == 0) {
		console.log(channelCount);
		console.log(colorArray);
	}*/

	this.color = new RgbColor(
		colorArray[0] * 256 - 20,
		colorArray[1] * 256 - 30,
		colorArray[2] * 256
	);
	this.deathTick = randomRange(100, 1000);
	//console.log([this.x, this.y, this.size]);
};

Particle.prototype.update = function() {
	if (randomRange(0, 2000 + g_g.glitchness.val*500) == 0)
		this.randomSize();

	--this.deathTick;
	if (this.deathTick == 0)
		this.init();

	if (randomRange(0, 300) == 0) {
		if (randomRange(0, 101) < this.bias)
		//if (this.side == 0)
			this.resize(function(){this.width += 1;});
		else
			this.resize(function(){this.height += 1;});
	}
};

Particle.prototype.draw = function() {
	var pos = this.pos.calcSub(g_g.camera);
	pos.x *= this.distance;
	pos.y *= this.distance;

	this.fixPos(pos, 'x', 'fullWidth',  'width');
	this.fixPos(pos, 'y', 'fullHeight', 'height');

	g_g.ctx.fillStyle = this.color.get();
	g_g.ctx.fillRect(pos.x, pos.y, this.fullWidth, this.fullHeight);
};


Particle.prototype.fixPos = function(pos, x, length, frameLength) {
	while (pos[x] <= -this[length]) {
		pos[x] += g_g.canvas[frameLength];
	}
	while (pos[x] >= g_g.canvas[frameLength]) {
		pos[x] -= g_g.canvas[frameLength];
	}
};


Particle.prototype.randomSize = function() {
	//this.size = randomRange(2, 0.5 * Math.pow(g_g.glitchness.val, 2));
	this.resize(function() {
		this.size = randomRange(2, 2 + 4 * g_g.glitchness.val);
	});
};

Particle.prototype.resize = function(func) {
	func.bind(this)();
	this.fullWidth  = this.size * this.width;
	this.fullHeight = this.size * this.height;
};