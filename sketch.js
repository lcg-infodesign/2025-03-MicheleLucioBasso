let table;

let worldMapImage;

let minLon, maxLon, minLat, maxLat; //variabili globali su latitudine e longitudine minima e massima

let minElevation = -6000; //limiti altitudine (elevation) per scala di colore
let maxElevation = 7000;

const volcano_radius = 6; //dimensione raggio cerchi

let hoveredVolcano = null; //x memorizzare vulcano su cui si trova mouse

let mapX, mapY, mapWidth, mapHeight; //posizione e dimensione mappa proporzionate alla finestra

let legendCategoryX, legendCategoryY, legendCategoryWidth, legendCategoryHeight; //variabili per posizione e dimensione legenda Type Category
let legendCategoryMargin = 50; //margine sotto legenda Elevation
let activeLegend = 'Elevation'; //x tracciare legenda attiva, di default 'Elevation' (Stroke giallo)
let categoryColors = {}; //array x memorizzare colori di ogni categoria di Type Category
let categoryPalette = ['#f44336', '#ff9800', '#4caf50', '#2196f3', '#9c27b0', '#ffeb3b', '#795548', '#00bcd4']; //colori legenda Type Category

function preload() {

  table = loadTable("volcanoes-2025-10-27 - Es.3 - Original Data.csv", "csv", "header");

  worldMapImage = loadImage("mappamondo1.png");

}

function setup() {

  createCanvas(windowWidth, windowHeight);

  background("#4b2a1cff");

  minLon = -180; //limiti di latitudine e longitudine
  maxLon = 180;
  minLat = -90;
  maxLat = 90;

  console.log("Dati caricati, numero di righe:", table.getRowCount());

  let uniqueCategories = table.getColumn('TypeCategory').filter((v, i, a) => a.indexOf(v) === i && v !== ''); //trova Type Categories uniche

  uniqueCategories.sort(); //ordina categorie x coerenza assegnazione colore

  for (let i = 0; i < uniqueCategories.length; i++) {

    let category = uniqueCategories[i];
    categoryColors[category] = categoryPalette[i % categoryPalette.length]; //assegna colore ciclicamente dalla palette

  }

}

//funzione per responsività, ricalcola dimensioni mappa
function calculateMapDimensions() {
            
            const verticalMargin = 50; //margine superiore e inferiore
            const mapLeftMargin = 80; //margine fisso a sinistra
            const reservedRightSpace = 220; //spazio riservato a destra per legenda
            
            const availableWidth = windowWidth - mapLeftMargin - reservedRightSpace; //dimensioni massime disponibili per mappa
            const availableHeight = windowHeight - 2 * verticalMargin;

            const mapRatio = 2.0; //proporzioni mappa del mondo (1/2 - 360 gradi longitudine / 180 gradi latitudine)
                                  //immagine planisfero è rettangolare, ma rapporto geografico è 2:1

            if (availableWidth / availableHeight > mapRatio) {

                mapHeight = availableHeight;

                mapWidth = availableHeight * mapRatio;

            } else {

                mapWidth = availableWidth;

                mapHeight = availableWidth / mapRatio;

            }

            mapX = mapLeftMargin; //coordinata X mappa
            mapY = (windowHeight - mapHeight) / 2 + 20; //coordinata Y mappa
            
            //calcolo posizione e dimensioni legenda type category
            const legendWidth = 150; //larghezza base legenda Elevation
            const titleHeight = 30 + 2 * 15; //altezza titolo superiore
            const legendY_Elevation = 25 + titleHeight; //posizione Y legenda Elevation
            const elevationRectHeight = 110; // altezza rettangolo Elevation 

            legendCategoryX = windowWidth - legendWidth - 40; //stessa X di Elevation
            legendCategoryY = legendY_Elevation + elevationRectHeight + legendCategoryMargin; //posizione Y = Y di Elevation + Altezza Elevation + Margine
            legendCategoryWidth = legendWidth; 
            
            //calcola altezza necessaria in base a numero categorie
            const lineHeight = 18; 
            const numCategories = Object.keys(categoryColors).length;
            // Altezza: 10px(margine sup) + Title (16px) + 18px(spazio) + Legend (10px) + 18px(spazio) + righe Categorie (numCategories * lineHeight) + 10px(margine inf)
            legendCategoryHeight = (3 + numCategories) * lineHeight + 40; //x stimare l'altezza: 3 righe fisse + righe variabili + margine extra (40px)

        }

