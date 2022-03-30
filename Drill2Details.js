define(["qlik", "jquery", "./props"], function
    (qlik, $, props) {

    'use strict';
    var navBackUsed = false;
    var global = {
        enabledExtensions: {}
    };

    $.ajax({
        url: '../extensions/Drill2Details/Drill2Details.qext',
        dataType: 'json',
        async: false,  // wait for this call to finish.
        success: function (data) { global.qext = data; }
    });

    /// ************** MAIN CODE ************** 

    return {
        //template: template,
        initialProperties: {
            qHyperCubeDef: {
                qDimensions: [],
                qMeasures: [
                    { qDef: { qDef: "=GetCurrentSelections()" }, }
                ]
            },
            showTitles: false,
        },
        definition: {
            type: "items",
            component: "accordion",
            // https://help.qlik.com/en-US/sense-developer/February2020/Subsystems/Extensions/Content/Sense_Extensions/extensions-add-custom-properties.htm		 
            items: {
                settings: {
                    uses: "settings",
                    items: {
                        item1: props.underApperance()
                    }
                },
                watchdogs: props.sectionWatchdogs(),

                actions: {
                    label: "On Drill Trigger Action",
                    type: "items",
                    items: props.sectionActions()
                },

                about: {
                    label: "About",
                    type: "items",
                    items: props.sectionAbout(global.qext)
                }
            }
        },
        /*support : {
          snapshot: false,
          export: false,
          exportData : false
        },*/

        paint: function ($element, layout) {
            var self = this;
            var ownId = this.options.id;
            //console.log('ExtensionID: ' + ownId);
            var html = '';
            var app = qlik.currApp(this);
            var enigma = app.model.enigmaModel;
            var currSel = {};
            var editMode = document.location.toString().indexOf('/state/edit') > -1;
            //var isChecked = document.getElementById('cb_' + ownId) == null ? layout.prop_Switch1 : document.getElementById('cb_' + ownId).checked;
            var prevSel = self['watch_' + ownId] || {};
            var watchFields = {};
            var evaluate = [];
            if (global.enabledExtensions[ownId] == undefined) global.enabledExtensions[ownId] = layout.prop_Switch1;

            // console.log('layout', layout);
            if (layout.prop_fieldList.length == 0) {
                $element.html('No field watchdogs defined. Go to settings.');
            } else if (JSON.stringify(layout.prop_fieldList).indexOf('""') >= 0) {
                $element.html('You have unfinished watchdog definitions. Go to settings.');
            } else {

                layout.prop_fieldList.forEach(function (fieldDef) {
                    watchFields[fieldDef.label] = fieldDef.maxcount;
                    evaluate.push(("'\"§§§§§\":' & If(GetSelectedCount([§§§§§]), '[\"' & GetFieldSelections([§§§§§],'\",\"',654) & '\"]', '[]')")
                        .replace(/§§§§§/g, fieldDef.label));
                });
                // console.log('watchFields:', watchFields);

                evaluate = "'{' & " + evaluate.join("& ',' &") + " & '}'";
                //console.log(evaluate)

                enigma.evaluate(evaluate).then(function (res) {
                    //console.log('res:', JSON.parse(res));
                    currSel = JSON.parse(res);
                    //console.log('prevSel:', prevSel);

                    var drillTo = [];
                    for (var elem in currSel) {
                        if (prevSel.hasOwnProperty(elem)) {
                            if (currSel[elem].length > 0 && currSel[elem].length <= watchFields[elem] && JSON.stringify(currSel[elem]) != JSON.stringify(prevSel[elem])) {
                                drillTo.push(elem);
                            }
                        }
                    }

                    if (drillTo.length > 0) console.log('You drilled to: ' + drillTo);
                    var prevNavBackUsed = navBackUsed;
                    navBackUsed = false;
                    if (drillTo.length > 0 && !editMode && global.enabledExtensions[ownId] && // document.getElementById('cb_' + ownId).checked &&
                        document.getElementById('parent_' + ownId) == null && !prevNavBackUsed) {

                        var rect = document.getElementById('qs-page-container').getElementsByClassName('qvt-sheet-container')[0].getBoundingClientRect();
                        var topDiv = '<div id="parent_' + ownId + '" style="position:absolute;z-index:1000;top:' + rect.top +
                            'px;left:0px;width:100%;height:100%;background-color:rgba(220,220,220,0.9);text-align:center;">' +
                            '<button id="closebtn_' + ownId + '" class="lui-button" style="background-color:white;margin:5px;">close</button>' +
                            '<br/><div id="objview_' + ownId + '" style="display:inline-block;background-color:white;width:90%;height:85%;" />' +
                            '</div>';

                        if (layout.prop_RB1 == 'object') {
                            app.visualization.get(layout.prop_objectId).then(function (visObj) {
                                $(topDiv).appendTo("body").ready(function () {
                                    visObj.show('objview_' + ownId);
                                    document.getElementById('closebtn_' + ownId).onclick = function () {
                                        var parentDiv = document.getElementById('parent_' + ownId);
                                        parentDiv.parentNode.removeChild(parentDiv);
                                        if (layout.prop_prevSelect) {
                                            app.back();
                                            navBackUsed = true;
                                        }
                                        if (visObj) visObj.close();
                                    };
                                });
                            }).catch(function (err) {
                                console.log(err);
                                niceError($, 'errorMsg_' + ownId, 'Error', 'No such object found, id "' + layout.prop_objectId + '". Change in the settings of Drill-to-detail extension.');
                            });

                        } else if (layout.prop_RB1 == 'newobj') {

                            var visObj;
                            var objJson;
                            try {
                                objJson = JSON.parse(layout.prop_objJson);
                                $(topDiv).appendTo("body").ready(function () {
                                    app.visualization.create(
                                        layout.prop_objType,
                                        objJson, {
                                        showTitles: true,
                                        title: layout.prop_cbLabel
                                    }).then(function (vis) {
                                        visObj = vis;
                                        visObj.show('objview_' + ownId);
                                    }).catch(function (err) {
                                        console.log('Error', err);
                                        niceError($, 'errorMsg_' + ownId, 'Error', err);
                                    });
                                    document.getElementById('closebtn_' + ownId).onclick = function () {
                                        var parentDiv = document.getElementById('parent_' + ownId);
                                        parentDiv.parentNode.removeChild(parentDiv);
                                        if (layout.prop_prevSelect) {
                                            app.back();
                                            navBackUsed = true;
                                        }
                                        if (visObj) visObj.close();
                                    };

                                })


                            } catch (err) {
                                console.log(err);
                                niceError($, 'errorMsg_' + ownId, 'Error', 'Invalid Object definition in Drill-to-detail extension.');
                                //alert('Here  is Error ' + err);
                            }


                        } else if (layout.prop_RB1 == 'link') {

                            var target = document.location.protocol + '//' + document.location.hostname + (document.location.port.length > 0 ? ':' : '') + document.location.port + '/single/?appid=' +
                                app.id + '&obj=' + layout.prop_objectId + '&opt=ctxmenu,currsel';
                            console.log('new url; ' + target);
                            window.open(target, 'detailview');

                        } else if (layout.prop_RB1 == 'sheet') {
                            qlik.navigation.gotoSheet(layout.prop_sheetId);

                        } else {
                            qlik.navigation.nextSheet();

                        }
                    }
                    self['watch_' + ownId] = currSel; // remember current selections for next call
                });


                var mouseOver = [];
                for (var elem in watchFields) {
                    mouseOver.push("'" + elem + "'")
                };
                mouseOver = (mouseOver.length > 1 ? 'Enabled for fields ' : 'Enabled for field ') + mouseOver.join(',');
                // class="tooltip-trigger" aria-haspopup="true" 

                html += ('<label style="text-align:' + layout.prop_align + ';" class="lui-checkbox" title="' + mouseOver + '">' +
                    '<input id="cb_' + ownId + '" class="lui-checkbox__input" type="checkbox" ' + (global.enabledExtensions[ownId] ? 'checked' : '') + '/>' +
                    '<div class="lui-checkbox__check-wrap">' +
                    '<span class="lui-checkbox__check"></span>' +
                    '<span class="lui-checkbox__check-text">' + layout.prop_cbLabel + '</span>' +
                    '</div>' +
                    '</label>');

                $element.html(html);

                $('#cb_' + ownId).click(function () {
                    global.enabledExtensions[ownId] = $('#cb_' + ownId).is(':checked');
                    console.log(ownId, ' Drill to detail is now ' + global.enabledExtensions[ownId]);
                })
            }
            return qlik.Promise.resolve();
        }
    };


    function niceError(jQuery, id, title, message) {

        return jQuery('<div class="dialog-content" id="' + id + '">' +
            '<div class="lui-dialog" style="width: 400px;">' +
            '<div class="lui-dialog__header">' +
            '<div class="lui-dialog__title">' + title + '</div>' +
            '</div>' +
            '<div class="lui-dialog__body">' + message +
            '</div>' +
            '<div class="lui-dialog__footer">' +
            '<button class="lui-button  lui-dialog__button  close-button" onclick="document.getElementById(\'' + id + '\').remove();">OK</button>' +
            '</div>' +
            '</div>' +
            '</div>').appendTo("#grid-wrap");
    }
});
