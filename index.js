//TODO: timeout

'use strict'
module.exports = function (write, reduce, isFull, isEmpty, delay) {

  var buffer = null, _cb, writing = false, timer
  var flush_cb

  function flush () {
    clearTimeout(timer)
    timer = null
    writing = true
    var _buffer = buffer
    buffer = null
    write(_buffer, function (err) {
      writing = false
      if(_cb) { var cb = _cb; _cb = null; cb() }
      if(isFull(buffer)) flush()
      else if(queue.onDrain) queue.onDrain()
    })
  }

  function queue (data, cb) {
    try {
      buffer = reduce(buffer, data)
    } catch (err) {
      cb(err); return
    }
    if(isFull(buffer)) {
      if(!writing) flush()
      else {_cb = cb; return }
    }
    else if(!timer)
      timer = setTimeout(flush, delay || 100)
    cb()
  }

//  queue.flush = function () {
//    if(writing) return
//    flush()
//  }

  return queue
}


