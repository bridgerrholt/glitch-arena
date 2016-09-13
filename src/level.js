Level = function() {
	this.objects = [];
	this.neededDistance = 1000;

	this.enemySystem = new EnemySystem();

	this.pushOrb();
};

Level.prototype.update = function() {
	for (var i = 0; i < this.objects.length; ++i) {
		if (this.objects[i].update()) {
			var tag = this.objects[i].getTag();
			var coord = this.objects[i].data.pos;
			this.objects[i].data.alive = false;
			this.objects.splice(i, 1);

			if (tag == "orb") {
				this.pushOrb();
			}
		}
	}

	this.enemySystem.update();
};

Level.prototype.draw = function() {
	loopCall(this.objects, "draw");
	this.enemySystem.draw();
};

Level.prototype.pushObject = function(constructFunc, argPack) {
	while (true) {
		var dir = randomRangeReal(0, trig.TAU);

		var min = Math.min(2000, 500 + g_g.glitchness.val*300);
		var max = Math.min(g_g.boundsDistance - 500, 1500 + g_g.glitchness.val*300);

		//console.log([min, max]);

		var dis = randomRange(min, max);
		var coord = trig.move(0, 0, dir, dis);

		if (g_g.player.pos.disTo(coord) < 1000) {
			continue;
		}

		var good = true;

		for (var i = 0; i < this.objects.length; ++i) {
			if (this.objects[i].data.pos.disTo(coord) < this.neededDistance) {
				good = false;
				break;
			}
		}

		if (good) break;

	}

	this.objects.push(new constructFunc(coord, argPack));
};


Level.prototype.pushOrb = function() {
	this.neededDistance -= 50;
	if (this.neededDistance < 100)
		this.neededDistance = 100;

	var keyNeed = g_g.glitchness.val;

	for (var i = 0; i < keyNeed; ++i) {
		this.pushObject(Level.Key);
	}

	this.pushObject(Level.Orb, { keyNeed: keyNeed });

	//console.log(g_g.glitchness.val + 2);

	this.enemySystem.spawn(this);
};



// Level.Object

Level.Object = function(pos, radius) {
	this.pos = pos;
	this.radius = radius;
	this.alive = true;
};

Level.Object.prototype.moveToPlayer = function(pullRadius, speed) {
	if (this.pos.disTo(g_g.player.pos) < pullRadius + g_g.player.radius) {
		this.pos.move(this.pos.dirTo(g_g.player.pos), speed);
	}
};

// Level.Key

Level.Key = function(pos) {
	this.circleRadius = 5;
	this.data = new Level.Object(pos, 3 * this.circleRadius);
	this.pullRadius = this.data.radius * (10/2);
	this.rotation = 0;

	this.getTag = function() {
		return "key";
	};

	this.update = function() {
		this.data.moveToPlayer(this.pullRadius, 1);

		if (g_g.player.calcInteraction(this.data)) {
			g_g.increaseScorePure(50);
			g_g.player.keyCount++;
			return true;
		}

		return false;
	};

	this.draw = function() {
		/*drawing.drawCircle(this.data.pos.calcSub(g_g.camera), this.data.radius, function() {
			g_g.ctx.fillStyle   = "#fff";
			g_g.ctx.strokeStyle = "#fff";
			g_g.ctx.fill();
			g_g.ctx.stroke();
		});*/

		var realPos = this.data.pos.calcSub(g_g.camera);

		g_g.ctx.lineWidth = 3;

		if (drawing.calcShouldDrawCircle(realPos, this.pullRadius)) {
			drawing.drawCircleForced(realPos, this.pullRadius);
			g_g.ctx.fillStyle = "#000";
			g_g.ctx.strokeStyle = "#f0f";
			g_g.ctx.fill();
			g_g.ctx.stroke();
			g_g.ctx.lineWidth = 1;

			g_g.ctx.fillStyle = "#fff";
			g_g.ctx.strokeStyle = "#fff";

			var dir = this.rotation;
			var dis = this.circleRadius * 2;
			for (var i = 0; i < 3; ++i) {
				dir += trig.TAU/3;
				drawing.drawCircleForced(realPos.calcMove(dir, dis), this.circleRadius);
				g_g.ctx.fill();
				g_g.ctx.stroke();
			}
		}

		g_g.ctx.lineWidth = 1;

		this.rotation += trig.TAU / (g_g.frameRate * 5);
	};

	this.drawIcon = function(pos, radius) {
		drawing.drawCircleForced(pos, radius);

		g_g.ctx.strokeStyle = "#f0f";

		g_g.ctx.fill();
		g_g.ctx.stroke();
	}
};



// Level.Orb

Level.Orb = function(pos, argPack) {
	this.circleRadius = 25;
	this.pullRadius = this.circleRadius * (5/2);
	this.data = new Level.Object(pos, this.circleRadius);
	this.keyNeed = argPack.keyNeed;

	this.rotation = 0;
	this.rotationSpeed = trig.TAU / (60 * 3);

	this.getTag = function() {
		return "orb";
	};

	this.update = function() {
		this.rotation += this.rotationSpeed;

		this.data.moveToPlayer(this.circleRadius, 0.5);

		if (g_g.player.calcInteraction(this.data)) {
			if (this.hasKeys()) {
				g_g.increaseScorePure(100);
				g_g.glitchness.inc(1);
				g_g.player.upgrade();
				g_g.player.keyCount -= this.keyNeed;
				return true;
			}
		}

		return false;
	};

	this.draw = function() {
		g_g.ctx.lineWidth = 3;

		var realPos = this.data.pos.calcSub(g_g.camera);

		drawing.drawCircle(realPos, this.circleRadius, function() {
			if (this.hasKeys()) {
				g_g.ctx.fillStyle = "#fff";
				g_g.ctx.strokeStyle = "#0f0";
			}
			else {
				g_g.ctx.fillStyle = "#ccc";
				g_g.ctx.strokeStyle = "#00a";
			}

			g_g.ctx.fill();
			g_g.ctx.stroke();

			g_g.ctx.lineWidth = 4;
			//g_g.ctx.strokeStyle = "#0f0";

			for (var i = 0; i < g_g.player.keyCount; ++i) {
				var dir = this.rotation + trig.TAU * (i / this.keyNeed),
					start = realPos.calcMove(dir, this.circleRadius),
					end   = realPos.calcMove(dir, this.pullRadius);

				g_g.ctx.beginPath();
				g_g.ctx.moveTo(start.x, start.y);
				g_g.ctx.lineTo(end.x, end.y);

				g_g.ctx.stroke();
			}
		}.bind(this));

		g_g.ctx.lineWidth = 1;
	};

	this.drawIcon = function(pos, radius) {
		g_g.ctx.beginPath();

		// Draws a 5-point star.
		for (var i = 0; i < 10; i += 2) {
			var unit = trig.TAU / 10;
			var outer = pos.calcMove(i * unit - Math.PI/2, radius);
			if (i == 0) {
				g_g.ctx.moveTo(outer.x, outer.y);
			}
			else {
				g_g.ctx.lineTo(outer.x, outer.y);
			}
			var inner = pos.calcMove((i + 1) * unit - Math.PI/2, radius * (2/4));
			g_g.ctx.lineTo(inner.x, inner.y);
		}

		if (this.hasKeys())
			g_g.ctx.strokeStyle = "#0f0";
		else
			g_g.ctx.strokeStyle = "#fff";

		g_g.ctx.closePath();
		g_g.ctx.fill();
		g_g.ctx.stroke();
	};

	this.hasKeys = function() {
		return (g_g.player.keyCount >= this.keyNeed);
	};
};