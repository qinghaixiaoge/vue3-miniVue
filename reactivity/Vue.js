const targetMap = new Map()
let activeEffect;
const extend = Object.assign
function isObject(value) {
    return value !== null && typeof value === 'object'
}
function convert(value) {
    return isObject(value) ? reactive(value) : value
}
function isFunction(value) {
    return typeof value === 'function'
}
const get = createGetter()
const set = createSetter()
const getReadOnly = createGetter(true)
const getShallow = createGetter(false, true)
const getShallowReadOnly = createGetter(true, true)
function createGetter(isReadOnly = false, isShallow = false) {
    return function get(target, key) {
        if (key === "_v__isReadOnly") {
            return isReadOnly
        } else if (key === "_v__isShallow") {
            return isShallow
        } else if (key === "_v__isReactive") {
            return !isReadOnly
        }
        const res = Reflect.get(target, key)
        if (!isReadOnly) {
            track(target, key)
        }
        if (isShallow) {
            return res
        }
        if (isObject(res)) {
            return isReadOnly ? readonly(res) : reactive(res)
        }
        return res
    }
}

function createSetter() {
    return function set(target, key, value) {
        if (Object.is(target[key], value)) return true
        const res = Reflect.set(target, key, value)
        trigger(target, key, value)
        return res
    }
}

function readonly(obj) {
    return new Proxy(obj, {
        get: getReadOnly,
        set(target, key, value) {
            console.warn(`${target} 的 ${key}为只读属性，不可对其重赋值`)
            return true
        }
    })
}

function shallowReadOnly(obj) {
    return new Proxy(obj, {
        get: getShallowReadOnly,
        set(target, key, value) {
            console.warn(`${target} 的 ${key}为只读属性，不可对其重赋值`)
            return true
        }
    })
}

function shallowReactive(obj) {
    return new Proxy(obj, {
        get: getShallow,
        set
    })
}

function reactive(obj) {
    return new Proxy(obj, {
        get,
        set
    })
}

function isReadOnly(value) {
    return !!(value && value["_v__isReadOnly"])
}

function isReactive(value) {
    return !!(value && value["_v__isReactive"])
}

function isShallow(value) {
    return !!(value && value["_v__isShallow"])
}

function isProxy(value) {
    return isReactive(value) || isReadOnly(value)
}

function preCleanEffect(effect) {
    effect._depsLength = 0
}

function track(target, key) {
    if (!activeEffect) return
    let depsMap = targetMap.get(target)
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()))
    }
    let dep = depsMap.get(key)
    if (!dep) {
        depsMap.set(key, (dep = new Set()))
        dep.cleanup = function () {
            depsMap.delete(key)
        }
    }
    trackEffect(activeEffect, dep)
}

function cleanDepEffect(dep, effect) {
    dep.delete(effect)
    if (dep.size === 0) {
        dep.cleanup && dep.cleanup()
    }
}

function trackEffect(effect, dep) {
    dep.add(effect)
    const oldDep = effect.deps[effect._depsLength]
    if (oldDep === dep) {
        effect._depsLength++
    } else {
        if (!oldDep) {
            // 反向收集，不收集重复依赖
            !effect.deps.includes(dep) && (effect.deps[effect._depsLength++] = dep)
        } else {
            //更新targetMap
            cleanDepEffect(oldDep, effect)
            !effect.deps.includes(dep) && (effect.deps[effect._depsLength++] = dep)
        }
    }
}

function postCleanEffect(effect) {
    if (effect.deps.length > effect._depsLength) {
        for (let i = effect._depsLength; i < effect.deps.length; i++) {
            cleanDepEffect(effect.deps[i], effect)
        }
        effect.deps.length = effect._depsLength
    }
}

function trigger(target, key, value) {
    const depsMap = targetMap.get(target)
    if (!depsMap) return
    const dep = depsMap.get(key)
    if (!dep) return
    triggerEffect(dep)
}

function triggerEffect(dep) {
    for (const effect of dep) {
        if (!effect.running) {
            if (effect.scheduler) {
                effect.scheduler()
            } else {
                effect.run()
            }
        }
    }
}

class ReactiveEffect {
    constructor(fn, scheduler) {
        this._fn = fn
        this.scheduler = scheduler
        this.running = 0
        this.deps = []
        this._depsLength = 0
        this.active = true
        this.onStop = () => { }
    }
    run() {
        if (!this.active) {
            return this._fn()
        }
        let lastEffect = activeEffect
        try {
            this.running++
            activeEffect = this
            preCleanEffect(this)
            return this._fn()
        } finally {
            postCleanEffect(this)
            activeEffect = lastEffect
            this.running--
        }
    }
    stop() {
        if (this.active) {
            cleanEffect(this)
            this.onStop && this.onStop()
            this.active = false
            this.deps.length = 0
        }
    }
}

