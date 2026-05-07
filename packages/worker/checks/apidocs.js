import { createCheckResult } from '../db.js'

const OPENAPI_RE = /"(?:swagger|openapi)"\s*:/i
const SWAGGER_UI_RE = /swagger-ui|SwaggerUIBundle|ReDoc|redoc\.standalone/i

const PROBES = [
  { path: '/swagger.json',     check: 'json-openapi' },
  { path: '/openapi.json',     check: 'json-openapi' },
  { path: '/api/swagger.json', check: 'json-openapi' },
  { path: '/api/openapi.json', check: 'json-openapi' },
  { path: '/api-docs',         check: 'swagger-ui' },
  { path: '/api/v1/docs',      check: 'swagger-ui' },
  { path: '/docs',             check: 'swagger-ui' },
  { path: '/graphql',          check: 'graphql' },
  { path: '/graphiql',         check: 'graphiql' },
]

export const runApiDocsCheck = async ({ uri, id, websiteId, createdAt, quickcheckId, type }) => {
  console.log(`Running API docs check for ${uri}`)

  const exposed = []

  await Promise.all(PROBES.map(async ({ path, check }) => {
    try {
      if (check === 'graphql') {
        // POST a minimal introspection query — a real GraphQL endpoint responds with data
        const res = await fetch(`${uri}${path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: '{"query":"{__typename}"}',
          signal: AbortSignal.timeout(6000),
        })
        if (res.ok) {
          const text = await res.text()
          if (text.includes('"__typename"') || (text.includes('"data"') && !text.includes('"errors"'))) {
            exposed.push(path)
          }
        }
      } else {
        const res = await fetch(`${uri}${path}`, { signal: AbortSignal.timeout(6000) })
        if (!res.ok) return
        const contentType = res.headers.get('content-type') || ''
        const text = await res.text()

        if (check === 'json-openapi' && contentType.includes('json') && OPENAPI_RE.test(text)) {
          exposed.push(path)
        } else if (check === 'swagger-ui' && SWAGGER_UI_RE.test(text)) {
          exposed.push(path)
        } else if (check === 'graphiql' && /graphiql/i.test(text)) {
          exposed.push(path)
        }
      }
    } catch {}
  }))

  await createCheckResult({
    id, websiteId, createdAt, check: 'apidocs',
    result: { status: exposed.length === 0 ? 'success' : 'fail', details: { exposed } },
    quickcheckId, type,
  })
}
