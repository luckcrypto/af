/* Per-aircraft deviation from the drawn template.
   tpl 'xb70'     = twin fin, supersonic, drooped delta
   tpl 'concorde' = single fin, slim delta
   Ported from Python so the silhouette system runs on the same runtime as build.js. */
module.exports = {
    // --- reconnaissance ---
    "lockheed-sr-71-blackbird": {
        tpl: 'xb70', finSpread: 16.0, finCant: -12, finH: 0.38, finW: 1.8,
        bodyW: 1.30, wingDroop: 1.2},
    "lockheed-u-2-dragon-lady": {
        tpl: 'concorde', bodyW: 0.62, finH: 1.25, wingDroop: -2.2, gearSpread: 0.55},

    // --- stealth ---
    "northrop-b-2-spirit": {
        tpl: 'xb70', dropBridge: true, finSpread: 0, finH: 0.10, finW: 0.1,
        bodyW: 1.75, bodyTall: 0.72, wingDroop: 1.0, gearSpread: 1.5},
    "lockheed-f-117-nighthawk": {
        tpl: 'xb70', finSpread: -10.0, finCant: 28, finH: 0.40, finW: 1.7,
        bodyW: 1.55, wingDroop: 2.4},

    // --- fifth generation ---
    "lockheed-martin-f-22-raptor": {
        tpl: 'xb70', finSpread: 4.0, finCant: 20, finH: 0.46, finW: 1.9, bodyW: 1.30},
    "lockheed-martin-f-35-lightning-ii": {
        tpl: 'xb70', finSpread: 3.0, finCant: 18, finH: 0.46, finW: 1.9, bodyW: 1.40},
    "sukhoi-su-57-felon": {
        tpl: 'xb70', finSpread: 8.0, finCant: 19, finH: 0.44, finW: 1.8, bodyW: 1.32},
    "chengdu-j-20-mighty-dragon": {
        tpl: 'xb70', finSpread: 5.0, finCant: 22, finH: 0.42, finW: 1.7, bodyW: 1.24,
        canard: [0.46, 0.30]},

    // --- fourth generation ---
    "mcdonnell-douglas-f-15-eagle": {
        tpl: 'xb70', finSpread: 9.0, finCant: 4, finH: 0.46, finW: 2.0, bodyW: 1.40},
    "general-dynamics-f-16-fighting-falcon": {
        tpl: 'xb70', singleFin: true, finH: 0.62, finW: 1.9, bodyW: 1.34, gearSpread: 0.80},
    "grumman-f-14-tomcat": {
        tpl: 'xb70', finSpread: 6.0, finCant: 3, finH: 0.44, finW: 1.9, bodyW: 1.55},
    "boeing-f-a-18-super-hornet": {
        tpl: 'xb70', finSpread: 5.0, finCant: 16, finH: 0.44, finW: 1.9, bodyW: 1.30},
    "sukhoi-su-27-flanker": {
        tpl: 'xb70', finSpread: 12.0, finCant: 4, finH: 0.46, finW: 2.0, bodyW: 1.32},
    "mikoyan-mig-29-fulcrum": {
        tpl: 'xb70', finSpread: 11.0, finCant: 6, finH: 0.44, finW: 1.9, bodyW: 1.26},
    "mikoyan-mig-31-foxhound": {
        tpl: 'xb70', finSpread: 7.0, finCant: 6, finH: 0.48, finW: 2.1, bodyW: 1.50},
    "eurofighter-typhoon": {
        tpl: 'xb70', singleFin: true, finH: 0.56, finW: 1.8, bodyW: 1.22, canard: [0.40, 0.30], gearSpread: 0.76},
    "dassault-rafale": {
        tpl: 'xb70', singleFin: true, finH: 0.54, finW: 1.8, bodyW: 1.24, canard: [0.38, 0.30], gearSpread: 0.76},
    // Gripen is the smallest fighter here, so the Concorde body scaled up looked bulbous.
    // Narrower body, and the canard tucked closer in on its short 8.6 m span.
    "saab-jas-39-gripen": {
        tpl: 'xb70', singleFin: true, finH: 0.58, finW: 1.7, bodyW: 1.14, canard: [0.34, 0.32], gearSpread: 0.70},

    // --- bomber and attack ---
    "rockwell-b-1b-lancer": {
        tpl: 'concorde', bodyW: 1.05, finH: 1.10, wingDroop: 0.8, gearSpread: 0.95},
    "fairchild-republic-a-10-thunderbolt-ii": {
        tpl: 'xb70', finSpread: 24.0, finCant: 0, finH: 0.40, finW: 1.8,
        bodyW: 1.30, wingDroop: -1.0, gearSpread: 1.15}
};
