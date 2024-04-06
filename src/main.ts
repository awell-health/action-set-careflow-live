import * as core from '@actions/core'
import { getCommitDetails } from './commit-details'
import { markReleaseAsLive } from './awell-gql'

export async function run(): Promise<void> {
  try {
    const token = core.getInput('github-token')
    core.debug(token)
    const { release_id, definition_id } = await getCommitDetails(token)
    core.setOutput('release_id', release_id)
    core.setOutput('definition_id', definition_id)
    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    core.debug(`Release ID: ${release_id}, Definition ID: ${definition_id}`)
    // Assuming the details are valid, mark the release as live
    await markReleaseAsLive({ release_id, definition_id })
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.error('There was an error running the action')
    if (error instanceof Error) {
      core.error(error)
      core.setFailed(error.message)
    }
  }
}
