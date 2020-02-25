import 'source-map-support/register'
import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { getUserId } from '../utils'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'

const XAWS = AWSXRay.captureAWS(AWS)
const docClient = new XAWS.DynamoDB.DocumentClient()

const todosTable = process.env.TODOS_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const userId = getUserId(event)
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)

  // TODO enable S3 update later
  try {
    const result = await docClient
      .update({
        TableName: todosTable,
        Key: {
          todoId,
        },
        UpdateExpression: "set name = :name, dueDate=:dueDate, done=:done",
        ExpressionAttributeValues:{
            ":name":updatedTodo.name,
            ":dueDate":updatedTodo.dueDate,
            ":done":updatedTodo.done,
            ':userId' : userId,
        },
        ConditionExpression: 'userId = :userId',
        ReturnValues:"UPDATED_NEW"
      })
      .promise()

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify(result)
      }
  } catch(e) { // TODO figure out status codes
    console.log('error updating!', e)
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: e
      })
    }
  }
}
