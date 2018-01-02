const result = require('await-result');
const adb = require('./adb');

//Para llevar la información de un dispostivo...
const getInfoDevice = (device) => {
    return new Promise(async (resolve, reject) => {
        const [ error, infoDevice ] = await result(
            adb.processADB(
                `-s ${device} shell getprop | grep API`
            )
        );
        if(!error) {
            const serializeInfo = infoDevice.split("]:")[1].replace(/(\r\n|\n|\r)/gm,"").trim().replace("[", "").replace("]", "");
            const getDimensions = serializeInfo.split("-");
            resolve({
                name : serializeInfo, 
                dimensions: getDimensions[getDimensions.length - 1]
            })
        } else {
            reject(
                error
            );
        }
    });
};

//Retorna un array de los emuladores conectados...
exports.connectedDevices = () => {
    return new Promise(async (resolve, reject) => {
        const [ err, devices ] = await result(
            adb.processADB(
                "devices"
            )
        );
        //Guarda el listado de dispositivos conectados disponibles...
        const availableDevices = [];
        if(!err) {
            const partDevices = devices.split("\n");
            for(let i = 1; i < partDevices.length; i++) {
                if(partDevices[i] !== "") {
                    availableDevices.push({
                        id : partDevices[i].split("\t")[0], 
                        info : await getInfoDevice(partDevices[i].split("\t")[0])
                    });
                }
            }
        }
        resolve(
            availableDevices
        );
    });
};

module.exports.getInfoDevice = getInfoDevice;