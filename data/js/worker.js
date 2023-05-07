"use strict"

const canvas = new OffscreenCanvas(600, 400)
const window = {location: {pathname: "JoBase"}, encodeURIComponent}

const screen = {}
const document = {}

var Module = {
    canvas,
    noInitialRun: true,
    stdout: e => postMessage({type: "stdout", code: e}),
    stderr: e => postMessage({type: "stderr", code: e})
}

async function init() {
    const blobs = [{name: "__init__.cpython-312-wasm32-emscripten.so", data: await (await fetch("JoBase.so")).blob()}]

    const add = async array => {
        for (const file of array)
            blobs.push({name: file, data: await (await fetch("https://jobase.org/JoBase/" + file)).blob()})
    }

    window.scrollX = 0
    window.scrollY = 0

    window.ready = new Promise(e => Module.onRuntimeInitialized = e)
    window.removeEventListener = () => null

    document.addEventListener = (name, value) => {
        postMessage({type: "add", root: "document", name})
        window[name] = value
    }

    window.addEventListener = (name, value) => {
        postMessage({type: "add", root: "window", name})
        window[name] = value
    }

    canvas.addEventListener = (name, value) => {
        postMessage({type: "add", root: "canvas", name})
        window[name] = value
    }

    canvas.getBoundingClientRect = () => {
        return {
            x: 0, y: 0,
            top: 0, left: 0,
            width: canvas.width,
            height: canvas.height
        }
    }

    onmessage = event => {
        if (event.data.type == "run") {
            canvas.width = event.data.width
            canvas.height = event.data.height

            callMain(["-c", event.data.code])
            window.process || postMessage({type: "end"})
        }

        else if (event.data.type == "end")
            window.terminate = true
    
        else if (event.data.type == "event") {
            if (event.data.data.target)
                event.data.data.target = canvas

            // const thing = new Proxy(event.data.data, {
            //     get: (target, prop, receiver) => {
            //         console.log(event.data.name, prop)
            //         return event.data.data[prop]
            //     }
            // })

            window[event.data.name](event.data.data)
        }

        else if (event.data.type == "resize")
            Module.setCanvasSize(event.data.width, event.data.height)
    }

    importScripts("python.js")
    await add(["man", "coin", "enemy"].map(e => "images/" + e + ".png"))
    await add(["default", "code", "pencil", "serif", "handwriting", "typewriter", "joined"].map(e => "fonts/" + e + ".ttf"))

    FS.mkdir("/JoBase")
    FS.mkdir("/JoBase/fonts")
    FS.mkdir("/JoBase/images")
    FS.mount(WORKERFS, {blobs}, "/JoBase")

    await window.ready
    postMessage({type: "ready"})
}

init()