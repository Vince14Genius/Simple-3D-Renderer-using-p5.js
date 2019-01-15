// Author: Vincent C. (Vince14Genius)
// Code compressed for presentation reasons

// Togglable Variables
var cameraRange = 1000
var worldHeightBound = 50, worldWidthBound = 200, worldDepthBound = 200

// Essential variables
var objectsInWorld = []
var activeCamera = null

/* Object & function declarations */

class Vector {
    /// Create a vector object using regular 3D coordinates
    constructor(x, y, z) { this.x = x; this.y = y; this.z = z }

    /// Translate the vector by the given change in 3D coordinate position
    translateBy(deltaX, deltaY, deltaZ) { this.x += deltaX; this.y += deltaY; this.z += deltaZ }

    /// GET the magnitude (modulus) of the vector
    magnitude() { return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z) }
}

/// Calculate the scalar product of two vectors
function scalarProduct(vectorA, vectorB) {
    return vectorA.x * vectorB.x + vectorA.y * vectorB.y + vectorA.z * vectorB.z
}

/// Calculate the angle between two vectors using the arc-cosine of the scalar product
function angleBetweenVectors(vectorA, vectorB) {
    var scalarProductOfVectors = scalarProduct(vectorA, vectorB)
    var productOfMagnitudes = vectorA.magnitude() * vectorB.magnitude()
    return Math.acos(scalarProductOfVectors / productOfMagnitudes)
}

/// A function from my mathematical work
function computeAngle(visionAngle, directionalAngle, complementAngle) {
    var numerator = Math.pow(visionAngle, 2) + Math.pow(directionalAngle, 2) - Math.pow(complementAngle, 2)
    var denominator = 2 * visionAngle * directionalAngle
    return Math.acos(numerator / denominator)
}

/// A function from my mathematical work
function computeRPoint(r0, visionAngle, thetaPoint) {
    return r0 * (thetaPoint / visionAngle)
}

/// A function from my mathematical work
function computeScreenX(rPoint, planeAngle) {
    return rPoint * Math.cos(planeAngle)
}

/// A function from my mathematical work
function computeScreenY(rPoint, planeAngle) {
    return rPoint * Math.sin(planeAngle)
}

class Point extends Vector {
    /// Create a vector object representing a single point in the 3D world
    constructor(x, y, z) { super(x, y, z) }

    /// GET the distance from this point to the camera
    distanceToCamera(camera) {
        var positionToCamera = new Vector(this.x - camera.x, this.y - camera.y, this.z - camera.z)
        return positionToCamera.magnitude()
    }

    /// GET a boolean value determining whether the point is in the camera's range
    shouldRenderInCamera(camera) {
        var pointRelativeToCamera = new Vector(this.x - camera.x, this.y - camera.y, this.z - camera.z)
        var cameraDirection = new Vector(Math.cos(camera.yRotation), 0, Math.sin(camera.yRotation))
        var angle = angleBetweenVectors(pointRelativeToCamera, cameraDirection)
        if (angle > camera.visionAngle) { return false }
        if (this.distanceToCamera(camera) > cameraRange) { return false }
        return true
    }

    // GET the point's relative positional vector to the camera
    getPointRelativeToCamera(camera) {
        return new Vector(this.x - camera.x, this.y - camera.y, this.z - camera.z)
    }

    // GET the angle to the camera's directional vector
    getAngleToDirectionalVector(camera) {
        var pointRelativeToCamera = this.getPointRelativeToCamera(camera)
        var cameraDirection = new Vector(Math.cos(camera.yRotation), 0, Math.sin(camera.yRotation))
        return angleBetweenVectors(pointRelativeToCamera, cameraDirection)
    }

    // GET the angle to the camera's complement vector
    getAngleToComplementVector(camera) {
        var pointRelativeToCamera = this.getPointRelativeToCamera(camera)
        var complementVector = new Vector(Math.cos(camera.yRotation + camera.visionAngle), 0, Math.sin(camera.yRotation + camera.visionAngle))
        return angleBetweenVectors(pointRelativeToCamera, complementVector)
    }

