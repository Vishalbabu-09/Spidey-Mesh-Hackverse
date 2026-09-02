#include <ESP8266WiFi.h>
#include <espnow.h>


// =====================================================
// BLOCK 1: RASPBERRY PI WI-FI CONFIGURATION
// =====================================================

const char* WIFI_SSID = "ecstaticfive";

// CHANGE THIS TO YOUR ACTUAL PI HOTSPOT PASSWORD
const char* WIFI_PASSWORD = "ecstaticfi";

const char* PI_IP = "192.168.4.1";

const uint16_t PI_PORT = 5000;

WiFiClient piClient;

#define MASTER_ID 99


// =====================================================
// BLOCK 2: WORKER MAC ADDRESSES
// =====================================================

uint8_t worker1MAC[] =
{
  0xD4, 0xE9, 0xF4,
  0x66, 0xD7, 0xA4
};


uint8_t worker2MAC[] =
{
  0x6C, 0xC8, 0x40,
  0x56, 0x83, 0x04
};


// =====================================================
// BLOCK 3: PACKET DEFINITION
// MUST MATCH WORKER STRUCTURE EXACTLY
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
// BLOCK 4: WIFI SCAN
// =====================================================

void scanWiFiNetworks()
{
  Serial.println();
  Serial.println("========== WIFI SCAN ==========");

  int n = WiFi.scanNetworks();

  Serial.print("Networks found: ");
  Serial.println(n);

  for (int i = 0; i < n; i++)
  {
    Serial.print(i + 1);
    Serial.print(". ");

    Serial.print(WiFi.SSID(i));

    Serial.print(" | RSSI: ");

    Serial.print(WiFi.RSSI(i));

    Serial.print(" | Channel: ");

    Serial.println(WiFi.channel(i));
  }

  Serial.println("================================");
}


// =====================================================
// BLOCK 5: CONNECT TO PI HOTSPOT
// =====================================================

bool connectToPiWiFi()
{
  if (WiFi.status() == WL_CONNECTED)
  {
    return true;
  }

  Serial.println();
  Serial.println("================================");
  Serial.println("CONNECTING TO PI HOTSPOT");
  Serial.println("================================");

  WiFi.disconnect();

  delay(500);

  WiFi.mode(WIFI_STA);

  WiFi.begin(
    WIFI_SSID,
    WIFI_PASSWORD
  );

  int attempts = 0;

  while (
    WiFi.status() != WL_CONNECTED &&
    attempts < 30
  )
  {
    delay(500);

    Serial.print(".");

    attempts++;
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED)
  {
    Serial.println("[+] Wi-Fi Connected!");

    Serial.print("Master ESP8266 IP: ");

    Serial.println(
      WiFi.localIP()
    );

    Serial.print("Gateway IP: ");

    Serial.println(
      WiFi.gatewayIP()
    );

    Serial.print("Master Wi-Fi Channel: ");

    Serial.println(
      WiFi.channel()
    );

    Serial.print("Master MAC Address: ");

    Serial.println(
      WiFi.macAddress()
    );

    return true;
  }

  Serial.println(
    "[-] Wi-Fi connection FAILED"
  );

  return false;
}


// =====================================================
// BLOCK 6: CONNECT TCP TO RASPBERRY PI
// =====================================================

bool connectTCP()
{
  if (piClient.connected())
  {
    return true;
  }

  if (WiFi.status() != WL_CONNECTED)
  {
    Serial.println(
      "[-] Wi-Fi disconnected. Cannot connect TCP."
    );

    return false;
  }

  Serial.print(
    "Connecting TCP to Pi..."
  );

  piClient.stop();

  if (
    piClient.connect(
      PI_IP,
      PI_PORT
    )
  )
  {
    Serial.println(
      " CONNECTED!"
    );

    return true;
  }
  else
  {
    Serial.println(
      " FAILED"
    );

    return false;
  }
}


// =====================================================
// BLOCK 7: SEND DATA TO RASPBERRY PI
// =====================================================

void sendToRaspberryPi(
  SensorPacket receivedPacket
)
{
  if (!piClient.connected())
  {
    connectTCP();
  }

  if (!piClient.connected())
  {
    Serial.println(
      "[-] Pi TCP disconnected! Data dropped."
    );

    return;
  }


  // -----------------------------------------------
  // CREATE JSON
  // -----------------------------------------------

  String jsonData = "{";

  jsonData +=
    "\"master_id\":" +
    String(MASTER_ID) +
    ",";

  jsonData +=
    "\"worker_id\":" +
    String(receivedPacket.workerID) +
    ",";

  jsonData +=
    "\"temperature\":" +
    String(
      receivedPacket.temperature,
      2
    ) +
    ",";

  jsonData +=
    "\"gas\":" +
    String(receivedPacket.gas) +
    ",";

  jsonData +=
    "\"flame\":" +
    String(receivedPacket.flame) +
    ",";

  jsonData +=
    "\"status\":\"";

  jsonData +=
    (
      receivedPacket.status == 0
      ?
      "NORMAL"
      :
      "ALERT"
    );

  jsonData +=
    "\",";

  jsonData +=
    "\"sequence\":" +
    String(
      receivedPacket.sequenceNumber
    );

  jsonData +=
    "}\n";


  // -----------------------------------------------
  // SEND JSON
  // -----------------------------------------------

  size_t bytesSent =
    piClient.print(
      jsonData
    );

  if (bytesSent > 0)
  {
    Serial.println(
      "[+] Forwarded JSON to Raspberry Pi"
    );

    Serial.print(
      "JSON: "
    );

    Serial.println(
      jsonData
    );
  }
  else
  {
    Serial.println(
      "[-] Failed to send JSON"
    );
  }
}


