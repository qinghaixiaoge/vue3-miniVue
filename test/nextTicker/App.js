import { h, ref, getCurrentInstance, nextTick } from "../../dist/mini-vue.esm.js"

export default {
    name: "App",
    setup() {
        const count = ref(1)
        const instance = getCurrentInstance()
        function onClick() {
            count.value = 5
            console.log(instance.vnode.el.innerText);
            nextTick(() => {
                console.log(instance.vnode.el.innerText);
            })
            for (let i = 0; i < 100; i++) {
                count.value++
            }
        }
        return { count, onClick }
    },
    render() {
        const button = h("button", { onClick: this.onClick }, "update")
        const p = h("p", {}, "count: " + this.count)
        return h("div", {}, [button, p])
    }
}