    /// GET the point's translated position on the 2D screen
    renderPositionInCamera(camera) {
        var screenDiagonalRadius = Math.sqrt(Math.pow(windowWidth / 2, 2) + Math.pow(windowHeight / 2, 2))

        var angleToDirectionalVector = this.getAngleToDirectionalVector(camera)
        var angleToComplementVector = this.getAngleToComplementVector(camera)

        var planeAngle = computeAngle(camera.visionAngle, angleToDirectionalVector, angleToComplementVector)
        var rPoint = computeRPoint(screenDiagonalRadius, camera.visionAngle, angleToDirectionalVector)

        var screenX = computeScreenX(rPoint, planeAngle)
        var screenY = computeScreenY(rPoint, planeAngle)

        // Test which of the two intersections to use (inverted because p5.js coordinates are inverted from Cartesian)
        if (this.y > camera.y) {
            // above midline
            return [screenX + screenDiagonalRadius / 2, -screenY + screenDiagonalRadius / 2]
        } else {
            // below midline
            return [screenX + screenDiagonalRadius / 2, screenY + screenDiagonalRadius / 2]
        }
    }
}

class Camera extends Vector {
    /// Create a vector object representing a camera, with  vision range and starting y-rotation provided
    constructor(x, y, z, visionAngle, yRotation) {
        super(x, y, z); this.visionAngle = visionAngle; this.yRotation = yRotation
    }

    /// Render all items in a 3D world onto the 2D screen through this camera
    renderItemsInWorld(world) {
        var thisCamera = this
        world.sort(function(a, b) { return a.distanceToCamera(thisCamera) < b.distanceToCamera(thisCamera)})
        for (var thisItem of world) { thisItem.renderInCamera(this) }
    }

    /// Rotate the camera's y-rotation by a certain angle
    rotateYBy(rotation) { this.yRotation += rotation; this.yRotation %= Math.PI }
}

class Color {
    /// Create a color object using RGBA values
    constructor(red, green, blue, alpha) {
        this.red = red; this.green = green; this.blue = blue; this.alpha = alpha
    }
}

class Triangle {
    /// Create a triangle object using three points and one color
    constructor(pointA, pointB, pointC, color) {
        this.pointA = pointA; this.pointB = pointB; this.pointC = pointC; this.color = color
    }

    /// Draw the triangle onto the 2D screen using the positions of the translated points
    renderInCamera(camera) {
        var positionA = this.pointA.renderPositionInCamera(camera)
        var positionB = this.pointB.renderPositionInCamera(camera)
        var positionC = this.pointC.renderPositionInCamera(camera)

        var meanX = (positionA[0] + positionB[0] + positionC[0]) / 3
        var meanY = (positionA[1] + positionB[1] + positionC[1]) / 3
        var distanceToCenter = Math.sqrt(Math.pow(meanX - windowWidth / 2, 2) + Math.pow(meanY - windowHeight / 2, 2))
        var screenDiagonalRadius = Math.sqrt(Math.pow(windowWidth / 2, 2) + Math.pow(windowHeight / 2, 2))
        var caseMeanUnrenderable = distanceToCenter > screenDiagonalRadius
        var casePointsUnrenderable = !this.pointA.shouldRenderInCamera(camera) && !this.pointB.shouldRenderInCamera(camera) && !this.pointC.shouldRenderInCamera(camera)

        if (caseMeanUnrenderable && casePointsUnrenderable) return

        noStroke()
        fill(this.color.red, this.color.green, this.color.blue, this.color.alpha)
        triangle(positionA[0], positionA[1], positionB[0], positionB[1], positionC[0], positionC[1])
    }

    /// GET the distance from the camera to the average position of the triangle's three points
    distanceToCamera(camera) {
        var avgX = (this.pointA.x + this.pointB.x + this.pointC.x) / 3
        var avgY = (this.pointA.y + this.pointB.y + this.pointC.y) / 3
        var avgZ = (this.pointA.z + this.pointB.z + this.pointC.z) / 3

        var meanPositionToCamera = new Vector(avgX - camera.x, avgY - camera.y, avgZ - camera.z)
        return meanPositionToCamera.magnitude()
    }
}

/* Object placement functions */

/// A function for adding triangles into the 3D world from a list of groups of three points
function addTrianglesFromPointGroup(points, triangleIndices) {
    for (var triangleIndexGroup of triangleIndices) {
        var color = new Color(Math.random() * 100 + 155, Math.random() * 100 + 155, Math.random() * 100 + 155, 255)
        objectsInWorld.push(new Triangle(points[triangleIndexGroup[0]], points[triangleIndexGroup[1]], points[triangleIndexGroup[2]], color))
    }
}

