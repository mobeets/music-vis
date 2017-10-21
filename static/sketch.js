var mic, fft, pos, vel, A, B, c, trgPos;
var gain = 0.005;
var canvasWidth = 900;
var canvasHeight = 600;
var circRadius = 25;
var score = 0;
var ntrials = 0;
var cursorTrace;
var cursorTraces;
var cursorTracesColors;
var spectrumSmoothing = 0.8; // between 0.0 and 1.0
var spectrumBins = 1024; // 2^k for k between 4 and 10
var spectrum;
var userInput;
// var nInputDims = 1024; // spectrum.length
var nInputDims = 32;
var showCheat = false;

var pdClrInds; // for cheating
var trgRadius = 50;
var trgDistance = 200;
var curTrgInd = 0;
var curTrgClr = 0;
var iterCount = 0;
var trgAngs = new Array(0, 45, 90, 135, 180, 225, 270, 315);
var trgClrs = [[0.8431,0.1882,0.1529],
   [0.9569,0.4275,0.2627],
   [0.9922,0.6824,0.3804],
   [0.9961,0.8784,0.5451],
   [0.8510,0.9373,0.5451],
   [0.6510,0.8510,0.4157],
   [0.4000,0.7412,0.3882],
   [0.1020,0.5961,0.3137]];
var histLow;
var histMid;
var histTreb;
var curOpt = 0;
var sinDiv = 50;

function setup() {
   var canvas = createCanvas(canvasWidth, canvasHeight);
   canvas.parent('sketch-container');
   noFill();
   textFont('Georgia');

   // monitor microphone input
   mic = new p5.AudioIn();
   mic.start();
   fft = new p5.FFT(spectrumSmoothing, spectrumBins);
   fft.setInput(mic);

   cursorTraces = new Array();
   cursorTracesColors = new Array();

   histLow = new Array();
   histMid = new Array();
   histTreb = new Array();
   for (var j=0; j++; j<360){
      append(histLow[j], 0);
      append(histMid[j], 0);
      append(histTreb[j], 0);
   }

   // initialize experiment
   startNewExperiment();
}

function startNewExperiment() {
   setDecoder();
   startNewTrial(false);
   score = 0;
   ntrials = 0;
}

function setDecoder() {
   c = createVector(0, 0);
   A = [createVector(0.5, 0), createVector(0, 0.5)];
   B = new Array();

   var nextMax = -2;
   var j = -1;
   var pdInds = new Array(); // pushing directions
   pdInds = new Array(0, 1, 2, 3, 4, 5, 6, 7);
   pdInds = shuffle(pdInds);
   var pd;
   pdClrInds = new Array();
   // angs = new Array();
   for (i = 0; i<nInputDims; i++) {
      if (i > nextMax) { // move to next quadrant
         j = j + 1;
         nextMax = random(i+2, i+4); // index of next quadrant change
      }
      if (j == pdInds.length) {
         j = 0;
         pdInds = shuffle(pdInds);
      }
      pd = trgAngs[pdInds[j]]; // current quadrant
      pd = pd + random(-10, 10); // add jitter
      pdClrInds = concat(pdClrInds, pdInds[j]);
      ang = pd*PI/180; // convert to radians
      B = concat(B, createVector(cos(ang), sin(ang)));
   }
}

function getNextTraceColor() {
   // var c = color(0, random(128, 255), random(128, 255));
   var c = color(10*iterCount % 255, 0, 0);
   return c;
}

function startNewTrial(isSuccess) {
   pos = createVector(canvasWidth/2.0,canvasHeight/2.0);
   vel = createVector(0,0);
   trgPos = setRandomTarget();
   cursorTrace = new Array();
   append(cursorTraces, cursorTrace);

   nextColor = getNextTraceColor();
   append(cursorTracesColors, nextColor);

   if (isSuccess) {
      score = score + 1;
   }
   ntrials = ntrials + 1;

   setDecoder();
}

function draw() {

   // draw target, cursor history, and score
   background(255);
   // showTarget();   
   // showScore();

   // display processed mic input
   getAndShowInput();

   // update decoder with mic input
   iterCount += 1;
   if (curOpt == 0) {
      drawWave();
   } else {
      showCursorHistory();
      drawBg();
      updateAndDrawCursor();
   }
   // checkIfCursorAcquiredTarget();   

}

