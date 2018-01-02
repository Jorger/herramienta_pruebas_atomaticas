"use strict";
const db = require('../modules/database');
const mysql = require('mysql');
const helpers = require('../helpers');
const striptags	=  require('striptags');
const sanitizer =  require('sanitizer'); 
const moment = require('moment-timezone');
const deviceController = require('./deviceController');

//Para actualizar información de los dispositivos...
const updateDataAPK = (data) => {
    return new Promise(async (resolve, reject) => {
        const {
            type, 
            update
        } = data;
        let upsertData = {
            table : "adb_test_apk", 
            type,
            update
        };
        if(type === "update") {
            upsertData.where = data.where;
        }
        const updateData = await db.upsertData(upsertData);
        resolve(
            updateData
        );
    });
};

//Actualiza el log y si ha finalizado la prueba...
const updateLogAndFinishTest = (log = "", finish = false, iddevice = 0, idapk = 0) => {
    return new Promise(async (resolve, reject) => {
        let sql = `UPDATE adb_test_apk SET txt_log = CONCAT(txt_log, ${mysql.escape(striptags(sanitizer.escape(log + "\n")))})`;
        if(finish) {
            const dates = helpers.dates();
            sql += `, end_test = '1', 
                    date_end_test = '${dates.current_date}',
                    date_end_test_unix = '${dates.unix}',
                    date_end_test_string = '${dates.date_string}',
                    date_end_hour_string = '${dates.hour_string}'`;
        }
        sql += ` WHERE idapk = ${idapk}`;
        db.queryMysql(sql, "single").then(async updateLog => {
            //Actualizar lo demás si es necesario...
            if(finish) {
                const updateUseDevice = await deviceController.updateDataDevice({
                    type : "update", 
                    update : {
                        device_available : 1
                    }, 
                    where : {
                        iddevice
                    }
                });
            }
            resolve({
                save : true
            })
        });
    });
};


//Retorna el tipo de dispositivo...
const getTestAPK = (param, withDevice = false) => {
    return new Promise(async (resolve, reject) => {
        const sqlQuery = await db.validateNameColumns(
            "adb_test_apk", 
            param.query
        );
        const sql = `select ${sqlQuery} from adb_test_apk 
                     where ${param.type} = ${mysql.escape(striptags(sanitizer.escape(param.value)))} and 
                           is_active = 1`;
        db.queryMysql(sql, "single").then(async testAPK => {
            if(withDevice) {
                testAPK.device = await deviceController.getDevice({
                    query : [
                        "iddevice", 
                        "token_device", 
                        "device_available", 
                        "name_device", 
                        "id_device", 
                        "dimensions_device", 
                        "position_window", 
                        "dimension_window"
                    ], 
                    type : "iddevice", 
                    value : testAPK.iddevice
                });
            }
            resolve(
                testAPK
            );
        });
    });
};

//La cantidad de pruebas realizadas...
const numberTestAPks = () => {
    return new Promise((resolve, reject) => {
        const sql = `select count(*) as numero 
                   from adb_test_apk a, 
                        adb_devices b 
                        where a.is_active = 1 and 
                              a.number_step <> 0 and 
                              b.iddevice = a.iddevice and 
                              b.is_active = 1`;
        
        db.queryMysql(sql, "single").then(value => {
            resolve(value);
		});
    });
};

//Llevar el listado de pruebas realizadas en el momento...
const getTestsAPK = (data) => {
    return new Promise(async (resolve, reject) => {
        let returnData = {
            error : false, 
            msg : "Proceso realizado..."
        };
        //Para validar si tendrá o no paginación...
        data.paginate = data.paginate || {pagina : false};
        //Traer el total de pruebas realizadas...
        returnData.total = await numberTestAPks();
        if(returnData.total.numero !== 0) {
            const sqlQuery = await db.validateNameColumns(
                "adb_test_apk", 
                data.query, 
                {
                    sufix : "a"
                }
            );
            let sql = `select ${sqlQuery}, 
                       b.token_device, b.device_available, 
                       b.name_device, b.id_device, b.dimensions_device 
                       from adb_test_apk a, 
                            adb_devices b 
                            where a.is_active = 1 and 
                                  a.number_step <> 0 and 
                                  b.iddevice = a.iddevice and 
                                  b.is_active = 1 order by a.creation_date_unix asc`;
            //Si tiene páginación...
            if(JSON.parse(data.paginate.pagina)) {
                const {
                    page, 
                    max
                } = helpers.clearDataObject(
                    data.paginate
                );
                const numPagina = max * (page - 1);
                sql += ` limit ${numPagina}, ${max}`;
            }
            db.queryMysql(sql).then(tests => {
                returnData.tests = tests;
                resolve(
                    returnData
                );
            });
        } else {
            resolve(
                returnData
            );
        }
    });
};

