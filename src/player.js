Player = function() {
	this.points = [];
	this.radius = 50;

	this.pos = new trig.Coord(0, 0);
	this.dir = 0;
	this.speed = 4;
	this.speedRotate = trig.TAU / 60;

	var pointDepth = 5;
	this.offset = 0;
	this.offsetMax = Math.PI/pointDepth;

	this.points.push(Math.PI);
	for (var i = 1; i < pointDepth-1; ++i) {
		this.points.push(Math.PI + i*(this.offsetMax));
	}

	this.mouthPoint = Math.PI + (pointDepth-1)*(this.offsetMax);

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


	this.pos.move(this.dir, this.speed);

	this.offset += Math.PI / 200;
	if (this.offset >= this.offsetMax) {
		this.offset -= this.offsetMax;
	}
};


Player.prototype.draw = function() {
	var currentPoints = [];
	currentPoints.push(this.radial(Math.PI));

	for (var i = 0; i < this.points.length; ++i) {
		currentPoints.push(this.radial(this.points[i]+this.offset));
	}

	currentPoints.push(this.radial(this.mouthPoint));

	currentPoints.push(this.pos);

	currentPoints.push(this.radial(Math.PI + (Math.PI-(this.mouthPoint))));

	for (i = this.points.length-1; i >= 0; --i) {
		currentPoints.push(this.radial(Math.PI + (Math.PI-(this.points[i]+this.offset))));
	}

	if (randomRange(0, 1000) == 0)
		console.log(currentPoints);

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
		var disTo = this.pos.disTo(obj.pos);
		// Will actually be drawn.
		if (disTo > radiusDisappear) {
			var radius;
			var opacity = 1.0;
			var dirTo = this.pos.dirTo(obj.pos);

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

			g_g.ctx.beginPath();
			var pos = this.pos.calcSub(g_g.camera);
			pos.move(dirTo, distance);
			g_g.ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI, false);
			g_g.ctx.globalAlpha = opacity;
			g_g.ctx.fillStyle = "#fff";
			g_g.ctx.fill();

			g_g.ctx.globalAlpha = 1.0;
		}
	}
};


Player.prototype.radial = function(dir) {
	return this.pos.calcMove(this.dir+dir, this.radius);
};