Level = function() {
	this.objects = [];

	this.pushOrb();
};

Level.prototype.update = function() {
	for (var i = 0; i < this.objects.length; ++i) {
		if (this.objects[i].update()) {
			var tag = this.objects[i].getTag();
			this.objects.splice(i, 1);

			if (tag == "orb") {
				this.pushOrb();
			}
		}
	}
};

Level.prototype.draw = function() {
	loopCall(this.objects, "draw");
};

Level.prototype.pushObject = function(constructFunc, argPack) {
	while (true) {
		var dir = randomRangeReal(0, trig.TAU);

		var min = Math.min(2000, 500 + g_g.glitchness.val*100);
		var max = Math.min(g_g.boundsDistance - 500, 1500 + g_g.glitchness.val*100);

		console.log([min, max]);

		var dis = randomRange(min, max);
		var coord = trig.move(0, 0, dir, dis);

		var good = true;
		for (var i = 0; i < this.objects.length; ++i) {
			if (this.objects[i].data.pos.disTo(coord) < 1000) {
				good = false;
				break;
			}
		}

		if (good) {
			this.objects.push(new constructFunc(coord, argPack));
			break;
		}

	}
};


Level.prototype.pushOrb = function() {
	var keyNeed;
	if (g_g.glitchness.val == 1)
		keyNeed = 1;
	else
		keyNeed = randomRange(g_g.glitchness.val, g_g.glitchness.val + 2);

	for (var i = 0; i < keyNeed; ++i) {
		this.pushObject(Level.Key);
	}

	this.pushObject(Level.Orb, { keyNeed: keyNeed });

	console.log(g_g.glitchness.val + 2);
};



// Level.Object

Level.Object = function(pos, radius) {
	this.pos = pos;
	this.radius = radius;
};



// Level.Key

Level.Key = function(pos) {
	this.circleRadius = 5;
	this.data = new Level.Object(pos, 3 * this.circleRadius);
	this.rotation = 0;

	this.getTag = function() {
		return "key";
	};

	this.update = function() {
		if (g_g.player.calcInteraction(this.data)) {
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
		var backRadius = this.data.radius * (10/2);

		if (drawing.calcShouldDrawCircle(realPos, backRadius/2)) {
			drawing.drawCircleForced(realPos, backRadius);
			g_g.ctx.fillStyle = "#000";
			g_g.ctx.strokeStyle = "#f0f";
			g_g.ctx.lineWidth = 3;
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
	this.data = new Level.Object(pos, 25);
	this.keyNeed = argPack.keyNeed;

	this.getTag = function() {
		return "orb";
	};

	this.update = function() {
		if (g_g.player.calcInteraction(this.data)) {
			if (this.hasKeys()) {
				g_g.glitchness.inc(1);
				g_g.player.upgrade();
				g_g.player.keyCount -= this.keyNeed;
				return true;
			}
		}

		return false;
	};

	this.draw = function() {
		drawing.drawCircle(this.data.pos.calcSub(g_g.camera), this.data.radius, function() {
			if (this.hasKeys()) {
				g_g.ctx.fillStyle = "#fff";
				g_g.ctx.strokeStyle = "#0f0";
			}
			else {
				g_g.ctx.fillStyle = "#ccc";
				g_g.ctx.strokeStyle = "#00a";
			}

			g_g.ctx.lineWidth = 3;

			g_g.ctx.fill();
			g_g.ctx.stroke();

			g_g.ctx.lineWidth = 1;
		}.bind(this));
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
