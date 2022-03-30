// props.js: Extension properties (accordeon menu) externalized

define(["qlik", "jquery"], function
    (qlik, $) {

    const ext = 'Drill2Details';

    return {

        underApperance: function () {
            return {
                label: "Label and Alignment",
                type: "items",
                items: [
                    {
                        ref: "prop_cbLabel",
                        label: "Label for checkbox",
                        type: "string",
                        expression: "optional",
                        defaultValue: "Drill to detail"
                    }, {
                        component: "switch",
                        type: "boolean",
                        ref: "prop_Switch1",
                        label: "Drill function on start is",
                        defaultValue: true,
                        options: [
                            { value: true, label: "Enabled" },
                            { value: false, label: "Disabled" }
                        ]
                    }, {
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
        },

        sectionWatchdogs: function () {
            return {
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
                        options: function () {
                            var app = qlik.currApp();
                            var enigma = app.model.enigmaModel;
                            return enigma.evaluate("concat(DISTINCT $Field, '\"},{\"value\":\"')").then(function (res) {
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
            }
        },

        sectionActions: function () {
            return [
                {
                    component: "radiobuttons",
                    type: "string",
                    ref: "prop_RB1",
                    label: "What to do on drill?",
                    options: [
                        {
                            label: "Open Next Sheet",
                            value: "nextsheet"
                        }, {
                            label: "Open specific Sheet",
                            value: "sheet"
                        }, {
                            label: "Given object in new window",
                            value: "link"
                        }, {
                            label: "Given object in this window*",
                            value: "object"
                        }, {
                            label: "A new object in this window*",
                            value: "newobj"
                        }
                    ],
                    defaultValue: "nextsheet"
                }, {
                    label: "* experimental",
                    component: "text"
                }, {
                    ref: "prop_sheetId",
                    label: "Sheet id to open",
                    type: "string",
                    expression: "optional",
                    show: function (data) {
                        return data.prop_RB1 == "sheet"
                    }
                }, {
                    ref: "prop_objectId",
                    label: "Object Id to show",
                    type: "string",
                    expression: "optional",
                    defaultValue: "",
                    show: function (data) {
                        return data.prop_RB1 == "object" || data.prop_RB1 == "link"
                    }
                }, {
                    ref: "prop_prevSelect",
                    label: "On Close undo last selection",
                    type: "boolean",
                    defaultValue: false,
                    show: function (data) {
                        return data.prop_RB1 == "object" || data.prop_RB1 == "newobj"
                    }
                }, {
                    component: "dropdown",
                    defaultValue: 'table',
                    ref: "prop_objType",
                    label: "New object type",
                    type: "string",
                    // https://help.qlik.com/en-US/sense-developer/April2020/Subsystems/Mashups/Content/Sense_Mashups/Create/Visualizations/visualization-types.htm
                    options: [
                        { value: "table" },
                        { value: "pivot-table" },
                        { value: "linechart" },
                        { value: "barchart" },
                        { value: "gauge" },
                        { value: "kpi" },
                        { value: "piechart" },
                        { value: "scatterplot" },
                    ],
                    show: function (data) {
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
                    show: function (data) {
                        return data.prop_RB1 == "newobj"
                    }
                },
                {
                    // ************** Copy all fields button **************
                    label: "\u2191 Copy fields of below table",
                    component: "button",
                    ref: "prop_table",
                    action: function (arg) {

                        console.log(arg);
                        var thisId = arg.qInfo.qId;
                        var app = qlik.currApp();
                        var enigma = app.model.enigmaModel;
                        var qFormula = "Concat({<$Table={\"" + arg.prop_fromTable + "\"},$Field-={\"(" + arg.prop_ignoreFields + ")\"}>} DISTINCT $Field, '\",\"', $FieldNo)";
                        var thisVizModel;
                        app.visualization.get(thisId).then(function (res) {
                            thisVizModel = res.model;
                            return enigma.evaluate(qFormula);
                        }).then(function (res) {
                            var oldArr;
                            var props = thisVizModel.properties;
                            //console.log('prop_objJson', props.prop_objJson);
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
                                //console.log('oldArr', oldArr);
                                var newArr = JSON.parse('["' + res + '"]');
                                var bothArr = arrayUnique(oldArr.concat(newArr));
                                console.log('Fieldlist', bothArr);
                                //arg.prop_objJson = JSON.stringify(bothArr).replace(/\",\"/g, '",\n"').replace('[', '[\n').replace(']', '\n]');
                                props.prop_objJson = {
                                    qStringExpression: {
                                        qExpr: "='" +
                                            JSON.stringify(bothArr).replace(/\",\"/g, '",\n"').replace('[', '[\n').replace(']', '\n]') + "'"
                                    }
                                };
                                thisVizModel.setProperties(props);
                            } catch (err) {
                                console.log('Error', err);
                                alert('This is not proper Json in the "Columns" text box. Clear it or write column array manually.');
                                // oldArr = [];
                            }
                        });

                    },
                    show: function (data) {
                        return data.prop_RB1 == "newobj" && data.prop_fromTable.length > 0
                    }
                },
                {
                    component: "dropdown",
                    ref: "prop_fromTable",
                    //label: "Data model table",
                    type: "string",
                    options: function (arg) {
                        var app = qlik.currApp();
                        var enigma = app.model.enigmaModel;
                        return enigma.evaluate("Concat(DISTINCT $Table, '\"},{\"value\":\"')").then(function (res) {
                            var fieldlist = JSON.parse('[{"value":"' + res + '"}]');
                            return fieldlist;
                        });
                    },
                    show: function (data) {
                        return data.prop_RB1 == "newobj"
                    }
                }, {
                    component: "text",
                    label: "Choose a table to quickly copy all fields to above list",
                    show: function (data) {
                        return data.prop_RB1 == "newobj"
                    }
                }, {
                    ref: "prop_ignoreFields",
                    label: "Ignore fields like pattern",
                    type: "string",
                    defaultValue: "*id|%*",
                    show: function (data) {
                        return data.prop_RB1 == "newobj"
                    }
                }, {
                    component: "text",
                    label: "wildcards: * ?, separator: |",
                    show: function (data) {
                        return data.prop_RB1 == "newobj"
                    }
                }
            ]
        },

        sectionAbout: function (qext) {
            return [
                {
                    label: function (arg) { return 'Installed extension version ' + qext.version },
                    component: "link",
                    url: '../extensions/Drill2Details/Drill2Details.qext'
                }, {
                    label: "This extension is available either licensed or free of charge by data/\\bridge, Qlik OEM partner and specialist for Mashup integrations.",
                    component: "text"
                }, {
                    label: "Without license you may use it as is. Licensed customers get support.",
                    component: "text"
                }, {
                    label: "",
                    component: "text"
                }, {
                    label: "About Us",
                    component: "link",
                    url: 'https://www.databridge.ch'
                }, {
                    label: "More",
                    component: "button",
                    action: function (arg) {
                        console.log(arg);
                        window.open('https://insight.databridge.ch/items/guided-tour-extension', '_blank');
                    }
                }
            ]
        }
    }

    function subSection(labelText, itemsArray, argKey, argVal) {
        var ret = {
            component: 'expandable-items',
            items: {}
        };
        var hash = 0;
        for (var j = 0; j < labelText.length; j++) {
            hash = ((hash << 5) - hash) + labelText.charCodeAt(j)
            hash |= 0;
        }
        ret.items[hash] = {
            label: labelText,
            type: 'items',
            show: function (arg) { return (argKey && argVal) ? (arg[argKey] == argVal) : true },
            items: itemsArray
        };
        return ret;
    }

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


});
