import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import * as uuid from 'uuid'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'
const logger = createLogger('createTodo')

const XAWS = AWSXRay.captureAWS(AWS)
const docClient = new XAWS.DynamoDB.DocumentClient()

const todosTable = process.env.TODOS_TABLE

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const newTodo: CreateTodoRequest = JSON.parse(event.body)
  const userId = getUserId(event);

  if (!userId) {
    return {
      statusCode: 401,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Not Authenticated to create todos'
      })
    }
  }

  const todoId = uuid.v4();
  const timestamp = new Date().toISOString()

  const newItem = {
    todoId,
    createdAt: timestamp,
    userId,
    ...newTodo,
  }
  try {
    await docClient
    .put({
      TableName: todosTable,
      Item: newItem
    })
    .promise()

    logger.info('new item created', newItem)

    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        item: newItem,
      })
    }
  } catch(e) {
    logger.error('failed create', e);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: e
      })
    }
  }
})

handler.use(
  cors({
    credentials: true
  })
)
