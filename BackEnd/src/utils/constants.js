export const DB_NAME = "flowmen";
// Hard-coded ideal soil metric targets (values in ppm/mg per kg)
export const IDEAL_SOIL_VALUES = {
    moisture: 50,        // percent
    pH: 6.5,             // optimal pH (6.0-7.5 range)
    temperature: 20,     // degrees Celsius (ideal growing temp)
    nitrogen: 150,       // ideal level in ppm
    phosphorus: 70,      // ideal level in ppm
    sulfur: 20,          // ideal level in ppm (reduced from 60)
    zinc: 8,             // ideal level in ppm (reduced from 60)
    iron: 12,            // ideal level in ppm (reduced from 60)
    manganese: 8,        // ideal level in ppm (reduced from 60)
    copper: 3,           // ideal level in ppm (reduced from 60)
    potassium: 210,      // ideal level in ppm
    calcium: 1800,       // ideal level in ppm
    magnesium: 280,      // ideal level in ppm
    sodium: 30           // ideal level in ppm
};