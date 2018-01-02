# ************************************************************
# Sequel Pro SQL dump
# Versión 4541
#
# http://www.sequelpro.com/
# https://github.com/sequelpro/sequelpro
#
# Host: localhost (MySQL 5.6.35)
# Base de datos: adb_monkey_test
# Tiempo de Generación: 2017-12-11 22:58:09 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Volcado de tabla adb_devices
# ------------------------------------------------------------

DROP TABLE IF EXISTS `adb_devices`;

CREATE TABLE `adb_devices` (
  `iddevice` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `token_device` varchar(60) DEFAULT '0',
  `is_active` int(5) DEFAULT '1',
  `device_available` int(5) DEFAULT '1',
  `name_device` varchar(100) DEFAULT '0',
  `id_device` varchar(100) DEFAULT '0',
  `dimensions_device` varchar(100) DEFAULT '0',
  `position_window` varchar(50) DEFAULT '0',
  `dimension_window` varchar(50) DEFAULT '0',
  `creation_date` datetime DEFAULT NULL,
  `creation_date_string` varchar(20) DEFAULT '0',
  `creation_date_unix` int(11) DEFAULT '0',
  `hour_string` varchar(20) DEFAULT '0',
  `ipcomputer` varchar(20) DEFAULT '0',
  PRIMARY KEY (`iddevice`),
  KEY `token_device` (`token_device`),
  KEY `device_available` (`device_available`),
  KEY `id_device` (`id_device`),
  KEY `is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla adb_test_apk
# ------------------------------------------------------------

DROP TABLE IF EXISTS `adb_test_apk`;

CREATE TABLE `adb_test_apk` (
  `idapk` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `token_apk` varchar(60) DEFAULT '0',
  `is_active` int(5) DEFAULT '1',
  `name_test` varchar(100) DEFAULT '0',
  `type_test` varchar(50) DEFAULT 'adbinput',
  `name_apk` varchar(100) DEFAULT '0',
  `name_features` varchar(100) DEFAULT '0',
  `number_step` int(5) DEFAULT '0',
  `file_apk` varchar(200) DEFAULT '0',
  `file_features` varchar(200) DEFAULT '0',
  `txt_log` longtext NOT NULL,
  `package` varchar(100) DEFAULT '0',
  `iddevice` int(11) DEFAULT '0',
  `commands` varchar(100) DEFAULT '0',
  `commands_monkey` varchar(200) DEFAULT '0',
  `number_events` int(5) DEFAULT '0',
  `seed_test` int(5) DEFAULT '0',
  `end_test` int(5) DEFAULT '0',
  `date_end_test` datetime DEFAULT NULL,
  `date_end_test_unix` int(11) DEFAULT '0',
  `date_end_test_string` varchar(20) DEFAULT '0',
  `date_end_hour_string` varchar(20) DEFAULT '0',
  `creation_date` datetime DEFAULT NULL,
  `creation_date_string` varchar(20) DEFAULT '0',
  `creation_date_unix` int(11) DEFAULT '0',
  `hour_string` varchar(20) DEFAULT '0',
  `ipcomputer` varchar(20) DEFAULT '0',
  PRIMARY KEY (`idapk`),
  KEY `token_apk` (`token_apk`),
  KEY `package` (`package`),
  KEY `iddevice` (`iddevice`),
  KEY `is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;




/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
