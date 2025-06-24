#include <SPI.h> // Include SPI library for LoRa communication
#include <lmic.h>  // Include MCCI LoRaWAN library
#include <hal/hal.h>  // Include hardware abstraction layer for LMIC
#include <DHT.h>  // Include DHT sensor library

// ===== OTAA keys =====
static const u1_t PROGMEM APPEUI[8] = {}; // Replace with your AppEUI
static const u1_t PROGMEM DEVEUI[8] = {}; // Replace with your DevEUI
static const u1_t PROGMEM APPKEY[16] = {}; // Replace with your AppKey

void os_getArtEui(u1_t* buf) {
  memcpy_P(buf, APPEUI, 8);
}
void os_getDevEui(u1_t* buf) {
  memcpy_P(buf, DEVEUI, 8);
}
void os_getDevKey(u1_t* buf) {
  memcpy_P(buf, APPKEY, 16);
}

// ===== PIN DEFINITIONS =====
// DHT22
#define DHT_PIN 13
#define DHT_TYPE DHT22

// Soil Moisture module
#define SOIL_A0_PIN 34
#define SOIL_D0_PIN 32

#define LDR_PIN 35

// RFM95 / SX1276 LoRa (HSPI)
#define LORA_NSS 5
#define LORA_RST 27
#define LORA_DIO0 26
#define LORA_DIO1 33

// LMIC pinmap
const lmic_pinmap lmic_pins = {
  .nss = LORA_NSS,
  .rxtx = LMIC_UNUSED_PIN,
  .rst = LORA_RST,
  .dio = { LORA_DIO0, LORA_DIO1, LMIC_UNUSED_PIN }
};

// Transmission interval (seconds)
static const unsigned TX_INTERVAL = 60;
static osjob_t sendjob;

// Sensor instances
DHT dht(DHT_PIN, DHT_TYPE);

// Forward declarations
void do_send(osjob_t* j);
void onEvent(ev_t ev);

// Event wrapper for MCCI-LMIC
static void onEventWrapper(void* _, ev_t ev) {
  onEvent(ev);
}

void setup() {
  Serial.begin(115200);
  while (!Serial);
  
  Serial.println(F("Smart Farm Node Starting…"));

  // 1) Init sensors
  dht.begin();
  pinMode(SOIL_D0_PIN, INPUT);

  // 2) Configure LoRa control pins
  pinMode(LORA_NSS, OUTPUT);
  digitalWrite(LORA_NSS, HIGH);
  pinMode(LORA_RST, OUTPUT);
  digitalWrite(LORA_RST, HIGH);
  pinMode(LORA_DIO0, INPUT);
  pinMode(LORA_DIO1, INPUT);
  Serial.println(F("Pins configured"));

  SPI.begin();

  // 4) Hard reset radio module
  digitalWrite(LORA_RST, LOW);
  delay(10);
  digitalWrite(LORA_RST, HIGH);
  delay(10);
  Serial.println(F("Radio reset pulse complete"));

  // 5) Initialize LMIC
  os_init_ex(&lmic_pins);
  Serial.println(F("os_init_ex done"));
  LMIC_reset();
  Serial.println(F("LMIC_reset done"));
  LMIC_setClockError(MAX_CLOCK_ERROR * 10 / 100);
  Serial.println(F("Clock error compensation set"));

  // 6) Register event callback and start OTAA join
  LMIC_registerEventCb(onEventWrapper, nullptr);
  Serial.println(F("Event callback registered"));
  LMIC_startJoining();
  Serial.println(F("Joining..."));
}

