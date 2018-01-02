$(function(){
    var MAX_PAGE = 20;
    var ID_DIV = "tableTest";
    var ACTUAL_PAGE	= 1;

    var printTable = function(data) {
        var nameStates = [
            "Selección dispositivo", 
            "Ejecución de la prueba"
        ];
        var inicio = ((ACTUAL_PAGE - 1) * MAX_PAGE) + 1;
        $("#"+(ID_DIV)+"_tbody").empty();
		for(var i = 0; i < data.length; i++) {
            var typeColor = data[i].type_test === "adbinput" ? "primary" : 
                            data[i].type_test === "monkey" ? "danger" : "success";
            var typeTest = data[i].type_test === "adbinput" ? "ADB Input" : 
                           data[i].type_test === "monkey" ? "Monkey Testing" : "BDD";
            var nombre 	= "<b><a href='/test/"+(data[i].token_apk)+"#step-4'>" + data[i].name_test + "</a></b> " + 
                          "<span class = 'label label-pill label-"+(typeColor)+"'>"+(typeTest)+"</span><br>" + 
                          "<small><b>APK: </b>"+(data[i].name_apk)+"</small><br>" + 
                          "<small><b>Creado:</b> "+(data[i].creation_date_string + "- " + data[i].hour_string)+"</small><br>";
			var txt = "<tr>" + 
				  "<td><center><b>" + (inicio) + "</b></center></td>" + 
                  "<td>"+(nombre)+"</td>" + 
                  "<td><center>"+(+data[i].end_test ? "SI" : "NO")+"</center></td>" + 
                  "<td><center>"+(data[i].number_events)+"</center></td>" + 
                  "<td>"+(data[i].name_device)+"</td>" + 
                  "<td>"+(+data[i].end_test ? "Terminada" : nameStates[data[i].number_step - 1])+"</td>" + 
				  "<td><center><button type='button' class='btn btn-danger btnRemove' token='"+(data[i].token_apk)+"'>Eliminar</button></center></td></tr>";
            $("#"+(ID_DIV)+"_tbody").append(txt);
            inicio++;
        }
        //Poner el evento del botón de sacar el usuario dle rol...
        $(".btnRemove").click(function(e) {
            var token_apk = $(this).attr("token");
            swal({
                title: "¿Estás Segur@?", 
                text: "¿Deseas eiminar la prueba seleccioanda?",
                type: "info", 
                showCancelButton: true, 
                confirmButtonColor: "#DD6B55", 
                confirmButtonText: "Si, lo deseo", 
                cancelButtonText: "No, cancelar", 
                closeOnConfirm: false, 
                closeOnCancel: false, 
                showLoaderOnConfirm : true
            }, 
            function(isConfirm) {
                if(isConfirm){
                    utils.consumeServicios({
                        method  : "DELETE", 
                        service : "testdelete", 
                        data : token_apk,
                    }, function(response) {
                        swal({
                            title: !response.error ? "Proceso realizado" : "Error",
                            text: response.msg, 
                            type : !response.error ? "success" : "error"
                        });
                        getData({
                            firstCharge : true
                        });
                    });
                }
                else {
                    swal({
                        title: "Cancelar", 
                        text: "Se ha cancelado la acción", 
                        timer: 2000, 
                        type : "error"
                    });                         
                }
            });
            
        });
	};
    
    //Para taer al información...
    var getData = (function getData(param) {
        page = param.page || 1;
        firstCharge = param.firstCharge || false;
        if(firstCharge) {
            $("#" + ID_DIV).html("<div align = 'center'><img src='/img/loader.gif' border = '0'/></div>");
        }
        var data = {
            query : [
                "token_apk",
                "name_test",
                "type_test", 
                "name_apk", 
                "number_step", 
                "file_apk", 
                "iddevice", 
                "number_events", 
                "end_test", 
                "date_end_test_string", 
                "date_end_hour_string", 
                "creation_date_string", 
                "hour_string"
            ],
            paginate : {
                pagina : true, 
                max : MAX_PAGE, 
                page : page
            }
        }
        utils.consumeServicios({
            method  : "POST", 
            service : "test/listtest", 
            data    :  data
        }, function(data) {
            if(!data.error) {
                if(Number(data.total.numero) !== 0) {
                    if(firstCharge) {
                        ACTUAL_PAGE = page;
                        utils.templateTable({
                            title   : "Listado de Pruebas", 
                            header  : ["#", "Prueba", "Terminado", "Ejecuciones", "Dispositivo", "Estado", "Eliminar"], 
                            id      : ID_DIV
                        });
                        utils.paginator({
                            total   : Math.ceil(Number(data.total.numero) / MAX_PAGE), 
                            actual  : page, 
                            id      : ID_DIV
                        }, 
                        function(newPage) {
                            ACTUAL_PAGE = newPage;
                            getData({page : newPage});
                        });
                    }
                    printTable(
                        data.tests
                    );
                }
                else {
                    $("#" + ID_DIV).html("<div class = 'alert alert-info'><strong>No se han encontrado información en el momento</strong></div>");
                }
            }
            else {
                swal({
                    title: "Error",
                    text: "Error al realizar la petición", 
                    timer: 5000,
                    type : "error"
                });
            }
        });
        return getData;
    })({firstCharge : true});

    //Crear una nueva prueba...
    var newTestAPK = function() {
        swal({
            title: "Nuevo Test",
            text: "Escribe el nombre con el cual identificarás el Test",
            type: "input",
            showCancelButton: true,
            closeOnConfirm: false,
            animation: "slide-from-top",
            inputPlaceholder: "Nombre del Test", 
            showLoaderOnConfirm: true, 
            confirmButtonText : "Aceptar", 
            cancelButtonText : "Cancelar"
        }, function(inputValue){
            if (inputValue === false) return false;
            if (inputValue === "") {
                swal.showInputError("Escribe el nombre del Test");
                return false;
            }
            servicesAPP.create({
                method  : "POST", 
                service : "test/newtest", 
                data    : {
                    name_test : inputValue
                }
            },
            function(data){
                if(data.error) {
                    swal.showInputError(data.msg);
                } else {
                    swal({
                        title: !data.error ? "Proceso realizado" : "Error",
                        text: data.msg, 
                        type : !data.error ? "success" : "error"
                    });
                    window.location.href = "/test/" + data.token_apk;
                }
            });
        });
    };

    //Para crear una nueva prueba...
    $("#newTest").click(function(e){
        newTestAPK();
    });
});