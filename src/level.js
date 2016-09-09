Level = function() {
	this.objects = [];

	this.pushObject(Level.Orb);
	this.pushObject(Level.Key);
};

Level.prototype.update = function() {

};

Level.prototype.draw = function() {
	for (var i = 0; i < this.objects.length; ++i) {
		this.objects[i].draw();
	}
};

Level.prototype.pushObject = function(constructFunc) {
	var dir = randomRangeReal(0, trig.TAU);
	var dis = randomRange(2000, 5000);

	this.objects.push(new constructFunc(trig.move(0, 0, dir, dis)));
};



Level.Object = function(pos, radius) {
	this.pos = pos;
	this.radius = radius;
};



Level.Key = function(pos) {
	this.data = new Level.Object(pos, 50);

	this.getTag = function() {
		return "key";
	};

	this.draw = function() {
		drawing.drawCircle(this.data.pos.calcSub(g_g.camera), this.data.radius, function() {
			g_g.ctx.fillStyle   = "#fff";
			g_g.ctx.strokeStyle = "#fff";
			g_g.ctx.fill();
			g_g.ctx.stroke();
		});
	};

	this.drawIcon = function(pos, radius, drawFunc) {
		drawing.drawCircle(pos, radius, function() {
			drawFunc();
			g_g.ctx.fill();
		});
	}
};



Level.Orb = function(pos) {
	this.data = new Level.Object(pos, 25);

	this.getTag = function() {
		return "orb";
	};

	this.draw = function() {
		drawing.drawCircle(this.data.pos.calcSub(g_g.camera), this.data.radius, function() {
			g_g.ctx.fillStyle   = "#fff";
			g_g.ctx.strokeStyle = "#fff";
			g_g.ctx.fill();
			g_g.ctx.stroke();
		});
	};

	this.drawIcon = function(pos, radius, drawFunc) {
		if (drawing.calcShouldDraw(pos, radius, radius)) {
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

			g_g.ctx.closePath();
			drawFunc();
			g_g.ctx.fill();
		}
	}
};
