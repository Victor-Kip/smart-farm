# IOT Based Smart Farm System

This is a React-based web application. Follow the instructions below to clone the project, install dependencies, and run it locally.

Click this link to view the website - [Smart Farm App](https://smart-farm-dashboard-1.netlify.app/)

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (v14 or higher recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Git](https://git-scm.com/)

### 📥 Clone the Repository

```bash
git clone https://github.com/Victor-Kip/smart-farm.git
```

###  📂 Navigate into the Project Directory

```bash
cd smart-farm
```

📦 Install Dependencies

```bash
npm install
```

▶️ Run the App

```bash
npm start
```

📁 Project Structure

```
smart-farm/
├── arduino-config/
│   ├── Schematic/
│   │   └── Schematic-diagram.png
│   ├── smart-farm.ino
│   └── lmic_project_config.h
├── public/
├── src/
├── package-lock.json
├── package.json
├── README.md
```

# Arduino LoRa + DHT Sensor Project

This project integrates LoRaWAN communication using the MCCI LMIC library and environmental sensing using a DHT sensor (e.g., DHT11 or DHT22).

## 📦 Included Libraries

The sketch uses the following Arduino libraries:

### 🔄 SPI
- Used for communication with LoRa transceivers (e.g., SX1276).
- Included by default with the Arduino IDE.

### 📡 LMIC (MCCI LoRaWAN LMIC library)
- Enables communication with LoRaWAN networks.
- Library: [`MCCI LoRaWAN LMIC library`](https://github.com/mcci-catena/arduino-lmic)

### ⚙️ hal/hal.h
- Part of the LMIC library. Provides hardware abstraction between the microcontroller and the LMIC stack.

### 🌡️ DHT
- Used to read temperature and humidity from DHT sensors.
- Library: [`DHT sensor library by Adafruit`](https://github.com/adafruit/DHT-sensor-library)

---

## 🔧 Setup Instructions

### 1. Install Arduino IDE
Download and install the [Arduino IDE](https://www.arduino.cc/en/software) if you haven't already.

### 2. Install Required Libraries

#### Through Library Manager:
1. Open Arduino IDE
2. Go to **Sketch > Include Library > Manage Libraries...**
3. Search and install:
   - `MCCI LoRaWAN LMIC library` by Terry Moore (MCCI)
   - `DHT sensor library` by Adafruit
   - `Adafruit Unified Sensor` (dependency for DHT)

#### Alternatively, install from GitHub:
- [LMIC library](https://github.com/mcci-catena/arduino-lmic)
- [DHT sensor library](https://github.com/adafruit/DHT-sensor-library)

### 3. Connect Hardware

#### Hardware Components
- DHT22 Sensor
- Soil moisture sensor
- ESP32
- RFM95 (868MHz) - LoRa Transmitter
- Light Dependent Resistor
- Breadboard
- Jumper Wires 

- The schematic diagram is provided under arduino-config -> schematic

### 4. Upload the Sketch

- Open the sketch file in Arduino IDE.
- Select your board and port.
- Click **Upload**.

---

## 🚀 Run

Once uploaded, the microcontroller will:
- Connect with the LoRa Gateway
- Read temperature and humidity from the DHT sensor.
- Read Soil moisture from the soil moisture sensor
- Read Light Intensity from LDR photoresistor
- Encrypt the data
- Send the data over LoRaWAN using the LMIC library which routes data to Firebase RTDB(Real Time Database).

---

## 📝 Notes

- Ensure region frequency is correctly set in `lmic_project_config.h`.
- Configure your LoRaWAN credentials (DevEUI, AppEUI, AppKey) in the sketch.

---

## 📜 License

This project is open-source under the MIT License. See `LICENSE` file for details.


