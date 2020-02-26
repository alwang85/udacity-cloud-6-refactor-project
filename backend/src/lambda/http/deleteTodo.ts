import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

import { getUserId } from '../utils'
import { deleteTodo, getTodoById } from '../../businessLogic/todos'
import { createLogger } from '../../utils/logger'
const logger = createLogger('deleteTodo')


export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const currentUserId = getUserId(event);
  const todoId = event.pathParameters.todoId

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

    await deleteTodo(oldTodo, currentUserId);

    logger.info('todo deleted:', todoId);
    
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: 'success'
    }
  } catch(e) {
    logger.error('error deleting!', e)
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
