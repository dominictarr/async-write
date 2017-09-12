var tape = require('tape')
var AsyncWrite = require('../')

function isFull (a) { return a && a.length >= 3 }
function isEmpty (a) { return !(a && a.length) }

//write several times, then when the buffer is full,
//actually call write!
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
  }, isFull, isEmpty)

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

tape('flush triggers write then calls back once everything is written', function (t) {

  var cb, write_called = 0, cb_called = 0, flush_called = 0
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
  }, isFull, isEmpty)

  w(1, function (err, value) {
    cb_called ++
  })
  w(2, function (err, value) {
    cb_called ++
  })

  t.notOk(write_called)
  t.equal(cb_called, 2)

  w.flush(function () {
    flush_called ++
  })

  cb()

  t.equal(flush_called, 1)

  t.end()

})

tape('flush waits for inprogress write', function (t) {

  var cb, write_called = 0, cb_called = 0, flush_called = 0
  var data = []

  function write (_data, _cb) {
    data = data.concat(_data)
    console.log("WRITE", data)
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

  w(1, function (err, value) {
    cb_called ++
  })
  w(2, function (err, value) {
    cb_called ++
  })

  w(3, function (err, value) {
    cb_called ++
  })

  t.equal(write_called, 1, 'one write')
  t.equal(cb_called, 3)
  t.deepEqual([1,2,3], data)
  w(4, function (err, value) {
    cb_called ++
  })
  w(5, function (err, value) {
    cb_called ++
  })

  w.flush(function () {
    flush_called ++
  })

  t.equal(flush_called, 0)
  cb()
  t.equal(flush_called, 0)
  t.equal(write_called, 2, 'write called')
  cb()

  t.equal(flush_called, 1)

  t.end()

})

