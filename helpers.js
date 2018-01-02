"use strict";
const moment = require('moment-timezone');
const filessystem = require('fs');
const ip = require('ip');
const timezone = "America/Bogota";
const striptags	=  require('striptags');
const sanitizer =  require('sanitizer');

//Para crear Token's...
exports.guid = () => {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
};

//Función para limpiar los valores que vengan por un objeto...
exports.clearDataObject = (objecto) => {
    let newObject = {};
    for(let i in objecto) {
        newObject[i] = striptags(sanitizer.escape(objecto[i]));
    }
    return newObject;
};

//Para las fechas...
exports.dates = () => {
	return {
        current_date 	: moment(new Date()).tz(timezone).format("YYYY-MM-DD HH:mm:ss"),
        date_string 	: moment().tz(timezone).format("DD/MM/YYYY"),
        hour_string  	: moment().tz(timezone).format("hh:mm:ss a"), 
        unix    		: moment().tz(timezone).unix()
    };
};

//Para crear un directorio de la prueba...
exports.crearDirectorio = (dir) =>  {
	if (!filessystem.existsSync(dir)) {
		filessystem.mkdirSync(dir);
	}
};

//Saber si un valor es un número...
exports.isNumber = (n) => !isNaN(parseFloat(n)) && !isNaN(n - 0);
//Listado de comandos permitidos...
exports.commandsADB = (command) => ["tap", "text", "swipe", "keyevent"].includes(command);
//Listado de comandos válidos para el modo Monkey...
exports.commandsMonkey = (command) => ["keyevents","motion","navigation","touch","trackball"].includes(command);
//Para obtener la ip en donde se realiza la acción...
exports.getIP = () => ip.address();
module.exports.timezone = timezone;