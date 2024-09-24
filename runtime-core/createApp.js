import { createVNode } from "./vnode.js"
import { h } from "./h.js"
export function createAppAPI(render){
   return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                rootContainer = document.querySelector(rootContainer)
                const vnode = createVNode(rootComponent, {
                    class: "box",
                    onXiaoYu: (val) => {
                        console.log('我是组件事件', val);
                    }
                },
                    { default: (val) => h('div', {}, '我是组件插槽' + val) }
                )
                render(vnode, rootContainer)
            }
        }
    }
}
