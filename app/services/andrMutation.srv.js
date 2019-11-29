'use strict'
const shell = require('shelljs');
const request = require('request');
const fs = require('fs');
const s3 = require('../../worker-sqs/s3Storage.js');
Promise = require('promise');


module.exports.generateAndrMutation = function(req,success,error){
    let itemsEx = req.numberExecution;
    let path = req.path_project;
    let code = req.code;
    const codeinit = req.code;
    var item = 1;
    let app = req.aplication;
    let appPackage;
    let apkInstall;
    let src;

    switch(req.aplication.toUpperCase()){
        case 'HABITICA':
            appPackage = 'com.habitrpg.android.habitica';
            apkInstall = 'habitica.apk';
            src= '../habitica-android/Habitica/src/';
            break;
        case 'CALENDULA':
                appPackage = 'es.usc.citius.servando.calendula';
                apkInstall = 'calendula.apk';
                src= '../calendula/Calendula/src/'
                break;
        default:
            throw error({ status: "APP_NOT_FOUND" });
    }

    for(var i = 0,p = Promise.resolve();i<itemsEx;i++){
        p= p.then(_ => new Promise(resolve => {
            code = `${codeinit}_${item}`;
            shell.exec('cd MDroidPlus && mvn clean && mvn package');
            console.log(process.cwd())
            shell.exec(`cd MDroidPlus/target && java -jar MDroidPlus-1.0.0.jar ../libs4ast/ ${src} ${app} ../tmp/mutants${app.toLowerCase()}/ ../ true`);
            fs.readdir(`${path}/MDroidPlus/tmp/mutants${app.toLowerCase()}`,function(err, items) {
                let file;
                console.log("--------------------> Items: ", items);
                for(var i=0;i<items.length;i++){
                    if(items[i].includes('log')){
                        file = items[i];
                        break;
                    }
                }
                const content = fs.readFileSync(`${path}/MDroidPlus/tmp/mutants${app.toLowerCase()}/${file}`);
                s3.saveFileToS3(`${code}`,content,()=>{
                    for(var i=0;i<items.length;i++){
                        if(items[i].includes('log')){
                            fs.unlinkSync(`${path}/MDroidPlus/tmp/mutants${app.toLowerCase()}/${items[i]}`);
                        }
                    }
                    if(item == itemsEx){
                        success("ok");
                    }else{
                        item = item+1;
                        resolve();
                    }
                });
            });
        }));
    }
}
