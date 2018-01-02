const sockets = require('./sockets');
const exec = require('child-process-promise').exec;
const {
    ADB_DIRECTORY,
    AAPT_DIRECTORY,
} = require('../config').adb;


//Ejecuta acciones ADB shell..
exports.processADB = (command, typeAction = ADB_DIRECTORY, props = {}) => {
    return new Promise(async (resolve, reject) => {
        //Valores opcionales que pueden o no llegar...
        props.viewTerminal = props.viewTerminal || false;
        props.room = props.room || "";
        props.contCommad = props.contCommad || {enabled : false};
        props.finish = props.finish || false;
        props.iddevice = props.iddevice || 0;
        props.idapk = props.idapk || 0;
        try {
            const txtComand = (
                props.contCommad.enabled ? `Evento ${props.contCommad.num} de ${props.contCommad.total}: ` : ""
            ) + `${typeAction} ${command}`;
            if(props.viewTerminal) {
                sockets.comandsTerminal(
                    props.room, 
                    txtComand, 
                    props.finish, 
                    props.iddevice, 
                    props.idapk
                );
            }
            const ADB = await exec(
                `${typeAction} ${command}`
            );
            resolve(
                ADB.stdout
            );
        } catch (e) {
            reject(
                e
            );
        }
    });
};