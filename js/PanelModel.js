var Constants = {
    XML_PANEL: '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap=\"http:\/\/www.w3.org/2001/12/soap-envelope\"><soap:Body><GetPanelResponse xmlns=\"http:\/\/Schneider-Electric.com\/EcoBusiness\/G4\"></GetPanelResponse></soap:Body></soap:Envelope>'
};

function getXMLData(url, soap) {
    var getUrl =  url + '/js_sample/xml/GetPanelResponse.xml';
    var jqAjaxData = $.ajax({
        type: 'GET',
        url: getUrl,
        cache: false,
        contentType: 'text/xml',
        dataType: 'xml',
        processData: true,
        data: soap
    });
    return jqAjaxData;
}

function xmlToJson(xml) {
    // Create the return object
    var obj = {};

    if (xml.nodeType == 1) { // element
        // do attributes
        if (xml.attributes.length > 0) {
            obj["@attributes"] = {};
            for (var j = 0; j < xml.attributes.length; j++) {
                var attribute = xml.attributes.item(j);
                obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
            }
        }
    } else if (xml.nodeType == 3) { // text
        obj = xml.nodeValue;
    }

    // do children
    if (xml.hasChildNodes()) {
        for(var i = 0; i < xml.childNodes.length; i++) {
            var item = xml.childNodes.item(i);
            var nodeName = item.nodeName;
            if (typeof(obj[nodeName]) == "undefined") {
                obj[nodeName] = xmlToJson(item);
            } else {
                if (typeof(obj[nodeName].push) == "undefined") {
                    var old = obj[nodeName];
                    obj[nodeName] = [];
                    obj[nodeName].push(old);
                }
                obj[nodeName].push(xmlToJson(item));
            }
        }
    }
    return obj;
}


function PanelModel(panels) {
    var pm = this;
    pm._panel = panels;
}

PanelModel.prototype = {
    getPanel : function() {
        var pm = this;
        return pm._panel;
    }
};


function PanelView(model) {
    var pm = this;
    pm._model = model;

}

PanelView.prototype = {
    show : function(jsonData, panelID) {
        var pm = this;
        pm.buildPanel(jsonData, panelID);
    },
    buildPanel : function(jsonData, panelID) {
        var panel = jsonData.GetPanelResponse.panel[panelID];
        var leftJson, rightJson, breakerSequence, titleNametag;
        var leftBrkrs = [];
        var rightBrkrs = [];

        if (panel !== undefined) {
            //for (var i=0 ; i < panel.busses.bus.length - 1; ) {
            var i = 0;
            leftJson = panel.busses.bus[i].breakers.breaker;
            rightJson = panel.busses.bus[i + 1].breakers.breaker;
            breakerSequence = parseInt(panel.brkrseqnumber['#text']);
            console.log(leftJson);

            for (var j = 0; j < leftJson.length; j++) {
                leftBrkrs.push('<tr><td class="column_width_20">' + leftJson[j].id['#text'] + '</td>' +
                    '<td class="column_width_50">' + leftJson[j].nametag['#text'] + '</td>' +
                    '<td class="column_width_30">' + leftJson[j].state['#text'] + '</td></tr>')
            }
            $('#panel_left').html('<div class="table-responsive"><table class="table table-striped"><thead><tr><th>ID</th><th>Breaker Name</th><th>Status</th></tr></thead><tbody>' + leftBrkrs.join("") + '</tbody></table></div>');

            for (j = 0; j < leftJson.length; j++) {
                rightBrkrs.push('<tr><td class="column_width_20">' + rightJson[j].id['#text'] + '</td>' +
                    '<td class="column_width_50">' + rightJson[j].nametag['#text'] + '</td>' +
                    '<td class="column_width_30">' + rightJson[j].state['#text'] + '</td></tr>')
            }
            $('#panel_right').html('<div class="table-responsive"><table class="table table-striped"><thead><tr><th>ID</th><th>Breaker Name</th><th>Status</th></tr></thead><tbody>' + rightBrkrs.join("") + '</tbody></table></div>');

            titleNametag = $.trim(panel.nametag["#text"]);
            if (titleNametag === '') {
                $('#title h1').html("Panel " + panel.id["#text"]);
            }
            else {
                $('#title h1').html("Panel " + panel.id["#text"] + ": " + titleNametag);
            }
            //}
            $("#panels_typical").show();
        }
    }
};

function PanelController(model, view) {
    var pm = this;
    pm._model = model;
    pm._view = view;
}

PanelController.prototype = {
    getPanel : function() {
        var pm = this;
        return pm._model.getPanel();
    }
};


(function () {
    if (typeof numID == 'undefined') {
        numID = 1;
    }

    var url = window.location.protocol + "//" + window.location.host;


    var jqAjaxData = getXMLData(url, Constants.XML_PANEL);

    //hideIDs(["#controllerdiagnostics", "#inputs", "#inputssummary", "#paneldiagnostics", "#publishers", "#publisherssummary", "#remotes", "#remotessummary", "#schedule", "#schedulessummary", "#specdayssummary", "#specialday", "#terminal", "#terminalssummary", "#zones", "#zonessummary", "#subscribers"]);
    //get a panel by ID number
    jqAjaxData.done(function (data) {
        var model = new PanelModel(data);
        var view = new PanelView(model);
        var controller = new PanelController(model, view);

        xmlData = controller.getPanel();
        jsonData = xmlToJson(xmlData);
        console.log(jsonData);

        view.show(jsonData, 0);
    });
})();

