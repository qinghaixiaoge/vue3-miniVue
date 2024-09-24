export function initSlots(componentInstance, children) {
    const slots = {}
    for (const key in children) {
        slots[key] = children[key] // default: ()=>h('div', {}, '我是组件插槽')
    }
    componentInstance.slots = slots
}