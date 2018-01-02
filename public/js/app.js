(function(window, document, $, undefined) {
    //Para los temas...
    window.servicesAPP = (function() {
        //Create a new element...
        var create = function(param, callback) {            
            utils.consumeServicios(param, function(data)
            {
                callback(data);
            });   
        };

        //Listar...
        var getAll = function(param, callback) {
            var page = param.page || 1, 
                max  = param.max || 5;        
            utils.consumeServicios({
                method  : "GET", 
                service : param.service,
                data    : page + "/" + max
            },
            function(data) {
                callback(data);
            });
        };

        //Traer un ítem...
        var getOne = function(param, callback) {
            utils.consumeServicios({
                method  : "GET", 
                service : param.service,
                data    : param.data,
            }, 
            function(data) {
                callback(data);            
            });
        };
        
        //Eliminar Item...
        var remove = function(param, callback) {
            utils.consumeServicios({
                method  : "DELETE", 
                service : param.service, 
                data    : param.data
            }, 
            function(data) {
                callback(data);            
            });
        };
        return {
            create  : create, 
            getAll  : getAll, 
            getOne  : getOne, 
            remove  : remove
        };
    })();
    if (typeof exports !== 'undefined'){
        for (var i in servicesAPP) {
            exports[i] = servicesAPP[i];
        }
    }
})(window, document, window.jQuery);
//Fin...

//Utilidades...
(function(window, document, $, undefined) {
    //Utilidades de la aplicación...
    window.utils = (function() {
        //Para consumir los servicios creados por AJAX...
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
                    window.location = data.urlResponse;
                } else {
                    callback(data);
                }
            }).error(function(request, status, error) {            
                sweetAlert("Error", request.responseText, "error");
            });
        };

        //Para crear un paginador...
        var paginator = function(param, accion) {
            var txt = "<ul class='pagination pagination-sm pagination_"+(param.id)+"'>";
            for(var i = 1; i <= param.total; i++) {
                var pag = "<li class = '"+(i === param.actual ? "active" : "")+"'>" + 
                          "<a href = 'javascript:;' " + 
                          "class = 'paginator paginate_"+(param.id)+"' data = '"+(i)+"' table='"+(param.id)+"'>"+(i)+"</a>";
                if(i === 1 || i === param.total) {
                    if(i === 1){
                        pag = "<li><a href='#' class = 'paginator paginate_"+(param.id)+"' data = 'prev' table='"+(param.id)+"'>&laquo;</a>" + pag;
                    } else {
                        pag += "<li><a href='#' class = 'paginator paginate_"+(param.id)+"' data = 'next' table='"+(param.id)+"'>&raquo;</a>";
                    }
                }
                txt += pag;
            }
            txt += "</ul>";            
            $("#" + param.id + "_paginator").html(txt);
            $(".paginate_" + param.id).click(function(event) {
                var idTable = $(this).attr("table");
                if($(this).attr("data") === "next" || $(this).attr("data") === "prev") {
                    var incremento = $(this).attr("data") === "next" ? 1 : -1;
                    if(param.actual + incremento >= 1 && param.actual + incremento <= param.total) {
                        param.actual += incremento;                     
                    }
                } else {
                    param.actual = Number($(this).attr("data"));
                }
                $(".pagination_"+(idTable)+" > li:eq("+(param.actual)+")").addClass('active');
                for(var i = 1; i < $(".pagination_"+(idTable)+" > li").size(); i++) {
                    $(".pagination_"+(idTable)+" > li:eq("+(i)+")")[(i === param.actual ? 'add' : 'remove') + 'Class']('active');
                }
                accion(param.actual);
            });
        };

        //Para el template de una tabla...
        var templateTable = function(param) {
            $("#" + param.id).empty();
            var txt = "<div class='panel panel-default'>" + 
                      "<div class='panel-heading'>"+(param.title)+"</div>" + 
                      "<div class='panel-body'>" + 
                      "<div class='table-responsive'>" + 
                      "<table class='table table-striped'>" +
                      "<thead>" + 
                      "<tr>";
            for(var i = 0; i < param.header.length; i++) {
                txt += "<th><center>"+(param.header[i])+"</center></th>";
            }
            txt += "</tr></thead><tbody id = "+(param.id + "_tbody")+"></tbody>" + 
                   "</table></div></div>" + 
                   "<div class = 'panel-footer'>" + 
                   "<div class='row'>" + 
                   "<div class='col-lg-12 text-center' id = '"+(param.id + "_paginator")+"'>" + 
                   "</div></div></div></div></div>";
            $("#" + param.id).html(txt);
        };        
        return {
            consumeServicios : consumeServicios, 
            paginator : paginator, 
            templateTable : templateTable
        };
    })();
    if (typeof exports !== 'undefined') {
        for (var i in utils) {
            exports[i] = utils[i];
        }
    }
})(window, document, window.jQuery);