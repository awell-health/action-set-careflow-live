import * as core from '@actions/core'
import { ErrorWithData } from '../src/errors'
import { markReleaseAsLive, MUTATION_MARK_LIVE } from '../src/awell-gql'

describe('awell-gql', () => {
  let debugMock: jest.SpiedFunction<typeof core.debug>
  let setOutputMock: jest.SpiedFunction<typeof core.setOutput>
  let setFailedMock: jest.SpiedFunction<typeof core.setFailed>
  let getInputMock: jest.SpiedFunction<typeof core.getInput>
  let fetchMock: jest.SpiedFunction<typeof global.fetch>
  const successData = {
    data: {
      markReleaseAsLive: {
        success: true
      }
    }
  }
  const mockJson = jest.fn().mockResolvedValue(successData)
  const mockFetch = jest.fn().mockResolvedValue({
    ok: true,
    json: mockJson,
    headers: new Headers({ 'x-request-id': '123' })
  })
  const mockUrl = 'http://localhost:8120/design/m2m/graphql'
  const mockApiKey = '1234567890'
  const mockVariables = {
    release_id: 'abc',
    definition_id: 'def'
  }
  const mockRequest = {
    headers: {
      'Content-Type': 'application/json',
      apikey: mockApiKey
    },
    body: JSON.stringify({
      query: MUTATION_MARK_LIVE,
      variables: {
        input: mockVariables
      }
    })
  }
  const mockError = new Error('Request failed.')
  const mockErrorWithData = new ErrorWithData({
    msg: 'Request failed.',
    data: { response: successData }
  })

  beforeEach(() => {
    jest.clearAllMocks()
    debugMock = jest.spyOn(core, 'debug').mockImplementation()
    setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()
    setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
    getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
    fetchMock = jest.spyOn(global, 'fetch').mockImplementation(mockFetch)
  })

  it('test markReleaseAsLive success', async () => {
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'awell-environment':
          return 'local'
        case 'api-key':
          return mockApiKey
        default:
          return ''
      }
    })
    await markReleaseAsLive(mockVariables)
    expect(fetchMock).toHaveBeenCalledWith(mockUrl, mockRequest)
    expect(mockJson).toHaveReturned()
    expect(setOutputMock).toHaveBeenCalledWith('result', 'success')
  })

  it('bad env var', async () => {
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'awell-environment':
          return 'bad'
        default:
          return ''
      }
    })
    await expect(markReleaseAsLive(mockVariables)).rejects.toThrow(
      new Error('Unknown environment: bad')
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('test response not ok', async () => {
    const failData = {
      ok: false,
      status: 500
    }
    const failFetch = jest.fn().mockResolvedValue(failData)
    fetchMock.mockImplementation(failFetch)
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'awell-environment':
          return 'local'
        case 'api-key':
          return mockApiKey
        default:
          return ''
      }
    })
    await expect(markReleaseAsLive(mockVariables)).rejects.toThrow(
      new Error(`Request failed with status ${failData.status}`)
    )
  })

  it('test markReleaseAsLive failure', async () => {
    const failData = {
      data: {
        markReleaseAsLive: {
          success: false
        }
      }
    }
    const failResponse = jest.fn().mockResolvedValue(failData)
    const failFetch = jest.fn().mockResolvedValue({
      json: failResponse,
      ok: true,
      headers: new Headers()
    })
    fetchMock.mockImplementation(failFetch)
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'awell-environment':
          return 'local'
        case 'api-key':
          return mockApiKey
        default:
          return ''
      }
    })
    await expect(markReleaseAsLive(mockVariables)).rejects.toThrow(
      mockErrorWithData
    )
  })
})
