var calculateNoteFrequencies = function() {
  /*var noteFrequencies = {};
  var nextFrequency = 16.35;
  var rate = nextFrequency / 12;

  var noteNames = [
    'C', ['C#', 'Db'], 'D', ['D#', 'Eb'], 'E', 'F',
    ['F#', 'Gb'], 'G', ['G#', 'Ab'], 'A', ['A#', 'Bb'], 'B'
  ];

  for (i in noteNames) {
    if (typeof noteNames[i] === 'string') {
      noteFrequencies[noteNames[i]] = nextFrequency;
      nextFrequency += rate;
    }
    else {
      for (j in noteNames[i]) {
        noteFrequencies[noteNames[i][j]] = nextFrequency;
      }
      nextFrequency += rate;
    }
  }

C0  16.35 2109.89
C#0/Db0  17.32 1991.47
D0  18.35 1879.69
D#0/Eb0  19.45 1774.20
E0  20.60 1674.62
F0  21.83 1580.63
F#0/Gb0  23.12 1491.91
G0  24.50 1408.18
G#0/Ab0  25.96 1329.14
A0  27.50 1254.55
A#0/Bb0  29.14 1184.13
B0  30.87 1117.67

  return noteFrequencies;*/

  var noteFrequencies = {
    'C' : 16.35,
    
    'C#': 17.32,
    'Db': 17.32,
    
    'D' : 18.35,

    'D#': 19.45,
    'Eb': 19.45,

    'E' : 20.60,
    'F' : 21.83,

    'F#': 23.12,
    'Gb': 23.12,

    'G' : 24.50,

    'G#': 25.96,
    'Ab': 25.96,

    'A' : 27.50,

    'A#': 29.14,
    'Bb': 29.14,

    'B' : 30.87
  };

  return noteFrequencies;
};

var WAVE_FORMAT_PCM  = 0x0001;
var NOTE_FREQUENCIES = calculateNoteFrequencies();

var REST_TOKEN = 'R';


function base64(b) {
  // http://tools.ietf.org/html/rfc4648
  var map = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");
  var r = "";
  for (var i = 0; i < b.length; i += 3) {
    var bin = 0x000000;
    // FIXME with one loop
    bin |= b[i] << 16;
    if (i + 1 < b.length)
      bin |= b[i + 1] << 8;
    if (i + 2 < b.length)
      bin |= b[i + 2];
    // Converting
    var mask = 0xFC0000;
    for (var j = 0; j < 4; j++) {
      r += map[((bin & (0xFC0000 >> (j * 6))) >> ((3 - j) * 6))];
    }
  }
  var padding = (b.length % 3 > 0) ? "==".substring(b.length % 3 - 1, 2) : "";
  return r.substring(0, r.length - padding.length) + padding;
}


// Make Little Endian Bytestream String
function littleEdian(data, size) {
  s = '';
  while (size > 0) {
    s += String.fromCharCode(0xFF & data);
    data >>= 8;
    size--;
  }
  return s;
}



function saw(t, T) {
  //return 2.0 * (t / T - Math.floor(t / T + 0.5));
  var a = T / 2.0;
  return 2.0 * Math.abs(2.0 * (t / a - Math.floor(t / a + 0.5))) - 1.0;
}


var AudioEncoder = function(bpm, markupChannels) {
  this.markupChannels = markupChannels;
  this.waveType = 'Sawtooth';

  this.bpm          = bpm;
  this.beatType     = 4;
  this.noteDuration = 1.0 / ((this.bpm * this.beatType) / 60.0);  // In seconds

  this.sampleSize   = 1;
  this.sampleRate   = 8000;
  this.sampleDuration = 1.0 / this.sampleRate;

  this.channel = 0;
  this.index = 0;

  this.channelCount = this.markupChannels.length;
  this.volume = 0.0;
  this.datas = [];

  this.noteFrequencies = calculateNoteFrequencies();

  this.audio           = this.encode();
};

