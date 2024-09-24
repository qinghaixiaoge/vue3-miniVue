import { getCurrentInstance } from "./component.js";
export function provide(key, value) {
    const componentInstance = getCurrentInstance()
    if (componentInstance) {
        let provides = componentInstance.provides // 当前组件实例provides
        if (componentInstance.parent) {  // 父组件实例存在
            // 初始化
            if (provides === componentInstance.parent.provides) {
                provides = componentInstance.provides = Object.create(componentInstance.parent.provides)
            }
        }
        provides[key] = value
    }
}

export function inject(key, defaultValue) {
    const componentInstance = getCurrentInstance()
    if (componentInstance) {
        if (componentInstance.parent) {
            const parentProvides = componentInstance.parent.provides
            // 不从自身上查找
            if (key in parentProvides) {
                return parentProvides[key]
            } else if (defaultValue) {
                if (typeof defaultValue === 'function') {
                    return defaultValue()
                }
                return defaultValue
            }
        }else{
            if (defaultValue) {
                if (typeof defaultValue === 'function') {
                    return defaultValue()
                }
                return defaultValue
            }
        }
    }
}