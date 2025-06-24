import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, query, orderByChild, limitToLast, startAt, endAt } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD_EbWsvYRdlKt1qMBtQC0fe62g2QIPq-o",
  authDomain: "smart-farm-79b04.firebaseapp.com",
  databaseURL: "https://smart-farm-79b04-default-rtdb.firebaseio.com",
  projectId: "smart-farm-79b04",
  storageBucket: "smart-farm-79b04.firebasestorage.app",
  messagingSenderId: "845664033767",
  appId: "1:845664033767:web:ef1406baddc61e9ff8fb42",
  measurementId: "G-XM431D5X74"
};

// Initialize Firebase (singleton pattern)
let firebaseApp = null;
let database = null;

const initializeFirebase = () => {
  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig);
    database = getDatabase(firebaseApp);
  }
  return database;
};

// Main function to connect to Firebase and fetch sensor data
export const connectToFirebase = (setData, setLoading, setError, setLastUpdated) => {
  try {
    const db = initializeFirebase();
    const devicePath = 'devices/smart-farm-gp5/smartfarm-node-1';
    const deviceRef = ref(db, devicePath);
   
    // Query to get the latest entry based on 'received_at' timestamp
    const latestDataQuery = query(deviceRef, orderByChild('received_at'), limitToLast(1));
    
    // Set up real-time listener
    const unsubscribe = onValue(latestDataQuery, (snapshot) => {
      if (snapshot.exists()) {
        let latestEntry = null;
        snapshot.forEach((childSnapshot) => {
          latestEntry = childSnapshot.val();
        });
        
        if (latestEntry && latestEntry.uplink_message && latestEntry.uplink_message.decoded_payload) {
          const payload = latestEntry.uplink_message.decoded_payload;
          setData({
            temperature: payload.temperature ? parseFloat(payload.temperature).toFixed(1) : 'N/A',
            humidity: payload.humidity ? parseFloat(payload.humidity).toFixed(1) : 'N/A',
            soilMoisture: payload.soil_moisture ? parseFloat(payload.soil_moisture).toFixed(1) : 'N/A',
            lightIntensity: payload.light_intensity ? parseFloat(payload.light_intensity).toFixed(0) : 'N/A',
          });
          setLastUpdated(new Date(latestEntry.received_at));
          console.log("Sensor data updated:", payload);
        } else {
          setData({
            temperature: 'N/A',
            humidity: 'N/A',
            soilMoisture: 'N/A',
            lightIntensity: 'N/A',
          });
          console.warn("Decoded payload not found in the latest Firebase entry.");
        }
      } else {
        console.log("No data available at the specified Firebase path.");
        setData({
          temperature: 'No Data',
          humidity: 'No Data',
          soilMoisture: 'No Data',
          lightIntensity: 'No Data',
        });
      }
      setLoading(false);
      setError(null);
    }, (dbError) => {
      console.error("Firebase Realtime Database error:", dbError);
      setError(`Failed to fetch data: ${dbError.message}`);
      setLoading(false);
    });
    
    return unsubscribe;
  } catch (initError) {
    console.error("Failed to initialize Firebase:", initError);
    setError(`Failed to initialize Firebase: ${initError.message}`);
    setLoading(false);
    return null;
  }
};

// Function to fetch historical data based on time range
export const fetchHistoricalData = async (timeRange = '24h') => {
  try {
    const db = initializeFirebase();
    const devicePath = 'devices/smart-farm-gp5/smartfarm-node-1';
    const deviceRef = ref(db, devicePath);

    // Calculate time range
    const now = new Date();
    let startTime;
    let limit = 100; // Default limit

    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - (1 * 60 * 60 * 1000));
        limit = 60;
        break;
      case '6h':
        startTime = new Date(now.getTime() - (6 * 60 * 60 * 1000));
        limit = 100;
        break;
      case '24h':
        startTime = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        limit = 288; // Every 5 minutes for 24h
        break;
      case '7d':
        startTime = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        limit = 336; // Every 30 minutes for 7 days
        break;
      case '30d':
        startTime = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        limit = 720; // Every hour for 30 days
        break;
      default:
        startTime = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        limit = 288;
    }

    const startTimestamp = startTime.toISOString();
    
    // Query historical data
    const historicalQuery = query(
      deviceRef,
      orderByChild('received_at'),
      startAt(startTimestamp),
      limitToLast(limit)
    );

    return new Promise((resolve, reject) => {
      onValue(historicalQuery, (snapshot) => {
        const historicalData = [];
        
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            const entry = childSnapshot.val();
            if (entry && entry.uplink_message && entry.uplink_message.decoded_payload) {
              const payload = entry.uplink_message.decoded_payload;
              historicalData.push({
                timestamp: entry.received_at,
                temperature: payload.temperature ? parseFloat(payload.temperature).toFixed(1) : null,
                humidity: payload.humidity ? parseFloat(payload.humidity).toFixed(1) : null,
                soilMoisture: payload.soil_moisture ? parseFloat(payload.soil_moisture).toFixed(1) : null,
                lightIntensity: payload.light_intensity ? parseFloat(payload.light_intensity).toFixed(0) : null,
              });
            }
          });
          
          // Sort by timestamp to ensure chronological order
          historicalData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          
          console.log(`Historical data fetched: ${historicalData.length} entries for ${timeRange}`);
          resolve(historicalData);
        } else {
          console.log("No historical data available");
          resolve([]);
        }
      }, (error) => {
        console.error("Error fetching historical data:", error);
        reject(error);
      });
    });
  } catch (error) {
    console.error("Failed to fetch historical data:", error);
    throw error;
  }
};