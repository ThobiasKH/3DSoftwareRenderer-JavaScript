const canvas = document.getElementById('mainWindow')
const ctx = canvas.getContext('2d')

let resolutionScale = 1 / 1

canvas.width = window.innerWidth  * resolutionScale
canvas.height = window.innerHeight  * resolutionScale

//! Unbelievably slow for some reason
//! So slow that resolution scale has to be tiny
class PerPixelRenderer {
    static #vertexBuffer = []
    static #colorBuffer = []

    static buffersPush(triangles, color) {
        triangles.forEach(triangle => {
            if (!triangle.includes(undefined)) {
                triangulate(triangle).forEach(vertex => {
                    this.#vertexBuffer.push(vertex)
                    this.#colorBuffer.push(color)
                })
            }
        })
        
    }

    static buffersClear() {
        this.#vertexBuffer = []
        this.#colorBuffer = []
        // this.#indexBuffer = []
    }

    static #setPixel(imageData, position, color) {
        if (Vector.getComponentSize(position) != 2) throw new Error('PerPixelRenderer.#setPixel -> position must be vec2')
        else if (Vector.getComponentSize(color) != 4) throw new Error('PerPixelRenderer.#setPixel -> color must be vec4')
    

        const index = (position.components[1] * imageData.width + position.components[0]) * 4
        imageData.data[index + 0] = color.components[0]
        imageData.data[index + 1] = color.components[1]
        imageData.data[index + 2] = color.components[2]
        imageData.data[index + 3] = color.components[3]
        
    }

    static render() {
        const w = canvas.width / 1
        const h = canvas.height / 1

        const imageData = ctx.createImageData(w, h)

        for (let n = 0; n < this.#vertexBuffer.length; n += 3) {
            const t0 = this.#vertexBuffer[n + 0]
            const t1 = this.#vertexBuffer[n + 1]
            const t2 = this.#vertexBuffer[n + 2]

            const boundingBox = calculateBoundingBoxForTriangle([
                t0,
                t1,
                t2
            ])

            const yStart = Math.round(Math.max(boundingBox[0].components[1], 0))
            const yEnd   = Math.round(Math.min(boundingBox[3].components[1], h))
            const xStart = Math.round(Math.max(boundingBox[0].components[0], 0))
            const xEnd   = Math.round(Math.min(boundingBox[3].components[0], w))
            // console.log(yStart, yEnd)


            for (let y = yStart; y < yEnd; y++) {
                for (let x = xStart; x < xEnd; x++) {
                    const pixelPosition = new Vector(x, y)
                    const pixelBarycentricPosition = getBarycentricCoords([t0, t1, t2], pixelPosition)
                    const isInsideTriangle = pointIsInsideTriangle(pixelBarycentricPosition)

                    if (isInsideTriangle) {
                        // let color = new Vector(
                        //     255 * pixelBarycentricPosition.components[0],
                        //     255 * pixelBarycentricPosition.components[1],
                        //     128,
                        //     255
                        // )

                        const colorToUse = this.#colorBuffer[n / 3]
                        let color = new Vector(
                            colorToUse.components[0], 
                            colorToUse.components[1],
                            colorToUse.components[2],
                            colorToUse.components[3]
                        )
                        this.#setPixel(imageData, pixelPosition, color)
                    }
                }
            }
        }

        ctx.putImageData(imageData, 0, 0)

    }
}

//* Quick and simple renderer
// Renders using standard js canvas context
// Very slow when the render stack grows in size
// Need to use pixelbuffer l8r, meaning a complete rework :,)
// The abstraction do go kinda crazy though
class ShapeRenderer {
    static #shapeBuffer = []

    static renderSorted = true

    static bufferPush(data) {
        this.#shapeBuffer.push(data)
    }

    static bufferClear() {
        this.#shapeBuffer = []
    }

    //! Minor headache, but it's ok
    static render() {
        if (this.renderSorted) this.#bufferSort()

        for (let n = 0; n < this.#shapeBuffer.length; n++) {
            const shape = this.#shapeBuffer[n]
            const color = shape.color
            const screenSpaceVectorCoordinates = shape.getWorldSpaceAsScreenSpaceVectors()

            let region = new Path2D()

            for (let i = 0; i < screenSpaceVectorCoordinates.length; i++) {
                const vector = screenSpaceVectorCoordinates[i]

                let x = vector.components[0]

                let y = vector.components[1]

                i == 0 ? region.moveTo(x, y) : region.lineTo(x, y)
            }
            region.closePath()

            ctx.fillStyle = "rgba(" + color.components[0] + ", " + color.components[1] + ", " + color.components[2] + ", " + color.components[3] + ")"
            ctx.fill(region, "evenodd")

            // const tex = TextureManager.TEXTURE_DIAMOND
            // if (tex.width > 0 && tex.height > 0) {
            //     const pCanvas = document.createElement('canvas')
            //     pCanvas.width = tex.width
            //     pCanvas.height = tex.height
            //     const pCtx = pCanvas.getContext('2d')
            //     const shapeCenter = shape.getCenter()
            //     const shapeDstFromCamera = Vector.matrixVectorMultiply(
            //         CameraUtils.viewMatrix(), new Vector(shapeCenter.components[0], shapeCenter.components[1], shapeCenter.components[2], 1)
            //     ).components[2]
            //     const m11 = 1;
            //     const m12 = 0; // Skew in x
            //     const m21 = 0; // Skew in y
            //     const m22 = 1;
            //     // Apply the perspective skew
            //     pCtx.transform(m11, m12, m21, m22, 0, 0);
            //     // pCtx.rotate(45 * Math.PI / 180)
            //     pCtx.drawImage(tex, -tex.width / 2, -tex.height / 2)
            //     // pCtx.restore()
            //     const pattern = pCtx.createPattern(pCanvas, 'repeat')
            //     ctx.fillStyle = pattern
            //     ctx.fill(region)
            // }
        }
    }

