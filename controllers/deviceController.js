"use strict";
const db = require('../modules/database');
const mysql = require('mysql');
const helpers = require('../helpers');
const striptags	= require('striptags');
const sanitizer = require('sanitizer'); 
const moment = require('moment-timezone');
//Para conectar y traer el listado de dispositivos...
const devices = require('../modules/device');

//Para actualizar información de los dispositivos...
const updateDataDevice = (data) => {
    return new Promise(async (resolve, reject) => {
        const {
            type, 
            update
        } = data;
        let upsertData = {
            table : "adb_devices", 
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

//Retorna el tipo de dispositivo...
const getDevice = (param) => {
    return new Promise(async (resolve, reject) => {
        const sqlQuery = await db.validateNameColumns(
            "adb_devices", 
            param.query
        );
        const sql = `select ${sqlQuery} from adb_devices 
                     where ${param.type} = ${mysql.escape(striptags(sanitizer.escape(param.value)))} and 
                           is_active = 1`;
        db.queryMysql(sql, "single").then(device => {
            resolve(
                device
            );
        });
    });
};

//Revisa si un dispositivo existe, si no es así lo creará...
const upsertDevice = (data) => {
    return new Promise(async (resolve, reject) => {
        let device = await getDevice({
            query : [
                "iddevice", 
                "token_device"
            ], 
            type : "id_device", 
            value : data.id
        });
        if(!device) {
            device = await newDevice({
                name_device : data.info.name, 
                id_device : data.id, 
                dimensions_device : data.info.dimensions
            });
        }
        resolve(
            device
        );
    });
};

//Crear un nuevo dispositivo...
const newDevice = (data) => {
    return new Promise(async (resolve, reject) => {
        const {
            name_device,
            id_device, 
            dimensions_device
        } = helpers.clearDataObject(
            data
        );
        const dates = helpers.dates();
        const token_device = helpers.guid();
        const saveDevice = await updateDataDevice({
            type : "save",
            update : {
                token_device,
                name_device, 
                id_device, 
                dimensions_device, 
                creation_date : dates.current_date,
                creation_date_string : dates.date_string,
                creation_date_unix : dates.unix,
                hour_string : dates.hour_string, 
                ipcomputer : helpers.getIP()
            }
        });
        resolve({
            iddevice : saveDevice.insertId, 
            token_device
        });
    });
};

//LLevar los dispositivos que están disponibles...
exports.availableDevices = () => {
    return new Promise(async (resolve, reject) => {
        const returnData = {
            error : false, 
            msg : "Listado de dispositivos disponibles"
        };
        const listDevices = await devices.connectedDevices();
        if(listDevices.length !== 0) {
            //Buscar si los dispositivos, ya exitían, si no es así, se deberán crear...
            for(let i = 0; i < listDevices.length; i++) {
                listDevices[i].database = await upsertDevice(
                    listDevices[i]
                );
            }
            returnData.listDevices = listDevices;
        } else {
            returnData.error = true;
            returnData.msg = "No existen dispositivos disponibles";
        }
        resolve(
            returnData
        );
    });
};

module.exports.getDevice = getDevice;
module.exports.updateDataDevice = updateDataDevice;