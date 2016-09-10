Player = function() {
	this.points = [];
	this.radius = 50;

	this.pos = new trig.Coord(0, 0);
	this.dir = 0;
	this.speed = 6;
	this.speedRotate = trig.TAU / 60;

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
	this.bulletSpeed = this.speed+10;
	this.bulletRadius = 5;

	console.log(this.mouthPoint);
	console.log(this.offsetMax);
	console.log(this.points);
};


Player.prototype.update = function() {
	var realPos = this.pos.calcSub(g_g.camera);

	if (realPos.disTo(g_g.mouse) > this.radius) {
		var toMouse = realPos.dirTo(g_g.mouse);
		var deltaDir = toMouse - this.dir;

		if (Math.abs(deltaDir) <= this.speedRotate ||
			  Math.abs(deltaDir + trig.TAU) <= this.speedRotate) {
			this.dir = toMouse;
		}

		else {
			if ((deltaDir + trig.TAU) % trig.TAU > Math.PI)
				this.dir -= this.speedRotate;
			else
				this.dir += this.speedRotate;

			this.dir = trig.normalizeDir(this.dir);
		}
	}


	this.pos.move(this.dir, this.speed * g_g.delta);
	stayInGameBounds(this.pos, this.radius);

	for (var i = 0; i < this.bullets.length; ++i) {
		if (this.bullets[i].update()) {
			this.bullets.splice(i, 1);
			console.log("Delete bullet");
		}
	}

	if (this.canShoot) {
		if (g_g.keys[g_g.keyBinds.spacebar].down || g_g.mouseButtons.left.down) {
			var time = new Date().getTime();
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

	currentPoints.push(this.radial(Math.PI + (Math.PI-(this.mouthPoint))));

	for (i = this.points.length-1; i >= 0; --i) {
		currentPoints.push(this.radial(Math.PI + (Math.PI-(calcPoint(i)))));
	}

	g_g.ctx.strokeStyle = "#fff";
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
};


Player.prototype.radial = function(dir) {
	var extra = 0;
	if (randomRange(0, Math.max(2, 100-g_g.glitchness.val*4)) == 0) {
		extra = randomRange(0, 2*(g_g.glitchness.val-1));
		//console.log(extra);
	}
	return this.pos.calcMove(this.dir+dir, this.radius + extra);
};


Player.prototype.calcInteraction = function(object) {
	return (this.pos.disTo(object.pos) < this.radius/2 + object.radius);
};

Player.prototype.shoot = function() {
	console.log(this.dir);
	this.bullets.push(new Bullet(
		this.pos.calcMove(this.dir, this.radius * (3/4)),
		this.dir, this.bulletSpeed, this.bulletRadius
	));

	console.log("Shoot");
};


Player.prototype.upgrade = function() {
	if (this.upgradeCount == 0) {
		this.canShoot = true;
		console.log("CANSHOOT");
	}
	else {
		var obj = Player.upgradeList[randomRange(0, Player.upgradeList.length)];
		obj.func(this);
	}

	this.upgradeCount++;
};


Player.upgradeFunction = function(name, func) {
	this.name = name;
	this.func = func;
};


Player.upgradeList = [
	new Player.upgradeFunction("speed", function(obj) {
		obj.speed += 1;
	})
];



// Bullet

Bullet = function(pos, dir, speed, radius) {
	this.pos    = pos;
	this.dir    = dir;
	this.speed  = speed;
	this.radius = radius;
	console.log(this.dir);
};

Bullet.prototype.update = function() {
	this.pos.move(this.dir, this.speed);

	if (!drawing.calcShouldDrawCircle(this.pos.calcSub(g_g.camera), this.radius) ||
		   checkOutGameBounds(this.pos, this.radius)) {
		return true;
	}

	return false;
};

Bullet.prototype.draw = function() {
	drawing.drawCircleForced(this.pos.calcSub(g_g.camera), this.radius);
	g_g.ctx.fillStyle = "#fff";
	g_g.ctx.fill();
};