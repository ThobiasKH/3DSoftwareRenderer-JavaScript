const planes = [
]

const cube = [
    new Polygon(
        new Vector( 1,  1, 2),
        new Vector(-1,  1, 2),
        new Vector(-1, -1, 2),
        new Vector( 1, -1, 2)
    ),
    new Polygon(
        new Vector( 1,  1, 4),
        new Vector(-1,  1, 4),
        new Vector(-1, -1, 4),
        new Vector( 1, -1, 4)
    ),
    new Polygon(
        new Vector( 1,  1, 2),
        new Vector( 1, -1, 2),
        new Vector( 1, -1, 4),
        new Vector( 1,  1, 4)
    ),
    new Polygon(
        new Vector(-1,  1, 2),
        new Vector(-1, -1, 2),
        new Vector(-1, -1, 4),
        new Vector(-1,  1, 4)
    ),
    new Polygon(
        new Vector( 1,  1, 2),
        new Vector( 1,  1, 4),
        new Vector(-1,  1, 4),
        new Vector(-1,  1, 2)
    ),
    new Polygon(
        new Vector( 1, -1, 2),
        new Vector( 1, -1, 4),
        new Vector(-1, -1, 4),
        new Vector(-1, -1, 2)
    )
]

const triangles = []

function getRandomColor() {
    return new Vector(Math.random() * 255, Math.random() * 255, Math.random() * 255, 255)
}

const strainTestMax = 50
for (let i = 0; i < strainTestMax; i++) {
    const randomCenterPoint = new Vector(
        (Math.round(Math.random()) * 2 - 1) * Math.random() * 25,
        (Math.round(Math.random()) * 2 - 1) * Math.random() * 25,
        (Math.round(Math.random()) * 2 - 1) * Math.random() * 25
    )
    const triangle = new Polygon(
        Vector.add(randomCenterPoint, new Vector(0, -1, 0)),
        Vector.add(randomCenterPoint, new Vector(1, 1, 0)),
        Vector.add(randomCenterPoint, new Vector(-1, 1, 0)),
    )

    triangle.setColor(getRandomColor())
    triangle.rotateX(Math.random() * 100)
    triangle.rotateY(Math.random() * 100)
    triangle.rotateZ(Math.random() * 100)

    triangles.push(
        triangle
    )
}

triangles.forEach(triangle => {
    planes.push(triangle)
})

cube.forEach(face => {
    face.setColor(getRandomColor())
    // face.setColor(new Vector(0, 255, 0, 255))
    planes.push(face)
})


let t1 = Date.now()

//* Change between which renderer to use. 
//! PixelRenderer is very slow and doesn't work properly when colliding with shapes in scene
//! Color doesn't really work with the pixelrenderer because if it gets 4 verticies fed it splits it into 2 separate 3 vertex polygons without giving the colorbuffer a new copy of the color to draw

let usePixelRenderer = false

function loop() {
    canvas.width = window.innerWidth  * resolutionScale
    canvas.height = window.innerHeight  * resolutionScale
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    triangles.forEach(triangle => {
        triangle.rotateX(0.1, triangle.getCenter())
        triangle.rotateY(0.2, triangle.getCenter())
        triangle.rotateZ(0.3, triangle.getCenter())
        const planeCamDiff = Vector.subtract(triangle.getCenter(), Camera.getPos())
        const planeCamDir = Vector.getNormalized(planeCamDiff)
        const moveTowardsCamera = Vector.scalarMultiply(planeCamDir, 0.05 * -1)
        const moveAwayFromCamera = Vector.scalarMultiply(planeCamDir, 0.05 * 1)
        if (Vector.getLength(planeCamDiff) > 15) triangle.move(moveTowardsCamera)
        else triangle.move(moveAwayFromCamera)
    })

    Camera.updateRotation(Vector.scalarMultiply(InputManager.mouseMove, InputManager.mouseSensitivity * resolutionScale))
    InputManager.handleKeys()

    if (!usePixelRenderer) {
        resolutionScale = 1 / 1

        ShapeRenderer.bufferClear()
        planes.forEach(plane => {
            ShapeRenderer.bufferPush(plane)
        })
        ShapeRenderer.render()
    }
    else {
        resolutionScale = 1 / 8

        PerPixelRenderer.buffersClear()

        planes.forEach(plane => {
            PerPixelRenderer.buffersPush([plane.getWorldSpaceAsScreenSpaceVectors()], plane.color)
        })  

        PerPixelRenderer.render()
    }

    ctx.font =  6 * resolutionScale + 'vmin Arial'
    ctx.fillStyle = 'white'
    ctx.fillText("Frame time: " + String(Date.now() - t1) + "ms", canvas.width * 0.01, canvas.height - canvas.height * 0.05)
    t1 = Date.now()

    ctx.fillText("Controlls: WASD, CTRL, SPACE, SHIFT, RIGHT-CLICK", canvas.width * 0.01, canvas.height * 0.05)
    ctx.fillText(usePixelRenderer ? "Per Pixel Renderer" : "Path2D Renderer (Shape)", canvas.width * 0.01, canvas.height * 0.1)

    // this is sorta inacurate as the cube is represented as a list of 6 separate 4 vertex planes.
    // we only get planes.length + cube.length * 2 "triangles" when using the perPixelRenderer
    // but considering the existing triangles become 4 2D-point shapes when colliding with the camera we can create 1 more triangle by faceplanting with a "triangle"
    ctx.fillText(planes.length + cube.length * 2 + " triangles in scene", canvas.width * 0.01, canvas.height * 0.15)

    InputManager.mouseMove.components[0] = 0
    InputManager.mouseMove.components[1] = 0
    console.log(Camera.getPos().toString(2))
    requestAnimationFrame(loop)
}

loop()