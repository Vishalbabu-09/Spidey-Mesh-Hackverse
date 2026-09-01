#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

// Pin Definitions
#define MQ2_PIN       34 // Analog input for MQ-2 Gas Sensor
#define FLAME_PIN     27 // Digital input for Flame Sensor
#define IR_PIN        26 // Digital input for IR Sensor
#define BUZZER_PIN    23 // Digital output for Buzzer

// Initialize MPU6050 Object
Adafruit_MPU6050 mpu;

// --- Thresholds for Danger Situations ---
// ESP32 ADC is 12-bit (0-4095). Typical clean air reads under 1000.
const int GAS_THRESHOLD = 2000; 

// Acceleration threshold in m/s^2 indicating a sudden fall or heavy impact
const float MOTION_THRESHOLD = 15.0; 

void setup() {
  Serial.begin(115200);
  while (!Serial) delay(10); // Wait for serial monitor to open

  // Set pin modes
  pinMode(MQ2_PIN, INPUT);
  pinMode(FLAME_PIN, INPUT);
  pinMode(IR_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  // Ensure buzzer is off on startup
  digitalWrite(BUZZER_PIN, LOW); 

  // Initialize MPU6050 
  // ESP32 default I2C pins are SDA = 21, SCL = 22, so Wire.begin() defaults to these.
  Serial.println("Initializing MPU6050...");
  if (!mpu.begin()) {
    Serial.println("Failed to find MPU6050 chip! Check I2C wiring.");
    while (1) { delay(10); } // Halt if sensor isn't found
  }
  Serial.println("MPU6050 Found!");

  // Configure MPU6050 sensitivity ranges
  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  
  Serial.println("System Ready. Monitoring Sensors...\n");
}

void loop() {
  bool dangerDetected = false;

  // 1. Read MQ-2 Gas Sensor (Analog)
  int gasValue = analogRead(MQ2_PIN);
  Serial.print("Gas: "); Serial.print(gasValue);
  
  if (gasValue > GAS_THRESHOLD) {
    Serial.print(" [HIGH GAS!] ");
    dangerDetected = true;
  }

  // 2. Read Flame Sensor (Digital)
  // Note: Most flame modules pull LOW (0) when a flame is detected.
  int flameState = digitalRead(FLAME_PIN);
  Serial.print(" | Flame: ");
  if (flameState == LOW) { 
    Serial.print("DETECTED!");
    dangerDetected = true;
  } else {
    Serial.print("Clear");
  }

  // 3. Read IR Sensor (Digital)
  // Note: Most IR modules pull LOW (0) when an object blocks the path.
  int irState = digitalRead(IR_PIN);
  Serial.print(" | IR: ");
  if (irState == LOW) {
    Serial.print("BLOCKED!");
    dangerDetected = true;
  } else {
    Serial.print("Clear");
  }

  // 4. Read MPU6050 Accelerometer
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);
  
  Serial.print(" | Accel(X,Y): ");
  Serial.print(a.acceleration.x); Serial.print(", ");
  Serial.print(a.acceleration.y);

  // Trigger danger if there is extreme motion on X or Y axis 
  // (Gravity naturally pulls ~9.8 on the Z axis, so we monitor X and Y for tilts/shocks)
  if (abs(a.acceleration.x) > MOTION_THRESHOLD || 
      abs(a.acceleration.y) > MOTION_THRESHOLD) { 
    Serial.print(" [IMPACT/TILT!]");
    dangerDetected = true;
  }

  // 5. Trigger Buzzer Alert
  if (dangerDetected) {
    digitalWrite(BUZZER_PIN, HIGH);
    Serial.println(" ---> ALARM ACTIVE");
  } else {
    digitalWrite(BUZZER_PIN, LOW);
    Serial.println();
  }

  // Brief delay to prevent flooding the Serial Monitor
  delay(250); 
}
