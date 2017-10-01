var tape = require('tape')
var AsyncWrite = require('../')

//write several times, then when the buffer is full,
//actually call write!

function isFull (a) { return a && a.length >= 3 }
function isEmpty (a) { return !(a && a.length) }

tape('simple', function (t) {
  var cb, write_called = 0, cb_called = 0
  var data = [], drain = 0

  function write (_data, _cb) {
    data = data.concat(_data)
    write_called ++
    if(cb) throw new Error('already writing')
    cb = function () {
      cb = null
      _cb(null, data.length)
    }
  }

  var w = AsyncWrite(write, function (ary, item) {
    return (ary || []).concat(item)
  }, isFull, isEmpty)

  w.onDrain = function () { drain ++ }

  w(1, function (err, value) {
    cb_called ++
  })
  w(2, function (err, value) {
    cb_called ++
  })

  t.notOk(write_called)
  t.equal(cb_called, 2)

  w(3, function (err, value) {
    cb_called ++
  })

  t.equal(write_called, 1)
  t.equal(w.writing, true)
  t.equal(cb_called, 3)
  t.equal(drain, 0)

  cb()
  t.equal(drain, 1)
  t.deepEqual(data, [1,2,3])
  t.equal(w.writing, false)
  t.end()
})

tape('fill the buffer while writing', function (t) {
  var cb, write_called = 0, cb_called = 0
  var data = [], drain = 0

  function write (_data, _cb) {
    data = data.concat(_data)
    write_called ++
    if(cb) throw new Error('already writing')
    cb = function () {
      cb = null
      _cb(null, data.length)
    }
  }

  var w = AsyncWrite(write, function (ary, item) {
    return (ary || []).concat(item)
  }, isFull, isEmpty)

  w.onDrain = function () { drain ++ }

  w(1, function (err, value) {
    cb_called ++
  })
  w(2, function (err, value) {
    cb_called ++
  })

  t.notOk(write_called)
  t.equal(cb_called, 2)

  w(3, function (err, value) {
    cb_called ++
  })

  t.equal(write_called, 1)
  //calls back immediately, but starts buffering again
  t.equal(cb_called, 3)

  w(4, function (err, value) {
    cb_called ++
  })
  w(5, function (err, value) {
    cb_called ++
  })
  w(6, function (err, value) {
    cb_called ++
  })

  t.equal(write_called, 1)
  //this time it buffers until the write succeeds
  t.equal(cb_called, 5)

  //first buffered write
  cb()
  t.equal(cb_called, 6)
  //which triggers another one to start
  t.equal(write_called, 2)
  cb()
  t.equal(cb_called, 6)
  t.deepEqual(data, [1,2,3, 4,5,6])
  t.end()
})

//tape('flush manually', function (t) {
//
//  var cb, write_called = 0, cb_called = 0
//  var data = []
//
//  function write (_data, _cb) {
//    data = data.concat(_data)
//    write_called ++
//    if(cb) throw new Error('already writing')
//    cb = function () {
//      cb = null
//      _cb(null, data.length)
//    }
//  }
//
//  var w = AsyncWrite(write, function (ary, item) {
//    return (ary || []).concat(item)
//  }, isFull, isEmpty)
//
//  w(1, function (err, value) {
//    cb_called ++
//  })
//  w(2, function (err, value) {
//    cb_called ++
//  })
//
//  t.notOk(write_called)
//  t.equal(cb_called, 2)
//
//  w.flush()
//
//  t.equal(write_called, 1)
//
//  w(3, function (err, value) {
//    cb_called ++
//  })
//  w(4, function (err, value) {
//    cb_called ++
//  })
//
//  cb()
//
//  t.deepEqual(data, [1,2])
//
//  w.flush()
//  t.equal(write_called, 2)
//  cb()
//  //calls back immediately, but starts buffering again
//  t.deepEqual(data, [1,2,3,4])
//  t.equal(cb_called, 4)
//
//  //nothing happens if you flush while buffer is empty
//  w.flush()
//  t.equal(write_called, 2)
//
//  t.end()
//})




tape('timeout', function (t) {

  var cb, write_called = 0, cb_called = 0
  var data = [], drain = 0

  function write (_data, _cb) {
    data = data.concat(_data)
    write_called ++
    setTimeout(_cb, 100)
  }

  var w = AsyncWrite(write, function (ary, item) {
    return (ary || []).concat(item)
  }, isFull, isEmpty)

  w.onDrain = function () { drain ++ }

  w(1, function () {})
  t.equal(drain, 0)
  setTimeout(function() {
    t.deepEqual(data, [1])
    t.equal(drain, 1)
    t.end()
  }, 300)

})


tape('write is slower than timeout', function (t) {
  var cb, write_called = 0, cb_called = 0
  var data = [], drain = 0

  function write (_data, _cb) {
    data = data.concat(_data)
    write_called ++
    if(cb) throw new Error('already writing')
    cb = function () {
      cb = null
      _cb(null, data.length)
    }
  }

  var w = AsyncWrite(write, function (ary, item) {
    return (ary || []).concat(item)
  }, isFull, isEmpty, 100)

  w.onDrain = function () { drain ++ }

  w(1, function (err, value) {
    cb_called ++
  })
  w(2, function (err, value) {
    cb_called ++
  })
  w(3, function (err, value) {
    cb_called ++
  })

  //third write fills buffer, triggers write
  t.equal(write_called, 1)
  t.deepEqual(data, [1,2,3])

  //calls back immediately, but starts buffering again
  t.equal(cb_called, 3)

  //an other write starts a timer
  w(4, function (err, value) {
    cb_called ++
  })

  //wait for timeout to trigger
  setTimeout(function () {
    if(write_called > 1) throw new Error('called write twice')
    cb()
    t.deepEqual(data, [1, 2, 3, 4])
    t.equal(write_called, 2)
    cb()
    t.end()
  }, 200)
})

tape('write is faster than timeout', function (t) {
  var cb, write_called = 0, cb_called = 0
  var data = [], drain = 0

  function write (_data, _cb) {
    data = data.concat(_data)
    write_called ++
    if(cb) throw new Error('already writing')
    cb = function () {
      cb = null
      _cb(null, data.length)
    }
  }

  var w = AsyncWrite(write, function (ary, item) {
    return (ary || []).concat(item)
  }, isFull, isEmpty, 100)

  w.onDrain = function () { drain ++ }

  w(1, function (err, value) {
    cb_called ++
  })
  w(2, function (err, value) {
    cb_called ++
  })
  w(3, function (err, value) {
    cb_called ++
  })

  //third write fills buffer, triggers write
  t.equal(write_called, 1)
  t.deepEqual(data, [1,2,3])

  //calls back immediately, but starts buffering again
  t.equal(cb_called, 3)

  //an other write starts a timer
  w(4, function (err, value) {
    cb_called ++
  })

  //wait for timeout to trigger
  cb()
  //still waiting for the timeout, so write shouldn't be called yet.
  t.equal(write_called, 1)

  setTimeout(function () {
    t.equal(write_called, 2)
    t.deepEqual(data, [1, 2, 3, 4])
    t.equal(write_called, 2)
    cb()
    t.end()
  }, 200)
})








