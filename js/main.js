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
        /moon|sun/, current == "dark" ? "moon" : "sun")
}

onload = () => {
    const icon = document.querySelector(".theme")
    const code = document.querySelectorAll("pre[large], pre[small]")
    const pre = document.querySelectorAll("pre[code]")
    const editors = document.querySelectorAll("pre[editor]")

    const data = [
        {class: "string", regex: /("""[\s\S]*?"""|".*?"|'.*?'|#.*)/},
        {class: "keyword", regex: /\b(and|as|assert|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|nonlocal|not|or|pass|raise|return|try|while|with|yield)\b/},
        {class: "number", regex: /\b(True|False|None|\d+)\b/},
        {class: "builtin", regex: /\b(abs|all|any|ascii|bin|bool|bytearray|bytes|callable|chr|classmethod|compile|complex|delattr|dict|dir|divmod|enumerate|eval|exec|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|isinstance|issubclass|iter|len|list|locals|map|max|memoryview|min|next|object|oct|open|ord|pow|print|property|range|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|vars|zip)\b/},
        {class: "method", regex: /\b(\w+\()/, item: /\w+/},
        {class: "variable", regex: /\b(\w+)\b/},
        {class: "operator", regex: /([\/\*\+<>%=-]+)/}
    ]

    const loop = (s, i = 0) => {
        const span = (c, e) => `<span class=${c}>${e}</span>`
        const group = data[i]

        return s.split(group.regex).map((e, j) => j % 2 ? group.item ? e.replace(
            group.item, a => span(group.class, a)) : span(group.class, e) :
            i + 1 == data.length ? e : loop(e, i + 1)).join("")
    }

    const highlight = e => {
        const html = loop(e.textContent.trim())
        e.innerHTML = html.replace(/(<\/span>) (<span)/g, "$1$2> $1$2")
    }

    pre.forEach(e => {
        e.querySelectorAll("span").forEach(highlight)
        e.innerHTML = e.innerHTML.replace(/(^\n|\n\s+$)/g, "")
    })

    code.forEach(highlight)
    icon.className += ` fa-solid fa-${document.body.getAttribute("theme") == "dark" ? "moon" : "sun"}`
    year.textContent = new Date().getFullYear()
    editors.length && Sk.configure({output: text => console.log(text)})

    editors.forEach(e => {
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

        const resize = () => {
            canvas.width = editor.clientWidth * devicePixelRatio
            canvas.height = canvas.offsetHeight * devicePixelRatio
        }

        new ResizeObserver(resize).observe(editor)

        run.onclick = async () => {
            const code = mirror.getWrapperElement()
            await cancel.onclick()
    
            cancel.removeAttribute("active")
            run.setAttribute("active", true)
    
            gear.className = "fa-solid fa-arrows-rotate fa-spin"
            code.style.width = 0
            Sk.JoBase = canvas
            resize()

            try {
                const run = () => Sk.importMainWithBody("<stdin>", false, mirror.getValue(), true)
                await (program.promise = Sk.misceval.asyncToPromise(run))
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
    
        run.append(gear, a)
        cancel.append(square, b)
        buttons.append(run, cancel)
        editor.append(buttons, main)
        e.replaceWith(editor)
    
        const mirror = CodeMirror(main, {
            mode: "python",
            theme: "none", 
            value: e.textContent.trim()
        })
    
        mirror.refresh()
        main.appendChild(canvas)
        cancel.setAttribute("active", true)
        editor.className = "editor"
        gear.className = "fa-solid fa-gear"
        square.className = "fa-solid fa-stop"
    
        a.textContent = " Run"
        b.textContent = " Stop"
    })
}

onkeydown = event => {
    const options = ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]
    options.includes(event.code) && event.preventDefault()
}