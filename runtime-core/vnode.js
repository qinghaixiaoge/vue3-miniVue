export const Fragment = Symbol("Fragment")
export const Text = Symbol("Text")
export function createVNode(types, props, children) {
    return {
        types,
        props,
        children,
        component: null,
        el: null,
        key: props && props.key
    }
}

export function createTextVNode(str) {
    return createVNode(Text, {}, str)
}