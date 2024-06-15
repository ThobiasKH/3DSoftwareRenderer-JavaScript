class Vector {
    constructor(...components) {
        if (components.length < 2) {throw new Error('Error at Vector construction -> components must be length 2 or more')}

        this.components = components
    }

    static initNullVectorOfLength(length) {
        const components = []
        for (let i = 0; i < length; i++) {components.push(0)}
        return new Vector(...components)
    }

    static getLength(vector) {
        return Math.sqrt(vector.components.reduce((acc, val) => acc + val * val, 0))
    }

    static getComponentSize(vector) {
        return vector.components.length
    }
  
    static getNormalized(vector) {
        const magnitude = this.getLength(vector)
        if (magnitude === 0) {
            return new Vector(...vector.components.map(component => 0))
        }
      return new Vector(...vector.components.map(component => component / magnitude))
    }

    static matrixVectorMultiply(matrix, vector) {
        const matrixSize = this.getComponentSize(matrix)
        if (matrixSize != this.getComponentSize(vector)) {throw new Error('Error in Vector.matrixVectorMultiply(matrix, vector) -> not same size')}

        const result = this.initNullVectorOfLength(matrixSize)

        for (let i = 0; i < matrixSize; i++) {
            for (let j = 0; j < this.getComponentSize(matrix.components[i]); j++) {
                result.components[i] += matrix.components[i].components[j] * vector.components[j]
            }
        }

        return result
    }

    static matrixMatrixMultiply(matrixA, matrixB) {
        const rowsA = this.getComponentSize(matrixA)
        const colsA = this.getComponentSize(matrixA.components[0])
        const rowsB = this.getComponentSize(matrixB)
        const colsB = this.getComponentSize(matrixB.components[0])

        if (colsA !== rowsB) {
            throw new Error('Error in Vector.matrixMatrixMultiply(matrixA, matrixB) -> Incompatible matrices')
        }

        const result = new Array(rowsA).fill(null).map(() => this.initNullVectorOfLength(colsB))

        for (let i = 0; i < rowsA; i++) {
            for (let j = 0; j < colsB; j++) {
                result[i].components[j] = 0
                for (let k = 0; k < colsA; k++) {
                    result[i].components[j] += matrixA.components[i].components[k] * matrixB.components[k].components[j]
                }
            }
        }

        return new Vector(...result)
    }
  
    static scalarMultiply(vector, scalar) {
        return new Vector(...vector.components.map(component => component * scalar))
    }
  
    static dotProduct(vector1, vector2) {
        if (vector1.components.length !== vector2.components.length) {
            throw new Error("Vectors must have the same number of components for dot product.")
        }
        return vector1.components.reduce((acc, component, index) => acc + component * vector2.components[index], 0)
    }

    static crossProduct_3D(vector1, vector2) {
        if (vector1.components.length != 3 || vector2.components.length != 3) {
            throw new Error("Vectors must have three components for cross product.")
        }
        return new Vector(
            vector1.components[1] * vector2.components[2] - vector2.components[1] * vector1.components[2],
            vector1.components[0] * vector2.components[2] - vector2.components[0] * vector1.components[2],
            vector1.components[1] * vector2.components[0] - vector2.components[2] * vector1.components[0],
        )
    }
  
    static add(vector1, vector2) {
        if (vector1.components.length !== vector2.components.length) {
            throw new Error("Vectors must have the same number of components for addition.")
        }
        return new Vector(...vector1.components.map((component, index) => component + vector2.components[index]))
    }
  
    static subtract(vector1, vector2) {
        if (vector1.components.length !== vector2.components.length) {
            throw new Error("Vectors must have the same number of components for subtraction.")
        }
        return new Vector(...vector1.components.map((component, index) => component - vector2.components[index]))
    }
  
    toString(decimals = 10) {
        const formattedComponents = this.components.map(component => {
            return component.toFixed(decimals)
        })
        return `(${formattedComponents.join(', ')})`
    }

    static getRotatedX_3D(vector, angle, point = new Vector(0, 0, 0)) {
        const translatedVector = new Vector(vector.components[0] - point.components[0], vector.components[1] - point.components[1], vector.components[2] - point.components[2])

        const angleRadX = angle * Math.PI / 180

        const rotationMatrixX = new Vector(
            new Vector(1, 0, 0),
            new Vector(0, Math.cos(angleRadX), -Math.sin(angleRadX)),
            new Vector(0, Math.sin(angleRadX), Math.cos(angleRadX))
        )

        const rotatedTranslatedVector = this.matrixVectorMultiply(rotationMatrixX, translatedVector)

        const finalVector = new Vector(rotatedTranslatedVector.components[0] + point.components[0], rotatedTranslatedVector.components[1] + point.components[1], rotatedTranslatedVector.components[2] + point.components[2])

        return finalVector
    }

    static getRotatedY_3D(vector, angle, point = new Vector(0, 0, 0)) {
        const translatedVector = new Vector(vector.components[0] - point.components[0], vector.components[1] - point.components[1], vector.components[2] - point.components[2])

        const angleRadY = angle * Math.PI / 180

        const rotationMatrixY = new Vector(
            new Vector(Math.cos(angleRadY), 0, Math.sin(angleRadY)),
            new Vector(0, 1, 0),
            new Vector(-Math.sin(angleRadY), 0, Math.cos(angleRadY))
        )

        const rotatedTranslatedVector = this.matrixVectorMultiply(rotationMatrixY, translatedVector)

        const finalVector = new Vector(rotatedTranslatedVector.components[0] + point.components[0], rotatedTranslatedVector.components[1] + point.components[1], rotatedTranslatedVector.components[2] + point.components[2])

        return finalVector
    }

    static getRotatedZ_3D(vector, angle, point = new Vector(0, 0, 0)) {
        const translatedVector = new Vector(vector.components[0] - point.components[0], vector.components[1] - point.components[1], vector.components[2] - point.components[2])

        const angleRadZ = angle * Math.PI / 180

        const rotationMatrixZ = new Vector(
            new Vector(Math.cos(angleRadZ), -Math.sin(angleRadZ), 0),
            new Vector(Math.sin(angleRadZ), Math.cos(angleRadZ), 0),
            new Vector(0, 0, 1)
        )

        const rotatedTranslatedVector = this.matrixVectorMultiply(rotationMatrixZ, translatedVector)

        const finalVector = new Vector(rotatedTranslatedVector.components[0] + point.components[0], rotatedTranslatedVector.components[1] + point.components[1], rotatedTranslatedVector.components[2] + point.components[2])

        return finalVector
    }
}