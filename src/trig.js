trig = {};

trig.TAU = 2 * Math.PI;

// Coord
trig.Coord = function(x, y) {
  this.moveTo(x, y);
};

trig.Coord.prototype.moveTo = function(x, y) {
	this.x = x;
	this.y = y;
};

trig.Coord.prototype.resetPos = function(coord) {
	this.moveTo(coord.x, coord.y);
};

trig.Coord.prototype.move = function(radians, distance) {
  this.x += trig.moveX(radians, distance);
  this.y += trig.moveY(radians, distance);
};

trig.Coord.prototype.moveDelta = function(radians, distance) {
	this.move(radians, distance * g_g.delta);
};

trig.Coord.prototype.calcMove = function(radians, distance) {
  return new trig.Coord(
    this.x + trig.moveX(radians, distance),
    this.y + trig.moveY(radians, distance)
  );
};

trig.Coord.prototype.dirTo = function(otherCoord) {
  return trig.dirTo(this.x, this.y, otherCoord.x, otherCoord.y);
};

trig.Coord.prototype.disToSquared = function(otherCoord) {
  return trig.disToSquared(this.x, this.y, otherCoord.x, otherCoord.y);
};

trig.Coord.prototype.disTo = function(otherCoord) {
  return trig.disTo(this.x, this.y, otherCoord.x, otherCoord.y);
};

trig.Coord.prototype.collidingCircles = function(thisRadius, otherCoord, otherRadius) {
	return (this.disTo(otherCoord) <= thisRadius + otherRadius);
};

trig.Coord.prototype.add = function(otherCoord) {
  this.x += otherCoord.x;
  this.y += otherCoord.y;
};

trig.Coord.prototype.calcAdd = function(otherCoord) {
  return new trig.Coord(
    this.x + otherCoord.x,
    this.y + otherCoord.y
  );
};

trig.Coord.prototype.calcSub = function(otherCoord) {
  return new trig.Coord(
    this.x - otherCoord.x,
    this.y - otherCoord.y
  );
};


// Rect

trig.Rect = function(position, width, height) {
	this.pos = position;
	this.width = width;
	this.height = height;
};


// Conversions
trig.toRads = function(degrees) {
  return degrees * Math.PI / 180;
};

trig.toDegs = function(radians) {
  return 180 / Math.PI * radians;
};

trig.dirWithin = function(radians, margin) {
	return (Math.abs(radians)            <= margin ||
		      Math.abs(radians + trig.TAU) <= margin);
};


// Actual trig
trig.moveScalarX = function(radians) {
  return Math.cos(radians);
};

trig.moveScalarY = function(radians) {
  return Math.sin(radians)
};


trig.moveX = function(radians, distance) {
  return distance * trig.moveScalarX(radians);
};

trig.moveY = function(radians, distance) {
  return distance * trig.moveScalarY(radians);
};


trig.move = function(x, y, radians, distance) {
  return new trig.Coord(
    x + trig.moveX(radians, distance),
    y + trig.moveY(radians, distance)
  );
};


trig.dirTo = function(x1, y1, x2, y2) {
  var a = Math.atan2((y2-y1), (x2-x1));
  if (a < 0)
    a += 2*Math.PI;

  return a;
};


trig.disToSquared = function(x1, y1, x2, y2) {
  return Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2);
};

trig.disTo = function(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2));
};


trig.normalizeDir = function(radians) {
	while (radians >= trig.TAU)
		radians -= trig.TAU;

	while (radians < 0)
		radians += trig.TAU;

	return radians;
};


trig.randomDir = function() {
	return randomRangeReal(0, trig.TAU);
};