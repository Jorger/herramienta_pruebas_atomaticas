"use strict";
const mysql = require('mysql');
const config = require('../config');
const striptags	=  require('striptags');
const sanitizer =  require('sanitizer');

let pool = mysql.createPool({
    connectionLimit : 100, 
    host : config.database.host,
    user : config.database.user,
    password : config.database.password,
    database : config.database.name,
    debug :  false
});

//Realiza la consulta...
const queryMysql = (sql, type = "multi") => {
    return new Promise((resolve, reject) => {
        pool.getConnection((err,connection) =>  {
            if (err) {
                console.log("Error in connection database");
                return;
            }
            connection.query(sql, (err, rows) =>  {
                connection.release();
                if(!err) {
                    resolve(type === "multi" ? rows : rows[0]);
                }
                else {
                    reject(err);
                }
            });
        });
    });
};

//Para actualizar/insertar data...
const upsertData = (param) => {
    return new Promise((resolve, reject) => {
        const objtUpdate  = Object.keys(param.update);
        let sqlUpdate = "";
        //Para los datos a actualizar...
        for (let update of objtUpdate) {
            if(sqlUpdate !== "") {
                sqlUpdate += ", ";
            }
            sqlUpdate += `${update} = ${striptags(sanitizer.escape(mysql.escape(param.update[update])))}`;
        }
        let sql = `${param.type === "save" ? "INSERT INTO" : "UPDATE"} ${param.table} SET ${sqlUpdate}`;
        if(param.type === "update") {
            let objtWhere = Object.keys(param.where);
            let sqlWhere = "";
            //Para la senetencia dle whrere...
            for (let where of objtWhere) {
                if(sqlWhere !== "") {
                    //Se tene que tener en cuenta si tabién se desea usar OR...
                    sqlWhere += " and ";
                }
                sqlWhere += ` ${where} = ${mysql.escape(striptags(sanitizer.escape(param.where[where])))}`;
            }
            sql += ` where ${sqlWhere}`;        
        }
        //Ejecutar la consulta...
        queryMysql(sql).then(value => {
            resolve(value);
        }, reason => {
            reject(reason);
        });
    });
};

//Para actualizar/crear información de un determinado controller...
const updateData = (data) => {
    return new Promise(async (resolve, reject) => {
        const updateData = await upsertData(data);
        resolve(updateData);
    });
};

//Para obtener el nombre de las coumnas de una tabla...
//Esto tiene como objetivo validar que los nombres de los campos enviados de una tabla, 
//existen en la tabla...
const nameColumsTable = (table) => {
    return new Promise((resolve, reject) => {
        const sql = `SHOW COLUMNS FROM ${striptags(sanitizer.escape(table))}`;
        queryMysql(sql).then(data => {
            resolve(data);
        }, reason => {
            reject(reason);
        });
    });
};

//Para validar que el nombre de las columnas enviadas en una consulta, existen en la tabla...
const validateNameColumns = (table, query, options = {sufix : "", skip : []}) => {
    return new Promise(async (resolve, reject) => {
        //Primero obtener los datos de ls columnas de una tabla para hacer la comparación...
        options.sufix = options.sufix || "";
        options.skip = options.skip || [];
        const columnsDB = await nameColumsTable(
            table
        );
        let sqlQuery = "";
        //Saber si se están pidiendo campos en específico...
        if(Array.isArray(query)) {
            //Dejar columnas únicas, es decir que no se tengan duplicados...
            query = [...new Set(query)];
            let numCorrectColumns = 0;
            for(let column of query) {
                let exist = false;
                for(let nameDB of columnsDB) {
                    if(column.toLowerCase() === nameDB.Field.toLowerCase()) {
                        numCorrectColumns++;
                        exist = true;
                        break;
                    }
                }
                //Para que no continue buscando si es que el campo no existe...
                if(!exist) {
                    break;
                }
            }
            if(numCorrectColumns === query.length) {
                for(let option of query){
                    //Se debe validar si hay registros que se envíen que se deban restringir en el resultado de la query...
                    let skipOption = false;
                    if(options.skip.length !== 0) {
                        for(let register of options.skip) {
                            if(option.toLowerCase() === register.toLowerCase()) {
                                skipOption = true;
                                break;
                            }
                        }
                    }
                    if(!skipOption) {
                        if(sqlQuery !== ""){
                            sqlQuery += ", ";
                        }
                        sqlQuery += (options.sufix !== "" ? `${options.sufix}.` : "") + striptags(sanitizer.escape(option.toLowerCase()));
                    }
                }
            }
        } else {
            const typeQuery = striptags(sanitizer.escape(query));
            if(typeQuery === "all") {
                sqlQuery = "*";
            }
        }
        //Se deja la query por defecto...
        if(sqlQuery === "") {
            sqlQuery = (options.sufix !== "" ? `${options.sufix}.` : "") + columnsDB[0].Field;
        }
        //Devolver la query "limpia"...
        resolve(
            sqlQuery
        );
    });
};

module.exports.upsertData = upsertData;
module.exports.updateData = updateData;
module.exports.queryMysql = queryMysql;
module.exports.validateNameColumns = validateNameColumns;