void onEvent(ev_t ev) {
  Serial.print(os_getTime());
  Serial.print(F(": "));
  switch (ev) {
    case EV_SCAN_TIMEOUT:
      Serial.println(F("EV_SCAN_TIMEOUT"));
      break;
    case EV_BEACON_FOUND:
      Serial.println(F("EV_BEACON_FOUND"));
      break;
    case EV_BEACON_MISSED:
      Serial.println(F("EV_BEACON_MISSED"));
      break;
    case EV_BEACON_TRACKED:
      Serial.println(F("EV_BEACON_TRACKED"));
      break;
    case EV_JOINING:
      Serial.println(F("EV_JOINING"));
      break;
    case EV_JOINED:
      Serial.println(F("EV_JOINED"));
      // Disable link check after join (sends MAC commands to gateway periodically)
      LMIC_setLinkCheckMode(0);
      // Schedule the first transmission after 5 seconds
      os_setTimedCallback(&sendjob, os_getTime() + sec2osticks(5), do_send);
      break;
    case EV_JOIN_FAILED:
      Serial.println(F("EV_JOIN_FAILED"));
      // Try to re-join after a delay
      os_setTimedCallback(&sendjob, os_getTime() + sec2osticks(TX_INTERVAL), do_send);
      break;
    case EV_REJOIN_FAILED:
      Serial.println(F("EV_REJOIN_FAILED"));
      // Re-join failed, try again later
      os_setTimedCallback(&sendjob, os_getTime() + sec2osticks(TX_INTERVAL), do_send);
      break;
    case EV_TXCOMPLETE:
      Serial.println(F("EV_TXCOMPLETE (includes waiting for RX windows)"));
      if (LMIC.dataLen > 0) {
        Serial.print(F("Received "));
        Serial.print(LMIC.dataLen);
        Serial.println(F(" bytes of payload"));
      }
      // Schedule next transmission
      os_setTimedCallback(&sendjob, os_getTime() + sec2osticks(TX_INTERVAL), do_send);
      break;
    case 20:
      Serial.println(F("EV_TXCANCELED"));
      break;
    case EV_RXCOMPLETE:
      Serial.println(F("EV_RXCOMPLETE"));
      if (LMIC.dataLen > 0) {
        Serial.print(F("Received "));
        Serial.print(LMIC.dataLen);
        Serial.println(F(" bytes of payload"));
      }
      break;
    case EV_TXSTART:
      Serial.println(F("EV_TXSTART"));
      break;
    case EV_RXSTART:
      Serial.println(F("EV_RXSTART"));
      break;
    case EV_RESET:
      Serial.println(F("EV_RESET"));
      break;
    case EV_LINK_ALIVE:
      Serial.println(F("EV_LINK_ALIVE"));
      break;
    default:
      Serial.print(F("Unknown event: "));
      Serial.println(ev);
      break;
  }
}


void do_send(osjob_t* j) {
  if (LMIC.opmode & OP_TXRXPEND) {
    Serial.println(F("TX pending, skipping"));
    os_setTimedCallback(&sendjob, os_getTime() + sec2osticks(TX_INTERVAL), do_send);
    return;
  }

  // Read sensors
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  int s_raw = analogRead(SOIL_A0_PIN);
  int s_flag = digitalRead(SOIL_D0_PIN);
  int l_raw = analogRead(LDR_PIN);

  if (isnan(t) || isnan(h)) {
    Serial.println(F("DHT read failed"));
  } else {
    // Pack temperature & humidity (signed-16.4)
    uint16_t t16 = LMIC_f2sflt16(t / 100.0);
    uint16_t h16 = LMIC_f2sflt16(h / 100.0);
    // Pack soil & light (12-bit)
    uint16_t s16 = s_raw & 0x0FFF;
    uint16_t l16 = l_raw & 0x0FFF;

    // Build 9-byte payload
    uint8_t payload[9] = {
      lowByte(t16), highByte(t16),
      lowByte(h16), highByte(h16),
      highByte(s16), lowByte(s16),
      highByte(l16), lowByte(l16),
      (uint8_t)s_flag
    };

    LMIC_setTxData2(1, payload, sizeof(payload), 0);

    Serial.print(F("Sent T="));
    Serial.print(t, 2);
    Serial.print(F(" H="));
    Serial.print(h, 2);
    Serial.print(F(" S="));
    Serial.print(s_raw);
    Serial.print(F(" SF="));
    Serial.print(s_flag);
    Serial.print(F(" L="));
    Serial.println(l_raw);
  }

  // Schedule next transmission
  os_setTimedCallback(&sendjob, os_getTime() + sec2osticks(TX_INTERVAL), do_send);
}

void loop() {
  os_runloop_once();
}
