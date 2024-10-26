// VARIABLES 
let model; // Contiendra le modèle de détection d'objets (ex. COCO-SSD)
let webcam; // Référence au flux vidéo de la webcam
let canvas; // Référence au canvas où les résultats de détection seront dessinés
let ctx; // Contexte de dessin pour le canvas
let isRunning = false; // Indicateur pour suivre l'état de la détection (active ou arrêtée)
let lastTime = 0; // Dernier moment de mesure pour calculer les FPS
let frameCount = 0; // Compteur pour les images affichées entre chaque calcul de FPS

// CONSTANTES (éléments du DOM)
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusElement = document.getElementById('status');
const fpsElement = document.getElementById('fps'); 
const objectCountElement = document.getElementById('objectCount');

// Initialisation
async function init() {
    try {
        // Chargement du modèle COCO-SSD
        statusElement.textContent = "Chargement du modèle...";
        model = await cocoSsd.load();
        statusElement.textContent = "Modèle chargé avec succès!";

        // Configuration du canvas
        webcam = document.getElementById('webcam'); 
        canvas = document.getElementById('canvas'); 
        // Définir le contexte du canvas pour les dessins 2D
        ctx = canvas.getContext('2d');

        // Ajouter les événements aux boutons
        startBtn.addEventListener('click', startDetection);
        stopBtn.addEventListener('click', stopDetection);
        
        // Activer le bouton de démarrage une fois l'initialisation terminée
        startBtn.disabled = false; 
    } catch (error) {
        statusElement.textContent = "Erreur lors de l'initialisation: " + error.message;
        console.error(error);
    }
}

// Démarrage de la détection
async function startDetection() {
    try {
        // Accéder au flux vidéo de la webcam
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: 640, 
                height: 480 
            }
        });

        // Associer le flux à l'élément vidéo de la page
        webcam.srcObject = stream; 
        webcam.addEventListener('loadeddata', () => {
            // Ajuster la taille du canvas en fonction de la taille de la webcam
            canvas.width = webcam.width;
            canvas.height = webcam.height;

            // Mettre l'indicateur à actif pour démarrer la détection
            isRunning = true; 
            // Lancer la boucle de détection
            detect();
        });

        // Désactiver le bouton de démarrage pendant la détection
        startBtn.disabled = true; 
        // Et activer le bouton d'arrêt
        stopBtn.disabled = false; 
        statusElement.textContent = "Détection en cours...";
    } catch (error) {
        statusElement.textContent = "Erreur d'accès à la caméra: " + error.message;
        console.error(error);
    }
}

// Arrêt de la détection
function stopDetection() {
    // Désactiver l'indicateur pour arrêter la détection
    isRunning = false; 
    // Récupérer le flux vidéo actuel
    const stream = webcam.srcObject; 
    // Récupérer toutes les pistes du flux (audio/vidéo)
    const tracks = stream.getTracks(); 
    // Arrêter chaque piste pour libérer la caméra
    tracks.forEach(track => track.stop()); 
    // Supprimer le flux de la webcam
    webcam.srcObject = null; 

    // Effacer le contenu du canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Réactiver le bouton de démarrage et désactiver le bouton d'arrêt
    startBtn.disabled = false; 
    stopBtn.disabled = true;
    statusElement.textContent = "Détection arrêtée";
}

// Boucle de détection
async function detect() {
    // Sortir de la fonction si la détection est arrêtée
    if (!isRunning) return;

    // Calcul des FPS pour évaluer les performances
    const currentTime = performance.now(); // Temps actuel
    frameCount++; // Incrémenter le compteur d'images
    if (currentTime - lastTime >= 1000) { // Si une seconde est écoulée
        fpsElement.textContent = frameCount; // Afficher le nombre d'images traitées
        frameCount = 0; // Réinitialiser le compteur d'images
        lastTime = currentTime; // Réinitialiser le dernier temps de mesure
    }

    try {
        // Détection des objets dans l'image actuelle de la webcam
        const predictions = await model.detect(webcam);

        // Mettre à jour l'affichage du nombre d'objets détectés
        objectCountElement.textContent = predictions.length;

        // Effacer le canvas pour redessiner les nouvelles détections
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Boucle pour dessiner chaque objet détecté
        predictions.forEach(prediction => {
            // Dessiner le rectangle autour de l'objet détecté
            ctx.strokeStyle = '#00ff00'; // Couleur verte pour le rectangle
            ctx.lineWidth = 2; // Épaisseur de ligne
            ctx.strokeRect(
                prediction.bbox[0], // Position x du rectangle
                prediction.bbox[1], // Position y du rectangle
                prediction.bbox[2], // Largeur du rectangle
                prediction.bbox[3]  // Hauteur du rectangle
            );

            // Dessiner le label et le score de confiance
            ctx.fillStyle = '#00ff00'; 
            ctx.font = '16px Arial'; 
            ctx.fillText(
                `${prediction.class} (${Math.round(prediction.score * 100)}%)`, // Texte avec nom et confiance
                prediction.bbox[0], // Position x du texte
                prediction.bbox[1] > 20 ? prediction.bbox[1] - 5 : prediction.bbox[1] + 20 // Position y du texte
            );
        });
    } catch (error) {
        console.error("Erreur de détection:", error);
    }

    // Boucle d'animation pour continuer la détection en temps réel
    requestAnimationFrame(detect); 
}

// Démarrer l'application en chargeant le modèle et configurant la webcam
init();
