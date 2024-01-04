"use strict"

function syntax(code) {
    const data = [
        {class: "string", regex: /("""[\s\S]*?"""|".*?"|'.*?'|#.*)/},
        {class: "keyword", regex: /\b(and|as|assert|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|nonlocal|not|or|pass|raise|return|try|while|with|yield)\b/},
        {class: "number", regex: /\b(True|False|None|\d+)\b/},
        {class: "builtin", regex: /\b(abs|all|any|ascii|bin|bool|bytearray|bytes|callable|chr|classmethod|compile|complex|delattr|dict|dir|divmod|enumerate|eval|exec|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|isinstance|issubclass|iter|len|list|locals|map|max|memoryview|min|next|object|oct|open|ord|pow|print|property|range|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|vars|zip)\b/},
        {class: "def", regex: /\b(\w+\()/, item: /\w+/},
        {class: "variable", regex: /\b(\w+)\b/},
        {class: "operator", regex: /([\/\*\+<>%=-]+)/}
    ]

    const loop = (text, index = 0) => {
        const span = (c, e) => `<span class=cm-${c}>${e}</span>`
        const group = data[index]

        return text.split(group.regex).map((e, i) => i % 2 ? group.item ? e.replace(
            group.item, e => span(group.class, e)) : span(group.class, e) :
            index + 1 == data.length ? e : loop(e, index + 1)).join("")
    }

    return loop(code)
}

function start() {
    const mutation = new MutationObserver(() => {
        const store = localStorage.getItem("theme")
        const dark = matchMedia("(prefers-color-scheme:dark)").matches
        const type = store ? store : dark ? "moon" : "sun"

        onload = () => {
            const pre = document.querySelectorAll("pre[code]")
            const bars = document.querySelector(".fa-bars")

            if (bars) {
                const set = e => theme.className = theme.className.replace(/moon|sun/, e)
                const theme = document.querySelector(".fa-sun")

                bars.onclick = () => {
                    const top = bars.parentNode
                    top.className = top.className == "top" ? top.className + " active" : "top"
                }

                theme.onclick = () => {
                    const type = document.body.getAttribute("theme") == "moon" ? "sun" : "moon"

                    localStorage.setItem("theme", type)
                    document.body.setAttribute("theme", type)
                    set(type)
                }

                set(type)
                year.textContent = new Date().getFullYear()
            }

            pre.forEach(e => e.innerHTML = syntax(e.textContent.trim()))
        }

        document.body.setAttribute("theme", type)
        mutation.disconnect()
    })

    mutation.observe(document.documentElement, {childList: true})
}

start()