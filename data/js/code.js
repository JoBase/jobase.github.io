"use strict"

function start() {
    window.Module = {noInitialRun: true}
    Module.ready = new Promise(r => Module.onRuntimeInitialized = r)
}

function snippet(code) {
    const pre = document.createElement("pre")

    pre.innerHTML = code.map((e, i) => i % 2 ? syntax(e) : "<span class=cm-comment>" + e + "</span>").join("")
    pre.className = "snippet"

    document.currentScript.replaceWith(pre)
}

async function game(name) {
    const canvas = document.querySelector("canvas")
    const text = await (await fetch("https://jobase.org/JoBase/examples/" + name + ".py")).text()

    Module.canvas = canvas
    canvas.oncontextmenu = e => e.preventDefault()

    new ResizeObserver(() => Module.setCanvasSize(canvas.clientWidth, canvas.clientHeight)).observe(canvas)
    await Module.ready

    callMain(["-c", text])
    return text
}

async function demo(name) {
    const code = document.createElement("pre")

    document.currentScript.replaceWith(code)
    code.innerHTML = syntax(await game(name))
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

        ctx.lineWidth = 3
        ctx.lineJoin = "bevel"
        ctx.font = "bold 18px monospace"
        ctx.textBaseline = "middle"

        draw()
    }).observe(canvas)

    new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) index.frame = requestAnimationFrame(update)
        else cancelAnimationFrame(index.frame)
    }, {threshold: .8}).observe(graph)
}

start()