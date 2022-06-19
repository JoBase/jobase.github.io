"use strict"

function toggleBars(element) {
    const top = element.parentNode

    if (top.className == "top")
        top.className += " active"

    else top.className = "top"
}

function toggleTheme(element) {
    const theme = document.body.getAttribute("theme")
    const current = theme == "dark" ? "light" : "dark"

    localStorage.setItem("theme", current)
    document.body.setAttribute("theme", current)

    element.className = element.className.replace(
        /(moon|sun)/, current == "dark" ? "moon" : "sun")
}

onload = () => {
    const icon = document.querySelector(".theme")
    const code = document.querySelectorAll("code")
    const pre = document.querySelectorAll("pre[code")
    const scripts = document.querySelectorAll("pre[editor]")

    icon.className += ` fa-solid fa-${document.body.getAttribute("theme") == "dark" ? "moon" : "sun"}`
    year.textContent = new Date().getFullYear()

    const reduce = content => {
        const parts = content.split("\n")
        const min = Math.min(...parts.map(s => s.search(/\S/)).filter(e => e > 0))
        const string = parts.map(s => s.substring(min)).join("\n")

        return (string || content).trim()
    }

    if (scripts.length) {
        Sk.configure({output: text => console.log(text)})
        Sk.timeoutMsg = () => "Aborted"
    }

    code.forEach(e => e.innerHTML = hljs.highlight(
        reduce(e.textContent), {language: "python"}).value.replace(
            /<\/span> <span/g, "</span><span> </span><span"))

    pre.forEach(e => e.innerHTML = reduce(e.textContent).replace(
        /‡[\s\S]*?‡/g, a => `<span class=code>${hljs.highlight(
            a.slice(1, -1), {language: "python"}).value}</span>`))

    scripts.forEach(e => {
        const create = n => document.createElement(n)
        const program = {}

        const editor = create("div")
        const buttons = create("div")
        const main = create("div")
        const canvas = create("canvas")
        const run = create("button")
        const cancel = create("button")
        const gear = create("i")
        const square = create("i")
        const a = create("span")
        const b = create("span")

        run.onclick = async () => {
            const code = mirror.getWrapperElement()
            await cancel.onclick()
    
            cancel.removeAttribute("active")
            run.setAttribute("active", true)
    
            gear.className = "fa-solid fa-arrows-rotate fa-spin"
            code.style.width = 0
            Sk.JoBase = canvas
    
            try {
                await (program.promise = Sk.misceval.asyncToPromise(() =>
                    Sk.importMainWithBody("<stdin>", false, mirror.getValue(), true)))
            } catch (error) {console.error(error.toString())}
    
            run.removeAttribute("active")
            cancel.setAttribute("active", true)
    
            gear.className = "fa-solid fa-gear"
            code.style.width = "100%"
        }
    
        cancel.onclick = async () => {
            try {
                Sk.execLimit = 0
                await program.promise
            } catch {}
    
            delete Sk.execLimit
        }
    
        new ResizeObserver(() => {
            canvas.width = canvas.offsetWidth * devicePixelRatio
            canvas.height = canvas.offsetHeight * devicePixelRatio
        }).observe(canvas)
    
        run.append(gear, a)
        cancel.append(square, b)
        buttons.append(run, cancel)
        editor.append(buttons, main)
        e.replaceWith(editor)
    
        const mirror = CodeMirror(main, {
            mode: "python",
            theme: "none", 
            value: reduce(e.textContent)
        })
    
        main.appendChild(canvas)
        cancel.setAttribute("active", true)
        editor.className = "editor"
        gear.className = "fa-solid fa-gear"
        square.className = "fa-solid fa-stop"
    
        a.textContent = " Run"
        b.textContent = " Stop"
    })
}