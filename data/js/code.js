"use strict"

const offscreen = typeof OffscreenCanvas !== "undefined"
const support = offscreen && new OffscreenCanvas(0, 0).getContext("webgl2")

class Game extends Worker {
    constructor(canvas) {
        super("/data/js/worker.js")

        this.ready = new Promise(m => this.onmessage = e => e.data.type == "ready" && m())
        this.bitmap = canvas.getContext("bitmaprenderer")
        this.canvas = canvas
    }

    resize(data) {
        this.canvas.width = this.canvas.clientWidth * devicePixelRatio,
        this.canvas.height = this.canvas.clientHeight * devicePixelRatio
        this.postMessage(Object.assign(data, {width: this.canvas.width, height: this.canvas.height}))
    }

    async run(code) {
        const observer = new ResizeObserver(() => this.resize({type: "resize"}))
        const events = []

        const update = event => {
            if (event.data.type == "start")
                observer.observe(this.canvas)

            else if (event.data.type == "update")
                this.bitmap.transferFromImageBitmap(event.data.image)

            else if (event.data.type == "add") {
                const mouse = event => {
                    const rect = this.canvas.getBoundingClientRect()

                    return {
                        type: event.type,
                        pageX: event.pageX - scrollX - rect.left,
                        pageY: event.pageY - scrollY - rect.top,
                        target: event.target == this.canvas
                    }
                }

                const table = [
                    {list: ["keydown", "keyup"], value: e => ({keyCode: e.keyCode})},
                    {list: ["wheel", "mousewheel"], value: e => ({type: e.type, deltaMode: e.deltaMode})},
                    {list: ["mouseenter", "mouseleave"], value: e => ({target: e.target == this.canvas})},
                    {list: ["mousemove", "mousedown", "mouseup", "touchmove", "touchstart", "touchcancel", "touchend"], value: mouse}
                ]

                const root = event.data.root == "window" ? window : event.data.root == "document" ? document : this.canvas
                const entry = table.find(e => e.list.includes(event.data.name))

                const method = entry ? entry.value : (() => ({}))
                const value = e => this.postMessage({type: "event", name: e.type, data: method(e)})

                events.push(() => root.removeEventListener(event.data.name, value))
                root.addEventListener(event.data.name, value)
            }

            else if (event.data.type == "end") {
                observer.disconnect()
                events.forEach(e => e())

                this.removeEventListener("message", update)
                this.terminate()
            }
        }

        await this.ready
        this.addEventListener("message", update)
        this.resize({type: "run", code})
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

        this.reset()
        this.start()
    }

    run() {
        if (support) {
            this.icon.className = "fa-solid fa-spin fa-arrows-rotate"
            this.button.onclick = null
            this.worker.run(this.mirror.getValue())

            this.worker.onmessage = event => {
                if (event.data.type == "start") {
                    this.button.onclick = () => this.worker.postMessage({type: "end"})
                    this.flex.style.right = 0
                }

                else if (event.data.type == "end") {
                    this.flex.style.right = "-100%"
                    this.reset()
                }

                this.message && this.message(event.data)
            }
        }
    }

    reset() {
        support && (this.worker = new Game(this.canvas))
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

        this.message = data => {
            if (data.type == "start") {
                addEventListener("keydown", disable)
                addEventListener("mousedown", disable)
                addEventListener("contextmenu", disable)
            }

            else if (data.type == "stdout") {
                this.stdout.push(data.code)

                if (data.code == 10) {
                    const span = document.createElement("span")

                    span.textContent = String.fromCharCode(...this.stdout)
                    this.stdout = []
                    this.add(span)
                }
            }

            else if (data.type == "stderr")
                this.stderr.push(data.code)

            else if (data.type == "end") {
                removeEventListener("keydown", disable)
                removeEventListener("mousedown", disable)
                removeEventListener("contextmenu", disable)

                if (this.stderr.length) {
                    this.error(String.fromCharCode(...this.stderr))
                    this.stderr = []
                }

                else this.check()
            }
        }
    }

    run() {
        this.log.innerHTML = ""
        support ? super.run() : this.check()
    }

    add(item) {
        this.log.appendChild(item)
        this.log.scrollTop = this.log.scrollHeight
    }

    error(text) {
        const span = document.createElement("span")

        span.className = "error"
        span.textContent = text

        super.error()
        this.add(span)
    }

    check() {
        const minify = text => {
            const identifier = /\\\s*\n/g
            const space = /(\S) +/g
            const operator = / ?([\/\.\[\]+*(){}:,<>%=-]+) ?/g
            const newline = /\s+(\n|$)/g
            const block = /#.*|("""[\s\S]*?"""|'''[\s\S]*?'''|".*?"|'.*?')/
            const code = text.replace(identifier, "").split(block)

            return code.map((e, i) => i % 2 ? e : e.replace(space, "$1 ").replace(operator, "$1").replace(newline, "\n")).join("")
        }

        const escape = e => e.replace(/[.*+?^${}()|[\]]/g, "\\$&")
        const regex = new RegExp(this.array.map(e => e.alt ? "([\\s\\S]+)" : escape(minify(e.code.trim()))).join(""))
        const result = regex.exec(minify(this.mirror.getValue().trim()))

        if (result) {
            for (const [i, item] of this.array.filter(e => e.alt).entries()) {
                const exception = item.alt(result[i + 1])
                if (exception) return this.error(exception)
            }

            this.button.onclick = () => {
                this.editor.parentNode.nextElementSibling.className = "active"
                this.editor.parentNode.nextElementSibling.scrollIntoView()
                this.start()
            }

            this.icon.className = "fa-solid fa-chevron-down"
        }

        else this.error("It looks like you edited the wrong part.")
    }
}

async function game(name) {
    if (support) {
        const canvas = document.currentScript.previousElementSibling
        const file = await fetch("https://jobase.org/JoBase/examples/" + name + ".py")

        new Game(canvas).run(await file.text())
    }

    else alert("OffscreenCanvas not available in your browser.")
}

function snippet(value) {
    const box = new Editor(value)

    box.message = e => e.type == "end" && box.start()
    support && box.editor.appendChild(box.button)
}

function load(array) {
    const parent = document.currentScript.parentNode

    if (parent.className == "active") {
        const text = document.createElement("p")

        text.textContent = "It seems like your browser can't run JoBase online. You won't be able to run the code in this lesson."
        text.className = "error"
        parent.prepend(text)
    }

    new Lesson(array)
}