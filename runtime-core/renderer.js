import { isObject, EMPTY_OBJ } from "./shared/index.js"
import { createComponentInstance, setupComponent } from "./component.js"
import { Fragment, Text } from "./vnode.js"
import { effect } from "../reactivity/Vue.js"
import { createAppAPI } from "./createApp.js"
import { shouldUpdate } from "./componentUpdateUtils.js"
import { queueJobs } from "./scheduler.js"
// 答疑
// 1、renderSlots和createTextVNode 内部都是调用createVNode返回虚拟节点，它们作为children数组项的一位，渲染children时根据虚拟节点的types进行渲染

// 2、组件实例的parent属性，不知道怎么配置？看哪些函数调用patch即可,createComponentInstance函数也需要parent参数

// 3、组件的el属性，需要等待render函数返回的虚拟dom，在经过patch函数转换成真实dom节点，才能访问到

// 4、组件最终都是通过patch去进行初始化，以及更新流程的

// 5、componentOptions的render 和 render函数是两回事，第一项是返回虚拟dom，第二项是内部调用patch进行组件初始化/更新，将虚拟dom转换成真实dom挂载到页面上

// 6、为啥只更新根节点的props，因为对比传的是根节点的props

export function createRenderer(rendererOptions) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText } = rendererOptions
    function render(vnode, container) {
        patch(null, vnode, container, null, null)
    }

    // oldVNode
    // newVNode
    // 如果有oldVNode代表是更新流程
    function patch(oldVNode, newVNode, container, parentComponentInstance, anchor) {
        const { types } = newVNode
        if (isObject(types)) {
            processComponent(oldVNode, newVNode, container, parentComponentInstance, anchor)
        } else if (typeof types === 'string') {
            processElement(oldVNode, newVNode, container, parentComponentInstance, anchor)
        } else if (types === Fragment) {
            processFragment(oldVNode, newVNode, container, parentComponentInstance, anchor)
        } else if (types === Text) {
            processText(oldVNode, newVNode, container)
        }
    }

    function processFragment(oldVNode, newVNode, container, parentComponentInstance, anchor) {
        mountChildren(newVNode.children, container, parentComponentInstance, anchor)
    }

    function processText(oldVNode, newVNode, container) {
        const el = (newVNode.el = document.createTextNode(newVNode.children))
        container.appendChild(el)
    }

    function processComponent(oldVNode, newVNode, container, parentComponentInstance, anchor) {
        if (!oldVNode) {
            // 初始化component
            mountComponent(newVNode, container, parentComponentInstance, anchor)
        } else {
            // 更新component
            updateComponent(oldVNode, newVNode)
        }
    }

    function processElement(oldVNode, newVNode, container, parentComponentInstance, anchor) {
        if (!oldVNode) {
            // 初始化element
            mountElement(newVNode, container, parentComponentInstance, anchor)
        } else {
            // 更新element
            patchElement(oldVNode, newVNode, container, parentComponentInstance, anchor)
        }
    }

    // 更新element
    function patchElement(oldVNode, newVNode, container, parentComponentInstance, anchor) {
        console.log("patchElement");
        // 对比props和children
        const oldProps = oldVNode.props || EMPTY_OBJ
        const newProps = newVNode.props || EMPTY_OBJ
        const el = (newVNode.el = oldVNode.el)
        // console.log("oldVNode====>", oldVNode);
        // console.log("newVNode====>", newVNode);
        patchChildren(oldVNode, newVNode, el, parentComponentInstance, anchor)
        patchProps(el, oldProps, newProps)
    }

    function patchChildren(oldVNode, newVNode, container, parentComponentInstance, anchor) {
        const oldChildren = oldVNode.children
        const newChildren = newVNode.children
        if (typeof newChildren === 'string') {
            if (Array.isArray(oldChildren)) {
                // ArrayToText
                // 1、把老的children清空
                unmountChildren(oldChildren)
                // 2、设置text
                hostSetElementText(container, newChildren)
            } else {
                //TextToText
                if (oldChildren !== newChildren) {
                    hostSetElementText(container, newChildren)
                }
            }
        }

        if (Array.isArray(newChildren)) {
            if (typeof oldChildren === 'string') {
                // TextToArray
                hostSetElementText(container, "")
                mountChildren(newChildren, container, parentComponentInstance, anchor)
            } else {
                // ArrayToArray
                patchKeyedChildren(oldChildren, newChildren, container, parentComponentInstance, anchor)
            }
        }
    }

    function isSomeVNodeType(oldVNode, newVNode) {
        return oldVNode.key === newVNode.key && oldVNode.types === newVNode.types
    }

    function patchKeyedChildren(oldChildren, newChildren, container, parentComponentInstance, parentAnchor) {
        let i = 0
        let e1 = oldChildren.length - 1
        let e2 = newChildren.length - 1
        // 对比左侧相同的节点
        while (i <= e1 && i <= e2) {
            const oldVNode = oldChildren[i]
            const newVNode = newChildren[i]
            if (isSomeVNodeType(oldVNode, newVNode)) {
                patch(oldVNode, newVNode, container, parentComponentInstance, null)
            } else {
                break;
            }
            i++
        }
        // 对比右侧相同的节点
        while (i <= e1 && i <= e2) {
            const oldVNode = oldChildren[e1]
            const newVNode = newChildren[e2]
            if (isSomeVNodeType(oldVNode, newVNode)) {
                patch(oldVNode, newVNode, container, parentComponentInstance, null)
            } else {
                break
            }
            e1--, e2--;
        }
        // 新的比老的长，创建新的
        if (i > e1) {
            if (i <= e2) {
                const anchor = e2 + 1 < newChildren.length ? newChildren[e2 + 1].el : parentAnchor
                while (i <= e2) {
                    patch(null, newChildren[i], container, parentComponentInstance, anchor)
                    i++
                }
            }
        }
        // 新的比老的长，创建新的
        if (i > e2) {
            while (i <= e1) {
                const oldVNode = oldChildren[i]
                hostRemove(oldVNode.el)
                i++
            }
        }
        // 处理中间部分
        if (i <= e1 && i <= e2) {
            const s1 = i
            const s2 = i
            const newChildLength = e2 - s2 + 1
            // 存放新节点key和索引的映射
            const newChildIndexMap = new Map()
            // 存放所有新节点在老节点中的索引,默认值为0
            const newChildAtOldChildIndexArray = new Array(newChildLength).fill(0)
            let contrast = 0 //对比新节点的个数
            let moved = false
            let prevIndex = 0
            // 遍历所有新节点，key和索引做映射
            for (let i = s2; i <= e2; i++) {
                newChildIndexMap.set(newChildren[i].key, i)
            }
            // 【处理删除和更新逻辑】
            // 遍历老节点，查看新节点在老节点中是否存在，如果存在，取出相同节点老节点在新节点中的索引，因为是遍历老节点，所以即可以得到老节点，去操作老节点【删除、更新、移动】，也可以得到新节点，去【新建】
            // newIndex是相同节点在新节点中的索引
            for (let i = s1; i <= e1; i++) {
                let newIndex;
                const oldVNode = oldChildren[i]
                // 优化点：新节点对比完成，老节点全部删除即可
                if (contrast >= newChildLength) {
                    hostRemove(oldVNode.el)
                    continue
                }
                if (oldVNode.key) {
                    // 存在相同节点，老节点在新节点中的索引值
                    newIndex = newChildIndexMap.get(oldVNode.key)
                } else {
                    // key不存在，遍历所有新节点查看是否有相同节点
                    for (let j = s2; j <= e2; j++) {
                        if (isSomeVNodeType(oldVNode, newChildren[j])) {
                            newIndex = j
                            break
                        }
                    }
                }
                // 不存在相同节点，进行删除操作
                // 存在相同节点,进行更新操作
                if (newIndex === undefined) {
                    hostRemove(oldVNode.el)
                } else {
                    // 优化点:判断是否需要移动,如果老节点在新节点的索引持续递增的,那么就不需要移动
                    if (newIndex >= prevIndex) {
                        prevIndex = newIndex
                    } else {
                        moved = true
                    }
                    // 存在相同节点，进行更新操作
                    patch(oldVNode, newChildren[newIndex], container, parentComponentInstance, null)
                    // 记录新节点处理个数
                    contrast++
                    // newIndex表示相同节点在新节点中的索引
                    // i表示相同节点在老节点中的索引
                    // 默认值为0,为了避免索引值也出现0的情况,有特殊意义,所以+1
                    newChildAtOldChildIndexArray[newIndex - s2] = i + 1
                }
            }
            // 【处理移动和新增逻辑】
            // 计算最长递增子序列
            const increaseArray = getSequence(newChildAtOldChildIndexArray)
            let j = increaseArray.length - 1
            // 倒序遍历新节点中间
            for (let i = newChildLength - 1; i >= 0; i--) {
                const index = s2 + i
                const newVNode = newChildren[index]
                const anchor = index + 1 < newChildren.length ? newChildren[index + 1].el : parentAnchor
                // 新增
                // newChildAtOldChildIndexArray数组中索引值为0,说明老节点中不存在
                if (newChildAtOldChildIndexArray[i] === 0) {
                    patch(null, newVNode, container, parentComponentInstance, anchor)
                }
                if (moved) {
                    if (j < 0 || i !== increaseArray[j]) {
                        // 需要移动
                        hostInsert(newVNode.el, container, anchor)
                    } else {
                        j--
                    }
                }
            }
        }
    }

    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el
            // remove
            hostRemove(el)
        }
    }

    function patchProps(el, oldProps, newProps) {
        /*  console.log(oldProps,newProps);
         console.log(oldProps === newProps); // false */
        if (oldProps !== newProps) {
            // 对比props
            for (const key in newProps) {
                const prevProp = oldProps[key]
                const nextProp = newProps[key]
                if (prevProp !== nextProp) {
                    hostPatchProp(el, key, prevProp, nextProp)
                }
            }

            if (oldProps !== EMPTY_OBJ) {
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null)
                    }
                }
            }

        }

    }

    function mountElement(vnode, container, parentComponentInstance, anchor) {
        const { types, props, children } = vnode
        const el = (vnode.el = hostCreateElement(types))  // 普通元素，虚拟dom的el属性挂载渲染后的真实dom
        // props
        for (const key in props) {
            let value = props[key]
            hostPatchProp(el, key, null, value)
        }
        // children
        if (Array.isArray(children)) {
            mountChildren(vnode.children, el, parentComponentInstance, anchor)
        } else if (typeof children === 'string') {
            el.textContent = children
        }
        // insert
        hostInsert(el, container, anchor)
    }

    function mountChildren(children, container, parentComponentInstance, anchor) {
        // 初始化渲染的子节点
        children.forEach(v => patch(null, v, container, parentComponentInstance, anchor))
    }

    // 组件实例的处理是细致的
    function mountComponent(vnode, container, parentComponentInstance, anchor) {
        const componentInstance = (vnode.component = createComponentInstance(vnode, parentComponentInstance))
        setupComponent(componentInstance)
        setupRenderEffect(componentInstance, vnode, container, anchor)
    }

    // 响应式数据变化肯定触发，只是根据是否修改了组件的props去判断要不要重新触发组件实例的update方法【即更新组件】
    function updateComponent(oldVNode, newVNode) {
        // console.log(oldVNode, newVNode);
        const componetInstance = (newVNode.component = oldVNode.component)
        // 更新组件
        if (shouldUpdate(oldVNode, newVNode)) {
            console.log("更新组件，重新调用组件的render函数，进行patch更新逻辑");
            componetInstance.next = newVNode
            componetInstance.update() //更改了组件的props，触发组件更新
        } else {
            // 修改无关组件的props 响应式数据
            newVNode.el = oldVNode.el
            componetInstance.vnode = newVNode
        }
    }

    // 更新组件的props属性才会进入该函数
    function updateComponentPreRender(componentInstance, nextVNode) {
        componentInstance.vnode = nextVNode
        componentInstance.next = null //组件更新完毕，赋值为null
        componentInstance.props = nextVNode.props
    }
    // 初始化/更新组件走不同的逻辑
    // patch是会递归调用的
    function setupRenderEffect(componentInstance, vnode, container, anchor) {
        // 页面依赖的响应式数据更改，重新运行render函数
        componentInstance.update = effect(() => {
            if (!componentInstance.isMounted) {
                // 初始化
                console.log("初始化");
                const { proxy } = componentInstance
                const subTree = (componentInstance.subTree = componentInstance.render.call(proxy))
                patch(null, subTree, container, componentInstance, anchor)
                vnode.el = subTree.el
                componentInstance.isMounted = true
            } else {
                // 挂载后
                console.log("更新");
                // next实际是新组件虚拟dom，理解成newVNode
                const { vnode: oldVNode, next: newVNode } = componentInstance
                // 更新组件的props属性才会进入该函数
                if (newVNode) {
                    newVNode.el = oldVNode.el
                    updateComponentPreRender(componentInstance, newVNode)
                }
                const { proxy } = componentInstance
                const subTree = componentInstance.render.call(proxy)
                const preSubTree = componentInstance.subTree
                componentInstance.subTree = subTree // subTree存放组件配置render函数的返回值
                // 更新根组件的children，children可能包含组件/元素【其中组件的props改变，才会进入更新逻辑，即重新调用render以及patch】
                patch(preSubTree, subTree, container, componentInstance, anchor)
            }
        }, {
            scheduler() {
                console.log("update - scheduler");
                queueJobs(componentInstance.update)
            }
        })

    }
    return {
        createApp: createAppAPI(render)
    }
}

