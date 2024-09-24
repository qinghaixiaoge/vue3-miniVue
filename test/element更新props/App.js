import { h, createTextVNode, renderSlots, getCurrentInstance, provide, inject, ref } from "../../dist/mini-vue.esm.js"

export default {
    name: "App",
    setup() {
        const count = ref(0)
        
        const onClick = () => {
            count.value++
        }

        const props = ref({
            foo : "foo",
            bar:"bar"
        })
        const onChangePropsDemo1 = () => {
            props.value.foo = "new-foo"
        }
        const onChangePropsDemo2 = () => {
            props.value.foo = undefined
        }
        const onChangePropsDemo3 = () => {
            props.value = {
                foo: "foo"
            }
        }
        return {
            count,
            onClick,
            onChangePropsDemo1,
            onChangePropsDemo2,
            onChangePropsDemo3,
            props
        }
    },
    render() {
        // 1、render函数访问的响应式变量，都会给effect收集到依赖中
        // 2、响应式数据更改，触发依赖，此时oldVNode有值进入更新逻辑
        // 3、传入旧props以及新props给patchProps【新、旧props保证值为对象类型】
        // 4、如果旧props和新props不一致，则更新props【分为替换/删除】
        // 问题：如何进行优化，什么情况下才需要去更新props？
        // 解答：遍历新props的每一项，如果和旧props不一致，进入更新环节【替换/删除】
        // 解答：如果旧props有值，遍历旧props每一项，如果新props没有，进入更新环节【删除】
        return h("div", {
            id: "root",
            ...this.props
        }, [
            h("div", {}, "count:" + this.count),
            h("button", {
                onClick: this.onClick
            }, "click"),
            h("button", {
                onClick: this.onChangePropsDemo1,
                aa: this.aa
            }, "修改值"),
            h("button", {
                onClick: this.onChangePropsDemo2
            }, "修改值为undefined"),
            h("button", {
                onClick: this.onChangePropsDemo3
            }, "删除值"),
        ])
    }
}