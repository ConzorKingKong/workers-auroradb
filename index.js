const { RDSDataClient, ExecuteStatementCommand } = require("@aws-sdk/client-rds-data");

// Replace these with your region, table, and database ARN
const REGION = "us-west-2"
const TABLE = "friends"
const RESOURCE_ARN = ""

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // The AWS SDK tries to use crypto from off of the window,
  // so we need to trick it into finding it where it expects it
  global.window = {}
  window.crypto = crypto

  if (request.method === "POST") {
    const jsonData = await request.json()

    await postData(jsonData)

    return new Response("Data added")
  } else {
    // We need to create a URL object so we can read the query parameters from the request
    const url = new URL(request.url)

    const ID = url.searchParams.get("ID")

    const result = await getData(ID)
    return new Response(JSON.stringify(result), {
      headers: { 'content-type': 'text/plain' },
    })
  }
}

async function getData(ID) {
  const client = new RDSDataClient({
    region: REGION,
    credentialDefaultProvider: myCredentialProvider
  });

  const call = new ExecuteStatementCommand({
    
    // This SQL command is susceptible to SQL Injections and
    // is not production ready
    sql: `SELECT * FROM ${TABLE} WHERE id = ${ID};`,
    resourceArn: RESOURCE_ARN,
    secretArn: SECRET_ARN
  })

  const results = await client.send(call)

  return results.records
}


async function postData(jsonData) {
  const client = new RDSDataClient({
    region: REGION,
    credentialDefaultProvider: myCredentialProvider
  });

  const keysArray = Object.keys(jsonData)
  let keys  = ""
  let values = ""

  keysArray.forEach((key, index) => {
    keys += `${key}`
    values += `'${jsonData[key]}'`

    if (index !== keysArray.length - 1) {
      keys += ", "
      values += ", "
    }
  })

  const call = new ExecuteStatementCommand({

    // This SQL command is susceptible to SQL Injections and
    // is not production ready
    sql: `INSERT INTO ${TABLE}(${keys}) VALUES (${values});`,
    resourceArn: RESOURCE_ARN,
    secretArn: SECRET_ARN
  })

  const results = await client.send(call)

  return results
}

async function myCredentialProvider() {
  return {
    // Use wrangler secrets to provide these global variables
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  }
}
