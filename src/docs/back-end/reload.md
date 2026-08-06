## Reload

```js
export const resolveReload = (timer, clients = new Set()) => {
  console.log('Live-reload enabled ⚡');
  (async () => {
    for await (const _ of Deno.watchFs('./src')) {
      clearTimeout(timer)
      timer = setTimeout(() => clients.forEach(c => c.readyState === 1 && c.send('reload')), 100)
    }
  })()

  const reloadServer = request => {
    const { socket, response } = Deno.upgradeWebSocket(request)
    socket.onopen = () => clients.add(socket)
    socket.onclose = () => clients.delete(socket)
    return response
  }

  const reloadClient = `new WebSocket(location.protocol.replace('http','ws')+'//'+location.host+'/_reload')
    .onmessage = ({ data }) => data === 'reload' && location.reload()`

  return { reloadServer, reloadClient }
}
```

`resolveReload`: Monitors project files for changes during local development and opens a real-time connection to connected browsers to refresh pages automatically when a file is saved.

### File Watcher

```js
(async () => {
  for await (const _ of Deno.watchFs('./src')) {
    clearTimeout(timer)
    timer = setTimeout(() => clients.forEach(c => c.readyState === 1 && c.send('reload')), 100)
  }
})()
```

`Deno.watchFs('./src')`: Initializes Deno's file watcher to listen for changes within the `./src` directory.

`for await (const _ of ...)`: Runs an ongoing loop that listens for any file change events sent by the operating system.

`clearTimeout(timer)`: Clears any pending reload timers when a new file change happens immediately after another.

`timer = setTimeout(..., 100)`: Waits 100 milliseconds to group multiple rapid file saves into a single page reload, preventing endless refresh loops.

`clients.forEach(...)`: Loops through all connected browser tabs to send the refresh message.

`c.readyState === 1 && c.send('reload')`: Makes sure the connection is fully open before sending the `'reload'` command.

### WebSocket Server

```js
const reloadServer = request => {
  const { socket, response } = Deno.upgradeWebSocket(request)
  socket.onopen = () => clients.add(socket)
  socket.onclose = () => clients.delete(socket)
  return response
}
```

`Deno.upgradeWebSocket(request)`: Upgrades a standard HTTP connection request into a persistent WebSocket connection.

`socket.onopen`: Adds a newly opened browser tab connection to the clients tracking Set.

`socket.onclose`: Removes a browser tab from the Set when it is closed, preventing memory leaks.

`return response`: Returns the upgrade handshake back to finalize the connection.

### Client-Side Listener

```js
const reloadClient = `new WebSocket(location.protocol.replace('http','ws')+'//'+location.host+'/_reload')
  .onmessage = ({ data }) => data === 'reload' && location.reload()`
```

`reloadClient`: An inline script tag injected into the HTML layouts during development to listen for reload commands from the server.

`location.protocol.replace('http','ws') +'//'+location.host+'/_reload'`: Reconstructs the target URL dynamically by switching the browser's current protocol to WebSockets (`ws` or `wss`) and pointing it to the `/_reload` endpoint.

`onmessage`: Listens for messages sent from the server's file watcher.

`data === 'reload' && location.reload()`: Checks if the server sent the word `'reload'`, and if so, refreshes the browser page instantly.