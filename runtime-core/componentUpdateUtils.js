export function shouldUpdate(oldVNode, newVNode){
    const { props: oldProps } = oldVNode
    const { props: newProps } = newVNode
    for (const key in newProps) {
        if (newProps[key] !== oldProps[key]) {
           return true
        }
    }
    return false
}