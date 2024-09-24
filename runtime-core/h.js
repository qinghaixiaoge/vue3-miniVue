import { createVNode } from "./vnode.js"
export function h(types, props, children) {
    return createVNode(types, props, children)
}