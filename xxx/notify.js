import https from 'https'
import qs from 'querystring'

const options = {
  'method': 'POST',
  'hostname': 'notify-api.line.me',
  'port': null,
  'path': '/api/notify',
  'headers': {
    'content-type': 'application/x-www-form-urlencoded',
    'authorization': 'Bearer BNo6b0h4QgUZKc94c6BxPCopZJd9RuiPnnzHtauXN6B'
  }
}

export default async message => {
  return new Promise((resolve, reject) => {
    try {
      const req = https.request(options, res => {
        try {
          const chunks = []

          res.on('data', chunk => {
            chunks.push(chunk)
          })

          res.on('end', () => {
            const body = Buffer.concat(chunks)
            const result = body.toString()

            console.log(result)
            resolve(result)
          })

          res.on('error', error => {
            reject(error)
          })
        } catch (error) {
          reject(error)
        }
      })

      req.on('error', error => {
        reject(error)
      })

      req.write(qs.stringify({ message: message }))
      req.end()
    } catch (error) {
      reject(error)
    }
  })
}
