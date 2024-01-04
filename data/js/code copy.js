"use strict"

var Module = {
    noInitialRun: true,
    preRun: [init],
    stdout: e => Module.game.stdout(e),
    stderr: e => Module.game.stderr(e)
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

function snippet(code) {
    const run = () => {
        icon.className = "fa-solid fa-spin fa-arrows-rotate"
        button.onclick = null

        Module.game = game
        Module.canvas = canvas
        Module.setCanvasSize(canvas.clientWidth, canvas.clientHeight)

        callMain(["-c", mirror.getValue()])
        game.process || start()
    }

    const start = () => {
        icon.className = "fa-solid fa-gear"
        button.onclick = run
    }

    const canvas = document.createElement("canvas")
    const flex = document.createElement("div")
    const editor = document.createElement("div")
    const top = document.createElement("div")
    const button = document.createElement("section")
    const icon = document.createElement("i")

    const game = {
        stdout: code => {
            console.log(String.fromCharCode(code))
        },

        stderr: code => {
            console.log(String.fromCharCode(code))
        },

        start: () => {
            flex.style.right = 0
            game.process = true
            button.onclick = () => game.terminate = true
        },

        end: start
    }

    const mirror = CodeMirror(flex, {
        mode: "python",
        theme: "none",
        lineNumbers: true,
        indentUnit: 4,
        value: code
    })

    editor.className = "editor"
    editor.append(top, button)

    top.appendChild(flex)
    flex.appendChild(canvas)
    button.appendChild(icon)
    document.currentScript.replaceWith(editor)

    new ResizeObserver(() => mirror.refresh()).observe(editor)
    mirror.refresh()
    start()
}

// class Lesson {
//     constructor(array) {
//         const top = document.createElement("div")

//         this.canvas = document.createElement("canvas")
//         this.flex = document.createElement("div")
//         this.editor = document.createElement("div")
//         this.button = document.createElement("section")
//         this.icon = document.createElement("i")
//         this.log = document.createElement("div")

//         this.mirror = CodeMirror(this.flex, {
//             mode: "python",
//             theme: "none",
//             lineNumbers: true,
//             indentUnit: 4,
//             value: array.map(e => e.code).join("")
//         })

//         this.editor.className = "editor"
//         this.log.className = "console"

//         this.editor.appendChild(top)
//         this.editor.appendChild(this.log)

//         top.appendChild(this.flex)
//         this.flex.appendChild(this.canvas)
//         this.button.appendChild(this.icon)

//         document.currentScript.replaceWith(this.editor)
//         this.editor.after(this.button)

//         new ResizeObserver(() => this.mirror.refresh()).observe(this.editor)
//         this.mirror.refresh()
//         this.start()
//     }

//     message(data) {
//         if (data.type == "start") {
//             this.button.onclick = () => this.game.end()
//             this.flex.style.right = 0
//         }

//         else if (data.type == "end")
//             this.flex.style.right = "-100%"
//     }

//     run() {
//         this.icon.className = "fa-solid fa-spin fa-arrows-rotate"
//         this.button.onclick = null

//         Module.stdout = code => {
//             this.log.appendChild(document.createTextNode(String.fromCharCode(code)))
//             this.log.scrollTop = this.log.scrollHeight
//         }

//         Module.stderr = code => {
//             this.log.appendChild(document.createTextNode(String.fromCharCode(code)))
//             this.log.scrollTop = this.log.scrollHeight
//         }

//         callMain(["-c", this.mirror.getValue()])

//         console.log("END")

//         //callMain(["c", this.mirror.getValue()])

//         this.icon.className = "fa-solid fa-spin fa-arrows-rotate"
//         this.button.onclick = null
//     }

//     start() {
//         this.icon.className = "fa-solid fa-gear"
//         this.button.onclick = () => this.run()
//     }
// }

function init() {
    FS.mkdir("/JoBase")
    FS.createPreloadedFile("/JoBase", "__init__.cpython-312-wasm32-emscripten.so", "python.so", true, false)
}

// function load(array) {
//     const error = text => {
//         const span = document.createElement("span")

//         span.className = "error"
//         span.textContent = text
//         icon.className = "fa-solid fa-xmark"

//         start()
//         add(span)
//     }

//     const run = () => {
//         icon.className = "fa-solid fa-spin fa-arrows-rotate"
//         button.onclick = null

//         Module.game = game
//         Module.canvas = canvas
//         Module.setCanvasSize(canvas.clientWidth, canvas.clientHeight)

//         callMain(["-c", mirror.getValue()])
//         game.process || check()
//     }

//     const add = html => {
//         log.appendChild(html)
//         log.scrollTop = log.scrollHeight
//     }

//     const start = () => {
//         game.terminate = false
//         game.process = false
//         button.onclick = run
//     }

//     const check = () => {
//         const minify = text => {
//             const identifier = /\\\s*\n/g
//             const space = /(\S) +/g
//             const operator = / ?([\/\.\[\]+*(){}:,<>%=-]+) ?/g
//             const newline = /\s+(\n|$)/g
//             const block = /#.*|("""[\s\S]*?"""|'''[\s\S]*?'''|".*?"|'.*?')/
//             const code = text.replace(identifier, "").split(block)

//             return code.map((e, i) => i % 2 ? e : e.replace(space, "$1 ").replace(operator, "$1").replace(newline, "\n")).join("")
//         }

//         const escape = e => e.replace(/[.*+?^${}()|[\]]/g, "\\$&")
//         const regex = new RegExp(array.map(e => e.alt ? "([\\s\\S]+)" : escape(minify(e.code.trim()))).join(""))
//         const result = regex.exec(minify(mirror.getValue().trim()))

//         if (result) {
//             for (const [i, item] of array.filter(e => e.alt).entries())
//                 error(item.alt(result[i + 1]))

//             button.onclick = () => {
//                 editor.parentNode.nextElementSibling.className = "active"
//                 editor.parentNode.nextElementSibling.scrollIntoView()

//                 icon.className = "fa-solid fa-gear"
//                 start()
//             }

//             icon.className = "fa-solid fa-chevron-down"
//         }

//         else error("It looks like you edited the wrong part.\n")
//     }

//     const top = document.createElement("div")
//     const canvas = document.createElement("canvas")
//     const flex = document.createElement("div")
//     const editor = document.createElement("div")
//     const button = document.createElement("section")
//     const icon = document.createElement("i")
//     const log = document.createElement("div")

//     const mirror = CodeMirror(flex, {
//         mode: "python",
//         theme: "none",
//         lineNumbers: true,
//         indentUnit: 4,
//         value: array.map(e => e.code).join("")
//     })

//     const game = {
//         stdout: code => {
//             add(document.createTextNode(String.fromCharCode(code)))
//         },

//         stderr: code => {
//             add(document.createTextNode(String.fromCharCode(code)))
//         },

//         start: () => {
//             flex.style.right = 0
//             game.process = true
//             button.onclick = () => game.terminate = true
//         },

//         end: () => {
//             check()
//         }
//     }

//     editor.className = "editor"
//     log.className = "console"

//     editor.appendChild(top)
//     editor.appendChild(log)

//     top.appendChild(flex)
//     flex.appendChild(canvas)
//     button.appendChild(icon)

//     document.currentScript.replaceWith(editor)
//     editor.after(button)

//     mirror.refresh()
//     start()
// }