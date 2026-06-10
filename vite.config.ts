import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { appendFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

const CLIENT_ERROR_LOG_ENDPOINT = '/__client-error-log'
const LOG_DIRECTORY = path.resolve(process.cwd(), 'logs')
const LOG_FILE_PATH = path.join(LOG_DIRECTORY, 'frontend-errors.log')

const readRequestBody = (request: IncomingMessage) =>
  new Promise<string>((resolve, reject) => {
    let rawData = ''

    request.setEncoding('utf8')
    request.on('data', (chunk) => {
      rawData += chunk

      if (rawData.length > 1_000_000) {
        reject(new Error('Payload too large'))
      }
    })
    request.on('end', () => resolve(rawData))
    request.on('error', reject)
  })

const sendResponse = (response: ServerResponse, statusCode: number, message = '') => {
  response.statusCode = statusCode

  if (message) {
    response.setHeader('content-type', 'application/json; charset=utf-8')
    response.end(JSON.stringify({ message }))
    return
  }

  response.end()
}

const createLogMiddleware = () => async (request: IncomingMessage, response: ServerResponse, next: () => void) => {
  if (request.method !== 'POST' || request.url !== CLIENT_ERROR_LOG_ENDPOINT) {
    next()
    return
  }

  try {
    const rawBody = await readRequestBody(request)
    const payload = rawBody ? JSON.parse(rawBody) : {}

    await mkdir(LOG_DIRECTORY, { recursive: true })
    await appendFile(
      LOG_FILE_PATH,
      `${JSON.stringify({
        ...payload,
        receivedAt: new Date().toISOString(),
      })}\n`,
      'utf8',
    )

    sendResponse(response, 204)
  } catch (error) {
    if (error instanceof SyntaxError) {
      sendResponse(response, 400, 'Invalid JSON payload')
      return
    }

    sendResponse(response, 500, 'Failed to persist client error log')
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'client-error-file-logger',
      configureServer(server) {
        server.middlewares.use(createLogMiddleware())
      },
      configurePreviewServer(server) {
        server.middlewares.use(createLogMiddleware())
      },
    },
  ],
})
