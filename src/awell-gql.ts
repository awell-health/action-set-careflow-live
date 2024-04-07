import * as core from '@actions/core'
import { ErrorWithData } from './errors'

export async function markReleaseAsLive(
  variables: MarkReleaseAsLiveParams
): Promise<void> {
  core.debug(`Marking release_id=${variables.release_id} as live`)
  const response = await fetch(url(), prepareRequest(variables))
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }
  const json = await response.json()
  core.debug(`Response JSON: ${JSON.stringify(json)}`)
  if (!json.data.markReleaseAsLive.success) {
    throw new ErrorWithData({
      msg: 'Request failed.',
      data: { response: json }
    })
  }
}

function url(): string {
  const urls = {
    local: 'http://localhost:8120/design/m2m/graphql',
    development: 'https://api.development.awellhealth.com/design/m2m/graphql',
    staging: 'https://api.staging.awellhealth.com/design/m2m/graphql',
    sandbox: 'https://api.sandbox.awellhealth.com/design/m2m/graphql',
    production: 'https://api.production.awellhealth.com/design/m2m/graphql',
    'production-us':
      'https://api.production-us.awellhealth.com/design/m2m/graphql',
    'production-uk':
      'https://api.production-uk.awellhealth.com/design/m2m/graphql'
  }
  const env = core.getInput('awell-environment') as keyof typeof urls
  const result = urls[env]
  if (!result) {
    throw new Error(`Unknown environment: ${env}`)
  }
  core.debug(`Sending POST request to ${result}`)
  return result
}

function prepareRequest(variables: MarkReleaseAsLiveParams): RequestInit {
  const apiKey = core.getInput('api-key')
  const headers = {
    'Content-Type': 'application/json',
    apikey: apiKey
  }
  const body = {
    query: MUTATION_MARK_LIVE,
    variables: {
      input: variables
    }
  }
  const result: RequestInit = {
    headers,
    body: JSON.stringify(body),
    method: 'POST'
  }
  core.debug(`Request: ${result}`)
  return result
}

interface MarkReleaseAsLiveParams {
  release_id: string
  definition_id: string
}

export const MUTATION_MARK_LIVE = `
mutation MarkReleaseAsLive($input: MarkReleaseAsLiveInput!) {
  markReleaseAsLive(input: $input) {
    code
    success
  }
}
`
