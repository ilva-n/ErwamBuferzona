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
"esri/Graphic"], 
function (esriConfig,Map, MapView, Sketch, GraphicsLayer, FeatureLayer, LayerList, 
    CoordinateConversion, Measurement, geometryEngineAsync, Graphic) {
    
    esriConfig.apiKey = "AAPKc6d3103f93ba45899206b019b686405bSdAz10q6A7j-RFC6kl6u4Uor2ADR2Nf5ytv-jRE0mGW9W9zP5UscUzYTL28efgHv";
    
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
    const layerListContainer = document.getElementById("layerListContainer");
    const measureDiv = document.getElementById("measureDiv");

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
        url: "https://services1.arcgis.com/3dWrAGXGF8L1iW48/arcgis/rest/services/buferzonas/FeatureServer/0"
    });

    //MAP
    const map = new Map({
      //basemap: "arcgis-imagery" // Basemap layer
      basemap: "arcgis-topographic" ,
      layers: [ekas, mazciemi, autoceli, ielas, ciemi, pagasti, novadi]
    });
     
    //VIEW
    const view = new MapView({
        map: map,
        center: [21.114408, 56.4285096], // Longitude, latitude 
        zoom: 13, // Zoom level
        container: "viewDiv" // Div element
    });
    //COORDINATE WIDGET
    const ccWidget = new CoordinateConversion({
        view: view
    });
    view.ui.add(ccWidget, "bottom-left");
    
    //MEASUREMENT WIDGET
    const measurement = new Measurement({
        view: view,
        activeTool: "distance",
        container: measureDiv
    });
      
    //view.ui.add(measurement, "bottom-right");

    //funkcijas priekš LayerList
    function defineActions(event) {
        // The event object contains an item property. 
        // is is a ListItem referencing the associated layer
        // and other properties. You can control the visibility of the
        // item, its title, and actions using this object.

        const item = event.item;

        if (!item.title) {
          // An array of objects defining actions to place in the LayerList.
          // By making this array two-dimensional, you can separate similar
          // actions into separate groups with a breaking line.
        item.layer.listMode = "hide";
        }
    }
    
    view.when(() => {
        // Create the LayerList widget with the associated actions
        // and add it to the top-right corner of the view.

        const layerList = new LayerList({
          view: view,
          container: layerListContainer,
          // executes for each ListItem in the LayerList
          listItemCreatedFunction: defineActions         
        });

        // Event listener that fires each time an action is triggered

        layerList.on("trigger-action", (event) =>  {
            // The layer visible in the view at the time of the trigger.
            event.item.visible ? event.item.visible = false : event.item.visible = true;
 
        });

          //console.log(layerList.operationalItems.items);
          // Add widget to the top right corner of the view
          //view.ui.add(layerList, "manual"); ja ir šis, tad vidžets ir virsū uz "view"
    });

    // Add sketch widget
    const graphicsLayerSketch = new GraphicsLayer();
    map.add(graphicsLayerSketch);

    const mainDrawingLayer = new GraphicsLayer();
    map.add(mainDrawingLayer);

    const sketch = new Sketch({
        layer: graphicsLayerSketch,
        view: view,
        creationMode: "update" // Auto-select
    });

    view.ui.add(sketch, "top-right");
    
    //JOIN shapes using button
    const joinButton = document.getElementById("joinButton");
    const joinShapesEnable = function(array){
        joinButton.addEventListener("click", ()=>{
            if (array.length > 1){
                geometryEngineAsync.union(array).then((apvienotaBuferzona)=>{
                    array = [];
                    const bufSymbol = {
                        type: "simple-fill", // autocasts as new SimpleFillSymbol()
                        color: [227, 139, 79, 0.8],
                        outline: {
                          // autocasts as new SimpleLineSymbol()
                          color: [0, 255, 0],
                          width: 6
                        }
                    };
                    mainDrawingLayer.add(
                        new Graphic({
                          geometry: apvienotaBuferzona,
                          symbol: bufSymbol
                        })
                    );

                }).catch((e)=>{
                    console.log(e);
                });
            } else {
            console.log("vienu figūru nevar apvienot");
            }
        });
    }
    
    // Add sketch events to listen for and execute query
    sketch.on("update", (event) => {
        //console.log(event.state);
        // Create
        if (event.state === "start") {
            //queryFeaturelayer(event.graphics[0].geometry);
            //console.log(graphicsLayerSketch.graphics);
            let polygonsToJoin = [];
            event.graphics.forEach((gr)=>{
                //console.log(gr.geometry.rings[0][0]);
                if (gr.geometry.type === "polygon"){
                    polygonsToJoin.push(gr.geometry);
                }
            });
            if (polygonsToJoin.length > 1){
                joinShapesEnable(polygonsToJoin);
            }
        }
        if (event.state === "complete"){
            //graphicsLayerSketch.remove(event.graphics[0]); // Clear the graphic when a user clicks off of it or sketches new one
            console.log("completed");
            //event.graphics = [];
        }
        // Change
        if (event.toolEventInfo && (event.toolEventInfo.type === "scale-stop" || event.toolEventInfo.type === "reshape-stop" || event.toolEventInfo.type === "move-stop")) {
            //queryFeaturelayer(event.graphics[0].geometry);
            //console.log(graphicsLayerSketch.graphics);
            //console.log(event);
        }
        //graphicsLayerSketch.graphics.forEach(function(item){
            // Do something here to each graphic like calculate area of its geometry
           // console.log(item.geometry.type);
            //console.log(item.geometry.rings);
         // });       
    });


    // function queryFeaturelayer(geometry) {

    //     const parcelQuery = {
    //      spatialRelationship: "intersects", // Relationship operation to apply
    //      geometry: geometry,  // The sketch feature geometry
    //      outFields: ["VKUR_TIPS", "NOSAUKUMS","SORT_NOS"], // Attributes to return
    //      returnGeometry: true
    //     };

    //     ekas.queryFeatures(parcelQuery)
    //     .then((results) => {
    //         console.log(results);
    //        displayResults(results);
    
    //     }).catch((error) => {
    //       console.log(error);
    //     });
    // }
    // Show features (graphics)
    // function displayResults(results) {

    //     // Create a blue polygon
    //     const symbol = {
    //         type: "simple-marker",
    //         color: [20, 130, 200],
    //         outline: {
    //         color: "white",
    //         width: 1
    //         },
    //     };

    //     const popupTemplate = {
    //         title: "{NOSAUKUMS}",
    //         content: [{type: "fields", fieldInfos: [{fieldName: "NOSAUKUMS"}, {fieldName: "SORT_NOS"}, {fieldName: "VKUR_TIPS"}]}]
    //     };      
            
    //     // Set symbol and popup
    //     results.features.map((feature) => {
    //         feature.symbol = symbol;
    //         feature.popupTemplate = popupTemplate;
    //         return feature;
    //     });
    //         // Clear display
    //     view.popup.close();
    //     view.graphics.removeAll();
    //         // Add features to graphics layer
    //     view.graphics.addMany(results.features);   
    // }

});


// TODOS
// Editor widget - pārbaudēm vai applyEdits
// Sketch vidget - buferzonai
// UNION
// Vēl viens slānis - pārbaudēm
// geometryService.union() apvieno feature, kas ir publicētā servisā
//geometryEngineAsync 
//geometryEngine
