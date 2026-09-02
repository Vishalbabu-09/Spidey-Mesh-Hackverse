#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>


// =====================================================
// BLOCK 1: WORKER ID
// CHANGE THIS FOR EACH ESP32
// =====================================================

#define WORKER_ID 2


// IMPORTANT:
// Change this to the Wi-Fi channel printed by the Master ESP32

#define ESPNOW_CHANNEL 7


// =====================================================
// BLOCK 2: MASTER MAC ADDRESS
// REPLACE WITH ACTUAL MASTER ESP32 MAC ADDRESS
// =====================================================

uint8_t masterMAC[] =
{
  0xDC, 0x4F, 0x22,
  0x60, 0x7B, 0x9D
};


// =====================================================
// BLOCK 3: PACKET DEFINITION
// MUST BE IDENTICAL TO MASTER
// =====================================================

typedef struct SensorPacket
{
  uint8_t packetType;

  uint8_t workerID;

  float temperature;

  uint16_t gas;

  uint8_t flame;

  uint8_t status;

  uint32_t sequenceNumber;

} SensorPacket;


// =====================================================
// BLOCK 4: GLOBAL PACKET
// =====================================================

SensorPacket sensorData;

uint32_t sequenceNumber = 0;


// =====================================================
// BLOCK 5: ESP-NOW SEND CALLBACK
// =====================================================

void onDataSent(
  const wifi_tx_info_t *info,
  esp_now_send_status_t status
)
{
  Serial.print("Packet Send Status: ");

  if (status == ESP_NOW_SEND_SUCCESS)
  {
    Serial.println("SUCCESS");
  }
  else
  {
    Serial.println("FAILED");
  }
}


// =====================================================
// BLOCK 6: READ SENSORS
// TEMPORARY TEST VALUES
// =====================================================

void readSensors()
{
  // TEMPERATURE

  sensorData.temperature =
    25.0 +
    random(0, 100) / 10.0;


  // GAS

  sensorData.gas =
    random(100, 600);


  // FLAME

  sensorData.flame =
    random(0, 2);


  // STATUS

  if (
    sensorData.gas > 500 ||
    sensorData.flame == 1
  )
  {
    sensorData.status = 1;
  }
  else
  {
    sensorData.status = 0;
  }
}


// =====================================================
// BLOCK 7: SEND DATA
// =====================================================

void sendSensorData()
{
  // Read sensor values

  readSensors();


  // Packet information

  sensorData.packetType = 1;

  sensorData.workerID =
    WORKER_ID;

  sensorData.sequenceNumber =
    sequenceNumber;


  sequenceNumber++;


  // Send ESP-NOW packet

  esp_err_t result =
    esp_now_send(
      masterMAC,
      (uint8_t *) &sensorData,
      sizeof(sensorData)
    );


  if (result == ESP_OK)
  {
    Serial.println("Data sent to Master");
  }
  else
  {
    Serial.print("Error sending data. Code: ");
    Serial.println(result);
  }
}


// =====================================================
// BLOCK 8: SETUP
// =====================================================

void setup()
{
  Serial.begin(115200);

  delay(1000);

  Serial.println();
  Serial.println("================================");
  Serial.println("WORKER ESP32 STARTING");
  Serial.println("================================");


  // -----------------------------------------------
  // SET WIFI MODE
  // -----------------------------------------------

  WiFi.mode(WIFI_STA);


  // Print Worker MAC address

  Serial.print("Worker MAC Address: ");

  Serial.println(
    WiFi.macAddress()
  );


  // -----------------------------------------------
  // SET ESP-NOW WIFI CHANNEL
  // -----------------------------------------------

  Serial.print("Setting WiFi Channel: ");

  Serial.println(
    ESPNOW_CHANNEL
  );


  esp_err_t channelResult =
    esp_wifi_set_channel(
      ESPNOW_CHANNEL,
      WIFI_SECOND_CHAN_NONE
    );


  if (channelResult != ESP_OK)
  {
    Serial.println(
      "ERROR: Failed to set WiFi channel"
    );

    return;
  }


  Serial.println(
    "WiFi Channel Set Successfully"
  );


  // -----------------------------------------------
  // INITIALIZE ESP-NOW
  // -----------------------------------------------

  if (esp_now_init() != ESP_OK)
  {
    Serial.println(
      "ESP-NOW initialization failed"
    );

    return;
  }


  Serial.println(
    "ESP-NOW initialized successfully"
  );


  // -----------------------------------------------
  // REGISTER SEND CALLBACK
  // -----------------------------------------------

  esp_now_register_send_cb(
    onDataSent
  );


  // -----------------------------------------------
  // CREATE MASTER PEER
  // -----------------------------------------------

  esp_now_peer_info_t peerInfo = {};


  memcpy(
    peerInfo.peer_addr,
    masterMAC,
    6
  );


  peerInfo.channel =
    ESPNOW_CHANNEL;


  peerInfo.encrypt =
    false;


  // -----------------------------------------------
  // ADD MASTER AS PEER
  // -----------------------------------------------

  if (
    esp_now_add_peer(
      &peerInfo
    )
    != ESP_OK
  )
  {
    Serial.println(
      "Failed to Add Master Peer"
    );

    return;
  }


  Serial.println(
    "Master Peer Added Successfully"
  );


  Serial.println();
  Serial.println(
    "WORKER READY"
  );

  Serial.println(
    "================================"
  );
}


// =====================================================
// BLOCK 9: LOOP
// =====================================================

void loop()
{
  sendSensorData();


  // Send data every 2 seconds

  delay(2000);
}
