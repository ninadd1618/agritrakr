export const DB_NAME = "flowmen";
// Hard-coded ideal soil metric targets (values in ppm/mg per kg)
export const IDEAL_SOIL_VALUES = {
    moisture: 50,        // percent
    pH: 6.5,             // optimal pH
    temp: 20,            // degrees Celsius
    phosphorus: 70,      // ideal level in ppm (based on actual data ~70)
    sulfur: 60,          // ideal level in ppm (working correctly)
    zinc: 60,            // ideal level in ppm
    iron: 60,            // ideal level in ppm
    manganese: 60,       // ideal level in ppm
    copper: 60,          // ideal level in ppm
    potassium: 210,      // ideal level in ppm (based on actual data ~210)
    calcium: 1800,       // ideal level in ppm (based on actual data ~1800)
    magnesium: 280,      // ideal level in ppm (based on actual data ~280)
    sodium: 30           // ideal level in ppm
};