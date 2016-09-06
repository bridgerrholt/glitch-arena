var g_g = {};

function main() {
  // Frame rate.
  g_g.frameRate = 60;
  g_g.fps       = g_g.frameRate;
  g_g.lastTick  = new Date;
  g_g.thisTick  = new Date;
  g_g.delta     = 60/g_g.frameRate;

  // The game canvas.
  g_g.canvas        = document.getElementById('game');
  g_g.ctx           = g_g.canvas.getContext('2d');
  g_g.canvas.width  = window.innerWidth;
  g_g.canvas.height = window.innerHeight;
  g_g.canvasW       = g_g.canvas.width;
  g_g.canvasH       = g_g.canvas.height;

  g_g.camera = new trig.Coord(0, 0);

  g_g.mouse = new trig.Coord(0, 0);

  var audioEncoder = new AudioEncoder(132/16./4, ['C4:16 C4:16 Eb4:16 E4:16 G3:16 G3:16 G3:16 G3:16 D4:16 D4:16 F4:16 F4:16 G3:16 G3:16 G3:16 G3:16 Eb4:16 E4:16 G4:16 G4:16 Ab4:16 G4:16 A4:16 G4:16 A4:16 G4:16 A4:16 G4:16 Bb4:16 G4:16 E4:16 D4:16']);
  audioEncoder.audio.addEventListener('ended', function() {
      this.currentTime = 0;
      this.play();
  }, false);
  //audioEncoder.audio.play();


  // Sets up everything.
  setInputCallbacks();
  loadMedia();
  reset();


  // Sets up the game loop.
  if (typeof g_g.gameLoop != "undefined")
    clearInterval(g_g.gameLoop);
  g_g.gameLoop = setInterval(update, 1000/g_g.frameRate);
}

function update() {
  g_g.particleSystem.update();
  g_g.player.update();



  g_g.camera.x = g_g.player.pos.x - g_g.canvas.width/2;
  g_g.camera.y = g_g.player.pos.y - g_g.canvas.height/2;

  // Draw
  g_g.ctx.fillStyle = "#000";
  g_g.ctx.fillRect(0, 0, g_g.canvas.width, g_g.canvas.height);

  /*for (var i = 0; i < 100; ++i) {
    var r = randomRange(2, 5);
    var x = randomRange(0, g_g.canvas.width - r);
    var y = randomRange(0, g_g.canvas.height - r);
    var color = "#fff";

    g_g.ctx.fillStyle = color;
    g_g.ctx.fillRect(x, y, x+r, x+r);
  }*/

  g_g.particleSystem.draw();
  g_g.player.draw();
}

function reset() {
  g_g.player = new Player();
  g_g.particleSystem = new ParticleSystem();
  g_g.glitchness = 1;
}

function setInputCallbacks() {
  
}

function loadMedia() {

}


function screenX(x) {
  return x - g_g.camera.x;
}

function screenY(y) {
  return y - g_g.camera.y;
}

function realX(x) {
  return x + g_g.camera.x;
}

function realY(y) {
  return y + g_g.camera.y;
}


// Player
Player = function() {
  this.points = [];
  this.radius = 50;

  this.pos = new trig.Coord(0, 0);
  this.dir = 0;
  this.speed = 4;

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
}

Player.prototype.update = function() {
  this.dir = this.pos.calcSub(g_g.camera).dirTo(g_g.mouse);

  this.pos.move(this.dir, this.speed);

  this.offset += Math.PI/200;
  if (this.offset >= this.offsetMax) {
    this.offset -= this.offsetMax;
  }
}