function draw() {

  calculateMapDimensions(); //ricalcola dimensioni mappa in ogni ciclo, per responsiveness

  background("#713f2cff"); //ridisegna sfondo a ogni ciclo

  hoveredVolcano = null; //variabile per memorizzare punto su cui mouse passa sopra
  
  image(worldMapImage, mapX, mapY, mapWidth, mapHeight);

  //ciclo per disegnare cerchi
  for (let i = 0; i < table.getRowCount(); i++) {

    const row = table.getRow(i);

    const lat = parseFloat(row.getString("Latitude")); //parseFloat() arrotonda numero, leva virgola
    const lon = parseFloat(row.getString("Longitude"));
    const elevation = parseFloat(row.getString("Elevation (m)"));
    const name = row.getString("Volcano Name");
    const country = row.getString("Country");
    const type = row.getString("Type");
    const typeCategory = row.getString("TypeCategory"); // Legge la Type Category
    const status = row.getString("Status"); 
    const lastEruption = row.getString("Last Known Eruption");

    const x = map(lon, minLon, maxLon, mapX, mapX - 18 + mapWidth); //converto coordinate geografiche in coordinate pixel con funzione map
    const y = map(lat, minLat, maxLat, mapY + mapHeight, mapY); //asse Y di p5.js è invertito (0 in alto), quindi invertiamo minLat e maxLat

    let volcanoColor;

    //colore in base a legenda attiva
    if (activeLegend === 'Elevation') { //se attiva legenda Elevation, usa logica Elevation
        //mappatura colori, basata su altitudine (vd. lgenda)
        if (elevation >= 0) { //vulcani con altezza positiva (sfumatura da rosso chiaro a rosso scuro)

          const lightRed = color("#ff9b7cff");
          const darkRed = color("#8c0a0aff");
          const colorRatio = map(elevation, 0, maxElevation, 0, 1, true); //true costringe valore rimappato entro l'intervallo 0 - 1
          volcanoColor = lerpColor(lightRed, darkRed, colorRatio); //lerpColor() crea sfumatura tra due colori (primi 2 argomenti), in base al 3° argomento (valore min = 0, max = 1) per questo ho mappato in intervallo 0 - 1

        } else { //vulcani con altezza negativa (sfumatura da blu chiaro a blu scuro)

          const lightBlue = color("#7cd1ffff");
          const darkBlue = color("#221ba0ff");
          const colorRatio = map(elevation, minElevation, 0, 0, 1, true); //true costringe valore rimappato entro l'intervallo 0 - 1
          volcanoColor = lerpColor(darkBlue, lightBlue, colorRatio); //lerpColor() crea sfumatura tra due colori (primi 2 argomenti), in base al 3° argomento (valore min = 0, max = 1) per questo ho mappato in intervallo 0 - 1
          
        }
    } else if (activeLegend === 'Type category') { //se attiva legenda Type Category, usa colore mappato
        
        //colora in basea type cateogru
        volcanoColor = categoryColors[typeCategory] ? color(categoryColors[typeCategory]) : color(255, 255, 255, 150); 

    }

    //interazione minima con mouse quando vado sul singolo pallino, calcolo distanza tra posizione mouse e centro pallino
    const d = dist(mouseX, mouseY, x, y);

    if (d < volcano_radius / 2) { //se mouse sopra cerchio

      //salva tutti dati necessari per tooltip
      hoveredVolcano = {

        x: x,
        y: y,
        name: name,
        country: country,
        elevation: elevation,
        type: type,
        typeCategory: typeCategory,
        status: status,
        lastEruption: lastEruption

      };
      
      cursor('pointer'); //cambia icona mouse in indice alzato

    }
    
    noStroke(); //cerchio vulcani
    fill(volcanoColor);
    ellipse(x, y, volcano_radius, volcano_radius);
  }

  drawUIElements(); //diesegno titolo ed legenda elevation
  
  drawTypeCategoryLegend();

  //tooltip
  if (hoveredVolcano) {

    const tooltipContent = [ //testo tooltip, mostra nome, country, altitude, type, type cateogry, status, last known eruption
      { text: hoveredVolcano.name, bold: true },
      { label: "Country:", text: hoveredVolcano.country },
      { label: "", text: `${hoveredVolcano.elevation}m` }, 
      { label: "Type:", text: hoveredVolcano.type },
      { label: "Type category:", text: hoveredVolcano.typeCategory },
      { label: "Status:", text: hoveredVolcano.status },
      { label: "Last known eruption:", text: hoveredVolcano.lastEruption }
    ];

    drawTooltip(hoveredVolcano.x, hoveredVolcano.y, tooltipContent); //disegna tooltip

  } else {

    cursor('default'); //se non sopra vulcano, reimposta icona mouse normale

  }

}

