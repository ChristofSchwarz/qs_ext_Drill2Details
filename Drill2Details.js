define(["qlik", "jquery"], function(qlik, $) {
   'use strict';
   var version = '0.91';
   
   function arrayUnique(array) {
   // function to remove duplicate entries from an text array
      var a = array.concat();
      for (var i = 0; i < a.length; ++i) {
         for (var j = i + 1; j < a.length; ++j) {
            if (a[i] === a[j])
               a.splice(j--, 1);
         }
      }
      return a;
   }


   var underApperance = {
      label: "Label and Alignment",
      type: "items",
      items:
         [{
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
               label: 'Alignment of text',
               type: 'string',
               component: 'item-selection-list',
               icon: true,
               horizontal: true,
               ref: 'prop_align',
               defaultValue: 'left',
               items: [{
                  value: 'left',
                  component: 'icon-item',
                  icon: '\u2190'
               }, {
                  value: 'center',
                  icon: '\u2194',
                  component: 'icon-item'
               }, {
                  value: 'right',
                  icon: '\u2192',
                  component: 'icon-item'
               }]
            }
         ]
   }

   var mainsection1 = {
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
   };
  
   var mainsection2 = {
      label: "On Drill Trigger Action",
      type: "items",
      items: [

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
                  label: "Given object in new window",
                  value: "link"
               },
               {
                  label: "Given object in this window*",
                  value: "object"
               },
               {
                  label: "A new object in this window*",
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
               },
               {
                  value: "pivot-table",
               },
               {
                  value: "linechart",
               },
               {
                  value: "barchart",
               },
               {
                  value: "gauge",
               },
               {
                  value: "kpi",
               },
               {
                  value: "piechart",
               },
               {
                  value: "scatterplot",
               },
            ],
            show: function(data) {
               return data.prop_RB1 == "newobj"
            }
         },
         {
            component: "textarea",
            //defaultValue: '',
            rows: 4,
            expression: "optional",
            ref: "prop_objJson",
            label: 'Columns Array Json ["field1","field2",...]',
            type: "string",
            show: function(data) {
               return data.prop_RB1 == "newobj"
            }
         },
         {
		    // ************** Copy all fields button **************
            label: "\u2191 Copy fields of below table",
            component: "button",  
            ref: "prop_table",
            action: function(arg) {
			 
               console.log(arg);
			   var thisId = arg.qInfo.qId;
			   var app = qlik.currApp();
			   var enigma = app.model.enigmaModel;
			   var qFormula = "Concat({<$Table={\"" + arg.prop_fromTable + "\"},$Field-={\"(" + arg.prop_ignoreFields + ")\"}>} DISTINCT $Field, '\",\"', $FieldNo)";
			   var thisVizModel;
			   app.visualization.get(thisId).then(function(res){
			     thisVizModel = res.model;
			     return enigma.evaluate(qFormula);
			   }).then(function(res) {
			      var oldArr;
				  var props = thisVizModel.properties;
				  console.log('prop_objJson',props.prop_objJson);
                  if (props.prop_objJson.qStringExpression == undefined) {
                     oldArr = props.prop_objJson;
                  } else {
                     oldArr = props.prop_objJson.qStringExpression.qExpr.substr(1);
                     if (oldArr.substr(0, 1) == "'") oldArr = oldArr.substr(1);
                     if (oldArr.substr(-1, 1) == "'") oldArr = oldArr.substr(0, oldArr.length - 1);
                  };
                  if (oldArr.length == 0) oldArr = '[]';
                  try {
                     oldArr = JSON.parse(oldArr);
					 console.log ('oldArr', oldArr);
					  var newArr = JSON.parse('["' + res + '"]');
					  var bothArr = arrayUnique(oldArr.concat(newArr));
					  console.log('Fieldlist', bothArr);
					  //arg.prop_objJson = JSON.stringify(bothArr).replace(/\",\"/g, '",\n"').replace('[', '[\n').replace(']', '\n]');
					  props.prop_objJson = {qStringExpression: {qExpr: "='" + 
					  JSON.stringify(bothArr).replace(/\",\"/g, '",\n"').replace('[', '[\n').replace(']', '\n]') + "'"}};
					  thisVizModel.setProperties(props);
                  } catch {
				     alert('This is not proper Json in the "Columns" text box. Clear it or write column array manually.');
                     // oldArr = [];
                  }
               });
			   
            },
            show: function(data) {
               return data.prop_RB1 == "newobj" && data.prop_fromTable.length > 0
            }
         },
         {
            component: "dropdown",
            ref: "prop_fromTable",
            //label: "Data model table",
            type: "string",
            options: function(arg) {
               var app = qlik.currApp();
               var enigma = app.model.enigmaModel;
               return enigma.evaluate("Concat(DISTINCT $Table, '\"},{\"value\":\"')").then(function(res) {
                  var fieldlist = JSON.parse('[{"value":"' + res + '"}]');
                  return fieldlist;
               });
            },
            show: function(data) {
               return data.prop_RB1 == "newobj"
            }
         }, {
            component: "text",
            label: "Choose a table to quickly copy all fields to above list",
            show: function(data) {
               return data.prop_RB1 == "newobj"
            }
         }, {
            ref: "prop_ignoreFields",
            label: "Ignore fields like pattern",
            type: "string",
            defaultValue: "*id|%*",
			show: function(data) {
               return data.prop_RB1 == "newobj"
            }
         }, {
            component: "text",
            label: "wildcards: * ?, separator: |",
            show: function(data) {
               return data.prop_RB1 == "newobj"
            }
         }
      ]
   }

   /// ************** MAIN CODE ************** 
   
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
         // https://help.qlik.com/en-US/sense-developer/February2020/Subsystems/Extensions/Content/Sense_Extensions/extensions-add-custom-properties.htm		 
         items: {
            settings: {
               uses: "settings",
               items: {
                  item1: underApperance
               }
            },
            mainSection1: mainsection1,
            mainSection2: mainsection2,
            mainSection3: {
               label: "About",
               type: "items",
               items: [{
			      label: "Version: " + version,
                  component: "text"
               }, {
                  label: "Extension by Christof Schwarz",
                  component: "text"
               }, {
                  label: "Open on Github",
                  component: "button",
                  action: function(arg) {
                     window.open('https://github.com/ChristofSchwarz/qs_ext_Drill2Details', '_blank');
                  }
               }]
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

               var drillTo = [];
               for (var elem in currSel) {
                  if (prevSel.hasOwnProperty(elem)) {
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
            // class="tooltip-trigger" aria-haspopup="true" 

            html += ('<label style="text-align:' + layout.prop_align + ';" class="lui-checkbox" title="' + mouseOver + '">' +
               '<input id="cb_' + ownId + '" class="lui-checkbox__input" type="checkbox" ' + (isChecked ? 'checked' : '') + '/>' +
               '<div class="lui-checkbox__check-wrap">' +
               '<span class="lui-checkbox__check"></span>' +
               '<span class="lui-checkbox__check-text">' + layout.prop_cbLabel + '</span>' +
               '</div>' +
               '</label>');

            $element.html(html);
         }
         return qlik.Promise.resolve();
      }
   };
});
