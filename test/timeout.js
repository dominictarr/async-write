var tape = require('tape')
var AsyncWrite = require('../')

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
  }, function (a) { return !(a && a.length) })

  w(1, function () {})

  setTimeout(function() {
    t.deepEqual(data, [1])
    t.end()
  }, 300)

})

