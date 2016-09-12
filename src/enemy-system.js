EnemySystem = function() {
	this.enemies = [];
};

EnemySystem.prototype.update = function() {
	for (var i = 0; i < this.enemies.length; ++i) {
		if (this.enemies[i].update()) {
			g_g.increaseScore(10);
			g_g.enemyKilled();
			this.enemies.splice(i, 1);
		}
	}
};

EnemySystem.prototype.draw = function() {
	loopCall(this.enemies, "draw");
};

EnemySystem.prototype.spawn = function(level) {
	for (var i = 0; i < level.objects.length; ++i) {
		var obj = level.objects[i];
		var degree = g_g.glitchness.val - 1;

		var maxInc;
		if (obj.getTag() == "orb")
			maxInc = degree;
		else
			maxInc = degree*0.5;

		var enemyCount = randomRange(1, 2 + maxInc);

		for (var j = 0; j < enemyCount; ++j) {
			this.enemies.push(new Enemy(
				obj,
				// guardRadius
				500 + randomRange(0, degree*10),
				// awareness
				500 + randomRange(0, degree*50),
				// radius
				25  + degree,
				// speed
				4   + randomRangeReal(0, degree),
				// damage
				1   + randomRange(0, degree * .8),
				// hp
				1   + randomRange(0, degree * .6))
			);
		}
	}
};



// Enemy

Enemy = function(guard, guardRadius, awareness, radius, speed, damage, hp) {
	this.guard = guard;
	this.guardRadius = guardRadius;
	this.awareness = awareness;
	this.radius = radius;
	this.damage = damage;
	this.hp = hp;

	this.alive = true;
	this.isGuarding = true;

	this.maxSpeed = speed;
	this.speed = 0;

	this.destination = this.randomPos();
	this.pos = this.destination;
	this.active = true;

	// 0  Guarding
	// 1  Pursuing
	// 2  Going home
	// 3  Roaming
	this.behavior = 0;

	this.lastBehaviorChange = new Date().getTime();
	this.behaviorChangeCooldown = 2000;

	this.dir = 0;

};

Enemy.prototype.update = function() {
	if (!this.alive) return true;

	if (this.isGuarding) {
		if (!this.guard.data.alive) {
			this.isGuarding = false;
			this.active = true;

			if (this.behavior == 0 || this.behavior == 2)
				this.setBehavior(3);
		}
	}

	else {
		if (this.pos.disTo(this.guard.data.pos) < this.guardRadius)
			this.active = (this.pos.disTo(g_g.player.pos) < 3000);
	}

	if (this.active) {

		switch (this.behavior) {
			// Guarding
			case 0 :
				if (this.pos.disTo(g_g.player.pos) < this.awareness) {
					this.setBehaviorPursuing();
				}
				else {
					this.dir = this.pos.dirTo(g_g.player.pos);
				}
				break;

			// Pursing
			case 1 :
				var toPlayer = this.pos.disTo(g_g.player.pos);
				if (this.isGuarding && (toPlayer > 600 || this.pos.disTo(this.destination) > 750)) {
					this.destination = this.randomPos();
					this.dir = this.pos.dirTo(this.destination);
					this.setDonePursuing();
				}
				else {
					var totalRadius = this.radius + g_g.player.radius;
					if (toPlayer <= totalRadius) {
						this.pos = g_g.player.pos.calcMove(g_g.player.pos.dirTo(this.pos), totalRadius);
						g_g.player.hpDecrease(this.damage);
					}
					this.dir = this.pos.dirTo(g_g.player.pos);
				}
				break;

			// Going home
			case 2 :
				if (this.pos.disTo(g_g.player.pos) < this.awareness - 200)
					this.setBehaviorPursuing();
				else if (this.pos.disTo(this.destination) < this.speed) {
					this.setBehaviorGuarding();
				}
				break;

			// Roaming
			case 3 :
				if (this.pos.disTo(g_g.player.pos) < this.awareness + 250) {
					this.setBehaviorPursuing();
				}
				else {
					if (this.pos.disTo(this.destination) <= this.speed) {
						this.randomDestination();
					}

					this.dir = this.pos.dirTo(this.destination);
				}
				break;
		}

		this.pos.moveDelta(this.dir, this.speed);

		for (var i = 0; i < g_g.player.bullets.length; ++i) {
			if (g_g.player.bullets[i].colliding(this.pos, this.radius)) {
				this.hpDecrease(g_g.player.bullets[i].damage);
				//console.log(g_g.player.bullets[i]);
				//console.log(this.hp);
			}
		}
	}


	return !this.alive;
};

Enemy.prototype.draw = function() {
	g_g.ctx.lineWidth = 3;
	drawing.drawCircle(this.pos.calcSub(g_g.camera), this.radius, function() {
		g_g.ctx.fillStyle = "#f00";
		g_g.ctx.strokeStyle = "#b00";
		g_g.ctx.fill();
		g_g.ctx.stroke();
	});
	g_g.ctx.lineWidth = 1;
};

Enemy.prototype.randomPos = function() {
	return this.guard.data.pos.calcMove(
		trig.randomDir(),
		randomRange(Math.min(this.radius * 2, this.guardRadius * 0.2), this.guardRadius)
	);
};

Enemy.prototype.hpDecrease = function(amount) {
	this.hp -= amount;
	if (this.hp <= 0) {
		this.alive = false;
		return true;
	}

	return false;
};

Enemy.prototype.setBehavior = function(number) {
	var time = new Date().getTime();

	if (this.lastBehaviorChange + this.behaviorChangeCooldown < time) {
		this.behavior = number;
		this.lastBehaviorChange = time;
	}
};


Enemy.prototype.setBehaviorPursuing = function() {
	this.setBehavior(1);
	this.speed = this.maxSpeed;
};

Enemy.prototype.setBehaviorGuarding = function() {
	this.setBehavior(0);
	this.speed = 0;
};

Enemy.prototype.setDonePursuing = function() {
	if (this.isGuarding)
		this.setBehavior(2);
	else {
		this.setBehavior(3);
		this.randomDestination();
	}
};

Enemy.prototype.randomDestination = function() {
	this.destination = g_g.center.calcMove(trig.randomDir(), randomRange(0, g_g.boundsDistance * (3/4)));
};