/// Create a cube out of 12 triangles (6 squares)
function createCube(x, y, z, sideLength) {
    var radius = sideLength / 2

    var points = [
        new Point(x - radius, y - radius, z - radius),
        new Point(x + radius, y - radius, z - radius),
        new Point(x - radius, y + radius, z - radius),
        new Point(x + radius, y + radius, z - radius),
        new Point(x - radius, y - radius, z + radius),
        new Point(x + radius, y - radius, z + radius),
        new Point(x - radius, y + radius, z + radius),
        new Point(x + radius, y + radius, z + radius),
    ]

    var triangleIndices = [
        // front
        [4, 5, 6], [7, 5, 6],
        // back
        [0, 1, 2], [3, 1, 2],
        // top
        [2, 3, 6], [7, 3, 6],
        // bottom
        [0, 1, 4], [5, 1, 4],
        // left
        [0, 2, 4], [6, 2, 4],
        // right
        [1, 3, 5], [7, 3, 5],
    ]

    addTrianglesFromPointGroup(points, triangleIndices)
}

/// Create a pyramid out of 6 triangles (1 square + 4 individual triangles)
function createPyramid(x, y, z, sideLength) {
    var radius = sideLength / 2

    var points = [
        new Point(x - radius, y - radius, z - radius), // left front
        new Point(x + radius, y - radius, z - radius), // right front
        new Point(x - radius, y - radius, z + radius), // left back
        new Point(x + radius, y - radius, z + radius), // right back
        new Point(x, y + radius, z), // top point
    ]

    var triangleIndices = [
        // front & back
        [4, 0, 1], [4, 2, 3],
        // left & right
        [4, 0, 2], [4, 1, 3],
        // bottom
        [0, 1, 2], [1, 2, 3],
    ]

    addTrianglesFromPointGroup(points, triangleIndices)
}

/// Create a weird tower shape using two pyramids and 7 cubes
function createTowerShape(x, y, z, sideLength) {
    createCube(x, y, z, sideLength)
    createCube(x, y + sideLength, z, sideLength)
    createCube(x, y - sideLength, z, sideLength)
    createCube(x + sideLength, y, z, sideLength)
    createCube(x - sideLength, y, z, sideLength)
    createCube(x, y, z + sideLength, sideLength)
    createCube(x, y, z - sideLength, sideLength)

    createPyramid(x, y + 2 * sideLength, z, sideLength)
    createPyramid(x, y - 2 * sideLength, z, sideLength)
}

// Variables for keyboard & mouse control
var oldMouseX = null
var leftKeyDown = false, rightKeyDown = false, upKeyDown = false, downKeyDown = false
var wKeyDown = false, aKeyDown = false, sKeyDown = false, dKeyDown = false
var shiftKeyDown = false, spaceKeyDown = false
var paused = false

// FPS Engine
var fpsEngine = {
    oldTime: 0, fpsCooldown: 0, displayFPS: 0, realFPS: 0, 
    updateFPS: function() {
        // Update realFPS
        var currentTime = millis(); var fpsDelta = currentTime - this.oldTime
        this.realFPS = frameRate() // function provided by p5.js API
        
        // Update displayFPS
        this.fpsCooldown -= fpsDelta
        if (this.fpsCooldown <= 0) { this.displayFPS = this.realFPS; this.fpsCooldown = 1000 }
        this.oldTime = currentTime
    },
    showFPS: function(r, g, b) {
        fill(r, g, b); textAlign(RIGHT, TOP); textSize(24)
        text(`${Math.floor(this.displayFPS)} fps`, width - 16, 16)
    }
}

/* Event handlers */

function setup() {
    /* setup() runs once at the initialization of the scene. */

    activeCamera = new Camera(0, 0, 0, Math.PI / 4, 0)
    createCanvas(windowWidth, windowHeight)

    function normalizedRandom(range) { return (Math.random() - 0.5) * range }

    // Add 100 small triangles into the 3D world
    for (var i = 0; i < 100; i++) {
        var pointA = new Point(normalizedRandom(worldWidthBound), normalizedRandom(worldHeightBound), normalizedRandom(worldDepthBound))
        var pointB = new Point(pointA.x + normalizedRandom(8), pointA.y + normalizedRandom(8), pointA.z + normalizedRandom(8))
        var pointC = new Point(pointA.x + normalizedRandom(8), pointA.y + normalizedRandom(8), pointA.z + normalizedRandom(8))
        var color = new Color(Math.random() * 100 + 155, Math.random() * 100 + 155, Math.random() * 100 + 155, Math.random() * 100 + 155)
        objectsInWorld.push(new Triangle(pointA, pointB, pointC, color))
    }

    // Add 20 cubes, pyramids, and weird tower shapes into the 3D world
    for (var i = 0; i < 20; i++) {
        createCube(normalizedRandom(worldWidthBound), normalizedRandom(worldHeightBound), normalizedRandom(worldDepthBound), Math.random() * 4 + 2)
        createPyramid(normalizedRandom(worldWidthBound), normalizedRandom(worldHeightBound), normalizedRandom(worldDepthBound), Math.random() * 4 + 2)
        createTowerShape(normalizedRandom(worldWidthBound), normalizedRandom(worldHeightBound), normalizedRandom(worldDepthBound), Math.random() * 4 + 2)
    }
}

