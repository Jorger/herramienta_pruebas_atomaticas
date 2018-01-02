"use strict";
require('dotenv').config({
    path : '.env.config'
});
const config = {
    database : {
        host : process.env.DATABASE_HOST,
        user : process.env.DATABASE_USER,
        password : process.env.DATABASE_PASSWORD, 
        name : "adb_monkey_test"
    }, 
    adb : {
        ADB_DIRECTORY : process.env.ADB_DIRECTORY,
        AAPT_DIRECTORY : process.env.AAPT_DIRECTORY, 
        APK_DIRECTORY : process.env.APK_DIRECTORY
    }
};

module.exports = config;