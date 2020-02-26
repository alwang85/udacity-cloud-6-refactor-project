import 'source-map-support/register'
import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'
const logger = createLogger('getTodos')

const XAWS = AWSXRay.captureAWS(AWS)
const docClient = new XAWS.DynamoDB.DocumentClient()

const todosTable = process.env.TODOS_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const userId = getUserId(event);

  try {
    const toDos = await getTodosPerUser(userId)

    logger.info('todo fetching success:');
  
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        items: toDos
      })
    }
  } catch(e) {
    logger.error('failed to get', e);
    return {
      statusCode: 401,
      body: JSON.stringify({
        error: e
      })
    }
  }
  
}

async function getTodosPerUser(userId: string) {
  const result = await docClient.query({
    TableName: todosTable,
    IndexName: process.env.TODOS_USERID_INDEX,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    },
    ScanIndexForward: false
  }).promise()

  return result.Items
}