"use strict"

const offscreen = typeof OffscreenCanvas !== "undefined"
const support = offscreen && new OffscreenCanvas(0, 0).getContext("webgl2")

class Game extends Worker {
    constructor(canvas, code, message) {
        super("/data/js/worker.js")

        const bitmap = canvas.getContext("bitmaprenderer")
        const observer = new ResizeObserver(() => resize({type: "resize"}))
        const events = []

        const resize = data => {
            canvas.width = canvas.clientWidth
            canvas.height = canvas.clientHeight

            this.postMessage(Object.assign(data, {width: canvas.width, height: canvas.height}))
        }

        this.onmessage = event => {
            if (event.data.type == "ready")
                resize({type: "run", code})

            else if (event.data.type == "start")
                observer.observe(canvas)

            else if (event.data.type == "update")
                bitmap.transferFromImageBitmap(event.data.image)

            else if (event.data.type == "add") {
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

                const root = event.data.root == "window" ? window : event.data.root == "document" ? document : canvas
                const entry = table.find(e => e.list.includes(event.data.name))

                const method = entry ? entry.value : (() => ({}))
                const value = e => this.postMessage({type: "event", name: e.type, data: method(e)})

                events.push(() => root.removeEventListener(event.data.name, value))
                root.addEventListener(event.data.name, value)
            }

            else if (event.data.type == "end") {
                events.forEach(e => e())
                observer.disconnect()
                this.terminate()
            }

            message && message(event.data)
        }
    }

    end() {
        this.postMessage({type: "end"})
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

    message(data) {
        if (data.type == "start") {
            this.button.onclick = () => this.game.end()
            this.flex.style.right = 0
        }

        else if (data.type == "end")
            this.flex.style.right = "-100%"
    }

    run() {
        this.game = new Game(this.canvas, this.mirror.getValue(), e => this.message(e))
        this.icon.className = "fa-solid fa-spin fa-arrows-rotate"
        this.button.onclick = null
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
        super(array.map(e => e.code).join(""))

        this.log = document.createElement("div")
        this.array = array
        this.stdout = []
        this.stderr = []

        this.log.className = "console"
        this.editor.appendChild(this.log)
        this.editor.after(this.button)
    }

    disable(event) {
        event.preventDefault()
    }

    message(data) {
        super.message(data)

        if (data.type == "start") {
            addEventListener("keydown", this.disable)
            addEventListener("mousedown", this.disable)
            addEventListener("contextmenu", this.disable)
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
            removeEventListener("keydown", this.disable)
            removeEventListener("mousedown", this.disable)
            removeEventListener("contextmenu", this.disable)

            if (this.stderr.length) {
                this.error(String.fromCharCode(...this.stderr))
                this.stderr = []
            }

            else this.check()
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

class Snippet extends Editor {
    constructor(value) {
        super(value)
        support && this.editor.appendChild(this.button)
    }

    message(data) {
        super.message(data)
        data.type == "end" && this.start()
    }
}

async function game(name) {
    if (support) {
        const canvas = document.currentScript.previousElementSibling
        const file = await fetch("https://jobase.org/JoBase/examples/" + name + ".py")

        new Game(canvas, await file.text())
    }

    else alert("OffscreenCanvas not available in your browser.")
}

async function graph(data) {
    const MAX_X = 2250
    const STEP_X = 250
    const MAX_Y = 80
    const STEP_Y = 10
    const SMOOTH = 10

    const graph = document.createElement("div")
    const canvas = document.createElement("canvas")
    const a = document.createElement("ul")
    const b = document.createElement("ul")

    const ctx = canvas.getContext("2d")
    const options = {root: null, threshold: .5}
    const index = {value: 0}

    const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        const style = getComputedStyle(document.body)
        const x = e => canvas.width / MAX_X * e
        const y = e => canvas.height - canvas.height / MAX_Y * e

        data.forEach(item => {
            ctx.strokeStyle = ctx.fillStyle = style.getPropertyValue("--" + item.color)
            ctx.beginPath()
            ctx.moveTo(0, y(60))

            for (let j = 1; j <= index.value; j ++) {
                const array = new Array(SMOOTH * 2 + 1).fill(item.data[j])
                const total = array.reduce((a, b, i) => a + (item.data[j + i - SMOOTH] || b))

                const px = x(j)
                const py = y(array.length / total)

                ctx.lineTo(px, py)
                j == index.value && ctx.fillText(item.name, px + 5, py)
            }

            ctx.stroke()
        })
    }

    const update = () => {
        if (index.value < MAX_X)
            index.frame = requestAnimationFrame(update)

        index.value += 2
        draw()
    }

    const add = (item, max, step) => {
        for (let i = 0; i < max; i += step)
            item.appendChild(document.createElement("li"))
    }

    graph.className = "graph"
    a.className = "x"
    b.className = "y"

    graph.append(a, b, canvas)
    document.currentScript.replaceWith(graph)

    add(a, MAX_X, STEP_X)
    add(b, MAX_Y, STEP_Y)

    for (const item of data) {
        const file = await fetch("data/json/" + item.file + ".json")
        item.data = await file.json()
    }

    new ResizeObserver(() => {
        canvas.width = canvas.clientWidth * devicePixelRatio
        canvas.height = canvas.clientHeight * devicePixelRatio

        ctx.lineWidth = 4
        ctx.lineJoin = "bevel"
        ctx.font = "bold 18px monospace"
        ctx.textBaseline = "middle"

        draw()
    }).observe(canvas)

    new IntersectionObserver(entries => {
        if (entries[0].isIntersecting)
            index.frame = requestAnimationFrame(update)

        else cancelAnimationFrame(index.frame)
    }, options).observe(canvas)
}

function snippet(value) {
    new Snippet(value)
}

function load(array) {
    const parent = document.currentScript.parentNode

    if (parent.className == "active" && !support) {
        const text = document.createElement("p")

        text.textContent = "It seems like your browser can't run JoBase online. Safari iOS is not supported."
        text.className = "error"
        parent.prepend(text)
    }

    new Lesson(array)
}