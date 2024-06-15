//! Remember to update this thingymajigyjig
class Line {
    static draw(p1, p2, color = 'lightgreen') {
        ctx.strokeStyle = color
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(p1.components[0], p1.components[1])
        ctx.lineTo(p2.components[0], p2.components[1])
        ctx.stroke()
    }

    // static getIntersectionTwoLines(line1, line2) {
    //     const x1 = line1.p1.components[0]; const x2 = line1.p2.components[0]; const x3 = line2.p1.components[0]; const x4 = line2.p2.components[0]
    //     const y1 = line1.p1.components[1]; const y2 = line1.p2.components[1]; const y3 = line2.p1.components[1]; const y4 = line2.p2.components[1]

    //     const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)

    //     if (denominator == 0) {return null}

    //     const intersectX = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / denominator
    //     const intersectY = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / denominator

    //     if (intersectX < Math.min(x1, x2) || intersectX > Math.max(x1, x2) ||
    //     intersectX < Math.min(x3, x4) || intersectX > Math.max(x3, x4) ||
    //     intersectY < Math.min(y1, y2) || intersectY > Math.max(y1, y2) ||
    //     intersectY < Math.min(y3, y4) || intersectY > Math.max(y3, y4)) {
    //         return null
    //     }

    //     return new Vector(intersectX, intersectY)
    // }

    constructor(p1, p2) {
        if (Vector.getComponentSize(p1) != 2 || Vector.getComponentSize(p2) != 2) console.log('Error at Line construction -> p1 or p2 is not component size 2')

        this.p1 = p1
        this.p2 = p2
    }

    debugDraw(color = 'lightgreen') {

        ctx.strokeStyle = color
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(this.p1.components[0], this.p1.components[1])
        ctx.lineTo(this.p2.components[0], this.p2.components[1])
        ctx.stroke()
    }
} 

class Polygon {
    #componentSize

    constructor(...verticies) {
        if (verticies.length <= 2) {throw new Error('Error at Polygon construction -> not enough verticies')}


        const firstVector = verticies[0]
        if ( !(firstVector instanceof Vector) ) {
            throw new Error('Error at Polygon construction -> all verticies are not the same component size')
        }

        const firstVectorComponentSize = Vector.getComponentSize(firstVector)
        if (firstVectorComponentSize > 3 || firstVectorComponentSize < 2) {
            throw new Error('Error at Polygon construction -> input is not the right component size')
        }

        for (let i = 1; i < verticies.length; i++) {
            const vector = verticies[i]
            if ( (!vector instanceof Vector) ) {throw new Error('Error at Polygon construction -> input is not a vector')}

            const vectorComponentSize = Vector.getComponentSize(vector)
            if (vectorComponentSize != firstVectorComponentSize) {

                throw new Error('Error at Polygon construction -> all verticies are not the same component size')
            }
        }
        
        this.verticies = verticies
        this.#componentSize = firstVectorComponentSize

        this.color = new Vector(255, 0, 0, 255)
    }

    setColor(color) {
        this.color = color
    }

    getCenter() {
        let result = new Vector(0, 0, 0)
        const k = this.verticies.length
        for (let i = 0; i < k; i++) {
            result = Vector.add(result, this.verticies[i])
        }

        return Vector.scalarMultiply(result, 1 / k)
    }

    getWorldSpaceAsScreenSpaceVectors() {
        if (this.#componentSize != 3) {throw new Error('Error at Polygon.getWorldSpaceAsScreenSpaceVectors() -> component size != 3')}

        const screenSpace = []
        const viewMatrix = CameraUtils.viewMatrix()
        // console.log(viewMatrix)
        const perspectiveMatrix = CameraUtils.projectionMatrix()

        const cameraSpaceVerticies = []
        this.verticies.forEach(vertex => {
            const usableVertex = new Vector(vertex.components[0], vertex.components[1], vertex.components[2], 1)
            cameraSpaceVerticies.push(Vector.matrixVectorMultiply(viewMatrix, usableVertex))
        })

        const clippedVerticies = clipVerticiesAgainstNearPlane(cameraSpaceVerticies, Camera.getZNear())
        // const clippedVerticies = cameraSpaceVerticies

        clippedVerticies.forEach(vertex => {
            const clip = Vector.matrixVectorMultiply(perspectiveMatrix, new Vector(vertex.components[0], vertex.components[1], vertex.components[2], 1))
            
            const screenSpaceVector = new Vector( 
                ((clip.components[0] / clip.components[3] + 1) * canvas.width) / 2, 
                ((-clip.components[1] / clip.components[3] + 1) * canvas.height) / 2
            )

            screenSpace.push(screenSpaceVector)
        })

        return screenSpace
    }
    

    move(moveVector) {
        for (let i = 0; i < this.verticies.length; i++) {
            this.verticies[i] = Vector.add(this.verticies[i], moveVector)
        }
    }

    rotateX(angle, point = new Vector(0, 0, 0)) {
        for (let i = 0; i < this.verticies.length; i++) {
            this.verticies[i] = Vector.getRotatedX_3D(this.verticies[i], angle, point)
        }
    }
    rotateY(angle, point = new Vector(0, 0, 0)) {
        for (let i = 0; i < this.verticies.length; i++) {
            this.verticies[i] = Vector.getRotatedY_3D(this.verticies[i], angle, point)
        }
    }
    rotateZ(angle, point = new Vector(0, 0, 0)) {
        for (let i = 0; i < this.verticies.length; i++) {
            this.verticies[i] = Vector.getRotatedZ_3D(this.verticies[i], angle, point)
        }
    }
}

//! Remember to put this in CameraUtils
function clipVerticiesAgainstNearPlane(verticies, near_plane) {
    const clippedVerticies = []
    for (let i = 0; i < verticies.length; i++) {
        const currentVertex = verticies[i]
        const nextVertex = verticies[(i + 1) % verticies.length]

        const currentZ = currentVertex.components[2]
        const nextZ = nextVertex.components[2]

        if (currentZ >= near_plane) {
            if (nextZ >= near_plane) {
                clippedVerticies.push(nextVertex)
            }

            else {
                const intersection = intersectWithNearPlane(currentVertex, nextVertex, near_plane)
                clippedVerticies.push(intersection)
            }
        }
        else {
            if (nextZ >= near_plane) {
                const intersection = intersectWithNearPlane(currentVertex, nextVertex, near_plane)
                clippedVerticies.push(intersection)
                clippedVerticies.push(nextVertex)
            }
        }
    }

    return clippedVerticies
}

//! Remember to put this in CameraUtils
function intersectWithNearPlane(vertex1, vertex2, near_plane) {
    const t = (near_plane - vertex1.components[2]) / (vertex2.components[2] - vertex1.components[2])
    return new Vector(
        vertex1.components[0] + t * (vertex2.components[0] - vertex1.components[0]),
        vertex1.components[1] + t * (vertex2.components[1] - vertex1.components[1]),
        near_plane
    )
}