import * as core from '@actions/core'
import * as github from '@actions/github'

interface MockInterface {
  debugMock: jest.SpiedFunction<typeof core.debug>
  infoMock: jest.SpiedFunction<typeof core.info>
  warningMock: jest.SpiedFunction<typeof core.warning>
  errorMock: jest.SpiedFunction<typeof core.error>
  getInputMock: jest.SpiedFunction<typeof core.getInput>
  setOutputMock: jest.SpiedFunction<typeof core.setOutput>
  setFailedMock: jest.SpiedFunction<typeof core.setFailed>
  getOctokitMock: jest.SpiedFunction<typeof github.getOctokit>
  getCommit: jest.Mock
}
class MockFactory {
  mocks: MockInterface

  constructor(props?: Partial<MockInterface>) {
    this.mocks = {
      debugMock: jest.spyOn(core, 'debug').mockImplementation(),
      infoMock: jest.spyOn(core, 'info').mockImplementation(),
      warningMock: jest.spyOn(core, 'warning').mockImplementation(),
      errorMock: jest.spyOn(core, 'error').mockImplementation(),
      getInputMock: jest.spyOn(core, 'getInput').mockImplementation(),
      setOutputMock: jest.spyOn(core, 'setOutput').mockImplementation(),
      setFailedMock: jest.spyOn(core, 'setFailed').mockImplementation(),
      getCommit: jest.fn(),
      getOctokitMock: jest
        .spyOn(github, 'getOctokit')
        .mockImplementation((_tok, _opt, ..._p) => {
          return {
            rest: {
              repos: {
                getCommit: this.mocks.getCommit
              }
            }
          } as any
        }),
      ...props
    }
  }

  public async clearMocks() {
    Object.values(this.mocks).forEach(mock => {
      mock.mockClear()
    })
  }
}
