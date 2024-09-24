import { h, ref } from "../../dist/mini-vue.esm.js"
// 1、左侧的对比
// (a b) c
// (a b) d e
// const prevChildren = [
//     h("P", { key: "A" }, "A"),
//     h("P", { key: "B" }, "B"),
//     h("P", { key: "C" }, "C")
// ]
// const nextChildren = [
//     h("P", { key: "A" }, "A"),
//     h("P", { key: "B" }, "B"),
//     h("P", { key: "D" }, "D"),
//     h("P", { key: "E" }, "E")
// ]

// 2、右侧的对比
// a (b c)
// d e (b c)
// const prevChildren = [
//     h("P", { key: "A" }, "A"),
//     h("P", { key: "B" }, "B"),
//     h("P", { key: "C" }, "C")
// ]
// const nextChildren = [
//     h("P", { key: "D" }, "D"),
//     h("P", { key: "E" }, "E"),
//     h("P", { key: "B" }, "B"),
//     h("P", { key: "C" }, "C")
// ]

// 3、新的比老的长，创建新的
// 左侧
// (a b)
// (a b) c d
// const prevChildren = [
//     h("P", { key: "A" }, "A"),
//     h("P", { key: "B" }, "B"),
// ]
// const nextChildren = [
//     h("P", { key: "A" }, "A"),
//     h("P", { key: "B" }, "B"),
//     h("P", { key: "C" }, "C"),
//     h("P", { key: "D" }, "D"),
// ]

// 4、新的比老的长，创建新的
// 右侧
// (a b)
// d c (a b) 
// const prevChildren = [
//     h("P", { key: "A" }, "A"),
//     h("P", { key: "B" }, "B"),
// ]
// const nextChildren = [
//     h("P", { key: "D" }, "D"),
//     h("P", { key: "C" }, "C"),
//     h("P", { key: "A" }, "A"),
//     h("P", { key: "B" }, "B")
// ]

// 5、老的比新的长，删除老的
// 左侧
// (a b) c d
// (a b)
// const prevChildren = [
//     h("P", { key: "A" }, "A"),
//     h("P", { key: "B" }, "B"),
//     h("P", { key: "C" }, "C"),
//     h("P", { key: "D" }, "D"),
// ]
// const nextChildren = [
//     h("P", { key: "A" }, "A"),
//     h("P", { key: "B" }, "B"),
// ]

// 6、老的比新的长，删除老的
// 右侧
// a d (b c)
// (b c)
// const prevChildren = [
//     h("P", { key: "A" }, "A"),
//     h("P", { key: "D" }, "D"),
//     h("P", { key: "B" }, "B"),
//     h("P", { key: "C" }, "C"),
// ]
// const nextChildren = [
//     h("P", { key: "B" }, "B"),
//     h("P", { key: "C" }, "C"),
// ]

// 对比中间的部分，删除老的（在老的里面存在，新的里面不存在）
// a b (c d) f g
// a b (e c) f g
// D 节点在新的里面是没有的，需要删除掉
// C 节点props也发生了变化，需要更新
// i = 2，e1 = 3, e2 = 3 
// const prevChildren = [
//     h("P", { key: "A" }, "A"),
//     h("P", { key: "B" }, "B"),
//     h("P", { key: "C", id: "c-prev" }, "C"),
//     h("P", { key: "D" }, "D"),
//     h("P", { key: "F" }, "F"),
//     h("P", { key: "G" }, "G"),
// ]
// const nextChildren = [
//     h("P", { key: "A" }, "A"),
//     h("P", { key: "B" }, "B"),
//     h("P", { key: "E" }, "E"),
//     h("P", { key: "C", id: "c-next" }, "C"),
//     h("P", { key: "F" }, "F"),
//     h("P", { key: "G" }, "G"),
// ]

// a b (c e d) f g
// a b (e c) f g
// 对比中间部分，老的比新的多，那么多出来的直接就可以删除(优化删除逻辑)
// const prevChildren = [
//     h("P", { key: "A" }, "A"),
//     h("P", { key: "B" }, "B"),
//     h("P", { key: "C", id: "c-prev" }, "C"),
//     h("P", { key: "E" }, "E"),
//     h("P", { key: "D" }, "D"), // D是肯定要被删除的了
//     h("P", { key: "F" }, "F"),
//     h("P", { key: "G" }, "G"),
// ]
// const nextChildren = [
//     h("P", { key: "A" }, "A"),
//     h("P", { key: "B" }, "B"),
//     h("P", { key: "E" }, "E"),
//     h("P", { key: "C", id: "c-next" }, "C"),
//     h("P", { key: "F" }, "F"),
//     h("P", { key: "G" }, "G"),
// ]

