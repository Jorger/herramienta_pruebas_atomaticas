const result = require('await-result');
const adb = require('./adb');
const bdd = require('./bdd');

const {
    ADB_DIRECTORY,
    AAPT_DIRECTORY,
    APK_DIRECTORY
} = require('../config').adb;
//Para la grabación de un vídeo...
const ScreenRecorder = require('screen-recorder').ScreenRecorder;
let sockets = {};

//Ejecutar la prueba en modo ADB Input...
const runTest = async (test) => {
    //Verifica si la app está en primer plano...
    if(test.front.supported) {
        if(test.totalExecutions % test.front.iterations === 0) {
            const [ errorFront, background ] = await result(
                appInFront(
                    test
                )
            );
            if(!errorFront) {
                if(background.isHide) {
                    if(background.supportsBackground) {
                        const openApp = await openApplication(
                            test
                        );
                    } else {
                        test.front.supported = false;
                    }
                }
            }
        }
    }
    //Para saber el comando que se ejecutará...
    const [xDevice, yDevice] =  test.device.dimensions_device.split("x");
    const commands = test.commands.split(",");
    const commandRun = commands[Math.floor(Math.random() * commands.length)];
    let commandADB = "";
    if(commandRun === "tap") {
        const x = Math.floor(Math.random() * Number(xDevice));
        const y = Math.floor(Math.random() * Number(yDevice));
        commandADB = `-s ${test.device.id_device} shell input tap ${x} ${y}`;
    } else if(commandRun === "text") {
        commandADB = `-s ${test.device.id_device} shell input text "${Math.random().toString(36).substr(2, Math.random() * (15 - 3) + 3)}"`;
    } else if(commandRun === "swipe") {
        //Primero saber la dirección...
        const coordinates = {
            start : {
                x : Math.floor(Math.random() * Number(xDevice)), 
                y : Math.floor(Math.random() * Number(yDevice))
            }, 
            end : {
                x : Math.floor(Math.random() * Number(xDevice)), 
                y : Math.floor(Math.random() * Number(yDevice))}
        };        
        commandADB = `-s ${test.device.id_device} shell input swipe ${coordinates.start.x} ${coordinates.start.y} ${coordinates.end.x} ${coordinates.end.y}`;
    } else if(commandRun === "keyevent"){
        const numberKey = Math.floor(Math.random() * 85) + 1;
        commandADB = `-s ${test.device.id_device} shell input keyevent ${numberKey !== 26 ? numberKey : 4}`;
    }
    const [ error, process ] = await result(
        adb.processADB(
            commandADB, 
            ADB_DIRECTORY, {
                viewTerminal : true, 
                room : test.token_apk, 
                idapk : test.idapk,
                contCommad : {
                    enabled : true, 
                    num : test.totalExecutions, 
                    total : test.number_events
                }
            }
        )
    );
    if(!error) {
        if(test.totalExecutions < test.number_events) {
            test.totalExecutions++;
            runTest(
                test
            );
        } else {
            const [ errorUnInstall, uninstall ] = await result(
                uninstallAPK(
                    test
                )
            );
            test.movie.stop();
            sockets.comandsTerminal(
                test.token_apk, 
                `Ejecución terminada...`, 
                true, 
                test.device.iddevice, 
                test.idapk
            );
        }
    } else {
        test.movie.stop();
        sockets.comandsTerminal(
            test.token_apk, 
            `Error durante la ejecución del comando ${commandRun}`, 
            true, 
            test.device.iddevice, 
            test.idapk
        );
    }
};

//Verifica que la APP esté en primer plano...
const appInFront = (test) => {
    return new Promise(async (resolve, reject) => {
        const [ error, process ] = await result(
            adb.processADB(
                `-s ${test.device.id_device} shell dumpsys window windows | grep -E 'mFocusedApp'| cut -d / -f 1 | cut -d " " -f 7`, 
                ADB_DIRECTORY, {
                    viewTerminal : true, 
                    room : test.token_apk, 
                    idapk : test.idapk   
                }
            )
        );
        if(!error) {
            const nameAppInFront = process.replace(/\s/g,'');
            //Quiere decir que si devuelve un valor de una aplicación que está en ejecución...
            const supportsBackground = nameAppInFront !== "";
            const isHide = nameAppInFront !== test.packageName; //apk !== apk1
            //configAPP.front.supported = nameAppInFront !== "";
            resolve({
                isHide,
                supportsBackground
            });
        } else {
            reject(
                error
            );
        }
    })
};

