import { Queue } from 'bullmq'
import IORedis from 'ioredis'

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
})

const queue = new Queue('checks', { connection })

export const getJobStatus = async (id) => {
  const freshJob = await queue.getJob(id)

  if (!freshJob || freshJob?.id !== id) { // job not found
    return { state: 'active', waitingIndex: null }
  }

  const state = await freshJob.getState()
  let waitingIndex = null

  if (state === 'waiting') {
    const waitingJobs = await queue.getWaiting()
    waitingIndex = waitingJobs.findIndex(j => j.id === id)
  }

  return { waitingIndex, state }
}

export const runJob = async (body) => {
  try {
    console.log('Run job:', body?.url)

    const job = await queue.add('api-triggered-job', body)
    await new Promise(r => setTimeout(r, 100))
    const { waitingIndex } = await getJobStatus(job.id)

    return { message: 'Job enqueued', waitingIndex, jobId: job.id }
  } catch (err) {
    console.error('Error enqueuing job:', err)
    reply.code(500).send({ error: 'Failed to enqueue job' })
  }
}