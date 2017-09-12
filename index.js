//TODO: timeout

'use strict'
module.exports = function (write, reduce, isFull, isEmpty, delay) {

  var buffer = null, _cb, writing = false, timer
  var flush_cb

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
      if(isFull(buffer) || (!isEmpty(buffer) && flush_cb)) flush()
      else if(flush_cb) {
        var _flush_cb = flush_cb
        flush_cb = null
        _flush_cb()
      }
    })
  }

  function queue (data, cb) {
    try {
      buffer = reduce(buffer, data)
    } catch (err) {
      return cb(err)
    }
    if(isFull(buffer)) {
      if(!writing) flush()
      else return _cb = cb
    }
    else if(!timer)
      timer = setTimeout(flush, delay || 100)
    cb()
  }

  queue.flush = function (cb) {
    if(writing) {
      flush_cb = cb
      return
     //   throw new Error('cannot flush: already writing')
    }
    if(buffer == null) return cb && cb()
    flush(cb)
  }

  return queue
}


