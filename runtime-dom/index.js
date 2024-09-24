import { createRenderer } from "../runtime-core/index.js";
function createElement(type) {
    return document.createElement(type)
}

function patchProp(el, key, prevValue, nextValue) {
    if (/^on[A-Z]/.test(key)) {
        el.addEventListener(key.slice(2).toLowerCase(), nextValue)
    } else {
        if (Array.isArray(nextValue)) {
            el.setAttribute(key, nextValue.join(' '))
        } else {
            if (nextValue === null || nextValue === undefined) {
                el.removeAttribute(key)
            } else {
                el.setAttribute(key, nextValue)
            }
        }
    }
}

function insert(child, parent, anchor) {
    // parent.append(el)
    // 插入到anchor之前
    parent.insertBefore(child, anchor || null)
}

function remove(child) {
    const parent = child.parentNode
    if (parent) {
        parent.removeChild(child)
    }
}

function setElementText(el, text) {
    el.textContent = text
}

const renderer = createRenderer({ createElement, patchProp, insert, remove, setElementText })

export function createApp(...args) {
    return renderer.createApp(...args)
}

export * from "../runtime-core/index.js"

