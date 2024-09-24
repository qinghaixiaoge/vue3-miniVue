import { Fragment, createVNode } from "../vnode.js"
export function renderSlots(slot, name, ...args) {
    let vnode = slot[name] ? slot[name](...args) : null
    vnode = Array.isArray(vnode) ? vnode : [vnode]
    return createVNode(Fragment, {}, vnode)
}