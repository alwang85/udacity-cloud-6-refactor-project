import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { createLogger } from '../../utils/logger'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { updateTodo, getTodoById } from '../../businessLogic/todos'
import { getUserId } from '../utils'

const logger = createLogger('generateUpload')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
  const currentUserId = getUserId(event);

  try {
    const oldTodo = await getTodoById(todoId);

    if (!oldTodo) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: ''
      }    
    }

    const params = {
      ...oldTodo,
      name: updatedTodo.name,
      done: updatedTodo.done,
      dueDate: updatedTodo.dueDate,
    }
    const result = await updateTodo(params, currentUserId)
    
    logger.info('todo updated', todoId);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        item: result,
      })
    }
  } catch(e) {
    logger.error('failed update', e);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: e
      })
    }
  }
}
