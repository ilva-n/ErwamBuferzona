let LLL;
require(["esri/config", 
"esri/Map", 
"esri/views/MapView", 
"esri/widgets/Sketch",
"esri/layers/GraphicsLayer",
"esri/layers/FeatureLayer", 
"esri/widgets/LayerList",
"esri/widgets/CoordinateConversion",
"esri/widgets/Measurement", 
"esri/geometry/geometryEngineAsync",
"esri/Graphic",
"esri/widgets/Editor",
"esri/widgets/Expand",
"esri/widgets/FeatureTable"], 
function (esriConfig, Map, MapView, Sketch, GraphicsLayer, FeatureLayer, LayerList, 
    CoordinateConversion, Measurement, geometryEngineAsync, Graphic, Editor, Expand, FeatureTable) {
    
    esriConfig.apiKey = "AAPKc6d3103f93ba45899206b019b686405bSdAz10q6A7j-RFC6kl6u4Uor2ADR2Nf5ytv-jRE0mGW9W9zP5UscUzYTL28efgHv";
    
    let zimetBuferzonu = false;
    let polygonsToJoin = [];
    let bzEditor, features, measurement, pointEditorExpand, addPointExpand, newSurveyBox;

    const layerListContainer = document.getElementById("layerListContainer");
    const measureDiv = document.getElementById("measureDiv");
    const bufSwitch = document.getElementById("bufSwitch");
    const saveButton = document.getElementById("saveButton");
    const pasleptMeritajuButton = document.getElementById("pasleptMeritaju");
    const joinButton = document.getElementById("joinButton");
    
    // Labels mājām un mazciemiem
    const labelClass = {
        // autocasts as new LabelClass()
        symbol: {
          type: "text", // autocasts as new TextSymbol()
          color: "green",
          font: {
            // autocast as new Font()
            family: "Playfair Display",
            size: 8,
            weight: "bold"
          }
        },
        labelPlacement: "above-center",
        labelExpressionInfo: {
          expression: "$feature.NOSAUKUMS"
        }
    };

    //for bzEditor which appears inside of popup
    const editThisAction = {
        title: "Labot šo buferzonu",
        id: "edit-this",
        className: "esri-icon-edit"
    };
       
    // Create a popupTemplate for the for buferzonas layer and pass in a function 
    //to set its content and specify an action to handle editing the selected feature
    const template = {
        title: "Buferzona",
        content: [
            {
              type: "fields",
              fieldInfos: [
                {
                  fieldName: "nosaukums"
                },
                {
                  fieldName: "gads"
                },
                {
                  fieldName: "OBJECTID"
                }
              ]
            }
          ],
        actions: [editThisAction]
    };

    //popup template apsekojumu slānim
    const apsTemplate = {
        title: "Apsekojums",
        content: [
            {
              type: "fields",
              fieldInfos: [
                {
                  fieldName: "inspektors"
                },
                {
                  fieldName: "gads"
                },
                {
                fieldName: "aktanr"
                },
                {
                  fieldName: "OBJECTID"
                }
              ]
            }
          ],
    };

    //popup template paraugu slānim
    const parTemplate = {
        title: "Pozitīvais paraugs",
        content: [
            {
              type: "fields",
              fieldInfos: [
                {
                  fieldName: "augasuga"
                },
                {
                  fieldName: "gads"
                },
                {
                  fieldName: "aktanr"
                },
                {
                  fieldName: "OBJECTID"
                }
              ]
            }
          ],
    };

    // renderer for buferzonas layer
    const bzRenderer = {
      type: "simple",  // autocasts as new SimpleRenderer()
      symbol: {
        type: "simple-fill",  // autocasts as new SimpleFillSymbol()
        color: [ 255, 128, 0, 0.2 ],
        outline: {  // autocasts as new SimpleLineSymbol()
          width: 2,
          color: "red"
        }
      }
    };

    // // renderer for apsekojumi layer - simpleRenderer - visi apsekojumi vienadi
    // const apsRenderer = {
    //   type: "simple",  // autocasts as new SimpleRenderer()
    //   symbol: {
    //     type: "simple-marker",  // autocasts as new SimpleMarkerSymbol()
    //     size: 7,
    //     color: "blue",
    //     outline: {  // autocasts as new SimpleLineSymbol()
    //       width: 1,
    //       color: "white"
    //     }
    //   },
    //   label: "apsekojums"
    // };
    
    /*
    // Šo var lietot, ja vēlas atšķirīgas krāsas pa gadiem
     let apsRenderer = {
      type: "unique-value",  // autocasts as new UniqueValueRenderer()
      field: "gads",
      defaultSymbol: { 
        type: "simple-marker", 
        size: 7, 
        color: "gray",
        outline: {
          width: 1,
          color: "white"
        }         
      },  // autocasts as new SimpleMarkerSymbol()
      uniqueValueInfos: [{
        // All features with value of "North" will be blue
        value: 2021,
        symbol: {
          type: "simple-marker",  // autocasts as new SimpleFillSymbol()
          size: 7,
          color: "blue",
          outline: {
            width: 1,
            color: "white"
          }
        }
      }, {
        value: 2022,
        symbol: {
          type: "simple-marker",  // autocasts as new SimpleFillSymbol()
          size: 7,
          color: "green",
          outline: {
            width: 1,
            color: "white"
          }
        }
      }]
    }; */   

    // UniqueValueRenderer with valueExpression  ar nosacījumiem
    // valueExpression is: when([expr1, result1, ...exprN, resultN], default) $feature
    const dateObj = new Date();
    const thisYearMinusTwo = dateObj.getFullYear() - 2;
    let apsRenderer = {
      type: "unique-value",  // autocasts as new UniqueValueRenderer()
      valueExpression: `When($feature.gads >= ${thisYearMinusTwo}, 'new', 'other')`,
      uniqueValueInfos: [{
          value: "new",
          symbol: {
            type: "simple-marker",  // autocasts as new SimpleFillSymbol()
            size: 7,
            color: "blue",
            outline: {
              width: 1,
              color: "white"
            }
          }
          }, {
          value: "other",
          symbol: {
            type: "simple-marker",  // autocasts as new SimpleFillSymbol()
            size: 7,
            color: "gray",
            outline: {
              width: 1,
              color: "white"
            }
          }
        }]
    };
  

    //renderer for paraugi layer
    const parRenderer = {
      type: "simple",  // autocasts as new SimpleRenderer()
      symbol: {
        type: "simple-marker",  // autocasts as new SimpleMarkerSymbol()
        size: 7,
        color: "red",
        outline: {  // autocasts as new SimpleLineSymbol()
          width: 1,
          color: "black"
        }
      },
      label: "paraugs"
    };       

    //LAYERS
    const ekas = new FeatureLayer({
        url: "https://services1.arcgis.com/3dWrAGXGF8L1iW48/arcgis/rest/services/AdresesLV/FeatureServer/0",
        labelingInfo: [labelClass],
        title: "Ēkas",
        visible: false
    });

    const mazciemi = new FeatureLayer({
        url: "https://services1.arcgis.com/3dWrAGXGF8L1iW48/arcgis/rest/services/AdresesLV/FeatureServer/1",
        labelingInfo: [labelClass],
        title: "Mazciemi",
        visible: false
    });
    const autoceli = new FeatureLayer({
        url: "https://services1.arcgis.com/3dWrAGXGF8L1iW48/arcgis/rest/services/AdresesLV/FeatureServer/2",
        title: "Autoceļi",
        visible: false
    });
    const ielas = new FeatureLayer({
        url: "https://services1.arcgis.com/3dWrAGXGF8L1iW48/arcgis/rest/services/AdresesLV/FeatureServer/3",
        title: "Ielas",
        visible: false
    });
    const ciemi = new FeatureLayer({
        url: "https://services1.arcgis.com/3dWrAGXGF8L1iW48/arcgis/rest/services/AdresesLV/FeatureServer/5",
        title: "Ciemi",
        //opacity: 0.15
        visible: false
    });
    const pagasti = new FeatureLayer({
        url: "https://services1.arcgis.com/3dWrAGXGF8L1iW48/arcgis/rest/services/AdresesLV/FeatureServer/7",
        title: "Pagasti",
        //opacity: 0.15
        visible: false
    });
    const novadi = new FeatureLayer({
        url: "https://services1.arcgis.com/3dWrAGXGF8L1iW48/arcgis/rest/services/AdresesLV/FeatureServer/6",
        title: "Novadi",
        //opacity: 0.15
        visible: false
    });

    const buferzonas = new FeatureLayer({
        url: "https://services1.arcgis.com/3dWrAGXGF8L1iW48/arcgis/rest/services/buferzonas/FeatureServer/0",
        renderer: bzRenderer,
        outFields: ["*"],
        popupTemplate: template
    });

    const apsekojumi = new FeatureLayer({
        url: "https://services1.arcgis.com/3dWrAGXGF8L1iW48/arcgis/rest/services/apsekojumiparaugi/FeatureServer/0",
        renderer: apsRenderer,
        outFields: ["*"],
        popupTemplate: apsTemplate,
        title: "Apsekojumi"
    });

    const paraugi = new FeatureLayer({
        url: "https://services1.arcgis.com/3dWrAGXGF8L1iW48/arcgis/rest/services/apsekojumiparaugi/FeatureServer/1",
        renderer: parRenderer,
        outFields: ["*"],
        title: "Pozitīvie paraugi",
        popupTemplate: parTemplate
    });

    //MAP
    const map = new Map({
      //basemap: "arcgis-imagery" // Basemap layer
      basemap: "gray-vector",
      layers: [ekas, mazciemi, autoceli, pagasti] // ielas, ciemi, novadi
    });
     
    // add buferzonas layer
    map.add(buferzonas);
    map.add(apsekojumi);
    map.add(paraugi);

    // layerinfos for editor widget (apsekojumi)
    const apsInfos = {
        layer: apsekojumi,
        formTemplate: {
          // autocasts to FormTemplate
          elements: [
            {
              // autocasts to Field Elements
              type: "field",
              fieldName: "OBJECTID",
              label: "OBJECTID",
              editable: false
            },
            {
              type: "field",
              fieldName: "inspektors",
              label: "inspektors"
            },
            {
              type: "field",
              fieldName: "aktanr",
              label: "Akta numurs"
            },
            {
              type: "field",
              fieldName: "gads",
              label: "gads"
            }
          ]
        }
    };
    // layerinfos for editor widget (paraugi)
    const parInfos = {
        layer: paraugi,
        label: "pozitīvie paraugi",
        formTemplate: {
          // autocasts to FormTemplate
          elements: [
            {
              // autocasts to Field Elements
              type: "field",
              fieldName: "OBJECTID",
              label: "OBJECTID",
              editable: false
            },
            {
              type: "field",
              fieldName: "augasuga",
              label: "auga suga"
            },
            {
              type: "field",
              fieldName: "aktanr",
              label: "Akta numurs"
            },
            {
              type: "field",
              fieldName: "gads",
              label: "gads"
            }
          ]
        }
    };
    
    //VIEW
    const view = new MapView({
        map: map,
        center: [24.399389, 56.902410], // Longitude, latitude 
        zoom: 7, // Zoom level
        container: "viewDiv" // Div element
    });
    //COORDINATE WIDGET
    const ccWidget = new CoordinateConversion({
        view: view
    });
    view.ui.add(ccWidget, "bottom-left");
    
    //MEASUREMENT WIDGET
    // const measurement = new Measurement({
    //     view: view,
    //     activeTool: "distance",
    //     container: measureDiv
    // });

    // novākt mērītājrīku
    pasleptMeritajuButton.addEventListener("click", ()=>{
        if (measurement){
            measurement.clear()
        }
    });

    bufSwitch.addEventListener("change", ()=>{
      zimetBuferzonu === true ? zimetBuferzonu = false : zimetBuferzonu = true;
      applySwitch();
    });

    //funkcijas priekš LayerList
    function defineActions(event) {
        // The event object contains an item property.  It is is a ListItem referencing the associated layer
        // and other properties. You can control the visibility of the item, its title, and actions using this object.
        const item = event.item;
        if (!item.title) {
          item.layer.listMode = "hide";
        }
    }
    //Apsekojumu pievadīšanai ar roku
    // paslept ailes
    const pasleptAiles = function(){
      document.getElementById("x_aile").style = "display:none";
      document.getElementById("y_aile").style = "display:none";
      document.getElementById("aktaNrInput").style = "display:none";
      document.getElementById("inspInput").style = "display:none";
      document.getElementById("gadsInput").style = "display:none";
      document.getElementById("gadsInput").style = "display:none";
      document.getElementById("iesniegtPoga").style = "display:none";
      document.getElementById("atpakalPoga").style = "display:block";
    }

    // paslept ailes
    const paraditAiles = function(){
      document.getElementById("h44").textContent = "Pievieno apsekojumu ierakstot koordinātes!"
      document.getElementById("x_aile").style = "display:block";
      document.getElementById("y_aile").style = "display:block";
      document.getElementById("aktaNrInput").style = "display:block";
      document.getElementById("inspInput").style = "display:block";
      document.getElementById("gadsInput").style = "display:block";
      document.getElementById("gadsInput").style = "display:block";
      document.getElementById("iesniegtPoga").style = "display:block";
      document.getElementById("atpakalPoga").style = "display:none";
    }

    const notiritAiles = function() {
      document.getElementById("x_aile").value = "";
      document.getElementById("y_aile").value = "";
      document.getElementById("aktaNrInput").value = "";
      document.getElementById("inspInput").value = "";
      document.getElementById("gadsInput").value = "";
    }

    //nolasīt ailes
    const createNewFeatureObj = function() {
      const obj = {};
      const lonText = document.getElementById("x_aile").value;
      const latText = document.getElementById("y_aile").value;
      obj.xkoord = parseFloat(lonText.replace(/,/g, '.'));
      obj.ykoord = parseFloat(latText.replace(/,/g, '.'));
      obj.attributes = {};
      obj.attributes.aktanr = document.getElementById("aktaNrInput").value;
      obj.attributes.inspektors = document.getElementById("inspInput").value;
      obj.attributes.gads = Number(document.getElementById("gadsInput").value);
      return obj;
    }
    
      // izveidot jaunu Feature (new Graphic)
    const createNewFeature1 = function(obj){
      const point = {
          type: "point",
          x: obj.xkoord,
          y: obj.ykoord,
          spatialReference: { wkid:4326 }
        };

      const jaunsPunkts = new Graphic({
          geometry: point,
          attributes: obj.attributes
        });
      return jaunsPunkts;
    };

    const izvPievienLaucinu = function(){
      newSurveyBox = document.createElement("div");
      newSurveyBox.classList.add("jaunsPunkts");
      //appned title
      const h44 = document.createElement("h4");
      h44.textContent = "Pievieno apsekojumu ierakstot koordinātes!";
      h44.setAttribute("id", "h44");
      newSurveyBox.appendChild(h44);
      //append x label and input box
      const lonLabel = document.createElement("label");
      lonLabel.textContent = "lon_(x): ";
      newSurveyBox.appendChild(lonLabel);
      const inputLon = document.createElement("input");
      inputLon.type = "text";
      inputLon.setAttribute("id", "x_aile");
      newSurveyBox.appendChild(inputLon);
      //create break
      const br1 = document.createElement("br");
      newSurveyBox.appendChild(br1);
      //append y label and input box
      const latLabel = document.createElement("label");
      latLabel.textContent = "lat_(y): "; 
      newSurveyBox.appendChild(latLabel);     
      const inputLat = document.createElement("input");
      inputLat.type = "text";
      inputLat.setAttribute("id", "y_aile");
      newSurveyBox.appendChild(inputLat);
      // break
      const br2 = document.createElement("br");
      newSurveyBox.appendChild(br2);
      // append akta Nr label and box
      const aktsLabel = document.createElement("label");
      aktsLabel.textContent = "Akta Nr: "; 
      newSurveyBox.appendChild(aktsLabel);     
      const inputAkts = document.createElement("input");
      inputAkts.type = "text";
      inputAkts.setAttribute("id", "aktaNrInput");
      newSurveyBox.appendChild(inputAkts);
      // break
      const br3 = document.createElement("br");
      newSurveyBox.appendChild(br3);
      //apped inspector name label and box           
      const inspektorsLabel = document.createElement("label");
      inspektorsLabel.textContent = "Inspektors: "; 
      newSurveyBox.appendChild(inspektorsLabel);     
      const inputInsp = document.createElement("input");
      inputInsp.type = "text";
      inputInsp.setAttribute("id", "inspInput");
      newSurveyBox.appendChild(inputInsp);
      // break
      const br4 = document.createElement("br");
      newSurveyBox.appendChild(br4);
      //apped year label and box           
      const gadsLabel = document.createElement("label");
      gadsLabel.textContent = "Gads: "; 
      newSurveyBox.appendChild(gadsLabel);     
      const inputGads = document.createElement("input");
      inputGads.type = "text";
      inputGads.setAttribute("id", "gadsInput");
      newSurveyBox.appendChild(inputGads);
      // break
      const br5 = document.createElement("br");
      newSurveyBox.appendChild(br5);
      // add submit button
      const iesniegtPoga = document.createElement("button");
      iesniegtPoga.type = "button";
      iesniegtPoga.textContent = "Saglabāt";
      iesniegtPoga.setAttribute("id", "iesniegtPoga");
      newSurveyBox.appendChild(iesniegtPoga);
      // add atcelt button
      const atpakalPoga = document.createElement("button");
      atpakalPoga.type = "button";
      atpakalPoga.textContent = "Atpakal";
      atpakalPoga.setAttribute("id", "atpakalPoga");
      atpakalPoga.style = "display:none"; // "display:block"
      newSurveyBox.appendChild(atpakalPoga);
      atpakalPoga.addEventListener("click", () =>{
        paraditAiles();
      });

      // event listener for submit button
      iesniegtPoga.addEventListener("click", ()=>{
        const newApsObj = createNewFeatureObj();
        console.log(newApsObj);
        const tekstaVieta = document.getElementById("h44");
        if(!newApsObj.xkoord || !newApsObj.ykoord){
          notiritAiles();
          pasleptAiles();
          tekstaVieta.textContent = "Lai pievienotu jaunu punktu, jābūt abām koordinātēm";
        } else {
          const newApsPoint = createNewFeature1(newApsObj);
          const edits = {
            addFeatures: [newApsPoint]
          };
          apsekojumi.applyEdits(edits).then((edresult) =>{
            notiritAiles();
            pasleptAiles();
            if (edresult.addFeatureResults[0].error) {
              tekstaVieta.textContent = `Pievienošana neizdevās: ${edresult.addFeatureResults[0].error.name}: ${edresult.addFeatureResults[0].error.message}`;
            } else {
              tekstaVieta.textContent = `Pievienots jauns apsekojums ar OBJECTID ${edresult.addFeatureResults[0].objectId}`;
              console.log(edresult.addFeatureResults[0]);
            }
          });
        }
      });
    }

    
    // HERE IS WHAT SHOULD HAPPEN WHEN view IS READY
    view.when(() => {
        // Create the LayerList widget with the associated actions and add it to the top-right corner of the view.
        const layerList = new LayerList({
          view: view,
          container: layerListContainer,
          // To add widget to the top right corner of the view: view.ui.add(layerList, "manual");
          // executes for each ListItem in the LayerList
          listItemCreatedFunction: defineActions         
        });

        // Event listener that fires each time an action is triggered
        layerList.on("trigger-action", (event) =>  {
            // The layer visible in the view at the time of the trigger.
            event.item.visible ? event.item.visible = false : event.item.visible = true;
        });
        
        // Create the Editor for buferzonas layer
        bzEditor = new Editor({
          view: view,
          container: document.createElement("div"),
          layerInfos: [{
              view: view,
              layer: buferzonas,                
              formTemplate: { // autocasts to FormTemplate
                  elements: [
                  // autocasts to FieldElement
                  {
                      type: "field",
                      fieldName: "Nosaukums",
                      label: "Nosaukums"
                  },
                  {
                      type: "field",
                      fieldName: "gads",
                      label: "gads"
                  },
                  {
                      type: "field",
                      fieldName: "OBJECTID",
                      label: "id",
                      editable: false
                  }
                  ]
              },
              addEnabled: false
          }]
        });

        // Execute each time the "Edit feature" action is clicked
        // šis ir tik sarežģīts, jo tam vajag iestādīties popup vietā
        function editThis() {
          // If the EditorViewModel's activeWorkflow is null, make the popup not visible
          // šī daļa palaiž Editor vidžetu
          if (!bzEditor.viewModel.activeWorkFlow) {
              view.popup.visible = false;
              // Call the Editor update feature edit workflow
              bzEditor.startUpdateWorkflowAtFeatureEdit(view.popup.selectedFeature);
              view.ui.add(bzEditor, "top-right");
              view.popup.spinnerEnabled = false;
          }
          // We need to set a timeout to ensure the editor widget is fully rendered. We
          // then grab it from the DOM stack
          // šī daļa ir, lai ar back pogu atgrieztos no Editora uz popup
          setTimeout(() => {
              // Use the editor's back button as a way to cancel out of editing
              const shadowLine1 = bzEditor.domNode.getElementsByTagName("calcite-panel")[1];
              const root1 = shadowLine1.shadowRoot;
              let backButtn = root1.querySelectorAll(".back-button")[0];
              // Add a tooltip for the back button
              backButtn.setAttribute(
                  "title",
                  "Cancel edits, return to popup"
              );
              // Add a listener to listen for when the editor's back button is clicked
              backButtn.addEventListener("click", (evt) => {
                  // Prevent the default behavior for the back button and instead remove the editor and reopen the popup
                  evt.preventDefault();
                  view.ui.remove(bzEditor);
                  view.popup.open({
                  features: features
                  });
              });        
          }, 750); // ar īsāku taimautu īsti nepietiek
        }
        
        // Event handler that fires each time "edit-this" action is clicked
        view.popup.on("trigger-action", (event) => {
            if (event.action.id === "edit-this") {
                editThis();
            }
        });

        // Editor vidžets apsekojumu un pozitīvo paraugu slāņiem. Ir atsevišķi, nevis ar izeju no popup. 
        // Būs savāžams, tāpēc sēdēs iekš "Expand widget"
        const pointEditor = new Editor({
            container: document.createElement("div"),
            view: view,
            layerInfos: [apsInfos, parInfos, {layer: buferzonas, enabled: false}]
        });

        // šo vajag paskatīties vai vajag. Tas ir, lai rādītu nevis "New feature", bet "Jauns apsekojums", "Jauns pozitīvais paraugs"
        // Varbūt var samierināties ar "New feature"
        pointEditor.viewModel.watch('state', function(state){
            if(state === 'ready'){
              setTimeout(function(){
				let bb = document.getElementsByClassName("esri-item-list__group");
                //console.log(bb);
                bb[0].lastChild.label = "Pozitīvais paraugs";
                bb[1].lastChild.label = "Apsekojums"
              }, 700);
            }
        }); // ar mazāku timeout nepietiek

        // Expand widget
        pointEditorExpand = new Expand({
            view: view,
            content: pointEditor
        });
        
        //izveidot labošanas formiņu
        izvPievienLaucinu();

      
        // 2nd Expand widget
        addPointExpand = new Expand({
          expandIconClass: "esri-icon-applications",
          view: view,
          content: newSurveyBox
        });

          
        // Add the widget to the view
        view.ui.add(addPointExpand, "top-left");
        view.ui.add(pointEditorExpand, "top-left");

        //Tabulas apsekojumiem un paraugiem
        const featureTable1 = new FeatureTable({
            view: view, // The view property must be set for the select/highlight to work
            layer: paraugi,
            container: document.getElementById("tableDiv"),
            visible: false
        });

        const featureTable2 = new FeatureTable({
            view: view, // The view property must be set for the select/highlight to work
            layer: apsekojumi,
            container: document.getElementById("tableDiv2")
        });
        const changeTables = function(){
            if(featureTable1.visible === false){
                featureTable1.visible = true;
                featureTable2.visible = false;
            } else {
                featureTable1.visible = false;
                featureTable2.visible = true;
            }
        }
        document.getElementById("mainitTabulas").addEventListener("click", changeTables);
    });
    
    //ŠIS VISS JOPOROJĀM IR, LAI DARBOTOS Editor form popup buferzonu slānim
    // Watch when the popup is visible
    view.popup.watch("visible", (event) => {
        // Check the Editor's viewModel state, if it is currently open and editing existing features, disable popups
        if (bzEditor.viewModel.state === "editing-existing-feature") {
            view.popup.close();
        } else {
            // Grab the features of the popup
            features = view.popup.features;
        }
    });

    buferzonas.on("apply-edits", () => {
        // Once edits are applied to the layer, remove the Editor from the UI
        view.ui.remove(bzEditor);

        // Iterate through the features
        features.forEach((feature) => {
            // Reset the template for the feature if it was edited
            feature.popupTemplate = template;
        });

        // Open the popup again and reset its content after updates were made on the feature
        if (features) {
            view.popup.open({
            features: features
            });
        }

        // Cancel the workflow so that once edits are applied, a new popup can be displayed
        bzEditor.viewModel.cancelWorkflow();
    }); // Te beidzas POPUP-EDITOR

    // Add sketch widget un tam piederīgās lietas
    // Ar Sketch widget ir domāts zīmēt buferzonu apaļās kontūras
    const graphicsLayerSketch = new GraphicsLayer();
    map.add(graphicsLayerSketch);

    const mainDrawingLayer = new GraphicsLayer();
    map.add(mainDrawingLayer);

    const sketch = new Sketch({
        layer: graphicsLayerSketch,
        view: view,
        creationMode: "update" // Auto-select
    });

    // function to show/hide sketch widget and buttons (in the DOM)
    const applySwitch = function(){
        const specialais = document.getElementById("specialais");
        const parasts = document.getElementById("parasts");
        const buttonDiv = document.getElementById("buttonDiv");
        if (zimetBuferzonu === true){
            if(!view.ui.find(sketch.id)){
                view.ui.add(sketch, "top-right"); 
            }
            if (!specialais.classList.contains("sstrong")){
                specialais.classList.add("sstrong");
            }
            if (parasts.classList.contains("sstrong")){
                parasts.classList.remove("sstrong");
            }
            if(view.ui.find(pointEditorExpand.id)){
                view.ui.remove(pointEditorExpand);
            }
            buttonDiv.style = "display:block";
                //MEASUREMENT WIDGET
              measurement = new Measurement({
              view: view,
              activeTool: "distance",
              container: measureDiv
            });
        
        } else {
            document.getElementById("virsraksts1").innerHTML = ":)";
            if(view.ui.find(sketch.id)){
                view.ui.remove(sketch);
            }
            if (specialais.classList.contains("sstrong")){
                specialais.classList.remove("sstrong");
            }
            if (!parasts.classList.contains("sstrong")){
                parasts.classList.add("sstrong");
            }
            if(!view.ui.find(pointEditorExpand.id)){
                view.ui.add(pointEditorExpand, "top-left");
            }
            buttonDiv.style = "display:none";   
            if (measurement){
                measurement.clear()
            }
          }
    }
    
    // ADD one shape to the layer using button
    const bzMarkButton = document.getElementById("bzMarkButton");
    const markShape = function() {
        if (polygonsToJoin.length === 1 && polygonsToJoin[0].type === "polygon"){
            const bufSymbol = {
                type: "simple-fill", // autocasts as new SimpleFillSymbol()
                color: [227, 139, 79, 0.2],
                outline: {
                    // autocasts as new SimpleLineSymbol()
                    color: [0, 255, 0],
                    width: 4
                }
            };
            mainDrawingLayer.add(
                new Graphic({
                    geometry: polygonsToJoin[0],
                    symbol: bufSymbol
                })
            );
            array = [];
            saveButton.addEventListener("click", applyEditsToBzLayer);
        } else {
            console.log("something wrong with the polygon. There should be only one");

        }
    };

    //JOIN shapes using button
    const joinShapesEnable = function(array){
        joinButton.addEventListener("click", ()=>{
            if (array.length > 1){
                geometryEngineAsync.union(array).then((apvienotaBuferzona)=>{
                    array = [];
                    const bufSymbol = {
                        type: "simple-fill", // autocasts as new SimpleFillSymbol()
                        color: [227, 139, 79, 0.2],
                        outline: {
                          // autocasts as new SimpleLineSymbol()
                          color: [0, 255, 0],
                          width: 4
                        }
                    };
                    mainDrawingLayer.add(
                        new Graphic({
                          geometry: apvienotaBuferzona,
                          symbol: bufSymbol
                        })
                    );
                    saveButton.addEventListener("click", applyEditsToBzLayer);
                }).catch((e)=>{
                    console.log(e);
                });
            } else {
            console.log("vienu figūru nevar apvienot");
            }
        });
    }
    
    // Add sketch events to listen for
    sketch.on("update", (event) => {
        //console.log(event.state);
        // Create
        if (event.state === "start") {
            polygonsToJoin = [];
            event.graphics.forEach((gr)=>{
                //console.log(gr.geometry.rings[0][0]);
                if (gr.geometry.type === "polygon"){
                    polygonsToJoin.push(gr.geometry);
                }
            });
            if (polygonsToJoin.length === 1){
                bzMarkButton.addEventListener("click", markShape);
                saveButton.removeEventListener("click", applyEditsToBzLayer);
            }
            if (polygonsToJoin.length > 1){
                joinShapesEnable(polygonsToJoin);
                saveButton.removeEventListener("click", applyEditsToBzLayer);
            }
        }
        if (event.state === "complete"){
            console.log("completed");
            bzMarkButton.removeEventListener("click", markShape);
            polygonsToJoin = [];
        }    
    });

    // ar "saglabāt" pogu pievienot buferzonas slānim sazīmēto buferzonu vai sazīmēto vairāku buferzonu apvienojumu        
    function applyEditsToBzLayer (){
        const edits = {addFeatures: mainDrawingLayer.graphics};
        buferzonas.applyEdits(edits)
        .then((results)=>{
            //console.log(results);
            const t = document.getElementById("virsraksts1");
            if (results.addFeatureResults.length > 0) {
                t.innerHTML = `Pievienoto buferzonu skaits: ${results.addFeatureResults.length}`
            } else {t.innerHTML = `Nekas nav pievienots`}     
        })
        .catch((e)=>{
            console.log(e);
        })
    }
});

