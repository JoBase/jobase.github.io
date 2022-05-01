"use strict"

const mutation = new MutationObserver(() => {
    if (!document.body) return

    const theme = localStorage.getItem("theme")
    const dark = matchMedia("(prefers-color-scheme: dark)").matches
    const current = theme ? theme : dark ? "dark" : "light"
    const icon = document.querySelector(".theme")

    document.body.setAttribute("theme", current)
    icon.className += ` fa-solid fa-${current == "dark" ? "moon" : "sun"}`
    mutation.disconnect()
})

mutation.observe(document.documentElement, {childList: true})

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
    const code = document.querySelectorAll("pre,code")
    year.textContent = new Date().getFullYear()

    code.forEach(e => {
        const parts = e.textContent.split("\n")
        const min = Math.min(...parts.map(s => s.search(/\S/)).filter(e => e > 0))
        const string = parts.map(s => s.substring(min)).join("\n")

        e.innerHTML = hljs.highlight(string || e.textContent, {language: "python"}).value
    })
}