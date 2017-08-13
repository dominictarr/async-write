var tape = require('tape')
var AsyncWrite = require('../')

//write several times, then when the buffer is full,
//actually call write!

tape('simple', function (t) {
  var cb, write_called = 0, cb_called = 0
  var data = []

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
  }, function (a) {
    return a && a.length >= 3
  })

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
  t.equal(cb_called, 3)

  cb()
  t.deepEqual(data, [1,2,3])
  t.end()
})

tape('fill the buffer while writing', function (t) {
  var cb, write_called = 0, cb_called = 0
  var data = []

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
  }, function (a) {
    return a && a.length >= 3
  })

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

tape('flush manually', function (t) {

  var cb, write_called = 0, cb_called = 0
  var data = []

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
  }, function (a) {
    return a && a.length >= 3
  })

  w(1, function (err, value) {
    cb_called ++
  })
  w(2, function (err, value) {
    cb_called ++
  })

  t.notOk(write_called)
  t.equal(cb_called, 2)

  w.flush()

  t.equal(write_called, 1)

  w(3, function (err, value) {
    cb_called ++
  })
  w(4, function (err, value) {
    cb_called ++
  })

  cb()

  t.deepEqual(data, [1,2])

  w.flush()
  t.equal(write_called, 2)
  cb()
  //calls back immediately, but starts buffering again
  t.deepEqual(data, [1,2,3,4])
  t.equal(cb_called, 4)

  //nothing happens if you flush while buffer is empty
  w.flush()
  t.equal(write_called, 2)

  t.end()
})




tape('timeout', function (t) {

  var cb, write_called = 0, cb_called = 0
  var data = []

  function write (_data, _cb) {
    data = data.concat(_data)
    write_called ++
    setTimeout(_cb, 200)
  }

  var w = AsyncWrite(write, function (ary, item) {
    return (ary || []).concat(item)
  }, function (a) {
    return a && a.length >= 3
  })

  w(1, function () {})

  setTimeout(function() {
    t.deepEqual(data, [1])
    t.end()
  }, 300)

})

