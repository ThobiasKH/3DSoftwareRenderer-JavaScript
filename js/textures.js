class TextureManager {
    static #FILEPATH_DIAMOND = 'src/textures/diamond.jpeg'

    static TEXTURE_DIAMOND

    // static TEXTURE_CANVAS = document.createElement('canvas')
    // static TEXTURE_CTX = this.TEXTURE_CANVAS.getContext('2d')

    static {
        this.TEXTURE_DIAMOND = new Image()
        this.TEXTURE_DIAMOND.src = this.#FILEPATH_DIAMOND

        
    }
}