function drawWave() {

   var curInd = iterCount % 360;

   d = color(0, 180, 128);
   stroke(d);

   histLow[(iterCount) % 360] = fft.getEnergy('bass');
   histMid[(iterCount + 45) % 360] = fft.getEnergy('mid');
   histTreb[(iterCount + 180) % 360] = fft.getEnergy('treble');

   hists = [histLow, histMid, histTreb];

   for (i=0; i<3; i++) {
      d = color(i*50 + 100, 0, 0);
      stroke(d);

      prevHist = hists[(i+1)%3];
      hist = hists[i];

      cx = canvasWidth/2;
      cy = canvasHeight/2;
      var firstPt;
      
      beginShape();
      for (j = 0; j < 362; j++) {
         // var prevr = 1*prevHist[j % prevHist.length] + 10*sin((j+iterCount)/100);
         var prevr = prevHist[j % prevHist.length] + 10*sin((j % prevHist.length)/sinDiv);

         var pind = (j-1) % hist.length;
         var nind = (j+1) % hist.length;
         var ind = j % hist.length;

         pwav = 10*sin((pind+iterCount)/sinDiv);
         nwav = 10*sin((nind+iterCount)/sinDiv);
         wav = 10*sin((ind+iterCount)/sinDiv);

         var pr = 1*hist[pind];
         var nr = 1*hist[nind];
         var r = 1*hist[ind];

         r = (pr+nr+r)/3 + (pwav+wav+nwav)/3;
         r += prevr + 1;

         ccx = cx + r*cos(j*PI/180);
         ccy = cy + r*sin(j*PI/180);
         vertex(ccx, ccy);
      }
      endShape();
   }
}

function drawBg() {
   // for (j = minInd; j<userInput.length; j++) {
   //    iterCount += userInput[j]/1000;
   // }
   // iterCount = iterCount % 10000;
   
   var c = color(255, 180, 0);
   stroke(c);
   
   iterStep = iterCount*500*gain;

   power = 2;
   maxRadius = pow(1000, power);
   maxWidth = 1.2*canvasWidth;

   startArc = 0.05*iterCount % TWO_PI;
   endArc = startArc + (0.05*iterCount % TWO_PI);
   startArc = 0;
   endArc = 10;

   arcRadius = pow((iterStep % 1000), power);
   arc(canvasWidth/2, canvasHeight/2, map(arcRadius, 0, maxRadius, 0, maxWidth), map(arcRadius, 0, maxRadius, 0, maxWidth), map(startArc, 0, 10, 0, TWO_PI), map(endArc, 0, 10, 0, TWO_PI));

   arcRadius = pow((iterStep + 333) % 1000, power);
   arc(canvasWidth/2, canvasHeight/2, map(arcRadius, 0, maxRadius, 0, maxWidth), map(arcRadius, 0, maxRadius, 0, maxWidth), map(startArc, 0, 10, 0, TWO_PI), map(endArc, 0, 10, 0, TWO_PI));

   arcRadius = pow((iterStep + 666) % 1000, power);
   arc(canvasWidth/2, canvasHeight/2, map(arcRadius, 0, maxRadius, 0, maxWidth), map(arcRadius, 0, maxRadius, 0, maxWidth), map(startArc, 0, 10, 0, TWO_PI), map(endArc, 0, 10, 0, TWO_PI));
}

function getAndShowInput() {
   spectrum = fft.analyze(spectrumBins);
   noFill();
   var c = color(255, 187, 0);
   stroke(c);
   strokeWeight(2);

   var amps = fft.logAverages(fft.getOctaveBands(3));
   // beginShape();
   // for (i = 0; i<amps.length; i++) {      
   //    var vx = map(i, 0, amps.length, 0, width);
   //    vertex(vx, map(amps[i], 0, 255, height, height/2));
   // }
   // endShape();
   userInput = amps;
}

function getColorFromInd(cursorTraces, j, minInd) {
   div = 255/cursorTraces.length;

   rval = div*(j+1);
   rval = 255;
   alpha = 255*(j-minInd+1)/(cursorTraces.length-minInd);//div*j;

   var curc = cursorTracesColors[j];
   var c = color(red(curc), green(curc), blue(curc), alpha);
   // c.alpha(alpha);
   return c;
}

