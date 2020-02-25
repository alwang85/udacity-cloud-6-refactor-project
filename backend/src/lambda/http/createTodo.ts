import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import * as uuid from 'uuid'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils'

const XAWS = AWSXRay.captureAWS(AWS)
const docClient = new XAWS.DynamoDB.DocumentClient()
// const s3 = new AWS.S3({
//   signatureVersion: 'v4'
// })

const todosTable = process.env.TODOS_TABLE
// const urlExpiration: Number = parseInt(process.env.SIGNED_URL_EXPIRATION, 10)

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const newTodo: CreateTodoRequest = JSON.parse(event.body)
  const userId = getUserId(event);
  console.log('userId', userId);

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
    userId, // should be the secondary index
    ...newTodo,
    // imageUrl: `https://${bucketName}.s3.amazonaws.com/${imageId}`
  }
  console.log('Storing new item: ', newItem)

  await docClient
    .put({
      TableName: todosTable,
      Item: newItem
    })
    .promise()

    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        item: newItem,
      })
    }
})

handler.use(
  cors({
    credentials: true
  })
)