//Para abrir la aplicación...
const openApplication = (test) => {
    return new Promise(async (resolve, reject) => {
        const [ error, process ] = await result(
            adb.processADB(
                `-s ${test.device.id_device} shell monkey -p ${test.packageName} -c android.intent.category.LAUNCHER 1`, 
                ADB_DIRECTORY, {
                    viewTerminal : true, 
                    room : test.token_apk, 
                    idapk : test.idapk    
                }
            )
        );
        if(error) {
            reject(
                error
            );
        } else {
            resolve(
                process
            );
        }
    });
};

//Ejecutar la prueba en modo Monkey...
const runMonkey = async (test) => {
    const {
        token_apk,
        seed_test, 
        number_events, 
        packageName, 
        commands_monkey,
        device
    } = test;
    let sumEvents = 0;
    let stringCommand = "";
    if(commands_monkey !== "") {
        const commandsMonkey = commands_monkey.split(",");
        for(let valCommand of commandsMonkey) {
            let parValCommad = valCommand.split("=");
            if(Number(parValCommad[1]) !== 0) {
                sumEvents += Number(parValCommad[1]);
                if(stringCommand !== "") {
                    stringCommand += " ";
                }
                stringCommand += `--pct-${
                    parValCommad[0] === "navigation" ? "nav" : 
                    parValCommad[0] === "keyevents" ? "syskeys" : 
                    parValCommad[0]} ${parValCommad[1]}`;
            }
        }
        if(sumEvents !== 0) {
            const remaining = 100 - sumEvents;
            if(remaining > 0) {
                if(stringCommand !== "") {
                    stringCommand += " ";
                }
                stringCommand += `--pct-anyevent ${remaining}`;
            }
        }
    }
    //--ignore-crashes
    const [ error, process ] = await result(
        adb.processADB(
            `-s ${device.id_device} shell monkey -p ${packageName} -s ${seed_test} ${stringCommand} -v ${number_events}`, 
            ADB_DIRECTORY, {
                viewTerminal : true, 
                room : test.token_apk, 
                idapk : test.idapk
            }
        )
    );
    if(!error) {
        const [ errorUnInstall, uninstall ] = await result(
            uninstallAPK(
                test
            )
        );
        test.movie.stop();
        sockets.comandsTerminal(
            token_apk, 
            process, 
            true, 
            test.device.iddevice, 
            test.idapk
        );
    } else {
        test.movie.stop();
        sockets.comandsTerminal(
            token_apk, 
            JSON.stringify(error),
            true, 
            test.device.iddevice, 
            test.idapk
        );
    }
};

//Para desisntalar la aplicaición, una vez se ha terminado la prueba...
const uninstallAPK = (test) => {
    return new Promise(async (resolve, reject) => {
        const [ error, process ] = await result(
            adb.processADB(
                `-s ${test.device.id_device} uninstall ${test.packageName}`, 
                ADB_DIRECTORY, {
                    viewTerminal : true, 
                    room : test.token_apk, 
                    idapk : test.idapk    
                }
            )
        );
        if(error) {
            reject(
                error
            );
        } else {
            resolve(
                process
            );
        }
    });
};

