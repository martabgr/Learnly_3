const bodyParser = require('body-parser')
const express = require('express')
const app = express()
const port = process.env.PORT || 4000

app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())

const routes = require('./settings/routes')
routes(app)

app.listen(port, () => {
  console.log(`App listen on port ${port}`)
})
