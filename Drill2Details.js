define( ["qlik","jquery"], function (qlik, $) {
   'use strict';
    return {
       //template: template,
       initialProperties : {
			qHyperCubeDef : {
				qDimensions : [],
				qMeasures : [],
				qInitialDataFetch : [{
					qWidth : 10,
					qHeight : 1
				}]
			}
		},
		definition : {
			type : "items",
			component : "accordion",
			items : {
			/*	dimensions : {
					uses : "dimensions",
					min : 0
				},*/
				measures : {
					uses : "measures",
					min : 1,
					max : 10
				},
				settings : {
					uses : "settings",
					items : {
						i1: {
							label: 'Extension Settings',
							type: 'items',
							items: [
								{
									label: "Add field names as Measures above.",
									component: "text"
								},
								{
									label: "Each field is then watched for selection.",
									component: "text"
								},
								{
									component: "radiobuttons",
									type: "string",
									ref: "prop_RB1",
									label: "What to do on drill?",
									options: [
									  { label: "Open Next Sheet", value: "nextsheet"},
									  { label: "Open specific Sheet", value: "sheet" },
									  { label: "An existing object new tab", value: "link" },
									  { label: "An existing object fullscreen*", value: "object" },
									  { label: "A new object*", value: "newobj" }
									],
									defaultValue: "nextsheet"
								},
								{
									label: "* experimental",
									component: "text"
								},
								{
									ref : "prop_sheetId",
									label : "Sheet id to open",
									type : "string",
									expression: "optional",
									show: function(data){return data.prop_RB1=="sheet"}
								},{
									ref : "prop_objectId",
									label : "Object Id to show",
									type : "string",
									expression: "optional",
									defaultValue : "",
									show: function(data){return data.prop_RB1=="object" || data.prop_RB1=="link"}
								},{
									ref : "prop_prevSelect",
									label : "On Close undo last selection",
									type : "boolean",
									defaultValue : false,
									show: function(data){return data.prop_RB1=="object"}
								},{
									component: "dropdown",
									defaultValue: 'table',
									ref: "prop_objType",
									label: "New object type",
									type: "string",
									// https://help.qlik.com/en-US/sense-developer/April2020/Subsystems/Mashups/Content/Sense_Mashups/Create/Visualizations/visualization-types.htm
									options: [
									  { value: "table", label: "table" },
									  { value: "pivot-table", label: "pivot-table" },
									  { value: "linechart", label: "linechart" },
									  { value: "barchart", label: "barchart" },
									  { value: "gauge", label: "gauge" },
									  { value: "kpi", label: "kpi" },
									  { value: "piechart", label: "piechart" },
									  { value: "scatterplot", label: "scatterplot" },
									],
									show: function(data){return data.prop_RB1=="newobj"}
								  }
								,{
									component: "textarea",
									defaultValue: '["City","Year","Customer","=Sum([Sales Quantity]*[Sales Price])"]',
									rows: 3,
									expression: "optional",
									ref: "prop_objJson",
									label: "New object definition",
									type: "string",
									show: function(data){return data.prop_RB1=="newobj"}
								  },
								{
									ref : "prop_cbLabel",
									label : "Label for checkbox",
									type : "string",
									expression: "optional",
									defaultValue : "Drill to detail"						
								},
								{
									component: "switch",
									type: "boolean",
									ref: "prop_Switch1",
									label: "Drill function on start is",
									defaultValue: true,
									options: [
									  { value: true, label: "Enabled" },
									  { value: false, label: "Disabled" }
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
										window.open('https://github.com/ChristofSchwarz/qs_ext_Drill2Details','_blank');
									}
								}
							]
						}
					}
				}
			}
		},
		support : {
			snapshot: true,
			export: true,
			exportData : true
		},
		paint: function ($element, layout) {
			var self = this;
			var ownId = this.options.id;	
			//console.log('ExtensionID: ' + ownId);
			var html = '';
			var app = qlik.currApp(this);
			var enigma = app.model.enigmaModel;
			var sel = {};
			var editMode = document.location.toString().indexOf('/state/edit') > -1;
			var isChecked = document.getElementById('cb_'+ownId) == null ? layout.prop_Switch1 : document.getElementById('cb_'+ownId).checked;
			//var prevSel = qlik.hasOwnProperty('watch_'+ownId) ? qlik['watch_'+ownId] : []; 
		//	var prevSel = qlik['watch_'+ownId] || {}; 
			var prevSel = self['watch_'+ownId] || {}; 
			var watchFields = {};
			var evaluate = [];
			//console.log(layout.qHyperCube);
			var col = 0;
			layout.qHyperCube.qMeasureInfo.forEach(function(measure){
				watchFields[measure.qFallbackTitle] = layout.qHyperCube.qDataPages[0].qMatrix[0][col].qNum;
				col++;
				evaluate.push(("'\"§§§§§\":' & If(GetSelectedCount([§§§§§]), '[\"' & GetFieldSelections([§§§§§],'\",\"',654) & '\"]', '[]')")
				  .replace(/§§§§§/g, measure.qFallbackTitle));
			});
			console.log('watchfields:',watchFields);
			
			evaluate = "'{' & " + evaluate.join("& ',' &") + " & '}'";
			//console.log(evaluate)
			
			enigma.evaluate(evaluate).then (function(res){
				//console.log(res);	
				//console.log('json:', JSON.parse(res));
				sel = JSON.parse(res);
				var both={...sel, ...prevSel};
				var drillTo=[];
				for (var elem in both) {
                    if (sel.hasOwnProperty(elem) && prevSel.hasOwnProperty(elem)) {
						if (sel[elem].length >0 && sel[elem].length <= watchFields[elem] && JSON.stringify(sel[elem]) != JSON.stringify(prevSel[elem])) {
							drillTo.push(elem);
						}
					}
				}
				/*var both = {};
				for (var elem in prevSel) {
					if (!both.hasOwnProperty(elem)) both[elem]={}; 
					both[elem].before = prevSel[elem];
				};
				for (var elem in sel) {
					if (!both.hasOwnProperty(elem)) both[elem]={};  
					both[elem].now = sel[elem];
				}
				console.log('compare:', both);
				var drillTo=[];
				for (var elem in both) {
                    if (both[elem].hasOwnProperty('before') && both[elem].hasOwnProperty('now')) {
						if (both[elem].now.length >0 && both[elem].now.length <= watchFields[elem] && JSON.stringify(both[elem].before) != JSON.stringify(both[elem].now)) {
							drillTo.push(elem);
						}
					}
				}*/
				console.log('You drilled to: ' + drillTo);
				
				//console.log('same?:', JSON.stringify(sel) == JSON.stringify(prevSel));
			
				if (drillTo.length>0 && !editMode && document.getElementById('cb_'+ownId).checked 
				&& document.getElementById('parent_' + ownId)==null) {
				
				  //alert('Drill to ' + drillTo.join('+'));
				  
				  if(layout.prop_RB1 =='object' || layout.prop_RB1 == 'newobj') {
				  
					
					var rect = document.getElementById('qs-page-container').getElementsByClassName('qvt-sheet-container')[0].getBoundingClientRect();
				    var visObj;		
						/*
						// this computes a single url and shows in an iframe
						var target = document.location.protocol + '//' + document.location.hostname + (document.location.port.length>0?':':'') + document.location.port + '/single/?appid=' 
					  + app.id + '&obj=' + layout.prop_objectId;
					console.log('iframe ' + target);
					
					  $('<div id="parent_' + ownId + '" style="position:absolute;z-index:1000;top:' + rect.top + 'px;left:0px;width:100%;height:100%;background-color:rgba(220,220,220,0.9);text-align:center;">'
					  + '<button onclick="var frame=document.getElementById(\'parent_'+ownId+'\');frame.parentNode.removeChild(frame);" class="lui-button" style="background-color:white;margin:5px;">close</button>'
					  + '<br/><iframe src="'+ target + '" style="border:0px;width:90%;height:85%;" />'
					  + '</div>').appendTo("body").ready(function(){});
					 */ 
					 
					  $('<div id="parent_' + ownId + '" style="position:absolute;z-index:1000;top:' + rect.top + 'px;left:0px;width:100%;height:100%;background-color:rgba(220,220,220,0.9);text-align:center;">'
					  + '<button id="closebtn_' + ownId + '" class="lui-button" style="background-color:white;margin:5px;">close</button>'
					  + '<br/><div id="objview_' + ownId + '" style="display:inline-block;background-color:white;width:90%;height:85%;" />'
					  + '</div>').appendTo("body").ready(function(){
					     
					     if(layout.prop_RB1 =='object') app.getObject('objview_' + ownId, layout.prop_objectId);
						 if(layout.prop_RB1 =='newobj') {
						 	app.visualization.create(
							  layout.prop_objType,
							  JSON.parse(layout.prop_objJson),
							  {
								showTitles: true,
								title: layout.prop_cbLabel
							  }
							).then(function(vis){
							  visObj = vis;
							  visObj.show('objview_' + ownId);
							})
						 }
						 document.getElementById('closebtn_' + ownId).onclick = function () {
						 	var parentDiv = document.getElementById('parent_'+ownId);
							parentDiv.parentNode.removeChild(parentDiv);
							if (layout.prop_prevSelect) app.back();
							if (visObj) visObj.close();
						 }
					  });					  
				  
				  /*
					  // hide the Qlik Sense sheet div
					var sheetDiv = document.getElementById('qs-page-container').getElementsByClassName('qvt-sheet-container')[0];
					sheetDiv.style = 'display:none;'
					var newDiv = document.createElement('DIV');
					newDiv.id = 'parent_'+ownId;
					newDiv.innerHTML = '<button id="closebtn_' + ownId + '" class="lui-button" style="margin:5px;">close</button>'
					+'<div id="objview_' + ownId + '" style="margin:8px;height:90%;"></div>';
					var domDiv = sheetDiv.parentNode.appendChild(newDiv);
					app.getObject('objview_' + ownId, layout.prop_objectId);
					document.getElementById('closebtn_'+ ownId).onclick = function(){
						newDiv.parentNode.removeChild(newDiv);
						sheetDiv.offsetHeight;
						sheetDiv.style = '';
					}
					*/
				  } else if (layout.prop_RB1 == 'link'){
				    
					
						var target = document.location.protocol + '//' + document.location.hostname + (document.location.port.length>0?':':'') + document.location.port + '/single/?appid=' 
					  + app.id + '&obj=' + layout.prop_objectId + '&opt=ctxmenu,currsel';
					  console.log('new url; ' + target);
					  window.open(target,'detailview');
                  } else if (layout.prop_RB1 == 'sheet') {
				     qlik.navigation.gotoSheet(layout.prop_sheetId);
				  } else {
				     qlik.navigation.nextSheet();
				  }
				}						
				self['watch_'+ownId] = sel;  // remember current selections for next call
			});
			
			
			// https://help.qlik.com/en-US/sense-developer/February2020/Subsystems/Extensions/Content/Sense_Extensions/widgets-lui-components.htm
			var mouseOver = [];
			for (var elem in watchFields) { mouseOver.push("'" + elem + "'") };
			mouseOver = (mouseOver.length>1 ? 'Enabled for fields ' : 'Enabled for field ') + mouseOver.join(',');
			
			html += ('<label class="lui-checkbox" title="' + mouseOver + '">'
			+ '<input id="cb_' + ownId + '" class="lui-checkbox__input" type="checkbox" ' + (isChecked ? 'checked' : '') + '/>'
			+   '<div class="lui-checkbox__check-wrap">'
			+      '<span class="lui-checkbox__check"></span>'
			+      '<span class="lui-checkbox__check-text">' + layout.prop_cbLabel + '</span>'
			+   '</div>'
			+'</label><!-- button id="abcdefg" class="lui-button">Check</button -->');

			//html += '<div id="' +ownId + '">Hello' + sel + '</div>';
			$element.html(html);

			return qlik.Promise.resolve();
		}
	};

} );