//Inicia la prueba de la APK...
exports.testAPK = async (param) => {
    //Instalar la APK en el dispositivo...
    let test = param.test;
    sockets = param.socket;
    let errorProcess = false;
    if(test.type_test === "adbinput" || test.type_test === "monkey") {
        //Inicio...
        let [ errorInstall, installAPK ] = await result(
            adb.processADB(
                `-s ${test.device.id_device} install -r ${APK_DIRECTORY}/${test.idapk}/${test.file_apk}`, 
                ADB_DIRECTORY, {
                    viewTerminal : true, 
                    room : test.token_apk, 
                    idapk : test.idapk
                }
            )
        );
        if(!errorInstall) {
            sockets.comandsTerminal(
                test.token_apk, 
                `Se ha instalado la apk ${test.name_apk} en el dispositivo ${test.device.name_device}`
            );
            //Para obtener el nombre del paquete del archivo...
            let [ errorPackage, getPackage ] = await result(
                adb.processADB(
                    `d badging ${APK_DIRECTORY}/${test.idapk}/${test.file_apk} | grep 'pack'`, 
                    AAPT_DIRECTORY, {
                        viewTerminal : true, 
                        room : test.token_apk, 
                        idapk : test.idapk
                    }
                )
            );
            if(!errorPackage) {
                test.packageName = getPackage.substr(15, getPackage.length).split("'")[0];
                sockets.comandsTerminal(
                    test.token_apk, 
                    `El nombre del paquete es ${test.packageName}`
                );
            } else {
                errorProcess = true;
                sockets.comandsTerminal(
                    test.token_apk, 
                    `Error: No se ha podido obtener el nombre del paquete de la apk ${test.name_apk}`, 
                    true,
                    test.device.iddevice, 
                    test.idapk
                );
            }
        } else {
            errorProcess = true;
            sockets.comandsTerminal(
                test.token_apk, 
                `Error no se ha podido instalar la apk ${test.name_apk} en el dispositivo ${test.device.name_device}`, 
                true,
                test.device.iddevice, 
                test.idapk
            );
        }
        if(!errorProcess) {
            if(test.type_test === "adbinput") {
                const [ errorOpen, openApp ] = await result(
                    openApplication(
                        test
                    )
                );
                if(!errorOpen) {
                    test.movie = recordVideo(
                        test
                    );
                    test.movie.start();
                    test.totalExecutions = 0;
                    test.front = {
                        iterations : 10, 
                        supported : true
                    };
                    runTest(
                        test
                    );
                } else {
                    sockets.comandsTerminal(
                        test.token_apk, 
                        `Error no se ha podido abrir la apk ${test.name_apk} en el dispositivo ${test.device.name_device}`, 
                        true,
                        test.device.iddevice, 
                        test.idapk
                    );
                }
            } else {
                test.movie = recordVideo(
                    test
                );
                test.movie.start();
                runMonkey(
                    test
                );
            }
        }
        //Fin...
    } else {
        //Para iniciar la cinfiguración de la prueba BDD...
        const configBDD = await bdd.initBDD(
            test
        );
        if(!configBDD.error) {
            sockets.comandsTerminal(
                test.token_apk, 
                configBDD.msg
            );
            //Inicia la granbación de la prueba...
            test.movie = recordVideo(
                test
            );
            test.movie.start();
            //Ejecutar la prueba de bdd...
            const runBDDTest = await bdd.runBDD(
                test
            );
            test.movie.stop();
            sockets.comandsTerminal(
                test.token_apk, 
                runBDDTest, 
                true, 
                test.device.iddevice, 
                test.idapk
            );
        } else {
            sockets.comandsTerminal(
                test.token_apk, 
                configBDD.msg,
                true,
                test.device.iddevice, 
                test.idapk
            );
        }
    }
};

//Para iniciar la grabación de la prueba...
const recordVideo = (test) => {
    //Iniciar la grabación del vídeo...
    const devicePosition = test.device.position_window.split("x");
    const deviceDimension = test.device.dimension_window.split("x");
    const movie = new ScreenRecorder(`${APK_DIRECTORY}/${test.idapk}/${test.token_apk}.mp4`);
    movie.setCapturesMouseClicks(false);
    movie.setCropRect(
        devicePosition[0], 
        devicePosition[1], 
        deviceDimension[0],
        deviceDimension[1]
    );
    movie.setFrameRate(30);
    //movie.recordAudio(false);
    return movie;
};