# norc

Simple cron library for node.js

## Installation

Using NPM:

```
npm install norc
```

Using yarn:

```
yarn add norc
```

## Basic usage

```javascript
const norc = require('norc')

norc.addJob('wakeUp', {
	dow: '1-5',			// weekday
	hour: 7,
	minute: 30,
}, () => {
	console.log('Rise and shine!')
})

norc.addJob('wakeUpWeekend', {
	dow: '6,7',			// sutarday, sunday
	hour: 9,
	minite: 0,
}, () => {
	console.log("It's weekend - consider waking up...")
})

setTimeout(() => {
	norc.removeJob('wakeUp')
	norc.removeJob('wakeUpWeekend')
}, 70e3)
```

## Permanent state

Norc defaults to RAM storage. Everything should work fine until there is a crash. If your node.js crashes, tasks scheduled in the same minute will execute again. To prevent this, you need some kind of permanent storage. Library provides simple way to store state as mtime for specified file, but you can use any method you like.

### File storage example

```javascript
const norc = require('norc')

norc.changeStore(norc.createFileStore('somefilename'))

norc.addJob('wakeUp', {
	dow: '1-5',			// weekday
	hour: 7,
	minute: 30,
}, () => {
	console.log('Rise and shine!')
})
```
