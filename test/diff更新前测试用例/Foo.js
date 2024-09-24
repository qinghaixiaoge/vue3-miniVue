import { h,inject,provide } from "../../dist/mini-vue.esm.js"
export default {
    setup(){
        provide("key", "Foo")
        console.log(inject("key"));
        return {
            msg: "Foo组件"
        }
    },
    render() {
        return h('div', { class: 'foo' }, this.msg)
    }
}