// Line thickness should be set before function calls for accurate draw calculation.

drawing = {};

drawing.calcShouldDrawX = function(x, halfWidth) {
	return (x >= -halfWidth && x <= g_g.canvas.width+halfWidth);
};

drawing.calcShouldDrawY = function(y, halfHeight) {
	return (y >= -halfHeight && y <= g_g.canvas.height+halfHeight);
};

drawing.calcShouldDraw = function(coord, halfWidth, halfHeight) {
	return (drawing.calcShouldDrawX(coord.x, halfWidth) &&
	        drawing.calcShouldDrawY(coord.y, halfHeight));
};

drawing.calcShouldDrawCircle = function(coord, radius) {
	return drawing.calcShouldDraw(coord, radius, radius);
};

// Doesn't actually draw, just strokes the arc. drawFunc is called after the arc.
drawing.drawCircle = function(coord, radius, drawFunc) {
	var fullRadius = radius + g_g.ctx.lineWidth / 2.0;
	if (drawing.calcShouldDrawCircle(coord, fullRadius)) {
		drawing.drawCircleForced(coord, radius);
		drawFunc();
	}
};

drawing.drawCircleForced = function(coord, radius) {
	g_g.ctx.beginPath();
	g_g.ctx.arc(coord.x, coord.y, radius, 0, 2 * Math.PI, false);
};