let table;

let worldMapImage;

let minLon, maxLon, minLat, maxLat; //variabili globali su latitudine e longitudine minima e massima

let minElevation = -6000; //limiti altitudine (elevation) per scala di colore
let maxElevation = 7000;

const volcano_radius = 6; //dimensione raggio cerchi

let hoveredVolcano = null; //x memorizzare vulcano su cui si trova mouse

let mapX, mapY, mapWidth, mapHeight; //posizione e dimensione mappa proporzionate alla finestra

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

}

//funzione per responsività, ricalcola dimensioni mappa
function calculateMapDimensions() {

  const outerMargin = 50; //margine esterno per non disegnare troppo sui bordi
  
  const availableWidth = windowWidth - 2 * outerMargin; //dimensioni massime disponibili per mappa
  const availableHeight = windowHeight - 2 * outerMargin;

  const mapRatio = 2.0; //proporzioni mappa del mondo (1/2 - 360 gradi longitudine / 180 gradi latitudine)
                        //immagine planisfero è rettangolare, ma rapporto geografico è 2:1

  if (availableWidth / availableHeight > mapRatio) {

    mapHeight = availableHeight;
    mapWidth = availableHeight * mapRatio;

  } else {

    mapWidth = availableWidth;
    mapHeight = availableWidth / mapRatio;

  }

  mapX = (windowWidth - mapWidth) / 2; //mappa sta a centro
  mapY = (windowHeight - mapHeight) / 2;

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
    const typeCategory = row.getString("TypeCategory");
    const status = row.getString("Status");
    const lastEruption = row.getString("Last Known Eruption");

    const x = map(lon, minLon, maxLon, mapX, mapX + mapWidth); //converto coordinate geografiche in coordinate pixel con funzione map
    const y = map(lat, minLat, maxLat, mapY + mapHeight, mapY); //asse Y di p5.js è invertito (0 in alto), quindi invertiamo minLat e maxLat

    let volcanoColor;

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
  
  // --- 4. Disegno degli elementi UI (Titolo e Legenda) in p5.js ---
  drawUIElements();
}

// --- Funzione per la Responsività ---
function windowResized() {
  // Ricalcola le dimensioni del canvas quando la finestra viene ridimensionata
  resizeCanvas(windowWidth, windowHeight);
  // calculateMapDimensions() è chiamato in draw()
}

// --- Funzione Tooltip (Disegna la scheda informativa) ---
function drawTooltip(x, y, content) {
    // Variabili per l'aspetto del tooltip
    const padding = 10;
    const lineHeight = 18;
    const cornerRadius = 5;

    // Calcola l'altezza del pannello in base al numero di righe
    const panelHeight = content.length * lineHeight + padding * 2;
    let panelWidth = 0;

    // Trova la larghezza massima del testo per dimensionare correttamente il pannello
    for (const item of content) {
        let currentText = (item.label || "") + (item.text || "");
        let currentWidth = textWidth(currentText);
        if (item.bold) {
            currentWidth += 10;
        }
        if (currentWidth > panelWidth) {
            panelWidth = currentWidth;
        }
    }
    panelWidth += padding * 2;

    // Posizione del pannello (a destra del cerchio)
    let panelX = x + volcano_radius / 2 + 5;
    let panelY = y - panelHeight / 2; // Centrato verticalmente rispetto al punto

    // Adatta la posizione se il pannello esce dai bordi destri o inferiori
    if (panelX + panelWidth > width) {
        // Se esce a destra, sposta a sinistra del cerchio
        panelX = x - volcano_radius / 2 - 5 - panelWidth;
    }
    if (panelY + panelHeight > height) {
        // Se esce in basso, alza il pannello
        panelY = height - panelHeight - 5;
    }
    if (panelY < 0) {
        // Se esce in alto, abbassa il pannello
        panelY = 5;
    }

    // --- Disegna il pannello di sfondo (giallo) ---
    fill(255, 255, 100); // Sfondo giallo chiaro
    rect(panelX, panelY, panelWidth + 30, panelHeight, cornerRadius);

    // --- Disegna il testo (nero) ---
    fill(0); // Testo nero
    textSize(12);
    textAlign(LEFT, TOP);
    
    let currentY = panelY + padding;

    for (const item of content) {
        const lineX = panelX + padding;
        const lineY = currentY;

        if (item.bold) {
            textStyle(BOLD);
            text(item.text, lineX, lineY);
        } else {
            textStyle(NORMAL);
            text(item.label || "", lineX, lineY);
            
            const labelWidth = textWidth(item.label || "");
            text(item.text, lineX + labelWidth, lineY);
        }

        currentY += lineHeight;
    }
    
    // Ripristina lo stile del testo
    textStyle(NORMAL);
}

