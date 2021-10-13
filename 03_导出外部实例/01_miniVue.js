function h(tag, props, children) {
	if ([...arguments].length === 1 && typeof arguments[0] === 'string') {
		return { tag: 'text', val: arguments[0] }
	}
	return { tag, props, children }
}
function mount(vnode, container) {
	let root
	// 0. obtain root node
	if (typeof container === 'string') {
		root = document.querySelector(container)
	} else {
		root = container
	}
	// 1 process text node
	if (vnode.tag === 'text') {
		let el = (vnode.el = document.createTextNode(vnode.val))
		root.appendChild(el)
		return
	}
	//2. process normal node
	let el = (vnode.el = document.createElement(vnode.tag))
	// 2.0. create  real el ,attach on vnode.el
	// 2.1. process properties
	for (const prop_key in vnode.props) {
		//2.1.0 judge type
		if (prop_key.startsWith('On')) {
			// 2.1.1 prop_key is a  event
			el.addEventListener(
				prop_key.slice(2).toLowerCase(),
				vnode.props[prop_key]
			)
		} else if (prop_key === 'style') {
			// 2.1.1 prop_key is a  event
			for (const style_key in vnode.props[prop_key]) {
				el.style[style_key] = vnode.props[prop_key][style_key].toString()
			}
		} else {
			// 2.2 prop_key is a prop
			el.setAttribute(prop_key, vnode.props[prop_key])
		}
	}

	// 3. process children
	//
	if (vnode.children && Array.isArray(vnode.children)) {
		vnode.children.forEach(it => mount(it, el))
	}
	root?.appendChild(el)
	// the end, attach to root node
}
function unmount(parent, oNode) {
	parent?.removeChild(oNode)
}
function patch(o, n) {
	// o or n is text node
	if (o.tag === 'text' || n.tag === 'text') {
		if (o.val !== n.val) {
			let tmp_parent_el = o.el.parentElement
			unmount(tmp_parent_el, o.el)
			mount(n, tmp_parent_el)
			return
		}
	}
	if (typeof o === 'object' && typeof n === 'object') {
		// diff tag ,diff node
		if (o.tag !== n.tag) {
			let tmp_parent_el = o.el?.parentElement
			unmount(tmp_parent_el, o.el)
			mount(n, tmp_parent_el)
			return
		} else {
			// x.0 same tag,replace the differs
			// x.1 replace
			// x.1 replace attribute
			// x.1.1 set the new attr
			let nProps = n.props
			let oProps = o.props
			for (const n_key in nProps) {
				// process style
				if (n_key === 'style') {
					for (const style_key in nProps.style) {
						o.el.style[style_key] = nProps.style[style_key].toString()
					}
				}
				// process event
				if (n_key.startsWith('On')) {
					// add new events
					o.el?.addEventListener(n_key.slice(2).toLowerCase(), nProps[n_key])
				} else {
					// replace/add attr
					if (n_key !== 'style') {
						o.el?.setAttribute(n_key, nProps[n_key])
					}
				}
			}
			// x.1.2 remove the old attr(key not in n)
			if (nProps !== undefined) {
				if (!('style' in nProps) && o.el !== undefined) {
					o.el.style = ''
				} else {
					for (const o_style_key in oProps.style) {
						if (!(o_style_key in nProps.style)) {
							o.el.style[o_style_key] = ''
						}
					}
				}
			}
			for (const o_key in oProps) {
				// remove all old events
				if (o_key.startsWith('On')) {
					o.el?.removeEventListener(o_key.slice(2).toLowerCase(), oProps[o_key])
				} else if (!(o_key in nProps)) {
					// remove old attr
					o.el.removeAttribute(o_key)
				}
			}
			// x.2 replace children
			// x.2.1 o,n has children
			if (o.children !== undefined && n.children !== undefined) {
				// o or n children.length === 0
				if (o.children.length === 0) {
					// o.children.length === 0
					n.children.forEach(it => mount(it, o.el))
				} else if (n.children.length === 0) {
					// n.children.length === 0
					o.children.forEach(it => unmount(o.el, it.el))
				}
			}
			if (o.children === undefined || n.children === undefined) {
				if (o.children === undefined && n.children !== undefined) {
					n.children.forEach(it => mount(it, o.el))
				}
				if (n.children === undefined && o.children !== undefined) {
					o.children.forEach(it => unmount(it, o.el))
				}
			} else if (o.children.length !== 0 && n.children.length !== 0) {
				// o or n children.length !== 0
				// common length
				let minLen = Math.min(o.children.length, n.children.length)
				// process common length
				for (let index = 0; index < minLen; index++) {
					patch(o.children[index], n.children[index])
				}
				// process rest length
				// o.length > n.length , remove the surplus
				for (let index = minLen; index < o.children.length; index++) {
					unmount(o.el, o.children[index].el)
				}
				// o.length < n.length , add the last
				for (let index = minLen; index < n.children.length; index++) {
					mount(n.children[index], o.el)
				}
			}
		}
	}
}
class Watcher {
	static _effect = null
	static WatchEffect(effect) {
		Watcher._effect = effect
		effect()
		Watcher._effect = null
	}
}
class Dep {
	constructor() {
		this.watchers = new Set()
	}
	depend() {
		this.watchers.add(Watcher._effect)
	}
	notify() {
		this.watchers.forEach(watcher => {
			watcher instanceof Function && watcher()
		})
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
// let vm = useReactive({ name: 'jiujue', age: 12 })
// Watcher.WatchEffect(function() {
// 	console.log('effect name fn exec->  vm.name', vm.name)
// })
// Watcher.WatchEffect(function() {
// 	console.log('effect age fn exec-> vm.age', vm.age)
// })
// Watcher.WatchEffect(function() {
// 	console.log('effect age fn exec-> vm.age && age', vm.name, vm.age)
// })

function createAppByMiniVue(options) {
	let data = useReactive(options.data)
	let isMounted = false
	let oldNode = null
	return {
		data,
		mount(container) {
			Watcher.WatchEffect(function() {
				if (!isMounted) {
					let vnode = options.render.call(data)
					oldNode = vnode
					mount(vnode, container)
					isMounted = true
				} else {
					let newVnode = options.render.call(data)
					patch(oldNode, newVnode)
					oldNode = newVnode
				}
			})
		}
	}
}