function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

// 组件实例的处理是细致的
/* function mountComponent(vnode, container, parentComponentInstance) {
    const componentInstance = createComponentInstance(vnode, parentComponentInstance)
    //setupComponent---->setupStatefulComponent---->handleSetupResult---->finishComponentSetup
    const componentOptions = vnode.types
    const { props, children } = vnode
    // 这是对组件传来的参数进行初始化  而不是普通元素
    initPrors(componentInstance, props)
    initSlots(componentInstance, children)
    const { render, setup } = componentOptions
    const proxy = new Proxy(componentInstance, {
        get(target, key) {
            if (key === '$el') {
                return componentInstance.vnode.el
            } else if (key === '$slots') {
                return componentInstance.slots
            } else if (key in componentInstance.setupState) {
                return componentInstance.setupState[key]
            } else if (key in componentInstance.props) {  //返回组件的根元素
                return componentInstance.props[key]
            }
            return Reflect.get(target, key)
        }
    })
    if (setup) {
        setCurrenInstance(componentInstance)
        componentInstance.setupState = setup()
        setCurrenInstance(null)
        // 组件本身会转成虚拟dom，以及组件的render函数返回值也是返回虚拟dom
        const subTree = render.call(proxy)
        patch(subTree, container, componentInstance)
        vnode.el = subTree.el  // 组件，虚拟dom的el挂载根节点的真实dom【即render函数返回虚拟dom的根节点】  
    }
} */