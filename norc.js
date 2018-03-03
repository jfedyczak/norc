const fs = require('fs')
const EventEmitter = require('events')

class Norc extends EventEmitter {
	constructor() {
		super()
		this.cronjobs = new Map()
		this.cronTimeout = null
		this.changeStore(this.createMemStore())
	}

	static cronspecParse(cronspec) {
		return ['year', 'month', 'day', 'hour', 'minute', 'dow']
			.map(x => cronspec[x])
			.map(x => x === undefined || x === null ? '*' : `${x}`)
			.map(x => x.split(','))
			.map(x => x.map(x => {
				let step
				[x, step] = x.split('/')
				step = step || 1
				if (x === '*') return [-Infinity, Infinity, step]
				if (x.indexOf('-') === -1) x = `${+x}-${+x}`
				return x.split('-').map(x => +x).concat([+step])
			}))
	}

	static currentRange() {
		const d = new Date()
		return [
			d.getFullYear(),
			d.getMonth() + 1,
			d.getDate(),
			d.getHours(),
			d.getMinutes(),
			d.getDay() === 0 ? 7 : d.getDay(),
		]
	}

	static inRange(cron, range) {
		return cron.every((r, i) => r.some(r => r[0] <= range[i] && r[1] >= range[i] && range[i] % r[2] === 0))
	}	

	createMemStore() {
		let lastTs = 0
		return (ts) => new Promise(resolve => {
			if (ts === lastTs) {
				return resolve(false)
			}
			lastTs = ts
			return resolve(true)
		})
	}

	createFileStore(filename) {
		const createFile = () => new Promise((resolve, reject) => {
			fs.writeFile(filename, '', (err) => {
				if (err) return reject(err)
				resolve(+new Date())
			})
		})
		const updateMtime = (ts) => new Promise((resolve, reject) => {
			fs.utimes(filename, new Date(ts), new Date(ts), (err) => {
				if (err) return reject(err)
				resolve(true)
			})
		})
		const statFile = () => new Promise((resolve, reject) => {
			fs.stat(filename, (err, stats) => {
				if (err && err.code !== 'ENOENT') {
					return reject(err)
				} else if (err) {
					return resolve(createFile())
				} else {
					return resolve(+stats.mtime)
				}
			})
		})
		return (ts) => statFile()
			.then(mtime => {
				if (mtime !== ts) {
					return updateMtime(ts)
				} else {
					return false
				}
			})
	}

	changeStore(store) {
		this.storageMethod = store
	}
	// cronspec = {
	//		year: 2017
	//		month: 8
	//		day: 28
	//		hour: 10
	//		minute: 10
	//		dow: 1 1 = monday
	// }
	addJob(name, cronspec, job) {
		this.cronjobs.set(name, {
			cronspec: Norc.cronspecParse(cronspec),
			job: job,
		})
		if (this.cronTimeout === null) {
			this.cronGo()
		}
	}

	removeJob(name) {
		this.cronjobs.delete(name)
		if (this.cronjobs.size === 0) {
			this.cronStop()
		}
	}

	changeStore(store) {
		this.storageMethod = store
	}

	cronGo() {
		const d = new Date()

		this.cronTimeout = setTimeout(() => this.cronGo(), 1000 * (60 - d.getSeconds()) - d.getMilliseconds() + 1)

		let cr = Norc.currentRange()
		this.storageMethod(+new Date(cr[0], cr[1] - 1, cr[2], cr[3], cr[4]))
			.then(doJobs => {
				if (doJobs) {
					this.cronjobs.forEach(job => {
						if (Norc.inRange(job.cronspec, cr))
							job.job()
					})
				}
			})
			.catch(e => {
				this.emit('error', e)
			})
	}

	cronStop() {
		if (this.cronTimeout !== null) {
			clearTimeout(this.cronTimeout)
			this.cronTimeout = null
		}
	}
}

module.exports = new Norc()

