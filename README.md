# Herramienta Pruebas automáticas

* Blog Medium: 
* Vídeo Ejecución: https://youtu.be/twBw1U78doY

![image](https://github.com/Jorger/herramienta_pruebas_atomaticas/blob/master/image.jpg?raw=true)

La herramienta realiza tres tipos de técnicas para pruebas automáticas de aplicaciones móviles Android, como son:

**ADB Input:** El Android Debugging Bridge (adb) permite lanzar eventos de interacción sobre los dispositivos Android desde el terminal, eventos como:

* TAP
* TEXT
* SWIPE
* Keyevent

**Monkey Testing:** Haciendo uso del comando entregado por ADB se hace la ejecución de modo Monkey testing, teniendo opciones como establecimiento de la semilla y establecer el porcentaje de ejecución de evento como:

* Touch.
* Motion.
* Trackball.
* Navigation.
* KeyEvents

**Behavior Driven Development (Calabash):** Haciendo uso del lenguaje común como es Gherkin, se hace este tipo de pruebas, en este caso se solicita el archivo .features que contiene los pasos a seguir.

## Instalación.

### Base de datos.

Antes de la instalación, es necesario la configuración de la base de datos, en el archivo [database.sql], se encuentra el script con las sentencias SQL necesarias para la creación de la base de datos.

### Configuración variables de entorno.

Es necesario la creación del archivo ```.env.config``` en la raíz del proyecto, que contenga los valores correspondiente a las variables de entorno, que son consumidad en el archivo [config.js]

```
DATABASE_HOST=
DATABASE_USER=
DATABASE_PASSWORD=
ADB_DIRECTORY=adb
AAPT_DIRECTORY=
APK_DIRECTORY=
```

***Si se tiene configurado adb de forma global no es necesario establecer la ruta completa, igualmente para el comando aapt***

### Instalación de paquetes.

Estando en el directorio del proyecto ejecutar el comando:

```
npm install
```

### Ejecución

```
npm start
```

## Consideraciones.

* Para realizar las pruebas en diferentes dispositivos se ha hecho uso de [Genymotion], el cual permite la ejecución de varios emuladores con diferentes versiones de Android.
* Para la ejecución de las pruebas de tipo BDD es necesario que se encuentre instalado la gema [calabash-android]
* Es necesario calcular las posiciones de los emuladores para la catptura de pantalla de la prueba, en la tabla [adb_devices] en los campos ```position_window``` y ```dimension_window```

***Ejemplo dimensiones***

```
position_window=0x290 -> Siendo 0 el valor en X, 290 el valor en Y
dimension_window=455x735 -> Siendo 455 el ancho y 735 el alto.
```

### Autor
* Jorge Rubaino [@ostjh]

License
----
MIT

[@ostjh]:https://twitter.com/ostjh
[database.sql]:https://github.com/Jorger/herramienta_pruebas_atomaticas/blob/master/database.sql
[config.js]:https://github.com/Jorger/herramienta_pruebas_atomaticas/blob/master/config.js
[calabash-android]:https://github.com/calabash/calabash-android
[Genymotion]:https://www.genymotion.com/
[adb_devices]:https://github.com/Jorger/herramienta_pruebas_atomaticas/blob/master/database.sql#L28