AudioEncoder.prototype.encode = function() {
  this.chunks = [];

  for (this.channel = 0; this.channel < this.markupChannels.length; ++this.channel) {
    this.encodePart();
  }

  var blockCount   = this.chunks.length;
  var channelBytes = this.sampleSize * this.channelCount;
  var chunkSize    = channelBytes * blockCount;

  console.log(this.chunks);
  console.log(this.datas);

  var pad = (blockCount % 2 == 1) ? ' ': '';
  // http://www-mmsp.ece.mcgill.ca/Documents/AudioFormats/WAVE/WAVE.html
  var s =
    // Chunk ID
    'RIFF' +
    // Chunk size
    littleEdian(4 + 24 + (8 + chunkSize + pad.length), 4) +
      // WAVE ID
      'WAVE' +
      // Chunk ID
      'fmt ' +
      // Chunk size
      littleEdian(16, 4) +
        // Wave format tag (WAVE_FORMAT_PCM)
        littleEdian(WAVE_FORMAT_PCM, 2) +
        // Number of channels (Nc)
        littleEdian(this.channelCount, 2) +
        // Number of samples per second (F)
        littleEdian(this.sampleRate, 4) +
        // Average number of bytes per second (F*M*Nc)
        littleEdian(this.sampleRate * channelBytes, 4) +
        // Number for block align
        littleEdian(channelBytes, 2) +
        // Number of bits per sample
        littleEdian(8 * this.sampleSize, 2) +
      // Chunk ID
      'data' +
      // Chunk size (M*Nc*Ns)
      littleEdian(chunkSize, 4);

  var bs = [];
  for (var i = 0; i < s.length; i++) {
    bs.push(s.charCodeAt(i));
  }
  bs = bs.concat(this.chunks);
  if (pad.length > 0)
    bs.push(0x00);

  return new Audio('data:audio/wav;base64,' + base64(bs));
};

AudioEncoder.prototype.encodePart = function() {
  var noteCollection = [];
  var addTo = false;

  var s = this.markupChannels[this.channel];
  this.index = this.channel;

  for (var i = 0; i < s.length; ++i) {
    if (s[i] == '|') {
      addTo = true;
      ++i;
    }

    var note = s[i];
    var frequency = 0;

    if (note != REST_TOKEN) {
      ++i;
      if (s[i] == '#' || s[i] == 'b') {
        note += s[i];
        ++i;
      }

      var octave = parseInt(s[i]);

      frequency = NOTE_FREQUENCIES[note] * Math.pow(2, octave);
    }

    // Skip over the ':' indicator.
    i += 2;


    // The denominator of the note type.
    var type = s[i];

    ++i;

    while (s[i] != ' ' && s[i] != '|' && i < s.length) {
      type += s[i];
      ++i;
    }

    var duration = this.noteDuration / parseInt(type);

    if (addTo) {
      noteCollection.push(frequency);

      if (s[i] == '|') {
        addTo = false;
        var sum = noteCollection.reduce(function(a, b) { return a + b; });
        frequency = sum / noteCollection.length;
        noteCollection = [];
        ++i;
      }
    }

    if (!addTo) {
      this.encodeNote(frequency, duration);
    }

    console.log(note);
  }
};

AudioEncoder.prototype.encodeNote = function(frequency, duration) {
  //console.log([frequency, duration]);
  var period = 1.0 / frequency;

  // var SamplesPerPeriod = Math.floor(duration * period);

  var dataPointCount = Math.floor(this.sampleRate * duration);
  // var pointCoefficient = 2.0 * Math.PI * frequency * sampleDuration;

  for (var i = 0; i < dataPointCount; i++) {
    switch (this.waveType) {
      /*case 'Sine':
        data.push(Math.floor(127.5 * Math.sin(i * pointCoefficient) + 127.5));
        break;
      case 'Square':
        data.push(Math.floor(127.5 * square(i * pointCoefficient) + 127.5));
        break;
      case 'Triangle':
        data.push(Math.floor(127.5 * tri(i * sampleDuration, period) + 127.5));
        break;*/
      case 'Sawtooth':
        //console.log(i);
        this.addData(Math.floor(127.5 * saw(i * this.sampleDuration, period) + 127.5)*2);
        break;
    }
  }
};

