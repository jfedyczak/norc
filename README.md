# norc

Simple cron library for node.js. With failsafes.

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
    dow: '1-5', // weekday
    hour: 7,
    minute: 30,
}, () => {
    console.log('Rise and shine!')
})

norc.addJob('wakeUpWeekend', {
    dow: '6,7', // sutarday, sunday
    hour: 9,
    minute: 0,
}, () => {
    console.log("It's weekend - consider waking up...")
})

setTimeout(() => {
    norc.removeJob('wakeUp')
    norc.removeJob('wakeUpWeekend')
}, 70e3)
```

## Permanent state

Norc defaults to RAM storage. Everything should work fine until there is a crash. If your node.js crashes, tasks scheduled in the same minute will execute again after restart. To prevent this, you need some kind of permanent storage. Library provides simple way to store state as mtime for specified file, but you can use any method you like.

### File storage example

```javascript
const norc = require('norc')

norc.changeStore(norc.createFileStore('somefilename'))

norc.addJob('wakeUp', {
    dow: '1-5', // weekday
    hour: 7,
    minute: 30,
}, () => {
    console.log('Rise and shine!')
})
```

### Custom storage example

Custom storage requires promise returnign `true` when current minute has not been executed yet and `false` when it has already.

```javascript
const norc = require('norc')

norc.changeStore((() => {
    let lastTs = 0
    return (ts) => new Promise(resolve => {
        if (ts === lastTs) {
            return resolve(false)
        }
        lastTs = ts
        return resolve(true)
    })
})()) // we're creating closure here

norc.addJob('wakeUp', {
    dow: '1-5', // weekday
    hour: 7,
    minute: 30,
}, () => {
    console.log('Rise and shine!')
})
```

## Error handling

Errors thrown by storage methods can be caught using `error` event:

```
norc.on('error', (e) => {
	// your handler goes here...
})
```

## API reference

### addJob(name, cronspec, job)

Adds new job to cron according to arguments:

- *name* - name of the job
- *cronspec* - object with following properties:

 - *year* - year range
 - *month* - month (1 - 12)
 - *day* - day of the month (1-31)
 - *hour* - hour (0 - 23)
 - *minute* - minute (0 - 59)
 - *dow* - day of week (1 = monday, 2 = tuesday, ...)
 all fields are optional and default to `*`, which matches any value. You can specify:

  - ranges: `15-20` - matches any number between 15 and 20 inclusive
  - lists: `1,3,7` - matches numbers 1, 3 and 7
  - lists of ranges: `1-3,5-8`
  - steps: `*/2` - any number divisible by 2
- *job* - function that will be invoked every minute matching *cronspec* criteria. No return value is expected.

### removeJob(name)

Removes job from cron:

- *name* - name of the job to be removed

### changeStore(store)

Sets new storage method used to ensure permanent storage of minutes that already passed:

- *store* is a function that takes parameter `ts` (UNIX timestamp - ms since the unix epoch) and is expected to return Promise. Result of the promise is expected to be `Boolean`: `true` will cause tasks to run while `false` means that tasks for this minute had already run.

There are two stores built in the library:

- `norc.createMemStore()` (default) - stores state in memory - not safe during crashes - can cause tasks to be executed again in event of process crash
- `norc.createFileStore(filename)` - creates a store keeping timestamp as `mtime` of the `filename` (will be created if not exists)

## License

MIT