Player.prototype.draw = function() {
  var currentPoints = [];
  currentPoints.push(this.radial(Math.PI));

  for (var i = 0; i < this.points.length; ++i) {
    currentPoints.push(this.radial(this.points[i]+this.offset));
  }

  currentPoints.push(this.radial(this.mouthPoint));

  currentPoints.push(this.pos);

  currentPoints.push(this.radial(Math.PI + (Math.PI-(this.mouthPoint))));

  for (var i = this.points.length-1; i >= 0; --i) {
    currentPoints.push(this.radial(Math.PI + (Math.PI-(this.points[i]+this.offset))));
  }

  if (randomRange(0, 1000) == 0)
    console.log(currentPoints);

  g_g.ctx.strokeStyle = "#fff";
  g_g.ctx.fillStyle = "#fff";
  g_g.ctx.lineWidth = 1;
  g_g.ctx.beginPath();
  g_g.ctx.moveTo(screenX(currentPoints[0].x), screenY(currentPoints[0].y));
  for (var i = 1; i < currentPoints.length; ++i) {
    g_g.ctx.lineTo(screenX(currentPoints[i].x), screenY(currentPoints[i].y));
  }
  g_g.ctx.lineTo(screenX(currentPoints[0].x), screenY(currentPoints[0].y));
  g_g.ctx.fill();
  g_g.ctx.stroke();
}

Player.prototype.radial = function(dir) {
  return this.pos.calcMove(this.dir+dir, this.radius);
}



// ParticleSystem

class ParticleSystem
{
  constructor() {
    this.particles = [];
    this.count     = 100;
    for (var i = 0; i < this.count; ++i) {
      this.particles.push(new Particle());
    }
  }

  update() {
    loopCall(this.particles, "update");

    if (this.particles.length < this.count && randomRange(0, 10) == 0) {
      this.particles.push(new Particle());
    }
  }

  draw() {
    loopCall(this.particles, "draw");
  }

}

  
class Particle
{
  constructor() {
    this.init();
  }

  init() {
    this.x = randomRange(0, g_g.canvas.width)  + g_g.camera.x - g_g.canvas.width/2;
    this.y = randomRange(0, g_g.canvas.height) + g_g.camera.y - g_g.canvas.height/2;
    this.size = randomRange(2, 6);
    this.w = 1;
    this.h = 1;
    this.color = new RgbColor(
      randomRange(0, 256),
      randomRange(0, 256),
      randomRange(0, 256)
    );
    this.deathTick = randomRange(100, 2000);
    //console.log([this.x, this.y, this.size]);
  }

  update() {
    if (randomRange(0, 60) == 0)
      this.size = randomRange(2, 6);
    --this.deathTick;
    if (this.deathTick == 0)
      this.init();
    if (randomRange(0, 300) == 0) {
      if (randomRange(0, 2) == 0)
        this.w += 1;
      else
        this.h += 1;
    }
  }

  draw() {
    var x = screenX(this.x);
    var y = screenY(this.y);

    while (x < 0) {
      x += g_g.canvas.width;
    }
    while (x > g_g.canvas.width) {
      x -= g_g.canvas.width;
    }

    while (y < 0) {
      y += g_g.canvas.height;
    }
    while (y > g_g.canvas.height) {
      y -= g_g.canvas.height;
    }

    g_g.ctx.fillStyle = this.color.get();
    g_g.ctx.fillRect(x, y, this.size+this.w, this.size+this.h);
    //console.log(this.color);
  }
}


// Common

class RgbColor
{
  constructor(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
  }

  get() {
    return "rgb(" + this.r.toString() + "," + this.g.toString() + "," + this.b.toString() + ")";
  }
}


function randomRange(min, max) {
  return Math.floor(Math.random() * (max + 1 - min) + min); 
}

function loopCall(arr, functionName) {
  for (var i = 0; i < arr.length; ++i) {
    arr[i][functionName]();
  }
}



// Events
document.addEventListener("mousemove", function(evt) {
  var rect = g_g.canvas.getBoundingClientRect();
  g_g.mouse.x = evt.clientX-rect.left;
  g_g.mouse.y = evt.clientY-rect.top;
  //var message = 'Mouse position: ' + g_g.mouse.x + ',' + g_g.mouse.y;
  //console.log(message);
}, false);



// Must be at bottom.
main();