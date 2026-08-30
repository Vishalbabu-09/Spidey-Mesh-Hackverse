#include <esp_now.h>
#include <WiFi.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Wire.h>

// Initialize MPU6050 instance
Adafruit_MPU6050 mpu;

// Telemetry struct without IR sensor
typedef struct test_struct {
  char message[32];
  float accel_x;
  float accel_y;
  float accel_z;
  float gyro_x;
  float gyro_y;
  float gyro_z;
} test_struct;

test_struct sendData;
esp_now_peer_info_t peerInfo = {};

// Receiver/Gateway MAC Address
uint8_t receiverMAC[] = {0xD4, 0xE9, 0xF4, 0x66, 0xD7, 0xA4};

// ESP32 Core v3.x send callback
void OnDataSent(const wifi_tx_info_t *info, esp_now_send_status_t status) {
  Serial.print("ESP-NOW Send Status: ");
  Serial.println(status == ESP_NOW_SEND_SUCCESS ? "Delivery Success" : "Delivery Fail");
}

void setup() {
  Serial.begin(115200);

  // Set Wi-Fi to Station Mode
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();

  // Initialize MPU6050 IMU on standard I2C pins (SDA: 21, SCL: 22)
  Wire.begin(21, 22);
  if (!mpu.begin()) {
    Serial.println("Failed to find MPU6050 chip! Check wiring.");
  } else {
    Serial.println("MPU6050 Initialized successfully.");
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setGyroRange(MPU6050_RANGE_500_DEG);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  }

  // Initialize ESP-NOW protocol
  if (esp_now_init() != ESP_OK) {
    Serial.println("Error initializing ESP-NOW");
    return;
  }

  // Register callback and register peer gateway
  esp_now_register_send_cb(OnDataSent);
  memcpy(peerInfo.peer_addr, receiverMAC, 6);
  peerInfo.channel = 0;  
  peerInfo.encrypt = false;

  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("Failed to add peer");
    return;
  }

  Serial.println("Transmitter Ready (MPU6050 Only).");
}

void loop() {
  // Read MPU6050 Sensor Data
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  // Populate struct fields
  strcpy(sendData.message, "Mining Node 1 Active");
  sendData.accel_x = a.acceleration.x;
  sendData.accel_y = a.acceleration.y;
  sendData.accel_z = a.acceleration.z;
  sendData.gyro_x = g.gyro.x;
  sendData.gyro_y = g.gyro.y;
  sendData.gyro_z = g.gyro.z;

  // Transmit over ESP-NOW
  esp_err_t result = esp_now_send(receiverMAC, (uint8_t *) &sendData, sizeof(sendData));

  if (result != ESP_OK) {
    Serial.println("Error queueing packet");
  }

  delay(1000); // Transmit every 1 second
}