AudioEncoder.prototype.addData = function(value) {
  var length = this.chunks.length;
  while (length <= this.index) {
    //console.log([this.chunks.length, this.index]);
    this.chunks.push(0);
    ++length;
  }

  this.chunks[this.index] = this.adjustForVolume(value);
  if (this.datas.length <= this.channel)
    this.datas.push([]);
  this.datas[this.channel].push(this.adjustForVolume(value));
  //console.log("done");

  this.index += this.channelCount;
};

AudioEncoder.prototype.adjustForVolume = function(value) {
  /*var toReturn = Math.pow(10, (-48 + 54 * this.volume / 100.0) / 20.0) * value;
  console.log(toReturn);
  console.log(value);
  return toReturn;*/
  //return value*this.volume;
  var toReturn = Math.pow(2.0, this.volume / 6.014) * value;
  //console.log(toReturn);
  return toReturn;
};

/*var audios = [];
audios.push('R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 A6:16 R:16 D6:16 R:16 A6:16 R:16 D6:16 R:16 G6:16 R:16 C6:16 R:16 G6:16 R:16 B5:16 R:16 A6:16 R:16 D6:16 R:16 A6:16 R:16 D6:16 R:16 G6:16 R:16 C6:16 R:16 G6:16 R:16 B5:16 R:16 A6:16 R:16 D6:16 R:16 A6:16 R:16 D6:16 R:16 G6:16 R:16 C6:16 R:16 G6:16 R:16 B5:16 R:16 A6:16 R:16 D6:16 R:16 A6:16 R:16 D6:16 R:16 G6:16 R:16 C6:16 R:16 G6:16 R:16 B5:16 R:16 A6:16 R:16 D6:16 R:16 A6:16 R:16 D6:16 R:16 G6:16 R:16 C6:16 R:16 G6:16 R:16 B5:16 R:16 A6:16 R:16 D6:16 R:16 A6:16 R:16 D6:16 R:16 G6:16 R:16 C6:16 R:16 G6:16 R:16 B5:16 R:16 A6:16 R:16 D6:16 R:16 A6:16 R:16 D6:16 R:16 G6:16 R:16 C6:16 R:16 G6:16 R:16 B5:16 R:16 A6:16 R:16 D6:16 R:16 A6:16 R:16 D6:16 R:16 G6:16 R:16 C6:16 R:16 G6:16 R:16 B5:16 R:16');
audios.push('R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 A4:16 F4:16 E4:16 F4:16 G4:16 F4:16 E4:16 F4:16 A4:16 F4:16 E4:16 F4:16 G4:16 F4:16 E4:16 F4:16 A4:16 F4:16 E4:16 F4:16 G4:16 F4:16 E4:16 F4:16 A4:16 F4:16 E4:16 F4:16 G4:16 F4:16 E4:16 F4:16 A4:16 F4:16 E4:16 F4:16 G4:16 F4:16 E4:16 F4:16 A4:16 F4:16 E4:16 F4:16 G4:16 F4:16 E4:16 F4:16 A4:16 F4:16 E4:16 F4:16 G4:16 F4:16 E4:16 F4:16 A4:16 F4:16 E4:16 F4:16 G4:16 F4:16 E4:16 F4:16 A4:16 F4:16 E4:16 F4:16 G4:16 F4:16 E4:16 F4:16 A4:16 F4:16 E4:16 F4:16 G4:16 F4:16 E4:16 F4:16 A4:16 F4:16 E4:16 F4:16 G4:16 F4:16 E4:16 F4:16 A4:16 F4:16 E4:16 F4:16 G4:16 F4:16 E4:16 F4:16 A4:16 F4:16 E4:16 F4:16 G4:16 F4:16 E4:16 F4:16 A4:16 F4:16 E4:16 F4:16 G4:16 F4:16 E4:16 F4:16 A4:16 F4:16 E4:16 F4:16 G4:16 F4:16 E4:16 F4:16 A4:16 F4:16 E4:16 F4:16 G4:16 F4:16 E4:16 F4:16 A4:16 F4:16 E4:16 F4:16 G4:16 F4:16 E4:16 F4:16 A4:16 F4:16 E4:16 F4:16 G4:16 F4:16 E4:16 F4:16 A4:16 F4:16 E4:16 F4:16 G4:16 F4:16 E4:16 F4:16 A4:16 F4:16 E4:16 F4:16 G4:16 F4:16 E4:16 F4:16 A4:16 F4:16 E4:16 F4:16 G4:16 F4:16 E4:16 F4:16 A4:16 F4:16 E4:16 F4:16 G4:16 F4:16 E4:16 F4:16 A4:16 F4:16 E4:16 F4:16 G4:16 F4:16 E4:16 F4:16 A4:16 F4:16 E4:16 F4:16 G4:16 F4:16 E4:16 F4:16 A4:16 F4:16 E4:16 F4:16 G4:16 F4:16 E4:16 F4:16 A4:16 F4:16 E4:16 F4:16 G4:16 F4:16 E4:16 F4:16 A4:16 F4:16 E4:16 F4:16 G4:16 F4:16 E4:16 F4:16 A4:16 F4:16 E4:16 F4:16 G4:16 F4:16 E4:16 F4:16 A4:16 F4:16 E4:16 F4:16 G4:16 F4:16 E4:16 F4:16 A4:16 F4:16 E4:16 F4:16 G4:16 F4:16 E4:16 F4:16 A4:16 F4:16 E4:16 F4:16 G4:16 F4:16 E4:16 F4:16 A4:16 F4:16 E4:16 F4:16 G4:16 F4:16 E4:16 F4:16');
audios.push('R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8 D6:16 R:16 R:8 D6:16 R:16 R:8 C6:16 R:16 R:8 B5:16 R:16 R:8');
audios.push('R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16 A5:16 F5:16 D5:16 F5:16 G5:16 F5:16 E5:16 F5:16');
audios.push('D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 D5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16 C5:16 A4:16 D4:16 A4:16');
audios.push('D3:1 D3:1 C3:1 C3:1 Bb2:1 Bb2:1 C3:1 C3:1 D3:1 D3:1 C3:1 C3:1 Bb2:1 Bb2:1 C3:1 C3:1 D3:1 D3:1 C3:1 C3:1 Bb2:1 Bb2:1 C3:1 C3:1 D3:1 D3:1 C3:1 C3:1 Bb2:1 Bb2:1 C3:1 C3:1 D3:1 D3:1 C3:1 C3:1 Bb2:1 Bb2:1 C3:1 C3:1 D3:1 D3:1 C3:1 C3:1 Bb2:1 Bb2:1 C3:1 C3:1 D3:1 D3:1 C3:1 C3:1 Bb2:1 Bb2:1 C3:1 C3:1');
audios.push('R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 D2:1 D2:1 C2:1 C2:1 B1:1 B1:1 C2:1 C2:1 D2:1 D2:1 C2:1 C2:1 B1:1 B1:1 C2:1 C2:1 D2:1 D2:1 C2:1 C2:1 B1:1 B1:1 C2:1 C2:1 D2:1 D2:1 C2:1 C2:1 B1:1 B1:1 C2:1 C2:1');
audios.push('R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 R:1 A2:1 A2:1 G2:1 G2:1 F2:1 F2:1 G2:1 G2:1 A2:1 A2:1 G2:1 G2:1 F2:1 F2:1 G2:1 G2:1 A2:1 A2:1 G2:1 G2:1 F2:1 F2:1 G2:1 G2:1');
//audios.push('C5:1 C5:1 B5:1 B5:1')

encoder = new AudioEncoder(132/16., audios);
//encoder = new AudioEncoder(132, ['C4:1', 'D2:1']);
//encoder1 = new AudioEncoder(132/16., [audios[0]]);
//encoder2 = new AudioEncoder(132/16., [audios[1]]);
//encoder3 = new AudioEncoder(132/16., [audios[2]]);
encoder.audio.play();
//encoder1.audio.play();
//encoder2.audio.play();
//encoder3.audio.play();*/