// --- Variabili Globali ---
// Variabile per i dati dei vulcani
let table;

// Variabile per l'immagine del planisfero
let worldMapImage;

// Variabili per i limiti delle coordinate (per il mapping)
let minLon, maxLon, minLat, maxLat;

// Limiti di altitudine (elevation) per la scala di colore
let minElevation = -6000; // Valore minimo stimato per l'altitudine negativa
let maxElevation = 7000;  // Valore massimo stimato per l'altitudine positiva

// Dimensione fissa del raggio dei cerchi
const VOLCANO_RADIUS = 6;

// Variabile per memorizzare il vulcano su cui si trova il mouse (per il tooltip)
let hoveredVolcano = null;

// Variabili per la posizione e dimensione della mappa calibrate sulla finestra
let mapX, mapY, mapWidth, mapHeight;

// --- Funzione Preload (Caricamento Asset) ---
function preload() {
  // Carica il file CSV dei vulcani
  table = loadTable("volcanoes-2025-10-27 - Es.3 - Original Data.csv", "csv", "header");

  // Carica l'immagine del planisfero (AGGIORNATO CON IL NUOVO NOME FILE)
  worldMapImage = loadImage("mappamondo1.png");
}

// --- Funzione Setup (Configurazione Iniziale) ---
function setup() {
  // Crea il canvas con ampiezza e altezza pari alla finestra del browser
  createCanvas(windowWidth, windowHeight);

  // Imposta il colore di sfondo (marrone chiaro, come richiesto)
  background(210, 180, 140); // Colore tan/marrone chiaro

  // Imposta i limiti di latitudine e longitudine.
  minLon = -180;
  maxLon = 180;
  minLat = -90;
  maxLat = 90;

  console.log("Dati caricati. Numero di righe:", table.getRowCount());
}

// --- Funzione per la Responsività (ricalcola le dimensioni della mappa) ---
function calculateMapDimensions() {
  // Margine esterno per non disegnare troppo sui bordi e lasciare spazio per la UI di p5
  const outerMargin = 50; 
  
  // Calcola le dimensioni massime disponibili per la mappa
  const availableWidth = windowWidth - 2 * outerMargin;
  const availableHeight = windowHeight - 2 * outerMargin;

  // Proporzioni della mappa del mondo (1:2 - 360 gradi longitudine / 180 gradi latitudine)
  // L'immagine del planisfero è rettangolare, ma il rapporto geografico è 2:1
  const mapRatio = 2.0; 

  if (availableWidth / availableHeight > mapRatio) {
    // Limitato dall'altezza
    mapHeight = availableHeight;
    mapWidth = availableHeight * mapRatio;
  } else {
    // Limitato dalla larghezza
    mapWidth = availableWidth;
    mapHeight = availableWidth / mapRatio;
  }

  // Centra la mappa
  mapX = (windowWidth - mapWidth) / 2;
  mapY = (windowHeight - mapHeight) / 2;
}