function cleanEffect(effect) {
    effect.deps.forEach(dep => {
        dep.delete(effect)
        if (dep.size === 0) {
            dep.cleanup && dep.cleanup()
        }
    })
}

function effect(fn, options) {
    const _effect = new ReactiveEffect(fn)
    extend(_effect, options)
    _effect.run()
    const runner = _effect.run.bind(_effect)
    runner.effect = _effect
    return runner
}

function stop(runner) {
    console.log("stop");
    runner.effect.stop()
}

class RefImpl {
    constructor(_value, isShallow = false) {
        this._value = isShallow ? _value : convert(_value)
        this._rawValue = _value
        this._v__isShallow = isShallow
        this._v__isRef = true
        this.dep = new Set()
    }
    get value() {
        trackRef(this)
        return this._value
    }
    set value(newValue) {
        if (Object.is(this._rawValue, newValue)) return
        this._value = this._v__isShallow ? newValue : convert(newValue)
        this._rawValue = newValue
        triggerEffect(this.dep)
    }
}

function isRef(value) {
    return !!(value && value["_v__isRef"])
}
function unRef(value) {
    return isRef(value) ? value.value : value
}
function trackRef(ref) {
    if (!activeEffect) return
    trackEffect(activeEffect, ref.dep)
}
function ref(obj) {
    return new RefImpl(obj)
}
function shallowRef(obj) {
    return new RefImpl(obj, true)
}

function proxyRefs(obj) {
    return new Proxy(obj, {
        get(target, key) {
            return unRef(Reflect.get(target, key))
        },
        set(target, key, value) {
            const oldValue = target[key]
            if (isRef(oldValue) && !isRef(value)) {
                return oldValue.value = value
            } else {
                return Reflect.set(target, key, value)
            }
        }
    })
}

class ObjectRefImpl {
    constructor(obj, key) {
        this._obj = obj
        this._key = key
        this._v__isRef = true
    }
    get value() {
        return this._obj[this._key]
    }
    set value(newValue) {
        if (Object.is(this._obj[this._key], newValue)) return
        this._obj[this._key] = newValue
    }
}

//reactive 转成 ref  还是基于proxy来获取值 避免proxy解构失去响应式
function toRef(obj, key) {
    return new ObjectRefImpl(obj, key)
}

function toRefs(obj) {
    const ret = {}
    for (const key in obj) {
        ret[key] = toRef(obj, key)
    }
    return ret
}


class ComputedRefImpl {
    constructor(getter) {
        this._getter = getter
        this.dep = new Set()
        this.effect = new ReactiveEffect(getter, () => {
            console.log(666);
            if (!this._dirty) {
                this._dirty = true
                triggerEffect(this.dep)
            }
        })
        this._value = undefined
        this._dirty = true
    }
    get value() {
        if (this._dirty) {
            console.log("重新计算");
            this._value = this.effect.run()
            this._dirty = false
            trackRef(this)
        }
        return this._value
    }
}
function computed(obj) {
    return new ComputedRefImpl(obj)
}

function traverse(source, deep, seen = new Set()) {
    if (!isObject(source)) return source
    if (seen.has(source)) return source
    seen.add(source)
    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            deep ? traverse(source[key], deep, seen) : source[key]
        }
    }
    return source
}

function doWatch(source, cb, options) {
    const deep = options.deep ? true : false
    let getter;
    // 统一将getter转换成函数  函数内部遍历响应式变量，在返回自身，如果是ref，则返回ref.value，如果ref.value还是reactive且deep为true则深度遍历
    if (isFunction(source)) {
        getter = source
    } else if (isReactive(source)) {
        getter = () => traverse(source, deep)
    } else if (isRef(source)) {
        if (isReactive(source.value) && deep) {
            getter = () => traverse(source.value, deep)
        } else {
            getter = () => source.value
        }
    } else {
        getter = () => source
    }
    let oldValue;
    const job = () => {
        let newValue = effect.run()
        cb(newValue, oldValue)
        oldValue = newValue
    }
    const effect = new ReactiveEffect(getter, job)
    oldValue = effect.run()
}

function watch(source, cb, options) {
    return doWatch(source, cb, options)
}


export { shallowReadOnly, effect, ref, proxyRefs }