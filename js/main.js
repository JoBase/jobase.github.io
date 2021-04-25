let load = false

window.addEventListener("DOMContentLoaded", loaded)

window.onscroll = function() {
    if (load) {
        if (document.scrollingElement.scrollTop > 100) $('.back').fadeIn()
        else $('.back').fadeOut()
    }
}

function loaded() {
	document.body.innerHTML = document.body.innerHTML
	.replace(/¦/g, "<font color = '77b13e'>")
	.replace(/%/g, "<font color = '999999'>")
	.replace(/{/g, "<font color = '3e77b1'>")
	.replace(/}/g, "</font>")
	.replace("^", new Date().getFullYear().toString())

    load = true
}

function bar() {
	let top = document.getElementById("top")
	
	if (top.className === "top") top.className += " responsive"	
	else top.className = "top"
}