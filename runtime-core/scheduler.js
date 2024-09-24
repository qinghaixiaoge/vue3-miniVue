// 微任务的好处即，执行完所有同步任务，再去执行微任务，执行微任务即Promise前可以设置开关，保证微任务的触发一次【优化没必须创建多个Promise】，微任务执行完毕在打开开关
const queue = []
let isFlushPending = false
const p = Promise.resolve()

export function nextTick(fn) {
    return fn ? p.then(fn) : p
}
export function queueJobs(job) {
    if (!queue.includes(job)) {
        queue.push(job)
    }

    queueFlush()
}

function flushJobs() {
    isFlushPending = false
    let job
    while (job = queue.shift()) {
        job && job()
    }
}
function queueFlush() {
    if (isFlushPending) return
    isFlushPending = true
    nextTick(flushJobs)
}

// 视图更新的采用异步的好处是，可以避免频繁重新渲染，只执行一次渲染