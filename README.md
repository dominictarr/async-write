# async-write

a writing strategy that attempts to keep a buffer
ready to write at all times. First, a buffer is filled,
then it is written and another one is started.
If both buffers are full, and the first one is still being
written, wait for it to empty, then write the queued one.

## example

``` js
var AsyncWrite = require('async-write')

var write = AsyncWrite(
  //an async function 
  function (string, cb) {
    fs.appendFile(filename, string, cb)
  },
  //a reduce function to add to a buffer
  function reduce (buffered, data) {
    return (buffered || '') + data
  },
  //a function to test if the buffer is full (ready to be written)
  function isFull (buffered) {
    return buffered.length > 1000
  },
  //a function to test if the buffer is empty (nothing to write)
  function isEmpty (buffered) {
    return buffered.length == 0
  }
  //a timeout, if nothing happens in this long, the buffer will
  //just be written anyway.
  200
)

```


## License

MIT

