import { initProps } from "./componentProps.js"
import { emit } from "./componentEmit.js"
import { initSlots } from "./componentSlots.js"
import { shallowReadOnly,proxyRefs } from "../reactivity/Vue.js"

export function createComponentInstance(vnode, parent) {
    const componentInstance = {
        vnode, //组件的虚拟dom
        next: null, // 组件更新后的虚拟dom
        type: vnode.types,
        render: vnode.types.render,
        setupState: {},
        props: {},
        slots: {},
        emit: () => { },
        parent,
        provides: parent ? parent.provides : {},
        isMounted: false,
        subTree: {}, // 组件render函数返回的虚拟dom
    }
    componentInstance.emit = emit.bind(null, componentInstance)
    return componentInstance
}

//setupComponent---->setupStatefulComponent---->handleSetupResult---->finishComponentSetup

// 处理组件的props和slots
export function setupComponent(componentInstance) {
    const { props, children } = componentInstance.vnode
    // 这是对组件传来的参数进行初始化  而不是普通元素
    initProps(componentInstance, props)
    initSlots(componentInstance, children)
    setupStatefulComponent(componentInstance)
}
// 处理组件代理---->执行setup函数【传props以及emit作为参数】
function setupStatefulComponent(componentInstance) {
    componentInstance.proxy = new Proxy(componentInstance, {
        get(target, key) {
            if (key === '$el') {
                return componentInstance.vnode.el
            } else if (key === '$slots') {
                return componentInstance.slots
            } else if (key === '$props') {
                return componentInstance.props
            } else if (key in componentInstance.setupState) {
                return componentInstance.setupState[key]
            } else if (key in componentInstance.props) {  //返回组件的根元素
                return componentInstance.props[key]
            }
            return Reflect.get(target, key)
        }
    })
    const setup = componentInstance.type.setup
    if (setup) {
        setCurrenInstance(componentInstance)
        const setupResult = setup(shallowReadOnly(componentInstance.props), {
            emit: componentInstance.emit
        })
        setCurrenInstance(null)
        handleSetupResult(componentInstance, setupResult)
    }
}

// 组件实例绑定setup函数返回值
function handleSetupResult(componentInstance, setupResult) {
    if (typeof setupResult === 'object') {
        componentInstance.setupState = proxyRefs(setupResult)
    }
    finishComponentSetup(componentInstance)
}

// 组件实例绑定render函数
function finishComponentSetup(componentInstance) {
    componentInstance.render = componentInstance.type.render
}

let currentInstance = null;
export function getCurrentInstance() {
    return currentInstance;
}
function setCurrenInstance(componentInstance) {
    currentInstance = componentInstance
}