// --- Funzione per disegnare gli elementi UI con p5.js ---
function drawUIElements() {
    // --- 4a. TITOLO CENTRALE (sopra) ---
    const titleText = "Volcanoes on the Earth";
    const titlePadding = 15;
    const titleHeight = 30 + 2 * titlePadding; // Calcola altezza del rettangolo
    
    // Disegna il rettangolo scuro per il titolo
    fill(0, 0, 0, 100); // Nero semi-trasparente
    noStroke();
    // Lo disegniamo sopra il canvas a tutta larghezza
    rect(0, 0, windowWidth, titleHeight, 0, 0, 10, 10); // Angoli arrotondati in basso

    // Disegna il testo del titolo
    fill(255); // Bianco
    textSize(24);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    text(titleText, windowWidth / 2, titleHeight / 2);


    // --- 4b. LEGENDA ALTITUDINE (a destra) ---
    const legendWidth = 150;
    const legendHeight = 110;
    const legendX = windowWidth - legendWidth - 10;
    const legendY = 50 + titleHeight; // Sotto il titolo con un piccolo margine
    
    // Disegna il pannello di sfondo
    fill(139, 69, 19, 180); // Marrone scuro semi-trasparente
    rect(legendX, legendY, legendWidth, legendHeight, 10); // Angoli arrotondati

    // Titolo Legenda
    fill(255); // Bianco
    textSize(16);
    textAlign(CENTER, TOP);
    textStyle(BOLD);
    text("Elevation", legendX + legendWidth / 2, legendY + 10);
    
    // Barra del Colore
    const barY = legendY + 35;
    const barHeight = 20;
    const halfBarWidth = legendWidth * 0.45; // Lascia un po' di margine

    // Disegno la sfumatura di colore (dal blu al rosso)
    noStroke();
    for (let i = 0; i <= legendWidth; i++) {
        let xPos = legendX + i;
        let c;
        let elevationValue;

        if (i < legendWidth / 2) {
            // Lato sinistro (Blu, altitudine negativa)
            elevationValue = map(i, 0, legendWidth / 2, minElevation, 0);
            const lightBlue = color("#7cd1ffff");
            const darkBlue = color("#221ba0ff");
            const ratio = map(i, 0, legendWidth / 2, 0, 1);
            c = lerpColor(darkBlue, lightBlue, ratio);
        } else {
            // Lato destro (Rosso, altitudine positiva)
            elevationValue = map(i, legendWidth / 2, legendWidth, 0, maxElevation);
            const lightRed = color("#ff9b7cff");
            const darkRed = color("#8c0a0aff");
            const ratio = map(i, legendWidth / 2, legendWidth, 0, 1);
            c = lerpColor(lightRed, darkRed, ratio);
        }

        stroke(c);
        line(xPos, barY, xPos, barY + barHeight);
    }
    
    // Etichette Numeriche
    textStyle(NORMAL);
    textSize(10);
    textAlign(LEFT, CENTER);
    text("-6000m", legendX + 5, barY + barHeight + 15);
    
    textAlign(CENTER, CENTER);
    text("0m", legendX + legendWidth / 2, barY + barHeight + 15);

    textAlign(RIGHT, CENTER);
    text("7000m", legendX + legendWidth - 5, barY + barHeight + 15);

    // Ripristina lo stile del testo
    textStyle(NORMAL);
    noStroke();
}