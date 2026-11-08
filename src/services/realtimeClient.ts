import { io, type ManagerOptions, type Socket, type SocketOptions } from 'socket.io-client'

// Lets the in-browser demo (src/demo) replace the real Socket.IO connection
// without the normal build having to know about it.
let factory: (() => Socket) | null = null

export function setSocketFactory(f: (() => Socket) | null): void {
  factory = f
}

export function connectSocket(url: string, opts: Partial<ManagerOptions & SocketOptions>): Socket {
  return factory ? factory() : io(url, opts)
}
