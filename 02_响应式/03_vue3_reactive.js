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
	return new Proxy(data, {
		get(target, prop_key) {
			getDep(target, prop_key).depend()
			return data[prop_key]
		},
		set(target, prop_key, newVal) {
			data[prop_key] = newVal
			getDep(target, prop_key).notify()
			return data[prop_key]
		}
	})
}
let vm = useReactive({ name: 'jiujue', age: 12 })
Watcher.WatchEffect(function() {
	console.log('effect name fn exec->  vm.name', vm.name)
})
Watcher.WatchEffect(function() {
	console.log('effect age fn exec-> vm.age', vm.age)
})
Watcher.WatchEffect(function() {
	console.log('effect age fn exec-> vm.age && age', vm.name, vm.age)
})