function windowResized() { //funzione responsiveness

  resizeCanvas(windowWidth, windowHeight); //ricalcola dimensioni canvas quando finestra ridimensionata
  calculateMapDimensions(); //ricalcola posizioni elementi UI

}

function drawTooltip(x, y, content) { //tooltip giallo

    const padding = 10;
    const lineHeight = 18; //altezza riga
    const cornerRadius = 5;

    const panelHeight = content.length * lineHeight + padding * 2; //calcola altezza tooltip in base a numero righe
    let panelWidth = 0;

    //ciclo trova larghezza massima testo, x dimensionare correttamente pannello
    for (const item of content) {

        let currentText = (item.label || "") + (item.text || ""); //combina etichetta (es. "Country:") e testo (es. "Canada") in unica stringa
                                                                  // || "" (or vuoto) assicura che se item.label o item.text non esistono (es. vulcano Unnamed), venga usata stringa vuota
        let currentWidth = textWidth(currentText); //textWidth() misura larghezza in pixel stringa currentText sul canvas, usando dimensione font e stile correnti

        if (item.bold) {

            currentWidth += 10; //se elemento corrente in grassetto (item.bold vero), aggiunto piccolo margine di 10px a larghezza

        }
        
        if (currentWidth > panelWidth) { //blocco verifica se larghezza testo corrente > larghezza massima finora trovata (panelWidth)

            panelWidth = currentWidth; //se si, panelWidth aggiornata a nuovo valore massimo
                                       //a termine ciclo, panelWidth conterrà larghezza in pixel riga di testo più lunga del tooltip
        }
    }

    panelWidth += padding * 2; //a larghezza massima testo, viene aggiunto padding * 2, x avere margine interno (padding) tra testo e bordi sinistro e destro del tooltip

    let panelX = x + volcano_radius + 5; //posizione pannello
    let panelY = y - panelHeight / 2; //centrato verticalmente rispetto al punto

    //adatta posizione tooltip se esce da bordi destri o inferiori
    if (panelX + panelWidth > width) {

      panelX = x - volcano_radius / 2 - 5 - panelWidth; //se esce a destra, sposta a sinistra del cerchio

    }

    if (panelY + panelHeight > height) {

        panelY = height - panelHeight - 5; //se esce in basso, alza tooltip

    }

    if (panelY < 0) {

      panelY = 50; //se esce in alto, abbassa tooltip

    }

    fill("#ffff4cff");
    rect(panelX, panelY, panelWidth + 30, panelHeight, cornerRadius);

    fill("#000000ff");
    textSize(12);
    textAlign(LEFT, TOP);
    
    let currentY = panelY + padding; //testo 1^ riga inizia da altezza Y + padding

    for (const item of content) {

        const lineX = panelX + padding; //posizione X e Y testo
        const lineY = currentY;

        if (item.bold) { //se array const tooltipContent[] ha bold:true per quell'item

            textStyle(BOLD);
            text(item.text, lineX, lineY);

        } else {

            textStyle(NORMAL);
            text(item.label || "", lineX, lineY); //scrive etichetta tooltip (es. Country:)
            
            const labelWidth = textWidth(item.label || ""); //larghezza in px etichetta appena disegnata
            text(item.text, lineX + labelWidth, lineY); //disegna testo (item.text - es. "Stratovolcano") non a lineX, ma a lineX + labelWidth, così posiziona scritta dopo fine etichetta (es. type:Stratovolcano)
        
          }

        currentY += lineHeight; //dopo disegnato 1 riga, currentY aumentata di lineHeight (altezza riga) x prossima riga

    }
    
    textStyle(NORMAL); //ripristina stile testo

}

