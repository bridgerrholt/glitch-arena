Level = function() {
	this.objects = [];

	this.objects.push(new Level.Key(0, 0));
};

Level.prototype.update = function() {

};

Level.prototype.draw = function() {

};



Level.Object = function(x, y, radius) {
	this.getTag = function() {
		return "none";
	};

	this.pos = new trig.Coord(x, y);
	this.radius = radius;
};



Level.Key = function(x, y) {
	Level.Object.apply(this, [x, y, 5]);

	this.getTag = function() {
		return "key";
	};
};

Level.Key.prototype = new Level();



Level.Orb = function(x, y) {
	Level.Object.apply(this, [x, y, 5]);

	this.getTag = function() {
		return "orb";
	};
};

Level.Orb.prototype = new Level();
