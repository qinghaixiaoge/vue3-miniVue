export function emit(componentInstance, event, ...args) {
    const { props } = componentInstance
    const handlerName = 'on' + event[0].toUpperCase() + event.slice(1)
    const handler = props[handlerName]
    handler && handler(...args)
}