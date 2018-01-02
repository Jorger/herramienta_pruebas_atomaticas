const exec = require('child-process-promise').exec;
const result = require('await-result');
const fs = require('fs');

const { APK_DIRECTORY } = require('../config').adb;

//Ejecutar un comando en la terminal...
const processTerminal = (command) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log(command);
            const terminal = await exec(
                command
            );
            resolve(terminal.stdout);
        } catch (e) {
            reject(e);
        }
    });
};

//Crear un archivo .sh con la prueba...
const createSHFile = (test) => {
    return new Promise((resolve, reject) => {
        const fileSH = `${APK_DIRECTORY}/${test.idapk}/${test.token_apk}.sh`;
        //Se debe renombrar el archivo...
        try {
            const stream = fs.createWriteStream(fileSH);
            stream.once('open', (fd) => {
                stream.write("#!/bin/sh\n");
                stream.write(`cd ${APK_DIRECTORY}/${test.idapk}\n`);
                //Renombrar el archivo de features que existe...
                stream.write(`mv ${test.file_features} my_first.feature\n`);
                //Genera el proyecto de Calabash...
                stream.write("echo | calabash-android gen\n");
                //Mover y reemplazar el features por defecto con el features que se ha subido...
                stream.write(`cp ${APK_DIRECTORY}/${test.idapk}/my_first.feature ${APK_DIRECTORY}/${test.idapk}/features\n`);
                //Ejecutar la prueba de Calabash...
                stream.write(`calabash-android resign ${test.file_apk}\n`);
                stream.write(`calabash-android run ${test.file_apk} ADB_DEVICE_ARG=${test.device.id_device}\n`);
                stream.end();
                resolve(
                    true
                );
            });
        } catch(e) {
            resolve(
                false
            );
        }
    });
};

//Para correr la prueba en modo BDD...
exports.runBDD = (test) => {
    return new Promise(async (resolve, reject) => {
        const fileSH = `${APK_DIRECTORY}/${test.idapk}/${test.token_apk}.sh`;
        //Ejecutar el archivo .sh con la prueba de BDD...
        const [ errorRunShell, runShell ] = await result(
            processTerminal(fileSH)
        );
        if(!errorRunShell) {
            resolve(
                runShell
            );    
        } else {
            resolve(
                JSON.stringify(errorRunShell)
            );
        }
    });
};


//Para configurar la prueba de calabash...
exports.initBDD = (test) => {
    return new Promise(async (resolve, reject) => {
        //Crear el archivo .sh...
        const shFile = await createSHFile(
            test
        );
        if(shFile) {
            const fileSH = `${APK_DIRECTORY}/${test.idapk}/${test.token_apk}.sh`;
            //Dar permisos al archivo SH...
            const [ errorPermissions, permissions ] = await result(
                processTerminal(`chmod +x ${fileSH}`)
            );
            if(!errorPermissions) {
                resolve({
                    error : false, 
                    msg : "Se ha creado la prueba de calabash, se iniciará la ejecución de la misma"
                });
            } else {
                resolve({
                    error : true, 
                    msg : errorPermissions
                });
            }
        } else {
            resolve({
                error : true, 
                msg : "Error al crear el archivo .sh"
            });
        }
    });
};