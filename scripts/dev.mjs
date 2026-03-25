import { spawn } from 'node:child_process'
import process from 'node:process'

const children = []
let shuttingDown = false

function run(name, command, args) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    env: process.env,
  })

  child.on('exit', (code, signal) => {
    if (shuttingDown) return
    shuttingDown = true
    const reason = signal ? `signal ${signal}` : `code ${code ?? 0}`
    console.log(`\n[${name}] exited with ${reason}. Stopping the other process...`)
    for (const sibling of children) {
      if (sibling !== child && !sibling.killed) sibling.kill('SIGTERM')
    }
    process.exit(code ?? 0)
  })

  children.push(child)
}

function shutdown(signal) {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM')
  }
  setTimeout(() => process.exit(0), 250)
  console.log(`\nReceived ${signal}. Shutting down Sentinel Nexus dev stack...`)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

run('api', 'npm', ['run', 'dev:api'])
run('web', 'npm', ['run', 'dev:web'])
