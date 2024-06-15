class InputManager {
    static mouseMove = new Vector(0, 0)
    static mouseIsDown = false
    static mouseSensitivity = 10

    static keyDown = {}

    //! Remember to remove this
    static #cameraWantsToSprint = false

    static handleKeys() {
        this.#cameraWantsToSprint ? Camera.setSpeed(0.03) : Camera.setSpeed(0.01)

        for (const key in this.keyDown) {
 
            if (key == 'w') {Camera.moveAlongForward(-1)}
            if (key == 's') {Camera.moveAlongForward( 1)}
            if (key == 'a') {Camera.moveAlongSide(1)}
            if (key == 'd') {Camera.moveAlongSide(-1)}
            if (key == ' ') {Camera.float(-1)}
            if (key == 'Control') {Camera.float(1)}
            if (key == 'Shift') {this.#cameraWantsToSprint = true}
            if (key != 'Shift') {this.#cameraWantsToSprint = false}
        }
    }
}

canvas.addEventListener('click', async (e) => {
    if (e.button == 2) {usePixelRenderer = !usePixelRenderer}
    await canvas.requestPointerLock({unadjustedMovement: true,})
})
canvas.addEventListener('mousemove', (e) => {
    InputManager.mouseMove.components[0] = (e.movementX / canvas.width) * 1
    InputManager.mouseMove.components[1] = (e.movementY / canvas.height) * 1
})

canvas.addEventListener('mousedown', () => {InputManager.mouseIsDown = true})
canvas.addEventListener('mouseup', () => {InputManager.mouseIsDown = false})
canvas.addEventListener('mouseleave', () => {InputManager.mouseIsDown = false})

window.addEventListener(
    'beforeunload',
    function(e){
        e.stopPropagation();e.preventDefault();return false;
    },
    true
)
document.addEventListener('contextmenu', (e) => {e.preventDefault()})

document.addEventListener('keydown', (e) => {
    InputManager.keyDown[e.key] = true
})

document.addEventListener('keyup', (e) => {
    delete InputManager.keyDown[e.key]
})