import { ErrorWithData } from './errors'
import * as github from '@actions/github'

export const getCommitDetails = async (
  token: string
): Promise<ParsedCommitMessage> => {
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
      msg: 'Commit message is missing release_id (Tag) or definition_id (Care flow ID)',
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
