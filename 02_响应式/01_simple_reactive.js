class Dep {
	constructor() {
		this.observers = new Set()
	}
	addObserver(obs) {
		console.log(arguments)
		this.observers.add(obs)
	}
	notify() {
		this.observers.forEach(it => it())
	}
}
let deps = new Dep()
let data = { a: 12 }
let vm = {}
Object.defineProperty(vm, 'a', {
	get() {
		return data.a
	},
	set(nVal) {
		data.a = nVal
		deps.notify()
		return data.a
	}
})
function print() {
	console.log('target change ', 123)
}
deps.addObserver(print)
print()
