'use strict'

const response= require('./../response')

exports.index = (req, res) => {
    response.status('Hello REST API NODE4JS',res)
}