    static #bufferSort() {
        this.#shapeBuffer.sort(sortObjectsBasedOnDstFromCenterToOrigin)
    }

    static renderWireFrame() {

        for (let n = 0; n < this.#shapeBuffer.length; n++) {
            const shape = this.#shapeBuffer[n]
            const color = shape.color
            const screenSpaceVectorCoordinates = shape.getWorldSpaceAsScreenSpaceVectors()

            let region = new Path2D()

            for (let i = 0; i < screenSpaceVectorCoordinates.length; i++) {
                const vector = screenSpaceVectorCoordinates[i]

            
                Line.draw(vector, screenSpaceVectorCoordinates[i == screenSpaceVectorCoordinates.length - 1 ? 0 : i + 1])

                ctx.font = '1vmin Arial'
                ctx.fillStyle = 'white'
                if (shape.verticies[i] != undefined) ctx.fillText( shape.verticies[i].toString(2) , vector.components[0], vector.components[1])
            }
            region.closePath()

            ctx.fillStyle = color
            ctx.fill(region, "evenodd")
        }
    }
}

function sortObjectsBasedOnDstFromCenterToOrigin(a, b) {
    const viewMatrix = CameraUtils.viewMatrix()

    const transformedA = []
    a.verticies.forEach(vertex => {
        const homogenousVertex = new Vector(vertex.components[0], vertex.components[1], vertex.components[2], 1)
        const transformedVertex = Vector.matrixVectorMultiply(viewMatrix, homogenousVertex)
        const readableVertex = new Vector(transformedVertex.components[0], transformedVertex.components[1], transformedVertex.components[2])
        transformedA.push(readableVertex)
    })

    const transformedB = []
    b.verticies.forEach(vertex => {
        const homogenousVertex = new Vector(vertex.components[0], vertex.components[1], vertex.components[2], 1)
        const transformedVertex = Vector.matrixVectorMultiply(viewMatrix, homogenousVertex)
        const readableVertex = new Vector(transformedVertex.components[0], transformedVertex.components[1], transformedVertex.components[2])
        transformedB.push(readableVertex)
    })

    const c = new Polygon(...transformedA)
    const d = new Polygon(...transformedB)

    if ( Vector.getLength(c.getCenter()) > Vector.getLength(d.getCenter()) ) return -1
    if ( Vector.getLength(c.getCenter()) < Vector.getLength(d.getCenter()) ) return 1
    return 0
}

//! Remember to replace somewhere else
function getBarycentricCoords(verticies, point) {
    if (verticies.length != 3) throw new Error('getBarycentricCoords -> verticies must be triangle')
    const v0 = Vector.subtract(verticies[1], verticies[0]) 
    const v1 = Vector.subtract(verticies[2], verticies[0])
    const v2 = Vector.subtract(point       , verticies[0])

    const d00 = Vector.dotProduct(v0, v0)
    const d01 = Vector.dotProduct(v0, v1)
    const d11 = Vector.dotProduct(v1, v1)
    const d20 = Vector.dotProduct(v2, v0)
    const d21 = Vector.dotProduct(v2, v1)
    const det = (d00 * d11 - d01 * d01)
    const v   = (d11 * d20 - d01 * d21) / det
    const w   = (d00 * d21 - d01 * d20) / det
    const u   = 1 - v - w

    return new Vector(u, v, w)
}

function pointIsInsideTriangle(barycentricCoords) {
    let result = 0
    for (let i = 0; i < barycentricCoords.components.length; i++) {
        let component = barycentricCoords.components[i]
        if (component < 0) return false
        result += component
    }

    // console.log(result)
    return result > 0.998 // slight leway beacuse floating point imprecision
}

function calculateBoundingBoxForTriangle(verticies) {
    const v1 = verticies[0]
    const v2 = verticies[1]
    const v3 = verticies[2]

    const minX = Math.min(v1.components[0], v2.components[0], v3.components[0])
    const maxX = Math.max(v1.components[0], v2.components[0], v3.components[0])
    const minY = Math.min(v1.components[1], v2.components[1], v3.components[1])
    const maxY = Math.max(v1.components[1], v2.components[1], v3.components[1])

    const width = maxX - minX
    const height = maxY - minY

    const squareVertices = [
        new Vector(minX, minY),                 // Top-left
        new Vector(minX + width, minY),         // Top-right
        new Vector(minX, minY + height),        // Bottom-left
        new Vector(minX + width, minY + height) // Bottom-right
    ]

    return squareVertices
}

//* This function checks if there are 3 verticies. With the current approach a triangle can be clipped into 4 verticies when colliding with the camera. In this case we clip it into 2 tirangles
function triangulate(verticies) {
    if (verticies.length <= 3) return verticies

    const p1 = verticies[0]
    const p2 = verticies[1]
    const p3 = verticies[2]
    const p4 = verticies[3]

    return [p1, p4, p3, p1, p3, p2]
}