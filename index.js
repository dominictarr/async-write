//TODO: timeout

'use strict'
module.exports = function (write, reduce, isFull, delay) {

  var buffer = null, _cb, writing = false, timer

  function flush (cb) {
    clearTimeout(timer)
    timer = null
    writing = true
    var _buffer = buffer
    buffer = null
    write(_buffer, function (err) {
      writing = false
      if(cb) cb(err)
      if(_cb) { cb = _cb; _cb = null; cb() }
      if(isFull(buffer)) flush()
    })
  }

  function queue (data, cb) {
    buffer = reduce(buffer, data)
    if(isFull(buffer)) {
      if(!writing) flush()
      else return _cb = cb
    }
    else if(!timer)
      timer = setTimeout(flush, delay || 100)
    cb()
  }

  queue.flush = function (cb) {
    if(writing) throw new Error('already writing')
    if(buffer == null) return cb && cb()
    flush(cb)
  }

  return queue
}