//funzione che disegna elementi UI (Legenda Elevation)
function drawUIElements() {

    const titleText = "Volcanoes on the Earth"; //titolo
    const titlePadding = 15;
    const titleHeight = 30 + 2 * titlePadding; //calcola altezza rettangolo
    
    //rettangolo marrone scuro titolo
    fill(0, 0, 0, 100); //nero semi-trasparente
    noStroke();
    rect(0, 0, windowWidth, titleHeight, 0, 0, 10, 10); //angoli arrotondati in basso

    fill("#ffffff"); //titolo
    textSize(24);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    text(titleText, windowWidth / 2, titleHeight / 2);

    const legendWidth = 150; //legenda elevation
    const legendHeight = 110;
    const legendX = windowWidth - legendWidth - 40;
    const legendY = 25 + titleHeight; //sotto titolo con piccolo margine
    
    if (activeLegend === 'Elevation') { //applica stroke solo se 'Elevation' è legenda attiva

        stroke("#fffb00ff");
        strokeWeight(3);

    } else {

        noStroke();

    }
    
    fill("#412f09ff"); //sfondo legenda
    rect(legendX, legendY, legendWidth, legendHeight, 10); //angoli arrotondati
    
    noStroke(); //toglie stroke x resto disegno

    fill("#ffffff"); //titolo legenda
    textSize(16);
    textAlign(CENTER, TOP);
    textStyle(BOLD);
    text("Elevation", legendX + legendWidth / 2, legendY + 10);
    
    const barY = legendY + 35; //rettangolo sfumato (bar)
    const barHeight = 20;
    const halfBarWidth = legendWidth * 0.45;

    noStroke();
    
    for (let i = 0; i <= legendWidth; i++) { //sfumatura rettangolo legenda

        let xPos = legendX + i;
        let c;
        let elevationValue;

        if (i < legendWidth / 2) { //sfumatura blu
            
            elevationValue = map(i, 0, legendWidth / 2, minElevation, 0); //mappa entro intervallo tra -6000 - 0
            const lightBlue = color("#7cd1ffff");
            const darkBlue = color("#221ba0ff");
            const ratio = map(i, 0, legendWidth / 2, 0, 1); //mappa entro intervallo 0 - 1
            c = lerpColor(darkBlue, lightBlue, ratio); //lerpColor() crea sfumatura tra due colori (primi 2 argomenti), in base al 3° argomento (valore min = 0, max = 1) per questo ho mappato in intervallo 0 - 1

        } else { //sfumatura rossa
            
            elevationValue = map(i, legendWidth / 2, legendWidth, 0, maxElevation); //mappa entro intervallo tra 0 - 7000
            const lightRed = color("#ff9b7cff");
            const darkRed = color("#8c0a0aff");
            const ratio = map(i, legendWidth / 2, legendWidth, 0, 1); //mappa entro intervallo 0 - 1
            c = lerpColor(lightRed, darkRed, ratio); //lerpColor() crea sfumatura tra due colori (primi 2 argomenti), in base al 3° argomento (valore min = 0, max = 1) per questo ho mappato in intervallo 0 - 1
        }

        stroke(c);
        line(xPos, barY, xPos, barY + barHeight);
    }
    
    noStroke();

    textStyle(NORMAL); //dati legenda
    textSize(10);
    textAlign(LEFT, CENTER);
    text("-6000m", legendX + 5, barY + barHeight + 15);
    
    textAlign(CENTER, CENTER);
    text("0m", legendX + legendWidth / 2, barY + barHeight + 15);

    textAlign(RIGHT, CENTER);
    text("7000m", legendX + legendWidth - 5, barY + barHeight + 15);

}