//Crear un nuevo dispositivo...
exports.newTestAPK = (data) => {
    return new Promise(async (resolve, reject) => {
        let {
            name_test
        } = helpers.clearDataObject(
            data
        );
        const returnData = {
            error : false, 
            msg : "Se ha creado la prueba"
        };
        if(name_test === "") {
            returnData.error = true;
            returnData.msg = "El nombre de la prueba no es válida";
        }
        if(!returnData.error) {
            const dates = helpers.dates();
            const token_apk = helpers.guid();
            const saveTest = await updateDataAPK({
                type : "save",
                update : {
                    token_apk, 
                    name_test, 
                    creation_date : dates.current_date,
                    creation_date_string : dates.date_string,
                    creation_date_unix : dates.unix,
                    hour_string : dates.hour_string, 
                    ipcomputer : helpers.getIP()
                }
            });
            returnData.idapk = saveTest.insertId;
            returnData.token_apk = token_apk;
            //Crear una carpeta donde se alojará todo...
            helpers.crearDirectorio(
                `./apks/${returnData.idapk}`
            );
        }
        resolve(
            returnData
        );
    });
};

//Para guardar la configuración de la prueba...
const configTestAPK = (data) => {
    return new Promise(async (resolve, reject) => {
        const {
            type_test,
            token_apk, 
            token_device, 
            number_events
        } = helpers.clearDataObject(
            data
        );
        const { events } = data;
        const features = type_test === "bdd" ? data.features : {};
        const returnData = {
            error : false, 
            msg : "Se ha guardado la configuración", 
            commands : "", 
            test : {}, 
            device : {}
        };
        let seed_test = 0;
        //Primero saber si es tipo de test válido...
        if(type_test !== "adbinput" && type_test !== "monkey" && type_test !== "bdd") {
            returnData.error = true;
            returnData.msg = "El tipo de prueba no es válido";
        }
        if(!returnData.error && (type_test === "adbinput" || type_test === "monkey")) {
            //Primero saber si el número de eventos es válido...
            if(helpers.isNumber(number_events)) {
                if(+number_events <= 0) {
                    returnData.error = true;
                    returnData.msg = "El número de eventos no puede ser cero o negativo";    
                }
            } else {
                returnData.error = true;
                returnData.msg = "El número de eventos no es válido";
            }
        }
        //Saber si el valor de la semilla es válido...
        if(!returnData.error && type_test === "monkey") {
            //Primero saber si el número de eventos es válido...
            seed_test = striptags(sanitizer.escape(data.seed));
            if(helpers.isNumber(seed_test)) {
                if(+seed_test <= 0) {
                    returnData.error = true;
                    returnData.msg = "El número de la semilla no puede ser cero o negativo";    
                }
            } else {
                returnData.error = true;
                returnData.msg = "El número de la semilla no es válido";
            }
        }
        
        //Para validar los comandos enviados...
        if(!returnData.error && (type_test === "adbinput" || type_test === "monkey")) {
            if(type_test === "adbinput") {
                for(let event in events) {
                    //Es un comando válido...
                    if(helpers.commandsADB(event)) {
                        //Saber si fue seleccionado...
                        if(+events[event]) {
                            if(returnData.commands !== "") {
                                returnData.commands += ",";
                            }
                            returnData.commands += striptags(sanitizer.escape(event));
                        }
                    } else {
                        returnData.error = true;
                        returnData.msg = "El comando enviado no es válido";
                        break;
                    }
                }
                if(!returnData.error) {
                    if(returnData.commands === "") {
                        returnData.error = true;
                        returnData.msg = "Es necesario al menos la selección de un comando para ejecutar la prueba en modo ADB Input";
                    }
                }
            } else {
                //commandsMonkey
                let sumCommands = 0;
                for(let event in events) {
                    //Es un comando válido...
                    if(helpers.commandsMonkey(event)) {
                        //Saber si fue seleccionado...
                        sumCommands += +events[event];
                        if(+events[event] !== 0) {
                            if(returnData.commands !== "") {
                                returnData.commands += ",";
                            }
                            returnData.commands += `${striptags(sanitizer.escape(event))}=${+events[event]}`;
                        }
                    } else {
                        returnData.error = true;
                        returnData.msg = "El comando enviado no es válido";
                        break;
                    }
                }
                if(!returnData.error) {
                    if(sumCommands > 100) {
                        returnData.error = true;
                        returnData.msg = "El porcentaje total de los eventos no puede ser mayor a 100%";
                    }
                }
            }
        }
        //Saber si la prueba existe y puede ejecutarse...
        if(!returnData.error) {
            returnData.test = await getTestAPK({
                query : [
                    "idapk", 
                    "number_step"
                ], 
                type : "token_apk", 
                value : token_apk
            });
            if(returnData.test) {
                if(returnData.test.number_step !== 1) {
                    returnData.error = true;
                    returnData.msg = "El paso de ejecución de la prueba no es válido";
                }
            } else {
                returnData.error = true;
                returnData.msg = "La prueba no existe";
            }
        }
        if(!returnData.error) {
            //Saber si el dispositivo seleccionado existe...
            returnData.device = await deviceController.getDevice({
                query : [
                    "iddevice", 
                    "device_available"
                ], 
                type : "token_device", 
                value : token_device
            });
            if(returnData.device) {
                if(!returnData.device.device_available) {
                    returnData.error = true;
                    returnData.msg = "El dispositivo no está disponible";    
                }
            } else {
                returnData.error = true;
                returnData.msg = "El dispositivo no existe";
            }
        }
        //Actualizar la información...
        if(!returnData.error) {
            //features
            const dataUpdate = {
                type_test,
                number_events, 
                seed_test,
                number_step : 2, 
                iddevice : returnData.device.iddevice
            };
            if(type_test === "adbinput" || type_test === "monkey") {
                dataUpdate[
                    type_test === "adbinput" ? "commands" : "commands_monkey"
                ] = returnData.commands;
            } else {
                dataUpdate.name_features = features.name_features;
                dataUpdate.file_features = features.file_features;
            }
            const updateInfoAPK = await updateDataAPK({
                type : "update", 
                update : dataUpdate, 
                where : {
                    idapk : returnData.test.idapk
                }
            });
            if(updateInfoAPK.affectedRows === 0) {
                returnData.error = true;
                returnData.msg = "No se ha podido guardar el registro";
            }
        }
        //Indicar que el dispositivo está en uso...
        if(!returnData.error) {
            const updateUseDevice = await deviceController.updateDataDevice({
                type : "update", 
                update : {
                    device_available : 0
                }, 
                where : {
                    iddevice : returnData.device.iddevice
                }
            });
            if(updateUseDevice.affectedRows === 0) {
                returnData.error = true;
                returnData.msg = "No se ha podido actualizar el estado del dispositivo";
            }
        }
        resolve(
            returnData
        );
    });
};

