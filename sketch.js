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

// --- Funzione Preload (Caricamento Asset) ---
function preload() {
  // Carica il file CSV dei vulcani
  // Il nome del file deve corrispondere a quello caricato: "volcanoes-2025-10-27 - Es.3 - Original Data.csv"
  // L'opzione "header" indica che la prima riga contiene i nomi delle colonne
  table = loadTable("volcanoes-2025-10-27 - Es.3 - Original Data.csv", "csv", "header");

  // Carica l'immagine del planisfero
  worldMapImage = loadImage("world_map_dark_gray.png");
}

// --- Funzione Setup (Configurazione Iniziale) ---
function setup() {
  // Crea il canvas con ampiezza e altezza pari alla finestra del browser
  createCanvas(windowWidth, windowHeight);

  // Imposta il colore di sfondo (marrone chiaro, come richiesto)
  background(210, 180, 140); // Colore tan/marrone chiaro

  // Imposta i limiti di latitudine e longitudine.
  // Usiamo i limiti estremi della Terra per mappare correttamente il planisfero.
  // Si potrebbero anche calcolare i limiti dai dati, ma -180/180 e -90/90 sono più generici.
  minLon = -180;
  maxLon = 180;
  minLat = -90;
  maxLat = 90;

  // Se i dati hanno le colonne Elevation (m) e TypeCategory che contengono spazi,
  // dobbiamo usare i nomi esatti.
  // Nel file .csv le colonne sono: "Latitude", "Longitude", "Elevation (m)", "Type", "TypeCategory", "Status", "Last Known Eruption", "Volcano Name", "Country".
  console.log("Dati caricati. Numero di righe:", table.getRowCount());
}

// --- Funzione Disegno (Loop Principale) ---
function draw() {
  // Ridisegna lo sfondo ad ogni ciclo per pulire il canvas
  background(210, 180, 140);

  // Inizializza la variabile del vulcano hoverato a null
  hoveredVolcano = null;

  // Variabili per la posizione e dimensione del planisfero
  const mapWidth = windowWidth * 0.66; // Circa 2/3 della windowWidth
  const mapHeight = mapWidth * (worldMapImage.height / worldMapImage.width); // Mantiene le proporzioni
  const mapX = (windowWidth - mapWidth) / 2;
  const mapY = (windowHeight - mapHeight) / 2;

  // --- Disegno del Planisfero ---
  image(worldMapImage, mapX, mapY, mapWidth, mapHeight);

  // Rimuove il bordo (stroke) per i cerchi dei vulcani
  noStroke();

  // Cicla su tutte le righe dei dati
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

    // --- Mappatura delle Coordinate ---

    // Mappa la longitudine (lon) sulle coordinate X del canvas
    // Usiamo 'mapX' e 'mapWidth' per limitare il disegno all'area del planisfero
    const x = map(lon, minLon, maxLon, mapX, mapX + mapWidth);

    // Mappa la latitudine (lat) sulle coordinate Y del canvas.
    // L'asse Y di p5.js è invertito (0 in alto), quindi invertiamo minLat e maxLat.
    const y = map(lat, minLat, maxLat, mapY + mapHeight, mapY);

    // --- Mappatura dei Colori (Elevation) ---
    let volcanoColor;

    if (elevation >= 0) {
      // Vulcani con altezza positiva (sfumatura da rosso chiaro a rosso scuro)
      // La funzione 'lerpColor' calcola un colore intermedio tra due colori
      const lightRed = color(255, 160, 122); // Corallo chiaro
      const darkRed = color(139, 0, 0);       // Rosso scuro
      // Mappiamo l'altitudine tra 0 e maxElevation (7000m)
      const colorRatio = map(elevation, 0, maxElevation, 0, 1, true); // true per clamp
      volcanoColor = lerpColor(lightRed, darkRed, colorRatio);
    } else {
      // Vulcani con altezza negativa (sfumatura da blu chiaro a blu scuro)
      // Mappiamo l'altitudine tra minElevation (-6000m) e 0
      const lightBlue = color(173, 216, 230); // Azzurro chiaro
      const darkBlue = color(0, 31, 63);      // Blu scuro (quasi navy)
      // Il rapporto deve andare da 0 (per -6000m) a 1 (per 0m)
      const colorRatio = map(elevation, minElevation, 0, 0, 1, true);
      volcanoColor = lerpColor(darkBlue, lightBlue, colorRatio);
    }

    // Imposta il colore di riempimento
    fill(volcanoColor);

    // --- Interazione con il Mouse ---
    const d = dist(mouseX, mouseY, x, y);

    if (d < VOLCANO_RADIUS / 2) {
      // Se il mouse è sopra il cerchio
      // 1. Cambia il colore del cerchio a un giallo brillante per feedback
      fill(255, 255, 0);

      // 2. Salva tutti i dati necessari per il tooltip
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
      
      // Impedisce che il cursore torni "default" al di fuori del loop di disegno
      cursor('pointer');

    }
    
    // Disegna il cerchio
    ellipse(x, y, VOLCANO_RADIUS, VOLCANO_RADIUS);
  }

  // --- TOOLTIP (Disegnato per ultimo per essere in primo piano) ---
  if (hoveredVolcano) {
    // Testo del tooltip formattato
    const tooltipContent = [
      { text: hoveredVolcano.name, bold: true },
      { label: "Country:", text: hoveredVolcano.country },
      // L'altitudine deve essere mostrata direttamente con 'm' accanto
      { label: "", text: `${hoveredVolcano.elevation}m` }, 
      { label: "Type:", text: hoveredVolcano.type },
      { label: "Type category:", text: hoveredVolcano.typeCategory },
      { label: "Status:", text: hoveredVolcano.status },
      { label: "Last known eruption:", text: hoveredVolcano.lastEruption }
    ];

    // Chiama la funzione per disegnare il tooltip
    drawTooltip(hoveredVolcano.x, hoveredVolcano.y, tooltipContent);

  } else {
    // Nessun vulcano è stato hoverato, torna al cursore normale
    cursor('default');
  }
}

// --- Funzione per la Responsività ---
function windowResized() {
  // Ricalcola le dimensioni del canvas quando la finestra viene ridimensionata
  resizeCanvas(windowWidth, windowHeight);
  // Il draw() loop gestirà il riposizionamento del planisfero e dei vulcani
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
            // Aggiungo un po' di margine se è in grassetto
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
    fill(255, 255, 100); // Sfondo giallo chiaro come richiesto
    rect(panelX, panelY, panelWidth, panelHeight, cornerRadius);

    // --- Disegna il testo (nero) ---
    fill(0); // Testo nero
    textSize(12);
    textAlign(LEFT, TOP);
    
    let currentY = panelY + padding;

    for (const item of content) {
        const lineX = panelX + padding;
        const lineY = currentY;

        // Se è in grassetto, usa il font grassetto
        if (item.bold) {
            textStyle(BOLD);
            text(item.text, lineX, lineY);
        } else {
            textStyle(NORMAL);
            // Disegna l'etichetta (es: "Country:")
            text(item.label || "", lineX, lineY);
            
            // Disegna il valore, posizionato subito dopo l'etichetta
            const labelWidth = textWidth(item.label || "");
            text(item.text, lineX + labelWidth, lineY);
        }

        currentY += lineHeight;
    }
    
    // Ripristina lo stile del testo
    textStyle(NORMAL);
}