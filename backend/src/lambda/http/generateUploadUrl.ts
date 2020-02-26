import 'source-map-support/register'
import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'
const logger = createLogger('generateUpload')

const XAWS = AWSXRay.captureAWS(AWS)
const docClient = new XAWS.DynamoDB.DocumentClient()

const todosTable = process.env.TODOS_TABLE
const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})

const bucketName = process.env.IMAGES_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const imageId = todoId
  const userId = getUserId(event)

  const url = getUploadUrl(imageId)
  const attachmentUrl = `https://${bucketName}.s3.us-east-1.amazonaws.com/${imageId}`

  try {
    await docClient
      .update({
        TableName: todosTable,
        Key: {
          todoId,
          userId,
        },
        UpdateExpression: "set attachmentUrl=:attachmentUrl",
        ExpressionAttributeValues: {
            ":attachmentUrl": attachmentUrl,
            ':userId' : userId,
        },
        ConditionExpression: 'userId = :userId',
        ReturnValues:"UPDATED_NEW"
      })
      .promise()

    logger.info('upload url generated:', url);
    
    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        uploadUrl: url
      })
    }
  } catch (e) {
    logger.error('failed to create upload url', e);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: e
      })
    }
  }
}

function getUploadUrl(imageId: string) {
  return s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: imageId,
    Expires: urlExpiration
  })
}