
#include <WiFi.h>
#include <esp_now.h>

// Payload structure
// MUST exactly match the transmitter structure
typedef struct test_struct {
  char message[32];

  float accel_x;
  float accel_y;
  float accel_z;

  float gyro_x;
  float gyro_y;
  float gyro_z;
} test_struct;

test_struct incomingData;

// ESP-NOW Receive Callback
// Compatible with ESP32 Arduino Core 3.x
void OnDataRecv(const esp_now_recv_info_t *info,
                const uint8_t *incomingDataPtr,
                int len) {

  // Check received data size
  if (len != sizeof(incomingData)) {
    Serial.println("Received data size mismatch!");
    return;
  }

  // Copy received data into structure
  memcpy(&incomingData, incomingDataPtr, sizeof(incomingData));

  Serial.println("===========================================");

  // Display message
  Serial.print("Message: ");
  Serial.println(incomingData.message);

  // Display RSSI
  if (info->rx_ctrl) {
    Serial.print("Signal Strength (RSSI): ");
    Serial.print(info->rx_ctrl->rssi);
    Serial.println(" dBm");
  }

  // Display accelerometer data
  Serial.println("Accelerometer:");
  Serial.print("  X: ");
  Serial.print(incomingData.accel_x);
  Serial.print(" m/s^2");

  Serial.print(" | Y: ");
  Serial.print(incomingData.accel_y);
  Serial.print(" m/s^2");

  Serial.print(" | Z: ");
  Serial.print(incomingData.accel_z);
  Serial.println(" m/s^2");

  // Display gyroscope data
  Serial.println("Gyroscope:");
  Serial.print("  X: ");
  Serial.print(incomingData.gyro_x);
  Serial.print(" rad/s");

  Serial.print(" | Y: ");
  Serial.print(incomingData.gyro_y);
  Serial.print(" rad/s");

  Serial.print(" | Z: ");
  Serial.print(incomingData.gyro_z);
  Serial.println(" rad/s");

  Serial.println("===========================================");
}

void setup() {

  // Start Serial Monitor
  Serial.begin(115200);

  // Set ESP32 to Wi-Fi Station Mode
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();

  // Initialize ESP-NOW
  if (esp_now_init() != ESP_OK) {
    Serial.println("Error initializing ESP-NOW");
    return;
  }

  // Register ESP-NOW receive callback
  esp_now_register_recv_cb(OnDataRecv);

  Serial.println("-------------------------------------------");
  Serial.println("ESP-NOW Gateway Receiver Ready");
  Serial.println("Waiting for MPU6050 data...");
  Serial.println("-------------------------------------------");
}

void loop() {
  // ESP-NOW receives data asynchronously.
  // No code is required here.
}
```
