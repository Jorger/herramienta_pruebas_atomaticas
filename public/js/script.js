$(function(){
    var TOKEN_APK = $("#token_apk").val();
    var ID_APK = $("#idapk").val();
    var nextStep = false;
    var numberStep = 1;
    var numTabSelected = 1;

    //Para las pestañas de la selección de eventos...
    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        numTabSelected = $(e.target).attr('href') === "#adbinput" ? 1 : 
                         $(e.target).attr('href') === "#monkeytest" ? 2 : 3;
    });

    //Para las acciones de los slider's..
    var nameCommandsSliders = [
        "Touch", 
        "Motion", 
        "Trackball", 
        "Navigation", 
        "KeyEvents"
    ];
    for(var i = 0; i < nameCommandsSliders.length; i++) {
        $("#monkey" + nameCommandsSliders[i]).change(function(e){
            $("#labelmonkey" + nameCommandsSliders[+$(this).attr("key") - 1]).val(
                $(this).val() + "%"
            );
        });
        $("#labelmonkey" + nameCommandsSliders[i]).val("0%");
    }

    //Para la temrinal...
    var t1 = new Terminal();
    t1.setHeight("400px");
    t1.setWidth('100%');
    $("#terminal").append(t1.html);
    
    //Para establecer el Socket...
    var currentLocation = window.location;
    var serverBaseUrl = "//" + currentLocation.hostname + ":" + currentLocation.port;
    var socket = io();
    //Para conectar con el Socket...
    socket.on('connect', function () {
        socket.emit('connectUser', {
            token_apk : TOKEN_APK
        });
    });

    //Recibe los comandos realizados...
    socket.on('terminal', function (data) {
        t1.print(data.message);
        $('.Terminal').scrollTop($('.Terminal')[0].scrollHeight);
        if(data.finish) {
            numberStep = 4;
            nextStep = true;
            swal({
                title: "Proceso realizado",
                text: "La ejecución ha terminado", 
                type : "success"
            });
            $("#videotest > source").attr("src", "/static/"+(ID_APK)+"/"+(TOKEN_APK)+".mp4");
            $("#videotest")[0].load();
        }
    });
    //Fin de la terminal...

    //Configuración de los Steps...
    $('#smartwizard').smartWizard({ 
        selected: 0, 
        theme: 'dots',
        transitionEffect:'fade',
        showStepURLhash: true
    });
    $(".sw-btn-prev").hide();
    $(".sw-btn-next").html("Siguiente");
    $("#smartwizard").on("leaveStep", function(e, anchorObject, stepNumber, stepDirection) {
        //El paso de configuración de las opciones...
        if(numberStep === 2) {
            $("#configTest").submit();
        }
        return stepDirection === "backward" ? false : nextStep;
    });

    //Para subir el apk...
    $("#upvideo").click(function() {
        $("#upload").trigger("click");
    });
    

    $('#upload').change(function () {
		var val = $(this).val().toLowerCase();
		var regex = new RegExp("(.*?)\.(apk)$");
		if(!(regex.test(val))) {
            $(this).val('');
            swal({
                title: "Error",
                text: "El tipo de archivo no es válido", 
                type : "error"
            });
		} else {
            $("#uploadForm").submit();
		}
    });

    $('#uploadForm').submit(function(event) {
        event.preventDefault();
        event.stopPropagation();
        if($("#upload").val() === "") {
            swal({
                title: "Error",
                text: "Por favor selecciona la APK", 
                type : "error"
            });
        } else {
            $("#uploadForm").hide("fast");
            $("#progreso").show("fast");
            $("#progress").width("0%").html("0%");
            $.ajax( {
                url: $(this).attr('action'),
                type: 'POST',
                data: new FormData( this ),
                processData: false,
                contentType: false, 
                xhr: function() {
                    var xhr = $.ajaxSettings.xhr();
                    if (xhr.upload) {
                        xhr.upload.addEventListener('progress', function(event)  {
                            var percent = 0;
                            var position = event.loaded || event.position;
                            var total = event.total;
                            if (event.lengthComputable) {
                                percent = Math.ceil(position / total * 100);
                            }
                            $("#progress").width(percent + "%").html( + percent + "%");
                        }, true);
                    }
                    return xhr;
                }
            }).done(function( data ) {
                swal({
                    title: !data.error ? "Proceso realizado" : "Error",
                    text: data.msg, 
                    type : !data.error ? "success" : "error"
                });
                if(data.error) {
                    $("#uploadForm").show("fast");
                    $("#progreso").hide("fast");
                }
                else {
                    $("#progreso").hide("fast");
                    nextStep = true;
                    $('#smartwizard').smartWizard("next");
                    //Traer el listado de dispositivos disponibles...
                    getDevices();
                }
            });
        }
        return false;
    });
    //Fin de subir la APK...

    //Paso dos, configuración de la prueba...
    //Traer el listado de dispositivos disponibles...
    var getDevices = function() {
        numberStep = 2;
        nextStep = false; //Bloquea al siguiente paso...
        consumeServicios({
            method : "GET", 
            service : "devices"
        }, function(data) {
            if(!data.error) {
                var $dropdown = $("#device");
                $dropdown.empty();
                $.each(data.listDevices, function() {
                    $dropdown.append(
                        $("<option />").val(
                            this.database.token_device
                        ).text(
                            this.info.name
                        )
                    );
                });
                $dropdown.attr("disabled", false);
                //Establecer el valor por defecto...
                $("#token_device").val($dropdown.val());
                $dropdown.change(function(e){
                    $("#token_device").val(
                        $(this).val()
                    );
                });
            } else {
                swal({
                    title: "Error",
                    text: data.msg, 
                    type : "error"
                });
            }
        });
    };

    //Para el proceso de aceptar la configuración seleccionada...
    $('#configTest').submit(function(event) {
        event.preventDefault();
        event.stopPropagation();
        var procesa = true;
        //Se debe validar que los campos estén completamente seleccionados...
        var dataTest = {
            type_test : numTabSelected === 1 ? "adbinput" : "monkey",
            token_apk : TOKEN_APK, 
            token_device : $("#device").val(), 
            number_events : $("#number_events").val(), 
            events : {}
        };
        if(numTabSelected === 1) {
            dataTest.events.tap = $("#tap").val();
            dataTest.events.text = $("#text").val();
            dataTest.events.swipe = $("#swipe").val();
            dataTest.events.keyevent = $("#keyevent").val();
            if(dataTest.token_device === "0") {
                swal({
                    title: "Error",
                    text: "Por favor selecciona el dispositivo para la prueba", 
                    type : "error"
                });
                procesa = false;
            }
            if(procesa) {
                if (isNumber(dataTest.number_events)) {
                    if(+dataTest.number_events <= 0) {
                        swal({
                            title: "Error",
                            text: "El número no puede ser cero o negativo", 
                            type : "error"
                        });
                        procesa = false;    
                    }
                } else {
                    swal({
                        title: "Error",
                        text: "El número no es válido", 
                        type : "error"
                    });
                    procesa = false;
                }
            }
            if(procesa) {
                //Saber si se ha elegido al menos un comando...
                var numComands = 0;
                var propierties = Object.keys(dataTest.events);
                for(var i = 0; i < propierties.length; i++) {
                    numComands += +dataTest.events[propierties[i]] ? 1 : 0;
                }
                if(numComands === 0) {
                    swal({
                        title: "Error",
                        text: "Al menos debes seleccionar un evento para ejecutar la prueba", 
                        type : "error"
                    });
                    procesa = false;
                }
            }
        } else {
            //Para el valor de la semilla...
            dataTest.seed = $("#seed").val();
            if (isNumber(dataTest.seed)) {
                if(+dataTest.seed <= 0) {
                    swal({
                        title: "Error",
                        text: "El número de la semilla no puede ser cero o negativo", 
                        type : "error"
                    });
                    procesa = false;    
                }
            } else {
                swal({
                    title: "Error",
                    text: "El número no es válido", 
                    type : "error"
                });
                procesa = false;
            }
            if(procesa) {
                var sumEvents = 0;
                for(var i = 0; i < nameCommandsSliders.length; i++) {
                    sumEvents += +$("#monkey" + nameCommandsSliders[i]).val();
                    dataTest.events[nameCommandsSliders[i].toLowerCase()] = +$("#monkey" + nameCommandsSliders[i]).val();
                }
                if(sumEvents > 100) {
                    swal({
                        title: "Error " + sumEvents + "%",
                        text: "El porcentaje total de los eventos no puede ser mayor a 100%", 
                        type : "error"
                    });
                    procesa = false;
                }
            }
        }
        if(procesa) {
            consumeServicios({
                method : "POST", 
                service : $(this).attr('action'), 
                data : dataTest
            }, function(data) {
                if(!data.error) {
                    numberStep = 3;
                    nextStep = true;
                    $('#smartwizard').smartWizard("next");
                    socket.emit('initTest', {
                        token_apk : TOKEN_APK
                    });
                    nextStep = false;
                } else {
                    swal({
                        title: "Error",
                        text: data.msg, 
                        type : "error"
                    });
                }
            });
        }
        return false;
    });

    //Para subir el archivo .feature de la prueba de calabash...
    //Para subir el apk...
    $("#uploadFeature").click(function() {
        $("#btnUploadFeature").trigger("click");
    });
    
    $('#btnUploadFeature').change(function () {
		var val = $(this).val().toLowerCase();
		var regex = new RegExp("(.*?)\.(feature)$");
		if(!(regex.test(val))) {
            $(this).val('');
            swal({
                title: "Error",
                text: "El tipo de archivo no es válido", 
                type : "error"
            });
		} else {
            $("#formFeature").submit();
		}
    });

    //Para subir el archivo .features de BDD...
    $('#formFeature').submit(function(event) {
        event.preventDefault();
        event.stopPropagation();
        if($("#btnUploadFeature").val() === "") {
            swal({
                title: "Error",
                text: "Por favor selecciona la APK", 
                type : "error"
            });
        } else {
            $("#divbtnFeature").hide("fast");
            $("#progresoFeature").show("fast");
            $("#progressFeature").width("0%").html("0%");
            $.ajax( {
                url: $(this).attr('action'),
                type: 'POST',
                data: new FormData( this ),
                processData: false,
                contentType: false, 
                xhr: function() {
                    var xhr = $.ajaxSettings.xhr();
                    if (xhr.upload) {
                        xhr.upload.addEventListener('progress', function(event)  {
                            var percent = 0;
                            var position = event.loaded || event.position;
                            var total = event.total;
                            if (event.lengthComputable) {
                                percent = Math.ceil(position / total * 100);
                            }
                            $("#progressFeature").width(percent + "%").html( + percent + "%");
                        }, true);
                    }
                    return xhr;
                }
            }).done(function( data ) {
                swal({
                    title: !data.error ? "Proceso realizado" : "Error",
                    text: data.msg, 
                    type : !data.error ? "success" : "error"
                });
                if(data.error) {
                    $("#divbtnFeature").show("fast");
                    $("#progresoFeature").hide("fast");
                }
                else {
                    $("#progresoFeature").hide("fast");
                    numberStep = 3;
                    nextStep = true;
                    $('#smartwizard').smartWizard("next");
                    socket.emit('initTest', {
                        token_apk : TOKEN_APK
                    });
                    nextStep = false;
                }
            });
        }
        return false;
    });
    //Fin de subir la APK...
    

    //Para ejecutar servicios al Backend...
    var consumeServicios = function(param, callback) {
        if(param.data) {
            if(param.method === "GET" || param.method === "DELETE") {
                param.service += "/" + param.data;
            }
        }            
        $.ajax({
            url         : "/" + param.service,
            type        : param.method,
            data        : param.method === "POST" || param.method === "PUT" ? JSON.stringify(param.data) : "",
            dataType    : "json",
            contentType: "application/json; charset=utf-8"
        }).done(function(data) {
            if(data.errorAuth) {
                location.reload();
            } else {
                callback(data);
            }
        }).error(function(request, status, error) {            
            sweetAlert("Error", request.responseText, "error");
        });
    };

    //Para saber si un valor es un número...
    function isNumber(n) {
        return !isNaN(parseFloat(n)) && !isNaN(n - 0);
    }

    //Saber en que pestaña del proceso está...
    numberStep = +window.location.hash.split("-")[1];
    if(numberStep === 2) {
        getDevices();
    }
});