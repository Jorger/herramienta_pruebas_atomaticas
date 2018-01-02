const express = require("express");
const router = express.Router();
//Los controladores...
const deviceController = require('./controllers/deviceController');
const apkController = require('./controllers/apkController');

//Para la vista del login...
router.get("/", (req, res) => {	
	res.render("index");
});

//Para crear una nueva prueba/test...
router.post('/test/newtest',
    async (req, res) => {
        return res.status(200).json(
            await apkController.newTestAPK(
                req.body
            )
        );
    }
);

//Para la vista de la prueba...
router.get(
    '/test/:token_apk', 
    async (req, res) => {
        //Buscar la prueba...
        const { 
            token_apk 
        } = req.params;
        const test = await apkController.getTestAPK({
            query : "all", 
            type : "token_apk", 
            value : token_apk
        });
        if(test) {
            res.render("test", {
                test
            });
        } else {
            res.redirect(`/`);
        }
    }
);

//Para crear una nueva prueba/test...
router.post('/test/upload',
    async (req, res) => {
        return res.status(200).json(
            await apkController.uploadTestAPK(
                req
            )
        );
    }
);

//Para subir el archivo .features de BDD...
router.post('/test/uploadfeature',
    async (req, res) => {
        return res.status(200).json(
            await apkController.uploadFeature(
                req
            )
        );
    }
);


//Para llevar el listado de dispositivos disponibles...
router.get(
    '/devices', 
    async (req, res) => {
        return res.status(200).json(
            await deviceController.availableDevices()
        );
    }
);

//Para guardas las opciones de ejecució  de la prueba...
router.post('/test/config',
    async (req, res) => {
        return res.status(200).json(
            await apkController.configTestAPK(
                req.body
            )
        );
    }
);

//Para listar los test que se han realizado...
router.post('/test/listtest',
    async (req, res) => {
        return res.status(200).json(
            await apkController.getTestsAPK(
                req.body
            )
        );
    }
);

//Para llevar el log de ejecución de la prueba...
router.get(
    '/testlog/:token_apk', 
    async (req, res) => {
        let logTest = "";
        let filename = "nofound.txt";
        const { 
            token_apk 
        } = req.params;
        const test = await apkController.getTestAPK({
            query : [
                "name_test", 
                "txt_log"
            ], 
            type : "token_apk", 
            value : token_apk
        });
        if(test) {
            logTest = test.txt_log;
            filename = `${test.name_test}.txt`;
        }
        res.setHeader('Content-disposition', `attachment; filename=${filename}`);
        res.setHeader('Content-type', 'text/plain');
        res.charset = 'UTF-8';
        res.write(logTest);
        res.end();        
    }
);

//Para eliminar una prueba...
router.delete(
    '/testdelete/:token_apk', 
    async (req, res) => {
        const returnData = {
            error : false, 
            msg : "Se ha eliminado la prueba"
        };
        //Buscar la prueba...
        const {
            token_apk 
        } = req.params;
        const test = await apkController.getTestAPK({
            query : [
                "idapk"
            ], 
            type : "token_apk", 
            value : token_apk
        });
        if(test) {
            const updateInfoAPK = await apkController.updateDataAPK({
                type : "update", 
                update : {
                    is_active : 0
                }, 
                where : {
                    idapk : test.idapk
                }
            });
            if(updateInfoAPK.affectedRows === 0) {
                returnData.error = true;
                returnData.msg = "No se ha podido actualizar el registro";
            }
        } else {
            returnData.error = true;
            returnData.msg = "La prueba no existe";
        }
        return res.status(200).json(
            returnData
        );
    }
);

module.exports = router;