import 'source-map-support/register'
import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'
const logger = createLogger('deleteTodo')

const XAWS = AWSXRay.captureAWS(AWS)
const docClient = new XAWS.DynamoDB.DocumentClient()

const todosTable = process.env.TODOS_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const currentUserId = getUserId(event);
  const todoId = event.pathParameters.todoId

  try {
    await docClient
      .delete({
        TableName: todosTable,
        Key: {
          todoId,
          userId: currentUserId,
        },
        ConditionExpression:"userId = :currentUserId",
        ExpressionAttributeValues: {
          ":currentUserId": currentUserId
        }
      })
      .promise()

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
