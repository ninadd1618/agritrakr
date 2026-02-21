export const DB_NAME = "flowmen";
// Hard-coded ideal soil metric targets - aligned with soil.controller.js
export const IDEAL_SOIL_VALUES = {
    moisture: 50,        // percent
    pH: 6.5,             // optimal pH
    temp: 20,            // degrees Celsius
    temperature: 20,     // alias for temp
    nitrogen: 150,       // ideal level in ppm
    phosphorus: 70,      // ideal level in ppm
    sulfur: 25,          // ideal level in ppm
    zinc: 4,             // ideal level in ppm
    iron: 35,            // ideal level in ppm
    manganese: 15,       // ideal level in ppm
    copper: 6,           // ideal level in ppm
    potassium: 210,      // ideal level in ppm
    calcium: 1800,       // ideal level in ppm
    magnesium: 280,      // ideal level in ppm
    sodium: 30           // ideal level in ppm
};