// --- Funzione Disegno (Loop Principale) ---
function draw() {
  // Ricalcola le dimensioni della mappa in ogni ciclo (per gestire resize dinamico)
  calculateMapDimensions();

  // Ridisegna lo sfondo ad ogni ciclo per pulire il canvas
  background(210, 180, 140);

  // Inizializza la variabile del vulcano hoverato a null
  hoveredVolcano = null;
  
  // --- 1. Disegno del Planisfero ---
  // L'immagine viene deformata leggermente per adattarsi esattamente al rapporto 2:1 delle coordinate reali
  image(worldMapImage, mapX, mapY, mapWidth, mapHeight);

  // Rimuove il bordo (stroke) per i cerchi dei vulcani
  noStroke();

  // --- 2. Disegno dei Vulcani ---
  for (let i = 0; i < table.getRowCount(); i++) {
    const row = table.getRow(i);

    // Estraggo i dati della riga corrente
    const lat = parseFloat(row.getString("Latitude"));
    const lon = parseFloat(row.getString("Longitude"));
    const elevation = parseFloat(row.getString("Elevation (m)"));
    const name = row.getString("Volcano Name");
    const country = row.getString("Country");
    const type = row.getString("Type");
    const typeCategory = row.getString("TypeCategory");
    const status = row.getString("Status");
    const lastEruption = row.getString("Last Known Eruption");

    // --- Mappatura delle Coordinate (CORRETTA) ---

    // Mappa la longitudine (lon) sulle coordinate X del canvas
    const x = map(lon, minLon, maxLon, mapX, mapX + mapWidth);

    // Mappa la latitudine (lat) sulle coordinate Y del canvas.
    // L'asse Y di p5.js è invertito (0 in alto), quindi invertiamo minLat e maxLat.
    const y = map(lat, minLat, maxLat, mapY + mapHeight, mapY);

    // --- Mappatura dei Colori (Elevation) ---
    let volcanoColor;

    if (elevation >= 0) {
      // Vulcani con altezza positiva (sfumatura da rosso chiaro a rosso scuro)
      const lightRed = color(255, 160, 122); // Corallo chiaro
      const darkRed = color(139, 0, 0);       // Rosso scuro
      const colorRatio = map(elevation, 0, maxElevation, 0, 1, true); // true per clamp
      volcanoColor = lerpColor(lightRed, darkRed, colorRatio);
    } else {
      // Vulcani con altezza negativa (sfumatura da blu chiaro a blu scuro)
      const lightBlue = color(173, 216, 230); // Azzurro chiaro
      const darkBlue = color(0, 31, 63);      // Blu scuro (quasi navy)
      const colorRatio = map(elevation, minElevation, 0, 0, 1, true);
      volcanoColor = lerpColor(darkBlue, lightBlue, colorRatio);
    }

    // Imposta il colore di riempimento
    fill(volcanoColor);

    // --- Interazione con il Mouse ---
    const d = dist(mouseX, mouseY, x, y);

    if (d < VOLCANO_RADIUS / 2) {
      // Se il mouse è sopra il cerchio
      fill(255, 255, 0); // Giallo brillante per feedback

      // Salva tutti i dati necessari per il tooltip
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
      
      cursor('pointer');

    }
    
    // Disegna il cerchio
    ellipse(x, y, VOLCANO_RADIUS, VOLCANO_RADIUS);
  }

  // --- 3. TOOLTIP (Disegnato per ultimo) ---
  if (hoveredVolcano) {
    const tooltipContent = [
      { text: hoveredVolcano.name, bold: true },
      { label: "Country:", text: hoveredVolcano.country },
      { label: "", text: `${hoveredVolcano.elevation}m` }, 
      { label: "Type:", text: hoveredVolcano.type },
      { label: "Type category:", text: hoveredVolcano.typeCategory },
      { label: "Status:", text: hoveredVolcano.status },
      { label: "Last known eruption:", text: hoveredVolcano.lastEruption }
    ];
    drawTooltip(hoveredVolcano.x, hoveredVolcano.y, tooltipContent);
  } else {
    cursor('default');
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
    let panelX = x + VOLCANO_RADIUS / 2 + 5;
    let panelY = y - panelHeight / 2; // Centrato verticalmente rispetto al punto

    // Adatta la posizione se il pannello esce dai bordi destri o inferiori
    if (panelX + panelWidth > width) {
        // Se esce a destra, sposta a sinistra del cerchio
        panelX = x - VOLCANO_RADIUS / 2 - 5 - panelWidth;
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
            const lightBlue = color(173, 216, 230);
            const darkBlue = color(0, 31, 63);
            const ratio = map(i, 0, legendWidth / 2, 0, 1);
            c = lerpColor(darkBlue, lightBlue, ratio);
        } else {
            // Lato destro (Rosso, altitudine positiva)
            elevationValue = map(i, legendWidth / 2, legendWidth, 0, maxElevation);
            const lightRed = color(255, 160, 122);
            const darkRed = color(139, 0, 0);
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