// 移动（节点存在于新的和老的里面，但是位置变了）
// 0 1 [2 3 4] 5 6
// a b (c d e) f g
//      
// a b (e c d) f g  
// 相同节点在新虚拟dom的索引值 [4 2 3]，计算最长子序列 [1 2]
const prevChildren = [
    h("P", { key: "A" }, "A"),
    h("P", { key: "B" }, "B"),
    h("P", { key: "C" }, "C"),
    h("P", { key: "D" }, "D"),
    h("P", { key: "E" }, "E"),
    h("P", { key: "F" }, "F"),
    h("P", { key: "G" }, "G")
]
const nextChildren = [
    h("P", { key: "A" }, "A"),
    h("P", { key: "B" }, "B"),
    h("P", { key: "E" }, "E"),
    h("P", { key: "C" }, "C"),
    h("P", { key: "D" }, "D"),
    h("P", { key: "F" }, "F"),
    h("P", { key: "G" }, "G")
]

// 创建新的节点
// a b (c e) f g
// a b (e c d) f g
// d 节点在老的节点中不存在，新的里面存在，所以需要创建
// const prevChildren = [
//     h("P", { key: "A" }, "A"),
//     h("P", { key: "B" }, "B"),
//     h("P", { key: "C" }, "C"),
//     h("P", { key: "E" }, "E"),
//     h("P", { key: "F" }, "F"),
//     h("P", { key: "G" }, "G")
// ]
// const nextChildren = [
//     h("P", { key: "A" }, "A"),
//     h("P", { key: "B" }, "B"),
//     h("P", { key: "E" }, "E"),
//     h("P", { key: "C" }, "C"),
//     h("P", { key: "D" }, "D"),
//     h("P", { key: "F" }, "F"),
//     h("P", { key: "G" }, "G")
// ]

// 综合例子
// a b (c d e z) f g
// a b (d c y e) f g
// const prevChildren = [
//     h("P", { key: "A" }, "A"),
//     h("P", { key: "B" }, "B"),
//     h("P", { key: "C" }, "C"),
//     h("P", { key: "D" }, "D"),
//     h("P", { key: "E" }, "E"),
//     h("P", { key: "Z" }, "Z"),
//     h("P", { key: "F" }, "F"),
//     h("P", { key: "G" }, "G")
// ]
// const nextChildren = [
//     h("P", { key: "A" }, "A"),
//     h("P", { key: "B" }, "B"),
//     h("P", { key: "D" }, "D"),
//     h("P", { key: "C" }, "C"),
//     h("P", { key: "Y" }, "Y"),
//     h("P", { key: "E" }, "E"),
//     h("P", { key: "F" }, "F"),
//     h("P", { key: "G" }, "G")
// ]
/* const prevChildren = [
    h("P", {}, "A"),
    h("P", {}, "B"),
    h("P", {}, "C"),
    h("P", {}, "D"),
    h("P", {}, "E"),
    h("P", {}, "Z"),
    h("P", {}, "F"),
    h("P", {}, "G")
]
const nextChildren = [
    h("P", {  }, "A"),
    h("P", {  }, "B"),
    h("P", {  }, "D"),
    h("P", {  }, "C"),
    h("P", {  }, "Y"),
    h("P", {  }, "E"),
    h("P", {  }, "F"),
    h("P", {  }, "G")
] */
export default {
    name: "ArrayToArray",
    setup() {
        const isChange = ref(false)
        window.isChange = isChange
        return {
            isChange
        }
    },
    render() {
        const self = this
        return self.isChange === true ? h("div", {}, nextChildren) : h("div", {}, prevChildren)
    }
}
// 双端对比diff为性能做考虑，整个vue3中最复杂的逻辑
// 1、左右两端缩小范围，后面在进行中间对比
// 2、创建映射表newIndexAtOldIndexMap
// 3、通过key缩小时间复杂度
// 4、最长递增子序列创建一个稳定的序列，减少移动次数
// 重点：最终递增子序列在diff算法里面做了哪些事，为什么用用它，它解决了什么问题

// vue中key的作用是什么？
// 元素的唯一标识，有利于在diff算法快速检索出相同的元素，尽量去更新元素再去移动元素，避免不必要的新增和删除元素，从而提升性能

