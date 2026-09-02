#define IN1 27
#define IN2 26
#define IN3 25
#define IN4 33
#define ENA_PIN 14  // Left motors
#define ENB_PIN 12  // Right motors (Assign an available pin, e.g., GPIO 12)

void stopMotors() {
  analogWrite(ENA_PIN, 0);
  analogWrite(ENB_PIN, 0);
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);
}

void applyMove(String dir, int spd) {
  spd = constrain(spd, 0, 255);
  
  // Enable speed for both sides
  analogWrite(ENA_PIN, spd);
  analogWrite(ENB_PIN, spd);

  if (dir == "forward") {
    digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);
    digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW);
  } else if (dir == "backward") {
    digitalWrite(IN1, LOW);  digitalWrite(IN2, HIGH);
    digitalWrite(IN3, LOW);  digitalWrite(IN4, HIGH);
  } else if (dir == "left") {
    digitalWrite(IN1, LOW);  digitalWrite(IN2, HIGH);
    digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW);
  } else if (dir == "right") {
    digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);
    digitalWrite(IN3, LOW);  digitalWrite(IN4, HIGH);
  } else {
    stopMotors();
  }
}
