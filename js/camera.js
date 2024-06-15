class Camera {
    static #position = new Vector(0, 0, 0)
    static #pitch = 0
    static #yaw = 0

    static #fov = 150 * (Math.PI / 180)
    static #zNear = 0.25 * 1
    static #zFar = 100

    static #speed = 0.01

    static float(up = -1) {
        this.#position = Vector.add(this.#position, Vector.scalarMultiply(new Vector(0, 1, 0), this.#speed * up ))
    }

    static setSpeed(newSpeed) {this.#speed = newSpeed}

    static moveAlongForward(moveForward = -1) {
        const cosPitch = Math.cos(this.#pitch)
        const sinPitch = Math.sin(this.#pitch)
        const cosYaw = Math.cos(this.#yaw)
        const sinYaw = Math.sin(this.#yaw)

        const forward = new Vector(
            sinYaw * cosPitch,
            -sinPitch,
            -cosYaw * cosPitch
        )

        this.#position = Vector.add(this.#position, Vector.scalarMultiply(forward, this.#speed * moveForward))
    }

    static moveAlongSide(moveRight = 1) {
        const cosYaw = Math.cos(this.#yaw)
        const sinYaw = Math.sin(this.#yaw)

        // const right = Vector.crossProduct_3D(forward, new Vector(0, 1, 0))
        const right = new Vector(cosYaw, 0, sinYaw)

        this.#position = Vector.add(this.#position, Vector.scalarMultiply(right, this.#speed * moveRight))
    }

    static updateRotation(mouseMovementVector) {
        this.#pitch += mouseMovementVector.components[1] // Y
        this.#yaw += mouseMovementVector.components[0] // X

        this.#pitch = Math.min(this.#pitch, 90 * (Math.PI / 180))
        this.#pitch = Math.max(this.#pitch, -90 * (Math.PI / 180))

        if (this.#yaw < 0) this.#yaw += 2 * Math.PI
        else if (this.#yaw >= 2 * Math.PI) this.#yaw -= 2 * Math.PI
    }

    static logComponents() {
        // console.log("Camera Position: " + this.#position)
        console.log("Camera Pitch: " + this.#pitch)
        // console.log("Camera Yaw: " + this.#yaw)
    }

    static getFov() {
        let returnValue = 0
        returnValue += this.#fov
        return returnValue
    }

    static getZNear() {
        let returnValue = 0
        returnValue += this.#zNear
        return returnValue
    }

    static getZFar() {
        let returnValue = 0
        returnValue += this.#zFar
        return returnValue
    }

    static getPitch() {
        let returnValue = 0
        returnValue += this.#pitch
        return returnValue
    }

    static getYaw() {
        let returnValue = 0
        returnValue += this.#yaw
        return returnValue
    }

    static getPos() {
        return new Vector(0 + this.#position.components[0], 0 + this.#position.components[1], 0 + this.#position.components[2])
    }
}

class CameraUtils {
    static projectionMatrix() {
        const tanHalfFov = Math.tan(Camera.getFov() / 2)
        const zNear = Camera.getZNear()
        const zFar = Camera.getZFar()
        const aspectRatio = canvas.width / canvas.height

        const perspectiveMatrix = new Vector(
            new Vector(1 / (tanHalfFov * aspectRatio),0,0,0),
            new Vector(0,     1 / tanHalfFov,    0,    0),
            new Vector(0,   0,  (zFar + zNear) / (zNear - zFar),  -  1),
            new Vector(0,0,(2 * zNear * zFar) / (zNear - zFar), 0)
        )

        return perspectiveMatrix
    }

    static viewMatrix() {
        const cosPitch = Math.cos(Camera.getPitch())
        const sinPitch = Math.sin(Camera.getPitch())
        const cosYaw = Math.cos(Camera.getYaw())
        const sinYaw = Math.sin(Camera.getYaw())

        // Create the rotation matrix around the Y-axis (yaw)
        const yawMatrix = new Vector(
            new Vector(cosYaw, 0, sinYaw, 0),
            new Vector(0, 1, 0, 0),
            new Vector(-sinYaw, 0, cosYaw, 0),
            new Vector(0, 0, 0, 1)
        );

        // Create the rotation matrix around the X-axis (pitch)
        const pitchMatrix = new Vector(
            new Vector(1, 0, 0, 0),
            new Vector(0, cosPitch, -sinPitch, 0),
            new Vector(0, sinPitch, cosPitch, 0),
            new Vector(0, 0, 0, 1)
        );

        const rotationMatrix = Vector.matrixMatrixMultiply(pitchMatrix, yawMatrix)

        const translationMatrix = new Vector(
            new Vector(1, 0, 0, -Camera.getPos().components[0]),
            new Vector(0, 1, 0, -Camera.getPos().components[1]),
            new Vector(0, 0, 1, -Camera.getPos().components[2]),
            new Vector(0, 0, 0, 1)
        )

        const viewMatrix = Vector.matrixMatrixMultiply(rotationMatrix, translationMatrix)

        return viewMatrix
    }   

    static convertWorldSpaceToScreenSpace(vector) {
        if (Vector.getComponentSize(vector) != 3) {throw new Error('Error at CameraUtils.convertWorldSpaceToScreenSpace() -> component size != 3')}

        const viewMatrix = this.viewMatrix()
        const perspectiveMatrix = this.projectionMatrix()

        const cameraSpaceVector = Vector.matrixVectorMultiply(viewMatrix, new Vector(vector.components[0], vector.components[1], vector.components[2], 1))

        const clippedVector = clipVerticiesAgainstNearPlane([cameraSpaceVector], Camera.getZNear())[0]

        const perspectiveAdjustedVector = Vector.matrixVectorMultiply(perspectiveMatrix, clippedVector)
        const screenSpaceVector = new Vector( 
            ((perspectiveAdjustedVector.components[0] / perspectiveAdjustedVector.components[3] + 1) * canvas.width) / 2, 
            ((-perspectiveAdjustedVector.components[1] / perspectiveAdjustedVector.components[3] + 1) * canvas.height) / 2
        )

        return screenSpaceVector
    }
}