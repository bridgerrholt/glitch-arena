Player = function() {
	this.points = [];
	this.radius = 50;

	this.pos = new trig.Coord(0, 0);
	this.dirFacing = 0;
	this.speedMax = 6;
	this.movements = [
		new Movement(0, 0)
	];
	this.speedInc = 10 / 60;
	this.speedDec = 10 / 60;
	this.speedRotate = trig.TAU / 60;

	this.hpMax = 5;
	this.hp = this.hpMax;
	this.lastHit = new Date().getTime();
	this.hitCooldown = 500;
	this.inHit = false;

	this.keyCount = 0;
	this.upgradeCount = 0;

	var pointDepth = 5;
	this.offset = 0;
	this.offsetMax = Math.PI/pointDepth;


	this.points.push(Math.PI);
	for (var i = 1; i < pointDepth-1; ++i) {
		this.points.push(Math.PI + i*(this.offsetMax));
	}

	this.mouthPoint = Math.PI + (pointDepth-1)*(this.offsetMax);

	this.canShoot = false;
	this.lastShoot = new Date().getTime();
	this.shootInterval = 500;
	this.bullets = [];
	this.bulletSpeed = this.speedMax+10;
	this.bulletRadius = 5;
	this.bulletDamage = 1;

	this.upgradeName = "";
	this.lastUpgrade = 0;
	this.upgradeDrawTime = 5 * 1000;

	//console.log(this.mouthPoint);
	//console.log(this.offsetMax);
	//console.log(this.points);
};


Player.prototype.update = function() {
	var realPos = this.pos.calcSub(g_g.camera);

	if (realPos.disTo(g_g.mouse) > this.radius) {
		var toMouse = realPos.dirTo(g_g.mouse);
		var deltaDir = toMouse - this.dirFacing;
		var speedDelta = this.speedRotate * g_g.delta;

		if (Math.abs(deltaDir) <= speedDelta ||
			  Math.abs(deltaDir + trig.TAU) <= speedDelta) {
			this.dirFacing = toMouse;
		}

		else {
			if ((deltaDir + trig.TAU) % trig.TAU > Math.PI)
				this.dirFacing -= speedDelta;
			else
				this.dirFacing += speedDelta;

			this.dirFacing = trig.normalizeDir(this.dirFacing);

		}
	}


	if (!g_g.keys[g_g.keyBinds.shift].down)
		this.movements[0].dir = this.dirFacing;


	for (var i = 0; i < this.movements.length; ++i) {
		var movement = this.movements[i];

		if (movement.speed < this.speedMax) {
			movement.speed += this.speedMax * this.speedInc;
		}

		if (movement.speed > this.speedMax) {
			movement.speed = this.speedMax;
		}

		this.pos.moveDelta(movement.dir, movement.speed);
	}

	stayInGameBounds(this.pos, this.radius);

	for (i = 0; i < this.bullets.length; ++i) {
		if (this.bullets[i].update()) {
			this.bullets.splice(i, 1);
		}
	}

	// Used for shooting and for last hit.
	var time = new Date().getTime();

	if (this.canShoot) {
		if (g_g.keys[g_g.keyBinds.spacebar].down || g_g.mouseButtons.left.down) {
			if (this.lastShoot + this.shootInterval < time) {
				this.lastShoot = time;
				this.shoot();
			}
		}
	}


	this.offset += Math.PI / 200 * (g_g.glitchness.val * 0.5);
	if (this.offset >= this.offsetMax) {
		this.offset -= this.offsetMax;
	}

	if (time > this.lastHit + this.hitCooldown) {
		this.inHit = false;
	}
};