function showCursorHistory() {
   noFill();
   stroke(0);

   maxTraces = 10;
   minInd = max(0, cursorTraces.length - maxTraces);

   for (j = minInd; j<cursorTraces.length; j++) {
      var c = getColorFromInd(cursorTraces, j, minInd);
      stroke(c);
      beginShape();
      for (i = 0; i<cursorTraces[j].length; i++) {
         vertex(cursorTraces[j][i].x, cursorTraces[j][i].y);
      }
      endShape();
   }

   for (j = minInd; j<cursorTraces.length; j++) {
      var c = getColorFromInd(cursorTraces, j, minInd);
      stroke(c);
      beginShape();
      for (i = 0; i<cursorTraces[j].length; i++) {
         vertex(cursorTraces[j][i].x, canvasHeight-cursorTraces[j][i].y);
      }
      endShape();
   }

   for (j = minInd; j<cursorTraces.length; j++) {
      var c = getColorFromInd(cursorTraces, j, minInd);
      stroke(c);
      beginShape();
      for (i = 0; i<cursorTraces[j].length; i++) {
         vertex(canvasWidth-cursorTraces[j][i].x, canvasHeight-cursorTraces[j][i].y);
      }
      endShape();
   }

   for (j = minInd; j<cursorTraces.length; j++) {
      var c = getColorFromInd(cursorTraces, j, minInd);
      stroke(c);
      beginShape();
      for (i = 0; i<cursorTraces[j].length; i++) {
         vertex(canvasWidth-cursorTraces[j][i].x, cursorTraces[j][i].y);
      }
      endShape();
   }

}

function updateAndDrawCursor() {
   vel = updateCursorVel(userInput, vel, A, B, c);
   pos = updateCursorPos(pos, vel, gain);
   resetIfHitBoundary();

   // draw cursor
   // var clr = color(121, 141, 224);
   // fill(clr);
   // noStroke();
   // ellipse(pos.x, pos.y, circRadius); // x, y, w, h
}

function showTarget() {
   var clr = color(255*curTrgClr[0], 255*curTrgClr[1], 255*curTrgClr[2]);
   fill(clr);
   noStroke();
   ellipse(trgPos.x, trgPos.y, trgRadius); // x, y, w, h
}

function setRandomTarget() {
   curTrgInd = random([0,1,2,3,4,5,6,7]);
   var angle = trgAngs[curTrgInd]*PI/180;
   curTrgClr = trgClrs[curTrgInd];
   trgPos = createVector(cos(angle), sin(angle));
   trgPos.mult(trgDistance);
   trgPos.add(canvasWidth/2.0, canvasHeight/2.0);
   return trgPos;
}

function updateCursorVel(spectrum, vel, A, B, c) {
   // vel[t] = A*vel[t-1] + B*spectrum + c

   // compute A*vel[t-1]
   var velx = p5.Vector.dot(A[0], vel);
   var vely = p5.Vector.dot(A[1], vel);
   var velNext = createVector(velx, vely);

   // compute B*spectrum
   for (i = 0; i<spectrum.length; i++) {
      velNext.add(p5.Vector.mult(B[i], spectrum[i]));
   }

   velNext.add(c);
   return velNext;
}

function updateCursorPos(pos, vel, gain) {
   pos = p5.Vector.add(pos, p5.Vector.mult(vel, gain));
   var curPos = createVector(pos.x, pos.y)
   append(cursorTrace, curPos);
   return pos;
}

function resetIfHitBoundary() {
   if (pos.x < 0 || pos.x > canvasWidth || pos.y < 0 || pos.y > canvasHeight) {
      startNewTrial(false);
   }
}

function checkIfCursorAcquiredTarget() {
   var d = dist(pos.x, pos.y, trgPos.x, trgPos.y);
   if (d < circRadius/2 + trgRadius/2) {
      var clr = color(100, 54, 50);
      fill(clr);
      noStroke();
      ellipse(trgPos.x, trgPos.y, trgRadius);
      startNewTrial(true);
   }
}

function showScore() {
  textSize(16);
  fill(0);
  strokeWeight(1);
  var msg = "Score: " + score.toString() + " out of " + ntrials.toString();
  text(msg, 15, 15);
}

function mouseClicked() {
   startNewExperiment();
}

function keyPressed() {
   if (keyCode === RIGHT_ARROW) {
      startNewTrial(false);
      curOpt = (curOpt + 1) % 2;
   }
   if (keyCode === UP_ARROW) {
      sinDiv = min(sinDiv + 5, 200);
      gain = min(gain + 0.0005, 1.0);
   }
   if (keyCode === DOWN_ARROW) {
      sinDiv = max(sinDiv - 5, 1);
      gain = max(gain - 0.0005, 0.00001);
   }
}