//Para subir la APK relacionada a la prueba...
const uploadTestAPK = (req) => {
    return new Promise(async (resolve, reject) => {
        const {
            token_apk
        } = helpers.clearDataObject(
            req.body
        );
        const returnData = {
            error : false, 
            msg : "Se ha subido el APK correctamente"
        };
        //Buscar el proyecto que se está ejecutando...
        const test = await getTestAPK({
            query : [
                "idapk", 
                "token_apk", 
                "number_step"
            ], 
            type : "token_apk", 
            value : token_apk
        });
        if(!test) {
            returnData.error = true;
            returnData.msg = "No existe la prueba";
        } else {
            if(test.number_step !== 0) {
                returnData.error = true;
                returnData.msg = `La prueba ya se encuentra en el paso ${test.number_step}, 
                                  por lo que no es posible subir una nueva APK`;
            }
        }
        //Saber si hay archivos para subir...
        if(!returnData.error) {
            if (!req.files) {
                returnData.error = true;
                returnData.msg = "No hay archivos para subir";
            }
        }

        if(!returnData.error) {
            //Realizar el proceso de subida del archivo...
            //El nombre del archivo...
            const sampleFile = req.files.sampleFile;
            const name_apk = sampleFile.name;
            const parteNombre = name_apk.split(".");
            const extension = parteNombre[parteNombre.length - 1].toLowerCase();
            const token_file_apk = helpers.guid();
            const file_apk = `${token_file_apk}.${extension}`
            const uploadPath = `./apks/${test.idapk}/${file_apk}`;
            //Para mover/guardar el archivo...
            sampleFile.mv(uploadPath, async (err) => {
                //Actualizar la información de que se ha subido el archivo..
                if(!err) {
                    const updateInfoAPK = await updateDataAPK({
                        type : "update", 
                        update : {
                            name_apk, 
                            number_step : 1, 
                            file_apk 
                        }, 
                        where : {
                            idapk : test.idapk
                        }
                    });
                } else {
                    returnData.error = true;
                    returnData.msg = "No se ha podido subir el archivo";
                }
                returnData.test = test;
                returnData.name_apk = name_apk;
                resolve(
                    returnData
                );
            });
        } else {
            resolve(
                returnData
            );
        }
    });
};

