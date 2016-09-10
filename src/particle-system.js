ParticleSystem = function() {
	this.particles = [];
	this.count = 100;
	for (var i = 0; i < this.count; ++i) {
		this.particles.push(new Particle());
	}

	g_g.glitchness.addCallback([ParticleSystem.glitchnessIncrease, this]);
};

ParticleSystem.prototype.update = function() {
	loopCall(this.particles, "update");

	if (this.particles.length < this.count && randomRange(0, 10) == 0) {
		this.particles.push(new Particle());
	}
};

ParticleSystem.prototype.draw = function() {
	loopCall(this.particles, "draw");
};

ParticleSystem.prototype.increaseCount = function() {
	this.count += 50;
};

ParticleSystem.glitchnessIncrease = function(obj) {
	obj.increaseCount();
};


// Particle

Particle = function() {
	this.init();
};

Particle.prototype.init = function() {
	this.x = randomRange(0, g_g.canvas.width)  + g_g.camera.x - g_g.canvas.width/2;
	this.y = randomRange(0, g_g.canvas.height) + g_g.camera.y - g_g.canvas.height/2;
	this.randomSize();
	this.w = 1;
	this.h = 1;
	this.side = randomRange(0, 2);
	if (this.side == 0)
		this.bias = randomRange(0, 5);
	else
		this.bias = randomRange(96, 101);
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
	if (randomRange(0, 5000) == 0)
		this.randomSize();
	--this.deathTick;
	if (this.deathTick == 0)
		this.init();
	if (randomRange(0, 300) == 0) {
		//if (randomRange(0, 101) < this.bias)
		if (this.side == 0)
			this.w += 1;
		else
			this.h += 1;
	}
};

Particle.prototype.draw = function() {
	var x = screenX(this.x);
	var y = screenY(this.y);

	var width  = this.size * this.w;
	var height = this.size * this.h;

	while (x + width < 0) {
		x += g_g.canvas.width + width;
	}
	while (x > g_g.canvas.width) {
		x -= g_g.canvas.width;
	}

	while (y + height < 0) {
		y += g_g.canvas.height + height;
	}
	while (y > g_g.canvas.height) {
		y -= g_g.canvas.height;
	}

	g_g.ctx.fillStyle = this.color.get();
	g_g.ctx.fillRect(x, y, this.size*this.w, this.size*this.h);
	//console.log(this.color);
};

Particle.prototype.randomSize = function() {
	this.size = randomRange(2, 3 * (Math.pow(g_g.glitchness.val, 2)));
};