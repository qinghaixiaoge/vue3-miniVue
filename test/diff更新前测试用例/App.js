import { h, createTextVNode, renderSlots, getCurrentInstance, provide, inject } from "../../dist/mini-vue.esm.js"
import Foo from "./Foo.js"

export default {
    setup(props, { emit }) {
        provide("key", "App")
        console.log(inject("key", () => "默认值"));
        return {
            msg: "mini-vue"
        }
    },
    render() {
        return h("div", {
            class: "red",
            style: "color:red;background:yellow",
            onClick: () => {
                this.emit("xiaoYu", 6666)
            }
        }, /* [this.$slots.default(123), h(Foo), createTextVNode("123")] */
            [renderSlots(this.$slots, "default", 123), h(Foo), createTextVNode("123")])
    }
}