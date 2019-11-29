'use strict'
var express = require('express')
var router = express.Router();
var http = require('http');
var cron = require('node-cron'); // CAMBIO:ADICIONAR DEPENDENCIA
var sqs = require('../../worker-sqs/sqs.js') //CAMBIO: ADICIONAR DEPENDENCIA

const execute = () => {
    sqs.getSqs(function(apps){
        console.log("Ejecucion vrt test");
    });
  }

var task = cron.schedule('* * * * *', execute, {scheduled:true});
router.get('/start', (req,res) => {
    execute();
    task.start();
    res.send('Cron iniciado')
})



router.get('/stop', (req,res) => {
    task.stop()
    res.send('Worker detenido')
  })

module.exports = router;
