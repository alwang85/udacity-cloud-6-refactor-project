import 'source-map-support/register'
import * as AWS  from 'aws-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

import { getUserId } from '../utils'

const docClient = new AWS.DynamoDB.DocumentClient()

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
        },
        ConditionExpression:"userId = :currentUserId",
        ExpressionAttributeValues: {
            ":currentUserId": currentUserId
        }
      })
      .promise()

      return {
        statusCode: 204
      }
  } catch(e) { // TODO figure out status codes
    console.log('error deleting!', e)
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: e
      })
    }
  }
}
