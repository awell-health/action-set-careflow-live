import { ErrorWithData } from './errors'
import * as github from '@actions/github'
import * as core from '@actions/core'

export const getCommitDetails = async (
  token: string
): Promise<ParsedCommitMessage> => {
  if (core.getInput('test_mode') === 'true') {
    core.info('Running in test mode')
    return {
      release_id: core.getInput('release_id'),
      definition_id: core.getInput('definition_id')
    }
  }
  const octokit = github.getOctokit(token)
  const response = await octokit.rest.repos.getCommit({
    ...github.context.repo,
    ref: github.context.sha
  })
  const latestCommitMessage = response.data.commit.message
  return parse(latestCommitMessage)
}

interface ParsedCommitMessage {
  release_id: string
  definition_id: string
  version_notes?: string
}

export function parse(commitMessage: string): ParsedCommitMessage {
  const result = {} as ParsedCommitMessage
  const releaseId = commitMessage.match(/Tag: (.*)/)?.[1]
  const definitionId = commitMessage.match(/Care flow ID: (.*)/)?.[1]
  if (!releaseId || !definitionId) {
    throw new ErrorWithData({
      msg: 'Commit message is missing release_id (Tag) and/or definition_id (Care flow ID)',
      data: { commitMessage }
    })
  }
  result.version_notes = commitMessage
    .match(/Version notes:([.\s\S]*)/)?.[1]
    .trim()
  result.release_id = releaseId.trim()
  result.definition_id = definitionId.trim()
  return result
}
