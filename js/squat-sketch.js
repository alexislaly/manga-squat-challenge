/*
 *   Manga SQUAT Challenge
 *
 *   alexis.laly@univ-reims.fr
 *   olivier.nocent@univ-reims.fr
 */

let capture;
let captureReady = false;
let captureScaleFactor, captureOffsetX;

let bodyPose;
let pose;

let squatCounter = 0;
let squatDone = false;

let leftEmitter, rightEmitter;

let level = [
  {
    value: 0,
    hair: undefined,
    ratio: 475 / 714,
    offset: 0.9
  },
  {
    value: 5,
    hair: undefined,
    ratio: 365 / 316,
    offset: 1.1
  },
  {
    value: 15,
    hair: undefined,
    ratio: 365 / 316,
    offset: 1.1
  },
  {
    value: 30,
    hair: undefined,
    ratio: 365 / 316,
    offset: 1.1
  },
  {
    value: 50,
    hair: undefined,
    ratio: 365 / 316,
    offset: 1.1
  },
  {
    value: 75,
    hair: undefined,
    ratio: 365 / 316,
    offset: 1.1
  },
  {
    value: 100,
    hair: undefined,
    ratio: 365 / 316,
    offset: 1.1
  },
  {
    value: 10000,
    hair: undefined,
    ratio: 365 / 316,
    offset: 1.1
  },
];
let currentLevel = 0;

function preload() {
  // Charger les images depuis les URLs fournies
  level[0].hair = loadImage("img/hair/black.png");
  level[0].color = color(0);
  level[1].hair = loadImage("img/hair/gold.png");
  level[1].color = color(255, 240, 0);
  level[2].hair = loadImage("img/hair/red.png");
  level[2].color = color(255, 20, 0);
  level[3].hair = loadImage("img/hair/pink.png");
  level[3].color = color(255, 10, 255);
  level[4].hair = loadImage("img/hair/blue.png");
  level[4].color = color(10, 40, 255);
  level[5].hair = loadImage("img/hair/green.png");
  level[5].color = color(10, 255, 30);
  level[6].hair = loadImage("img/hair/silver.png");
  level[6].color = color(200);
}

// When the model is loaded
function modelLoaded() {
  console.log("Model Loaded!");

  // Start detecting poses in the webcam video
  bodyPose.detectStart(capture, gotPoses);
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("canvas");

  colorMode(RGB, 255, 255, 255, 1);

  let constraints = {
    video: {
      facingMode: "environment", // "user", "environment"
    },
    audio: false,
  };
  capture = createCapture(constraints, () => {
    captureReady = true;
    captureScaleFactor = height / capture.height;
    captureOffsetX = (width - capture.width * captureScaleFactor) / 2;

    // Load the bodyPose model
    let poseOptions = {
      modelType: "SINGLEPOSE_THUNDER", // "MULTIPOSE_LIGHTNING", "SINGLEPOSE_LIGHTNING", or "SINGLEPOSE_THUNDER".
      enableSmoothing: true,
      minPoseScore: 0.25,
      multiPoseMaxDimension: 256,
      enableTracking: true,
      trackerType: "boundingBox", // "keypoint" or "boundingBox"
      trackerConfig: {},
      modelUrl: undefined,
      flipped: false,
    };
    bodyPose = ml5.bodyPose(poseOptions, modelLoaded);
  });
  capture.hide();

  leftEmitter = new ParticleSystem(createVector(0, 0), createVector(0, height), -1);
  rightEmitter = new ParticleSystem(createVector(0, width), createVector(width, height), 1);
}

// Callback function for when bodyPose outputs data
function gotPoses(results) {
  // Save the output to the pose variable
  pose = results[0];
  if (pose) document.querySelector("#loading").style.display = "none";
}

function distance(pointA, pointB) {
  return Math.sqrt(
    Math.pow(pointA.x - pointB.x, 2) + Math.pow(pointA.y - pointB.y, 2)
  );
}

function draw() {
  background(0);
  if (captureReady) {
    push();
    translate(captureOffsetX, 0);
    scale(captureScaleFactor, captureScaleFactor);
    image(capture, 0, 0);

    if (pose) {
      let leftAnkle = pose.left_ankle;
      let leftShoulder = pose.left_shoulder;
      let rightShoulder = pose.right_shoulder;
      let leftHip = pose.left_hip;

      if (
        leftAnkle.confidence > 0.5 &&
        leftShoulder.confidence > 0.5 &&
        rightShoulder.confidence > 0.5 &&
        leftHip.confidence > 0.5
      ) {
        leftEmitter.updateSegment(createVector(pose.right_shoulder.x, pose.right_shoulder.y),
          createVector(pose.right_hip.x, pose.right_hip.y));

        rightEmitter.updateSegment(createVector(pose.left_shoulder.x, pose.left_shoulder.y),
          createVector(pose.left_hip.x, pose.left_hip.y));

        let shoulderWidth = distance(rightShoulder, leftShoulder);
        let proximityThreshold = shoulderWidth * 1.3;
        let currentDistance = distance(leftHip, leftAnkle);

        if (currentDistance < proximityThreshold) {
          if (!squatDone) {
            // Update squat counter
            squatCounter++;
            squatDone = true;
            if (squatCounter > 5) {
              leftEmitter.add(20);
              rightEmitter.add(20);
            }

            // Reach next level?
            if (squatCounter >= level[currentLevel + 1].value) {
              currentLevel++;
              leftEmitter.setColor(level[currentLevel].color);
              rightEmitter.setColor(level[currentLevel].color);
            }

            // Display the new value
            squatcount.textContent = squatCounter;
          }
        } else {
          squatDone = false;
        }
      }

      if (squatCounter > 5) {
        leftEmitter.draw();
        rightEmitter.draw();
      }

      let p1 = pose.right_ear;
      let p2 = pose.left_ear;

      let v = createVector(p2.x - p1.x, p2.y - p1.y);
      let l = v.mag();
      let angle = v.heading();

      push();
      translate((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
      rotate(angle);
      imageMode(CENTER);
      image(level[currentLevel].hair, 0, -l * level[currentLevel].offset, l * 2.2, l * 2.2 * level[currentLevel].ratio);
      pop();
    } else {
      // No more humain being...
      console.log("No more humain being...")
      squatCounter = 0;
      squatDone = false;
      currentLevel = 0;
      leftEmitter.reset();
      rightEmitter.reset();
      document.querySelector("#loading").style.display = "inline";

      // Display the new value
      squatcount.textContent = squatCounter;
    }
    pop();
  }
}
