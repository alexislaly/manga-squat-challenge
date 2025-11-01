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
let poseReady = false;

let squatCounter = 0;
let squatDone = false;

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
  level[0].hair = loadImage(
    "img/hair/black.png"
  );
  level[1].hair = loadImage(
    "img/hair/gold.png"
  );
  level[2].hair = loadImage(
    "img/hair/red.png"
  );
  level[3].hair = loadImage(
    "img/hair/pink.png"
  );
  level[4].hair = loadImage(
    "img/hair/blue.png"
  );
  level[5].hair = loadImage(
    "img/hair/green.png"
  );
  level[6].hair = loadImage(
    "img/hair/silver.png"
  );
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
}

// Callback function for when bodyPose outputs data
function gotPoses(results) {
  // Save the output to the pose variable
  pose = results[0];
  if (pose) {
    poseReady = true;
  }
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
        let shoulderWidth = distance(rightShoulder, leftShoulder);
        let proximityThreshold = shoulderWidth * 1.5;
        let currentDistance = distance(leftHip, leftAnkle);

        if (currentDistance < proximityThreshold) {
          if (!squatDone) {
            // Update squat counter
            squatCounter++;
            squatDone = true;

            // Reach next level?
            if (squatCounter >= level[currentLevel + 1].value) currentLevel++;

            // Display the new value
            squatcount.textContent = squatCounter;
          }
        } else {
          squatDone = false;
        }
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
      squatCounter = 0;
      squatDone = false;
      currentLevel = 0;

      // Display the new value
      squatcount.textContent = squatCounter;
    }
    pop();
  }
}