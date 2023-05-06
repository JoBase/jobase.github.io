"use strict"

class Game extends Worker {
    constructor(canvas) {
        const bitmap = canvas.getContext("bitmaprenderer")

        const observer = new ResizeObserver(() => {
            this.resize()
            this.postMessage({type: "resize", width: this.canvas.width, height: this.canvas.height})
        })

        super("/data/js/worker.js")
        observer.observe(canvas)

        this.ready = new Promise(i => this.onmessage = e => e.data.type == "ready" && i())
        this.canvas = canvas
        this.events = []

        this.addEventListener("message", event => {
            if (event.data.type == "update")
                bitmap.transferFromImageBitmap(event.data.image)

            else if (event.data.type == "add") {
                const mouse = event => {
                    const rect = canvas.getBoundingClientRect()

                    return {
                        type: event.type,
                        pageX: event.pageX - window.scrollX - rect.left,
                        pageY: event.pageY - window.scrollY - rect.top,
                        target: event.target == canvas
                    }
                }

                const table = [
                    {list: ["keydown", "keyup"], value: e => ({keyCode: e.keyCode})},
                    {list: ["wheel", "mousewheel"], value: e => ({type: e.type, deltaMode: e.deltaMode})},
                    {list: ["mouseenter", "mouseleave"], value: e => ({target: e.target == canvas})},
                    {list: ["mousemove", "mousedown", "mouseup", "touchmove", "touchstart", "touchcancel", "touchend"], value: mouse}
                ]

                const root = event.data.root == "window" ? window : event.data.root == "document" ? document : canvas
                const entry = table.find(e => e.list.includes(event.data.name))

                const method = entry ? entry.value : (() => ({}))
                const value = e => this.postMessage({type: "event", name: e.type, data: method(e)})

                this.events.push(() => root.removeEventListener(event.data.name, value))
                root.addEventListener(event.data.name, value)
            }

            else if (event.data.type == "end") {
                observer.disconnect()
                this.events.forEach(e => e())
                this.terminate()
            }
        })
    }

    resize() {
        this.canvas.width = this.canvas.clientWidth * devicePixelRatio
        this.canvas.height = this.canvas.clientHeight * devicePixelRatio
    }

    async run(code) {
        await this.ready

        this.resize()
        this.postMessage({type: "run", code, width: this.canvas.width, height: this.canvas.height})
    }
}

class Editor {
    constructor(value, message) {
        const top = document.createElement("div")

        this.canvas = document.createElement("canvas")
        this.flex = document.createElement("div")
        this.editor = document.createElement("div")
        this.button = document.createElement("section")
        this.icon = document.createElement("i")

        this.mirror = CodeMirror(this.flex, {mode: "python", theme: "none", lineNumbers: true, indentUnit: 4, value})
        this.message = message

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

    async run() {
        this.icon.className = "fa-solid fa-spin fa-arrows-rotate"
        this.button.onclick = null
        await this.worker.run(this.mirror.getValue())

        this.worker.onmessage = event => {
            if (event.data.type == "start") {
                this.button.onclick = () => this.worker.postMessage({type: "end"})
                this.flex.style.right = 0
            }

            else if (event.data.type == "end") {
                this.flex.style.right = "-100%"
                this.reset()
            }

            this.message(event.data)
        }
    }

    reset() {
        this.listeners = []
        this.worker = new Game(this.canvas)
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

class Box extends Editor {
    constructor(array) {
        const code = array.map(e => e.code).join("")
        const disable = e => e.preventDefault()

        super(code, data => {
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

                else {
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
                    const regex = new RegExp(array.map(e => e.alt ? "([\\s\\S]+)" : escape(minify(e.code.trim()))).join(""))
                    const result = regex.exec(minify(this.mirror.getValue().trim()))

                    if (result) {
                        for (const [i, item] of array.filter(e => e.alt).entries()) {
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
        })

        this.log = document.createElement("div")
        this.stdout = []
        this.stderr = []

        this.log.className = "console"
        this.editor.appendChild(this.log)
        this.editor.after(this.button)
    }

    run() {
        this.log.innerHTML = ""
        super.run()
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
}

async function game(name) {
    const canvas = document.currentScript.previousElementSibling
    const worker = new Game(canvas)

    worker.run(await (await fetch("https://jobase.org/JoBase/examples/" + name + ".py")).text())
}

function snippet(value) {
    const box = new Editor(value, e => e.type == "end" && box.start())
    box.editor.appendChild(box.button)
}

function load(array) {
    new Box(array)
}