// =====================================================
// BLOCK 8: ESP-NOW RECEIVE CALLBACK
// =====================================================

void onDataReceive(
  uint8_t *mac,
  uint8_t *incomingData,
  uint8_t len
)
{
  if (len != sizeof(SensorPacket))
  {
    Serial.print(
      "[-] Invalid packet size: "
    );

    Serial.println(
      len
    );

    return;
  }


  SensorPacket receivedPacket;

  memcpy(
    &receivedPacket,
    incomingData,
    sizeof(receivedPacket)
  );


  // -----------------------------------------------
  // DISPLAY RECEIVED DATA
  // -----------------------------------------------

  Serial.println();
  Serial.println(
    "================================"
  );

  Serial.println(
    "DATA RECEIVED FROM WORKER"
  );

  Serial.print(
    "Worker ID   : "
  );

  Serial.println(
    receivedPacket.workerID
  );


  Serial.print(
    "Temperature : "
  );

  Serial.print(
    receivedPacket.temperature,
    2
  );

  Serial.println(
    " C"
  );


  Serial.print(
    "Gas ADC     : "
  );

  Serial.println(
    receivedPacket.gas
  );


  Serial.print(
    "Flame State : "
  );

  Serial.println(
    receivedPacket.flame
  );


  Serial.print(
    "Status      : "
  );

  if (receivedPacket.status == 0)
  {
    Serial.println(
      "NORMAL"
    );
  }
  else
  {
    Serial.println(
      "ALERT"
    );
  }


  Serial.print(
    "Sequence    : "
  );

  Serial.println(
    receivedPacket.sequenceNumber
  );


  Serial.println(
    "================================"
  );


  // Send to Raspberry Pi

  sendToRaspberryPi(
    receivedPacket
  );
}


// =====================================================
// BLOCK 9: ADD ESP-NOW PEER
// =====================================================

void addPeer(
  uint8_t *peerMAC
)
{
  if (
    esp_now_add_peer(
      peerMAC,
      ESP_NOW_ROLE_COMBO,
      0,
      NULL,
      0
    )
    != 0
  )
  {
    Serial.println(
      "[-] Failed to add Worker peer"
    );
  }
  else
  {
    Serial.println(
      "[+] Worker peer added successfully"
    );
  }
}


// =====================================================
// BLOCK 10: SETUP
// =====================================================

void setup()
{
  Serial.begin(115200);

  delay(1000);

  Serial.println();
  Serial.println(
    "================================"
  );

  Serial.println(
    "MASTER ESP8266 STARTING"
  );

  Serial.println(
    "================================"
  );


  // STEP 1: WIFI SCAN

  WiFi.mode(WIFI_STA);

  delay(1000);

  scanWiFiNetworks();


  // STEP 2: CONNECT TO PI

  bool wifiConnected =
    connectToPiWiFi();


  // IMPORTANT:
  // ESP-NOW should be initialized after Wi-Fi
  // so it uses the Pi hotspot channel.

  if (
    esp_now_init() != 0
  )
  {
    Serial.println(
      "[-] ESP-NOW Init Failed"
    );

    return;
  }


  Serial.println(
    "[+] ESP-NOW Initialized"
  );


  // STEP 3: SET ESP-NOW ROLE

  esp_now_set_self_role(
    ESP_NOW_ROLE_COMBO
  );


  // STEP 4: REGISTER RECEIVE CALLBACK

  esp_now_register_recv_cb(
    onDataReceive
  );


  // STEP 5: ADD WORKERS

  addPeer(
    worker1MAC
  );

  addPeer(
    worker2MAC
  );


  // STEP 6: CONNECT TCP

  if (wifiConnected)
  {
    connectTCP();
  }


  Serial.println();
  Serial.println(
    "================================"
  );

  Serial.println(
    "MASTER READY"
  );

  Serial.println(
    "================================"
  );
}


// =====================================================
// BLOCK 11: MAIN LOOP
// =====================================================

void loop()
{
  // Reconnect Wi-Fi if disconnected

  if (
    WiFi.status() != WL_CONNECTED
  )
  {
    Serial.println(
      "[-] Wi-Fi lost. Reconnecting..."
    );

    connectToPiWiFi();

    delay(1000);

    return;
  }


  // Reconnect TCP if disconnected

  if (!piClient.connected())
  {
    connectTCP();
  }


  delay(2000);
}
