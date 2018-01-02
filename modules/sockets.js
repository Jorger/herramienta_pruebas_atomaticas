"use strict";
const socketio = require('socket.io');
const apkController = require('../controllers/apkController');
const adbInput = require('./adbInput');
let io = {};

exports.startSocketServer = (app) => {
    io = socketio.listen(app, {
        log : false
    });
    io.on('connection', (socket) => {
        socket.on("connectUser", (data) => {
            const room = data.token_apk;
            socket.join(room);
        });
        socket.on('initTest', async (data) => {
            const { token_apk } = data;
            //Buscar la prueba...
            const test = await apkController.getTestAPK(
                {
                    query : [
                        "idapk", 
                        "token_apk", 
                        "type_test",
                        "name_test", 
                        "name_apk", 
                        "name_features",
                        "number_step", 
                        "file_apk", 
                        "file_features",
                        "iddevice", 
                        "commands", 
                        "number_events", 
                        "commands_monkey",
                        "seed_test"
                    ], 
                    type : "token_apk", 
                    value : token_apk
                }, 
                true
            );
            io.sockets.in(token_apk).emit(
                "terminal", 
                {
                    message : test ? `Iniciando prueba ${test.name_test}, 
                              sobre la APK ${test.name_apk} 
                              en el dispositivo ${test.device.name_device}` 
                              : "Error! No existe la prueba",
                    finish : false
                }
            );
            if(test) {
                const startTest = adbInput.testAPK(
                    {
                        test, 
                        socket : {
                            comandsTerminal
                        }
                    }
                );
            }
        });
    });		
};

const comandsTerminal = async (token_apk, message, finish = false, iddevice = 0, idapk = 0) => {
    //Actualizar el log en la base de datos...
    const updateData = await apkController.updateLogAndFinishTest(
        message, 
        finish, 
        iddevice, 
        idapk
    );
    io.sockets.in(token_apk).emit(
        "terminal", 
        {
            message, 
            finish
        }
    );
};

module.exports.comandsTerminal = comandsTerminal;
