/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import * as core from '@actions/core'
import * as main from '../src/main'
import * as commit from '../src/commit-details'
import * as awell from '../src/awell-gql'

// Mock the action's main function
const runMock = jest.spyOn(main, 'run')

// Mock the GitHub Actions core library
let debugMock: jest.SpiedFunction<typeof core.debug>
let errorMock: jest.SpiedFunction<typeof core.error>
let warningMock: jest.SpiedFunction<typeof core.warning>
let getInputMock: jest.SpiedFunction<typeof core.getInput>
let setFailedMock: jest.SpiedFunction<typeof core.setFailed>
let setOutputMock: jest.SpiedFunction<typeof core.setOutput>
let getCommitDetailsMock: jest.SpiedFunction<typeof commit.getCommitDetails>
let markReleaseAsLiveMock: jest.SpiedFunction<typeof awell.markReleaseAsLive>

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    debugMock = jest.spyOn(core, 'debug').mockImplementation()
    errorMock = jest.spyOn(core, 'error').mockImplementation()
    warningMock = jest.spyOn(core, 'warning').mockImplementation()
    getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
    setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
    setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()
    markReleaseAsLiveMock = jest
      .spyOn(awell, 'markReleaseAsLive')
      .mockResolvedValue()
  })

  it('Run the main function, test success', async () => {
    getCommitDetailsMock = jest
      .spyOn(commit, 'getCommitDetails')
      .mockResolvedValueOnce({ release_id: 'abc', definition_id: 'def' })
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementationOnce(name => {
      switch (name) {
        case 'github-token':
          return 'tok'
        case 'test-mode':
          return 'false'
        default:
          return ''
      }
    })

    await main.run()
    expect(runMock).toHaveReturned()

    // Verify that all of the core library functions were called correctly
    expect(setOutputMock).toHaveBeenNthCalledWith(1, 'release_id', 'abc')
    expect(setOutputMock).toHaveBeenNthCalledWith(2, 'definition_id', 'def')
    expect(setOutputMock).toHaveBeenNthCalledWith(3, 'result', 'success')
    expect(errorMock).not.toHaveBeenCalled()
  })

  it('Run the main function, test success in test mode', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'github-token':
          return 'tok'
        case 'test-mode':
          return 'true'
        case 'release-id':
          return 'test-release-id'
        case 'definition-id':
          return 'test-definition-id'
        default:
          return ''
      }
    })
    await main.run()
    expect(runMock).toHaveReturned()

    // Verify that all of the core library functions were called correctly
    expect(setOutputMock).toHaveBeenNthCalledWith(
      1,
      'release_id',
      'test-release-id'
    )
    expect(setOutputMock).toHaveBeenNthCalledWith(
      2,
      'definition_id',
      'test-definition-id'
    )
    expect(setOutputMock).toHaveBeenNthCalledWith(3, 'result', 'success')
    expect(errorMock).not.toHaveBeenCalled()
  })

  it('sets a failed status', async () => {
    getCommitDetailsMock.mockImplementationOnce(() => {
      throw new Error('test error')
    })
    await main.run()
    expect(runMock).toHaveReturned()
    expect(setFailedMock).toHaveBeenNthCalledWith(1, 'test error')
    expect(errorMock).toHaveBeenCalledTimes(2)
  })
})
