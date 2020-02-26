import 'source-map-support/register'
import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'
const logger = createLogger('generateUpload')
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'

const XAWS = AWSXRay.captureAWS(AWS)
const docClient = new XAWS.DynamoDB.DocumentClient()

const todosTable = process.env.TODOS_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const userId = getUserId(event)
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)

  try {
    const result = await docClient
      .update({
        TableName: todosTable,
        Key: {
          todoId,
          userId,
        },
        UpdateExpression: "set done=:done",
        ExpressionAttributeValues:{
            ":done":updatedTodo.done,
            ':userId' : userId,
        },
        ConditionExpression: 'userId = :userId',
        ReturnValues:"UPDATED_NEW"
      })
      .promise()
    
    logger.info('todo updated', todoId);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify(result)
    }
  } catch(e) {
    logger.error('failed update', e);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: e
      })
    }
  }
}