function draw() {
    /* draw() runs every time before a new frame is rendered.  */

    // Pause screen appears when paused
    if (paused) {
        fill(200, 255, 255); stroke(0); strokeWeight(32)
        textAlign(CENTER, CENTER); textSize(64)
        text("- P A U S E D -", windowWidth / 2, windowHeight / 2)
        return
    }

    /* Camera movement based on keyboard controls */

    activeCamera.yRotation += (mouseX / windowWidth - 0.5) / 20

    if (leftKeyDown || aKeyDown) {
        var direction = activeCamera.yRotation - Math.PI / 2
        activeCamera.x += Math.cos(direction); activeCamera.z += Math.sin(direction)
    }

    if (rightKeyDown || dKeyDown) {
        var direction = activeCamera.yRotation + Math.PI / 2
        activeCamera.x += Math.cos(direction); activeCamera.z += Math.sin(direction)
    }

    if (upKeyDown || wKeyDown) {
        var direction = activeCamera.yRotation
        activeCamera.x += Math.cos(direction); activeCamera.z += Math.sin(direction)
    }

    if (downKeyDown || sKeyDown) {
        var direction = activeCamera.yRotation + Math.PI
        activeCamera.x += Math.cos(direction); activeCamera.z += Math.sin(direction)
    }

    if (spaceKeyDown) { activeCamera.y += 1 }
    if (shiftKeyDown) { activeCamera.y -= 1 }

    /* Check for world boundaries */

    activeCamera.x = (activeCamera.x < -worldWidthBound / 2) ? (-worldWidthBound / 2) : activeCamera.x
    activeCamera.x = (activeCamera.x > worldWidthBound / 2) ? (worldWidthBound / 2) : activeCamera.x

    activeCamera.y = (activeCamera.y < -worldHeightBound / 2) ? (-worldHeightBound / 2) : activeCamera.y
    activeCamera.y = (activeCamera.y > worldHeightBound / 2) ? (worldHeightBound / 2) : activeCamera.y

    activeCamera.z = (activeCamera.z < -worldDepthBound / 2) ? (-worldDepthBound / 2) : activeCamera.z
    activeCamera.z = (activeCamera.z > worldDepthBound / 2) ? (worldDepthBound / 2) : activeCamera.z

    // Render
    background(0)
    if (activeCamera !== null) { activeCamera.renderItemsInWorld(objectsInWorld) }

    // Update and show FPS
    fpsEngine.updateFPS(); fpsEngine.showFPS(200, 200, 200)
}

function windowResized() { resizeCanvas(windowWidth, windowHeight) }
function mousePressed() { paused = !paused }

function keyPressed() {
    switch (keyCode) {
        case (LEFT_ARROW): leftKeyDown = true; break
        case (RIGHT_ARROW): rightKeyDown = true; break
        case (UP_ARROW): upKeyDown = true; break
        case (DOWN_ARROW): downKeyDown = true; break
        case (87): /* W */ wKeyDown = true; break
        case (65): /* A */ aKeyDown = true; break
        case (83): /* S */ sKeyDown = true; break
        case (68): /* D */ dKeyDown = true; break
        case (32): /* Space */ spaceKeyDown = true; break
        case (16): /* Shift */ shiftKeyDown = true; break
    }
}

function keyReleased() {
    switch (keyCode) {
        case (LEFT_ARROW): leftKeyDown = false; break
        case (RIGHT_ARROW): rightKeyDown = false; break
        case (UP_ARROW): upKeyDown = false; break
        case (DOWN_ARROW): downKeyDown = false; break
        case (87): /* W */ wKeyDown = false; break
        case (65): /* A */ aKeyDown = false; break
        case (83): /* S */ sKeyDown = false; break
        case (68): /* D */ dKeyDown = false; break
        case (32): /* Space */ spaceKeyDown = false; break
        case (16): /* Shift */ shiftKeyDown = false; break
    }
}
