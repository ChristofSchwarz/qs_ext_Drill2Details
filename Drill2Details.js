define(["qlik", "jquery"], function(qlik, $) {
   'use strict';
   return {
      //template: template,
      initialProperties: {
         qHyperCubeDef: {
            qDimensions: [],
            qMeasures: [{
               qDef: {
                  qDef: "=GetCurrentSelections()"
               },
            }]
         },
         showTitles: false,
      },
      definition: {
         type: "items",
         component: "accordion",
         items: {
            settings: {
               uses: "settings",
               items: {
                  MyList: {
                     type: "array",
                     ref: "prop_fieldList",
                     label: "Field selection watchdogs",
                     itemTitleRef: "label",
                     allowAdd: true,
                     allowRemove: true,
                     addTranslation: "Add watchdog",
                     items: {
                        label: {
                           type: "string",
                           ref: "label",
                           label: "Datafield Name",
                           component: "dropdown",
                           options: function() {
                              var app = qlik.currApp();
                              var enigma = app.model.enigmaModel;
                              return enigma.evaluate("concat(DISTINCT $Field, '\"},{\"value\":\"')").then(function(res) {
                                 var fieldlist = JSON.parse('[{"value":"' + res + '"}]');
                                 return fieldlist;
                              });
                           }
                        },
                        number: {
                           label: "Max Selections",
                           ref: "maxcount",
                           type: "number",
                           defaultValue: 1
                        }
                     }
                  },
                  other: {
                     label: "Settings",
                     items: [{
                           label: "Add field names as Measures above.",
                           component: "text"
                        },
                        {
                           component: "radiobuttons",
                           type: "string",
                           ref: "prop_RB1",
                           label: "What to do on drill?",
                           options: [{
                                 label: "Open Next Sheet",
                                 value: "nextsheet"
                              },
                              {
                                 label: "Open specific Sheet",
                                 value: "sheet"
                              },
                              {
                                 label: "Existing object in new window",
                                 value: "link"
                              },
                              {
                                 label: "Existing object in current window *",
                                 value: "object"
                              },
                              {
                                 label: "A new object *",
                                 value: "newobj"
                              }
                           ],
                           defaultValue: "nextsheet"
                        },
                        {
                           label: "* experimental",
                           component: "text"
                        },
                        {
                           ref: "prop_sheetId",
                           label: "Sheet id to open",
                           type: "string",
                           expression: "optional",
                           show: function(data) {
                              return data.prop_RB1 == "sheet"
                           }
                        }, {
                           ref: "prop_objectId",
                           label: "Object Id to show",
                           type: "string",
                           expression: "optional",
                           defaultValue: "",
                           show: function(data) {
                              return data.prop_RB1 == "object" || data.prop_RB1 == "link"
                           }
                        }, {
                           ref: "prop_prevSelect",
                           label: "On Close undo last selection",
                           type: "boolean",
                           defaultValue: false,
                           show: function(data) {
                              return data.prop_RB1 == "object"
                           }
                        }, {
                           component: "dropdown",
                           defaultValue: 'table',
                           ref: "prop_objType",
                           label: "New object type",
                           type: "string",
                           // https://help.qlik.com/en-US/sense-developer/April2020/Subsystems/Mashups/Content/Sense_Mashups/Create/Visualizations/visualization-types.htm
                           options: [{
                                 value: "table",
                                 label: "table"
                              },
                              {
                                 value: "pivot-table",
                                 label: "pivot-table"
                              },
                              {
                                 value: "linechart",
                                 label: "linechart"
                              },
                              {
                                 value: "barchart",
                                 label: "barchart"
                              },
                              {
                                 value: "gauge",
                                 label: "gauge"
                              },
                              {
                                 value: "kpi",
                                 label: "kpi"
                              },
                              {
                                 value: "piechart",
                                 label: "piechart"
                              },
                              {
                                 value: "scatterplot",
                                 label: "scatterplot"
                              },
                           ],
                           show: function(data) {
                              return data.prop_RB1 == "newobj"
                           }
                        }, {
                           component: "textarea",
                           defaultValue: '["City","Year","Customer","=Sum([Sales Quantity]*[Sales Price])"]',
                           rows: 3,
                           expression: "optional",
                           ref: "prop_objJson",
                           label: "New object definition",
                           type: "string",
                           show: function(data) {
                              return data.prop_RB1 == "newobj"
                           }
                        },
                        {
                           ref: "prop_cbLabel",
                           label: "Label for checkbox",
                           type: "string",
                           expression: "optional",
                           defaultValue: "Drill to detail"
                        },
                        {
                           component: "switch",
                           type: "boolean",
                           ref: "prop_Switch1",
                           label: "Drill function on start is",
                           defaultValue: true,
                           options: [{
                                 value: true,
                                 label: "Enabled"
                              },
                              {
                                 value: false,
                                 label: "Disabled"
                              }
                           ]
                        },
                        {
                           label: "Extension by Christof Schwarz",
                           component: "text"
                        },

                        {
                           label: "Christof Schwarz on Github",
                           component: "button",
                           action: function(arg) {
                              window.open('https://github.com/ChristofSchwarz/qs_ext_Drill2Details', '_blank');
                           }
                        }
                     ]
                  }
               }
            }
         }
      },
      /*support : {
        snapshot: false,
        export: false,
        exportData : false
      },*/
      paint: function($element, layout) {
         var self = this;
         var ownId = this.options.id;
         //console.log('ExtensionID: ' + ownId);
         var html = '';
         var app = qlik.currApp(this);
         var enigma = app.model.enigmaModel;
         var currSel = {};
         var editMode = document.location.toString().indexOf('/state/edit') > -1;
         var isChecked = document.getElementById('cb_' + ownId) == null ? layout.prop_Switch1 : document.getElementById('cb_' + ownId).checked;
         var prevSel = self['watch_' + ownId] || {};
         var watchFields = {};
         var evaluate = [];
         // console.log('layout', layout);
         if (layout.prop_fieldList.length == 0) {
            $element.html('No field watchdogs defined. Go to settings.');
         } else if (JSON.stringify(layout.prop_fieldList).indexOf('""') >= 0) {
            $element.html('You have unfinished watchdog definitions. Go to settings.');
         } else {

            layout.prop_fieldList.forEach(function(fieldDef) {
               watchFields[fieldDef.label] = fieldDef.maxcount;
               evaluate.push(("'\"§§§§§\":' & If(GetSelectedCount([§§§§§]), '[\"' & GetFieldSelections([§§§§§],'\",\"',654) & '\"]', '[]')")
                  .replace(/§§§§§/g, fieldDef.label));
            });
            // console.log('watchFields:', watchFields);

            evaluate = "'{' & " + evaluate.join("& ',' &") + " & '}'";
            //console.log(evaluate)

            enigma.evaluate(evaluate).then(function(res) {
               //console.log('res:', JSON.parse(res));
               currSel = JSON.parse(res);
               //console.log('prevSel:', prevSel);
               var both = {  // get a combined object of both
                  ...currSel,
                  ...prevSel
               };
               var drillTo = [];
               for (var elem in both) {
                  if (currSel.hasOwnProperty(elem) && prevSel.hasOwnProperty(elem)) {
                     if (currSel[elem].length > 0 && currSel[elem].length <= watchFields[elem] && JSON.stringify(currSel[elem]) != JSON.stringify(prevSel[elem])) {
                        drillTo.push(elem);
                     }
                  }
               }

               console.log('You drilled to: ' + drillTo);

               if (drillTo.length > 0 && !editMode && document.getElementById('cb_' + ownId).checked &&
                  document.getElementById('parent_' + ownId) == null) {

                  if (layout.prop_RB1 == 'object' || layout.prop_RB1 == 'newobj') {

                     var rect = document.getElementById('qs-page-container').getElementsByClassName('qvt-sheet-container')[0].getBoundingClientRect();
                     var visObj;

                     $('<div id="parent_' + ownId + '" style="position:absolute;z-index:1000;top:' + rect.top + 
					    'px;left:0px;width:100%;height:100%;background-color:rgba(220,220,220,0.9);text-align:center;">' +
                        '<button id="closebtn_' + ownId + '" class="lui-button" style="background-color:white;margin:5px;">close</button>' +
                        '<br/><div id="objview_' + ownId + '" style="display:inline-block;background-color:white;width:90%;height:85%;" />' +
                        '</div>').appendTo("body").ready(function() {

                        if (layout.prop_RB1 == 'object') app.getObject('objview_' + ownId, layout.prop_objectId);
                        if (layout.prop_RB1 == 'newobj') {
                           app.visualization.create(
                              layout.prop_objType,
                              JSON.parse(layout.prop_objJson), {
                                 showTitles: true,
                                 title: layout.prop_cbLabel
                              }
                           ).then(function(vis) {
                              visObj = vis;
                              visObj.show('objview_' + ownId);
                           })
                        }
                        document.getElementById('closebtn_' + ownId).onclick = function() {
                           var parentDiv = document.getElementById('parent_' + ownId);
                           parentDiv.parentNode.removeChild(parentDiv);
                           if (layout.prop_prevSelect) app.back();
                           if (visObj) visObj.close();
                        }
                     });

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

            html += ('<label class="lui-checkbox" title="' + mouseOver + '">' +
               '<input id="cb_' + ownId + '" class="lui-checkbox__input" type="checkbox" ' + (isChecked ? 'checked' : '') + '/>' +
               '<div class="lui-checkbox__check-wrap">' +
               '<span class="lui-checkbox__check"></span>' +
               '<span class="lui-checkbox__check-text">' + layout.prop_cbLabel + '</span>' +
               '</div>' +
               '</label><!-- button id="abcdefg" class="lui-button">Check</button -->');

            $element.html(html);
         }
         return qlik.Promise.resolve();
      }
   };
});
