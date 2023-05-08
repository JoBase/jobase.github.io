"use strict"

class Game extends Worker {
    constructor() {
        super("/data/js/worker.js")
    }

    end() {
        this.postMessage({type: "end"})
    }

    message(method) {
        const update = event => {
            if (event.data.type == "end")
                this.removeEventListener("message", update)

            method(event.data)
        }

        this.addEventListener("message", update)
    }

    async run(code, canvas) {
        const bitmap = canvas.getContext("bitmaprenderer")
        const observer = new ResizeObserver(() => resize({type: "resize"}))
        const events = []

        const resize = data => {
            canvas.width = canvas.clientWidth
            canvas.height = canvas.clientHeight

            this.postMessage(Object.assign(data, {width: canvas.width, height: canvas.height}))
        }

        this.message(data => {
            if (data.type == "start")
                observer.observe(canvas)

            else if (data.type == "update") {
                console.log("update")
                bitmap.transferFromImageBitmap(data.image)
            }

            else if (data.type == "add") {
                const mouse = event => {
                    const rect = canvas.getBoundingClientRect()

                    return {
                        type: event.type,
                        pageX: event.pageX - scrollX - rect.left,
                        pageY: event.pageY - scrollY - rect.top,
                        target: event.target == canvas
                    }
                }

                const table = [
                    {list: ["keydown", "keyup"], value: e => ({keyCode: e.keyCode})},
                    {list: ["wheel", "mousewheel"], value: e => ({type: e.type, deltaMode: e.deltaMode})},
                    {list: ["mouseenter", "mouseleave"], value: e => ({target: e.target == canvas})},
                    {list: ["mousemove", "mousedown", "mouseup", "touchmove", "touchstart", "touchcancel", "touchend"], value: mouse}
                ]

                const root = data.root == "window" ? window : data.root == "document" ? document : canvas
                const entry = table.find(e => e.list.includes(data.name))

                const method = entry ? entry.value : (() => ({}))
                const value = e => this.postMessage({type: "event", name: e.type, data: method(e)})

                events.push(() => root.removeEventListener(data.name, value))
                root.addEventListener(data.name, value)
            }

            else if (data.type == "end") {
                events.forEach(e => e())
                observer.disconnect()
            }
        })

        resize({type: "run", code})
    }
}

class Editor {
    constructor(code) {
        const top = document.createElement("div")

        this.canvas = document.createElement("canvas")
        this.flex = document.createElement("div")
        this.editor = document.createElement("div")
        this.button = document.createElement("section")
        this.icon = document.createElement("i")

        this.mirror = CodeMirror(this.flex, {
            mode: "python",
            theme: "none",
            lineNumbers: true,
            indentUnit: 4,
            value: code
        })

        this.editor.className = "editor"
        this.editor.appendChild(top)

        top.appendChild(this.flex)
        this.flex.appendChild(this.canvas)
        this.button.appendChild(this.icon)
        document.currentScript.replaceWith(this.editor)

        new ResizeObserver(() => this.mirror.refresh()).observe(this.editor)
        this.mirror.refresh()
        this.start()
    }

    run() {
        worker.message(data => {
            if (data.type == "start") {
                console.log("START")
                this.button.onclick = () => worker.end()
                this.flex.style.right = 0
            }

            else if (data.type == "stderr" || data.type == "stdout") {
                thing.push(data.code)

                if (data.code == 10) {
                    console.log(String.fromCharCode(...thing))
                    thing.length = 0
                }
            }

            else if (data.type == "end") {
                console.log("ENDDDD")
                this.flex.style.right = "-100%"
                this.start()
            }
        })

        worker.run(this.mirror.getValue(), this.canvas)
        this.icon.className = "fa-solid fa-spin fa-arrows-rotate"
        this.button.onclick = null

        const thing = []
    }

    start() {
        this.icon.className = "fa-solid fa-gear"
        this.button.onclick = () => this.run()
    }

    error() {
        this.icon.className = "fa-solid fa-xmark"
        this.button.onclick = () => this.run()
    }
}

class Lesson extends Editor {
    constructor(array) {
        const disable = e => e.preventDefault()

        super(array.map(e => e.code).join(""))
        this.log = document.createElement("div")
        this.array = array
        this.stdout = []
        this.stderr = []

        this.log.className = "console"
        this.editor.appendChild(this.log)
        this.editor.after(this.button)
    }
}

const offscreen = typeof OffscreenCanvas !== "undefined"
const support = offscreen && new OffscreenCanvas(0, 0).getContext("webgl2")
const worker = new Game()

function snippet(value) {
    const box = new Editor(value)

    //box.message = e => e.type == "end" && box.start()
    support && box.editor.appendChild(box.button)
}

function load(array) {
    const parent = document.currentScript.parentNode

    if (parent.className == "active" && !support) {
        const text = document.createElement("p")

        text.textContent = "It seems like your browser can't run JoBase online. You won't be able to run the code in this lesson."
        text.className = "error"
        parent.prepend(text)
    }

    new Lesson(array)
}