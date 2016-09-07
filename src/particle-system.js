ParticleSystem = function() {
	this.particles = [];
	this.count = 100;
	for (var i = 0; i < this.count; ++i) {
		this.particles.push(new Particle());
	}
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


Particle = function() {
	this.init();
};

Particle.prototype.init = function() {
	this.x = randomRange(0, g_g.canvas.width)  + g_g.camera.x - g_g.canvas.width/2;
	this.y = randomRange(0, g_g.canvas.height) + g_g.camera.y - g_g.canvas.height/2;
	this.randomSize();
	this.w = 1;
	this.h = 1;
	this.color = new RgbColor(
		randomRange(0, 256),
		randomRange(0, 256),
		randomRange(0, 256)
	);
	this.deathTick = randomRange(100, 2000);
	//console.log([this.x, this.y, this.size]);
};

Particle.prototype.update = function() {
	if (randomRange(0, 60) == 0)
		this.randomSize();
	--this.deathTick;
	if (this.deathTick == 0)
		this.init();
	if (randomRange(0, 300) == 0) {
		if (randomRange(0, 2) == 0)
			this.w += 1;
		else
			this.h += 1;
	}
};

Particle.prototype.draw = function() {
	var x = screenX(this.x);
	var y = screenY(this.y);

	while (x < 0) {
		x += g_g.canvas.width;
	}
	while (x > g_g.canvas.width) {
		x -= g_g.canvas.width;
	}

	while (y < 0) {
		y += g_g.canvas.height;
	}
	while (y > g_g.canvas.height) {
		y -= g_g.canvas.height;
	}

	g_g.ctx.fillStyle = this.color.get();
	g_g.ctx.fillRect(x, y, this.size+this.w, this.size+this.h);
	//console.log(this.color);
};

Particle.prototype.randomSize = function() {
	this.size = randomRange(2, 3 * g_g.glitchness.val);
};