import type { Endpoint } from 'payload'

import { TasksHandler } from './tasksHandler.js'
import { PLUGIN_AUTOMATIONS_TABLE } from '../defaults.js'

export const jobTrigger: Endpoint = {
  handler: async (req) => {
    const { payload } = req

    console.log('!!!! CRON JOB TRIGGERED !!!!')

    const now = new Date()
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)

    const entry = await payload.find({
      collection: PLUGIN_AUTOMATIONS_TABLE,
      pagination: false,
      where: {
        schedule: {
          greater_than: now.toISOString(),
        },
      },
    })

    for (const doc of entry.docs) {
      const { tasks = [] } = doc
      if (!tasks || !tasks.length) {
        return Response.json({
          error: 'No tasks found!',
        })
      }

      let previousResult: any
      for (const task of tasks) {
        const handler = TasksHandler[task.blockType]
        if (typeof handler === 'function') {
          task['response'] = await handler({ ...task, previousResult }, payload)
          previousResult = task['response']
          task['fields'] = task['fields']?.map((f) => f.id)
        }
      }
      doc.tasks = tasks
      await payload.update({
        id: doc.id,
        collection: PLUGIN_AUTOMATIONS_TABLE,
        data: doc,
      })
    }

    return Response.json({
      time: new Date().toISOString(),
    })
  },
  method: 'get',
  path: '/trigger',
}