Player.prototype.draw = function() {
	var calcPoint = function(i) {
		return (this.points[i] + this.offset);
	}.bind(this);

	var currentPoints = [];
	currentPoints.push(this.radial(Math.PI));

	for (var i = 0; i < this.points.length; ++i) {
		currentPoints.push(this.radial(calcPoint(i)));
	}

	currentPoints.push(this.radial(this.mouthPoint));

	currentPoints.push(this.pos);

	var mouthPointOpposite = Math.PI + (Math.PI-(this.mouthPoint));

	currentPoints.push(this.radial(mouthPointOpposite));

	for (i = this.points.length-1; i >= 0; --i) {
		currentPoints.push(this.radial(Math.PI + (Math.PI-(calcPoint(i)))));
	}

	if (this.inHit)
		g_g.ctx.strokeStyle = "#f00";
	else
		g_g.ctx.strokeStyle = "#000";
	g_g.ctx.fillStyle = "#fff";
	g_g.ctx.lineWidth = 1;
	g_g.ctx.beginPath();
	g_g.ctx.moveTo(screenX(currentPoints[0].x), screenY(currentPoints[0].y));
	for (i = 1; i < currentPoints.length; ++i) {
		g_g.ctx.lineTo(screenX(currentPoints[i].x), screenY(currentPoints[i].y));
	}
	g_g.ctx.lineTo(screenX(currentPoints[0].x), screenY(currentPoints[0].y));
	g_g.ctx.fill();
	g_g.ctx.stroke();



	/*var hpStart = this.mouthPoint;
	var hpEnd   = mouthPointOpposite;
	var hpDiff  = hpEnd - hpStart;
	var hpRatio = this.hp / this.hpMax;
	hpEnd = hpStart + hpDiff * hpRatio;


	g_g.ctx.strokeStyle = "#0f0";
	g_g.ctx.lineWidth = 3;
	g_g.ctx.beginPath();
	g_g.ctx.arc(screenX(this.pos.x), screenY(this.pos.y), this.radius + 25,
		this.dirFacing + hpStart, this.dirFacing + hpEnd, true);
	g_g.ctx.stroke();*/


	g_g.ctx.lineWidth = 1;



	var distance        = 50;

	var radiusDisappear = 300;
	var radiusFade      = 200;
	var radiusGrow      = 3000;

	var smallestRadius = 7;
	var largestRadius  = 20;

	// Increase to actual radii.
	distance        += this.radius;
	radiusDisappear += distance;
	radiusFade      += radiusDisappear;
	radiusGrow      += radiusFade;

	for (i = 0; i < g_g.level.objects.length; ++i) {
		//console.log(g_g.level.objects[i].getTag());
		var obj = g_g.level.objects[i];
		var disTo = this.pos.disTo(obj.data.pos);
		// Will actually be drawn.
		if (disTo > radiusDisappear) {
			var radius;
			var opacity = 1.0;
			var dirTo = this.pos.dirTo(obj.data.pos);

			// Smallest size.
			if (disTo > radiusGrow) {
				radius = smallestRadius;
			}

			// Growing to max size.
			else if (disTo > radiusFade) {
				var ratio = (disTo - radiusFade) / (radiusGrow - radiusFade);
				radius = largestRadius - ratio * (largestRadius - smallestRadius);
			}

			// At max size, fading out.
			else {
				var ratio = (disTo - radiusDisappear) / (radiusFade - radiusDisappear);
				radius = largestRadius;
				opacity = ratio;
			}

			/*g_g.ctx.beginPath();
			var pos = this.pos.calcSub(g_g.camera);
			pos.move(dirTo, distance);
			g_g.ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI, false);
			g_g.ctx.globalAlpha = opacity;
			g_g.ctx.fillStyle = "#fff";
			g_g.ctx.fill();*/

			var pos = this.pos.calcSub(g_g.camera);
			pos.move(dirTo, distance);

			g_g.ctx.globalAlpha = opacity;
			g_g.ctx.lineWidth = 2;
			g_g.ctx.fillStyle = "#fff";

			obj.drawIcon(pos, radius);

			g_g.ctx.globalAlpha = 1.0;
			g_g.ctx.lineWidth = 1;
		}
	}

	loopCall(this.bullets, "draw");


	// Draw upgrade
	var difference = new Date().getTime() - this.lastUpgrade;
	if (difference < this.upgradeDrawTime) {
		g_g.ctx.globalAlpha = 1 - difference / this.upgradeDrawTime;
		g_g.ctx.textAlign = "center";
		g_g.ctx.font = "34px Arial";
		g_g.ctx.fillStyle = "#f00";
		g_g.ctx.fillText(this.upgradeName, g_g.canvas.width / 2, g_g.canvas.height / 4);
	}

	g_g.ctx.globalAlpha = 1.0;

};


