class Watcher {
	static _effect = null
	static WatchEffect(effect) {
		Watcher._effect = effect
		effect()
		Watcher._effect = null
	}
}
/**
 *
 *
 * @class Dep
 */
class Dep {
	constructor() {
		this.watchers = new Set()
	}
	depend() {
		this.watchers.add(Watcher._effect)
	}
	notify() {
		this.watchers.forEach(watcher => watcher instanceof Function && watcher())
	}
}
/**
 * depMap :
 *  {
 *    obj_1:{prop_key_01:dep},
 *    obj_2:{prop_key_02:dep}
 * }
 */
const depMap = new WeakMap()
function getDep(obj, prop_key) {
	let wrap = depMap.get(obj)
	if (!wrap) {
		wrap = new Map()
		depMap.set(obj, wrap)
	}
	let dep = wrap.get(prop_key)
	if (!dep) {
		dep = new Dep()
		wrap.set(prop_key, dep)
	}
	return dep
}
function useReactive(data) {
	let _data = {}
	for (const prop_key in data) {
		const dep = getDep(data, prop_key)
		Object.defineProperty(_data, prop_key, {
			get() {
				dep.depend()
				return data[prop_key]
			},
			set(newVal) {
				data[prop_key] = newVal
				dep.notify()
				return data[prop_key]
			}
		})
	}
	return _data
}

let vm = useReactive({ name: 'jiujue', age: 12 })
Watcher.WatchEffect(function() {
	console.log('effect fn exec->', vm.name)
})
