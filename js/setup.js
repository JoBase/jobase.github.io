window.dataLayer = window.dataLayer || []
function gtag() {dataLayer.push(arguments)}

gtag("js", new Date())
gtag("config", "G-DKHQZ28TR3", {cookie_flags: "SameSite=None;Secure"})

const mutation = new MutationObserver(() => {
    if (!document.body) return

    const theme = localStorage.getItem("theme")
    const dark = matchMedia("(prefers-color-scheme: dark)").matches

    mutation.disconnect()
    document.body.setAttribute("theme", theme ? theme : dark ? "dark" : "light")
})

mutation.observe(document.documentElement, {childList: true})