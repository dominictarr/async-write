var tape = require('tape')
var AsyncWrite = require('../')

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
  var err = new Error('test error')
  var w = AsyncWrite(write, function (ary, item) {
    throw err
    return (ary || []).concat(item)
  }, function (){}, function (){})

  w(1, function (_err, value) {
    t.equal(_err, err)
    t.end()
  })
})