function drawTypeCategoryLegend() {
    
    //variabili ricalcolate per categoria
    const rectX = legendCategoryX;
    const rectY = legendCategoryY;
    const rectW = legendCategoryWidth;
    const rectH = legendCategoryHeight;
    const padding = 10; //margine interno
    const lineHeight = 18; //altezza riga testo
    let currentY = rectY + padding; //inizia dopo margine superiore

    if (activeLegend === 'Type category') { //applica stroke solo se type category è la legenda attiva

        stroke("#fffb00ff");
        strokeWeight(3);

    } else {

        noStroke();

    }

    fill("#412f09ff");
    rect(rectX, rectY, rectW, rectH, 10); //angoli arrotondati
    
    noStroke(); //toglie stroke x resto disegno

    fill(255);
    textSize(16);
    textAlign(CENTER, TOP);
    textStyle(BOLD);
    text("Type category", rectX + rectW / 2, currentY);
    currentY += 25; //sposta Y x testo successivo
    
    textSize(12);
    textAlign(LEFT, TOP);
    textStyle(NORMAL);
    text("Legend", rectX + padding, currentY);
    currentY += 18; //sposta Y x categorie

    //ciclo itera su tutte categorie
    for (let category in categoryColors) {

        let catColor = categoryColors[category];
        
        fill(catColor);//quadrato colorato legenda
        rect(rectX + padding, currentY, 12, 12);
        
        fill("#ffffff"); //testo legenda
        textSize(12);
        textAlign(LEFT, TOP);
        textStyle(NORMAL);
        text(category, rectX + padding + 15, currentY); //15px di spazio dopo il quadrato
        
        currentY += lineHeight; //passa a riga successiva
    }
}

function mouseClicked() {
    
    const legendWidth = 150; 
    const legendHeight = 110;
    const legendX = windowWidth - legendWidth - 40;
    const titleHeight = 30 + 2 * 15;
    const legendY_Elevation = 25 + titleHeight;

    //coordinate rettangolo legenda elevation
    const elevationRectX = legendX;
    const elevationRectY = legendY_Elevation;
    const elevationRectWidth = legendWidth;
    const elevationRectHeight = legendHeight;
    
    //coordinate rettangolo type category
    const categoryRectX = legendCategoryX;
    const categoryRectY = legendCategoryY;
    const categoryRectW = legendCategoryWidth;
    const categoryRectH = legendCategoryHeight;

    //controlla se click avvenuto su legenda elevation
    if (mouseX >= elevationRectX && mouseX <= elevationRectX + elevationRectWidth &&
        mouseY >= elevationRectY && mouseY <= elevationRectY + elevationRectHeight) {
        
        activeLegend = 'Elevation'; //imposta elevation attiva quando si apre sito

    } 
    //controlla se click avvenuto su legenda type category
    else if (mouseX >= categoryRectX && mouseX <= categoryRectX + categoryRectW &&
             mouseY >= categoryRectY && mouseY <= categoryRectY + categoryRectH) {
        
        activeLegend = 'Type category'; //imposta type category attiva
    }
}