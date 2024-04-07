import * as core from '@actions/core'
import * as github from '@actions/github'
import * as commit from '../src/commit-details'
import * as errors from '../src/errors'

// Mock the GitHub Actions core library
let debugMock: jest.SpiedFunction<typeof core.debug>
let errorMock: jest.SpiedFunction<typeof core.error>
let warningMock: jest.SpiedFunction<typeof core.warning>
let getInputMock: jest.SpiedFunction<typeof core.getInput>
let setFailedMock: jest.SpiedFunction<typeof core.setFailed>
let setOutputMock: jest.SpiedFunction<typeof core.setOutput>
let getOctokitMock: jest.SpiedFunction<typeof github.getOctokit>
const COMMIT_MESSAGE =
  `Publish version 3 from Awell Studio\n \n      \n      Tag: u0Ey6YPvdbWGYuwisCtwv\n\n      ` +
  `Created by: jonathan+awelldev@awellhealth.com\n\n      Care flow ID: xjUdrKvscUmq\n\n\n   ` +
  `   Version notes:\n\n      # Not markdown  \nasdf  \n# h1\nsome comments about the publish.`

describe('action', () => {
  let getCommit: jest.Mock
  beforeEach(() => {
    jest.clearAllMocks()
    getCommit = jest.fn().mockResolvedValue({
      data: {
        commit: {
          message: COMMIT_MESSAGE
        }
      }
    })
    debugMock = jest.spyOn(core, 'debug').mockImplementation()
    errorMock = jest.spyOn(core, 'error').mockImplementation()
    warningMock = jest.spyOn(core, 'warning').mockImplementation()
    getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
    setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
    setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()
    getOctokitMock = jest
      .spyOn(github, 'getOctokit')
      .mockImplementation((_tok, _opt, ..._p) => {
        return {
          rest: {
            repos: {
              getCommit
            }
          }
        } as any
      })
  })

  it('test getCommitDetails', async () => {
    await commit.getCommitDetails('abc')
    expect(getOctokitMock).toHaveBeenCalledWith('abc')
    expect(getCommit).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      ref: '123'
    })
    expect(getCommit).toHaveReturned()
  })

  it('test successful parse', async () => {
    const commitMessage =
      `Publish version 3 from Awell Studio\n \n      \n      Tag: u0Ey6YPvdbWGYuwisCtwv\n\n      ` +
      `Created by: jonathan+awelldev@awellhealth.com\n\n      Care flow ID: xjUdrKvscUmq\n\n\n   ` +
      `   Version notes:\n\n      # Not markdown  \nasdf  \n# h1\nsome comments about the publish.`
    const parsed = commit.parse(commitMessage)
    expect(parsed.release_id).toBe('u0Ey6YPvdbWGYuwisCtwv')
    expect(parsed.definition_id).toBe('xjUdrKvscUmq')
    expect(parsed.version_notes).toBe(
      '# Not markdown  \nasdf  \n# h1\nsome comments about the publish.'
    )
  })

  it('test failed parse', async () => {
    const commitMessage =
      `Publish version 3 from Awell Studio\n \n      \n      \n\n      ` +
      `Created by: jonathan+awelldev@awellhealth.com\n\n      Care flow ID: xjUdrKvscUmq\n\n\n   ` +
      `   Version notes:\n\n      # Not markdown  \nasdf  \n# h1\nsome comments about the publish.`
    expect(() => commit.parse(commitMessage)).toThrow(
      new errors.ErrorWithData({
        msg: 'Commit message is missing release_id (Tag) and/or definition_id (Care flow ID)',
        data: { commitMessage }
      })
    )
  })
})