//Para subir el archivo .feature de calabash...
const uploadFeature = (req) => {
    return new Promise(async (resolve, reject) => {
        const {
            token_apk_feature, 
            token_device
        } = helpers.clearDataObject(
            req.body
        );
        let returnData = {
            error : false, 
            msg : "Se ha subido el archivo correctamente"
        };
        //Saber si hay archivos para subir...
        if (!req.files) {
            returnData.error = true;
            returnData.msg = "No hay archivos para subir";
        }
        if(!returnData.error) {
            const test = await getTestAPK({
                query : ["idapk"], 
                type : "token_apk", 
                value : token_apk_feature
            });
            if(test) {
                //Inicioi...
                //Realizar el proceso de subida del archivo...
                //El nombre del archivo...
                const fileFeatures = req.files.fileFeatures;
                const name_features = fileFeatures.name;
                const parteNombre = name_features.split(".");
                const extension = parteNombre[parteNombre.length - 1].toLowerCase();
                const file_features = `${helpers.guid()}.${extension}`
                const uploadPath = `./apks/${test.idapk}/${file_features}`;
                //Para mover/guardar el archivo...
                fileFeatures.mv(uploadPath, async (err) => {
                    //Actualizar la información de que se ha subido el archivo..
                    if(!err) {
                        returnData = await configTestAPK({
                            type_test : "bdd", 
                            token_apk : token_apk_feature, 
                            token_device,
                            number_events : 0, 
                            features : {
                                name_features, 
                                file_features
                            }
                        });
                    } else {
                        returnData.error = true;
                        returnData.msg = "No se ha podido subir el archivo";
                    }
                    resolve(
                        returnData
                    );
                });
                //fin...
            } else {
                returnData.error = true;
                returnData.msg = "No existe la prueba";
                resolve(
                    returnData
                );
            }
        } else {
            resolve(
                returnData
            );
        }
    });
};

module.exports.updateDataAPK = updateDataAPK;
module.exports.getTestsAPK = getTestsAPK;
module.exports.getTestAPK = getTestAPK;
module.exports.configTestAPK = configTestAPK;
module.exports.uploadTestAPK = uploadTestAPK;
module.exports.uploadFeature = uploadFeature;
module.exports.updateLogAndFinishTest = updateLogAndFinishTest;

