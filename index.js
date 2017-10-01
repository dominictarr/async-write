//TODO: timeout
'use strict'

module.exports = function (write, reduce, isFull, isEmpty, delay) {

  var buffer = null, _cb, writing = false, timer, timeout
  queue.writing = false

  function flush () {
    if(writing) return
    clearTimeout(timer)
    timer = null
    queue.writing = writing = true
    var _buffer = buffer
    buffer = null
    write(_buffer, function (err) {
      queue.writing = writing = false
      if(_cb) { var cb = _cb; _cb = null; cb() }
      //what if a write takes longer than the timeout
      //and the buffer is partially full?
      //hmm, would that cause an out of order write?
      if(isFull(buffer)) flush()
      else if(!isEmpty(buffer) && timeout) flush()
      else if(queue.onDrain && isEmpty(buffer)) queue.onDrain()
    })
  }

  function queue (data, cb) {
    try {
      queue.buffer = buffer = reduce(buffer, data)
    } catch (err) {
      cb(err); return
    }
    if(isFull(buffer)) {
      if(!writing) flush()
      else {_cb = cb; return }
    }
    else if(!timer) {
      timeout = false
      timer = setTimeout(function () {
        timeout = true
        flush()
      }, delay || 100)
    }
    cb()
  }

  return queue
}