Player.prototype.radial = function(dir) {
	var extra = 0;
	var probability = this.hp / this.hpMax;
	/*if (randomRange(0, Math.max(2, 100-g_g.glitchness.val*4)) == 0) {
		extra = randomRange(0, 2*(g_g.glitchness.val-1));
		//console.log(extra);
		//console.log(extra);
	}*/

	if (randomRangeReal(0, 1) > probability) {
		extra = randomRange(0, 2*(1 - probability)*10);
	}

	return this.pos.calcMove(this.dirFacing+dir, this.radius + extra);
};


Player.prototype.calcInteraction = function(object) {
	return (this.pos.disTo(object.pos) < this.radius * (3/4) + object.radius);
};

Player.prototype.shoot = function() {
	this.bullets.push(new Bullet(
		this.pos.calcMove(this.dirFacing, this.radius * (3/4)),
		this.dirFacing, this.bulletSpeed, this.bulletRadius, this.bulletDamage
	));
};

Player.prototype.hpDecrease = function(amount) {
	if (!this.inHit) {
		this.inHit = true;
		this.lastHit = new Date().getTime();
		this.hp -= amount;
		if (this.hp <= 0)
			gameOver();
	}
};

Player.prototype.upgrade = function() {
	if (this.upgradeCount == 0) {
		this.canShoot = true;
		this.upgradeName = "Shooting enabled";
	}
	else {
		var obj = Player.upgradeList[randomRange(0, Player.upgradeList.length)];
		obj.func(this);
		this.upgradeName = obj.name;
	}

	this.hp = this.hpMax;
	this.upgradeCount++;
	this.lastUpgrade = new Date().getTime();
};


Player.upgradeFunction = function(name, func) {
	this.name = name;
	this.func = func;
};


Player.upgradeList = [
	new Player.upgradeFunction("Speed increased", function(obj) {
		obj.speedMax += 1;
		obj.speedRotate += trig.TAU / 60;
		obj.bulletSpeed += 1;
	}),

	new Player.upgradeFunction("Damage increased", function(obj) {
		obj.bulletRadius += 1;
		obj.bulletDamage += 1;
	}),

	new Player.upgradeFunction("HP increased", function(obj) {
		obj.hpMax += 1;
	})
];



// Bullet

Bullet = function(pos, dir, speed, radius, damage) {
	this.pos    = pos;
	this.dir    = dir;
	this.speed  = speed;
	this.radius = radius;
	this.damage = damage;
	this.alive  = true;
};

Bullet.prototype.update = function() {
	if (!this.alive) return true;

	this.pos.moveDelta(this.dir, this.speed);

	if (!drawing.calcShouldDrawCircle(this.pos.calcSub(g_g.camera), this.radius) ||
		   checkOutGameBounds(this.pos, this.radius)) {
		g_g.resetMultiplier();
		return true;
	}

	return false;
};

Bullet.prototype.draw = function() {
	drawing.drawCircleForced(this.pos.calcSub(g_g.camera), this.radius);
	g_g.ctx.fillStyle = "#fff";
	g_g.ctx.fill();
};

Bullet.prototype.colliding = function(pos, radius) {
	if (this.pos.collidingCircles(this.radius, pos, radius)) {
		this.alive = false;
		return true;
	}

	return false;
};



// Movement

Movement = function(direction, speed) {
	this.dir   = direction;
	this.speed = speed;
};
