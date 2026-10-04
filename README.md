# 🕷️ Spidey-Mesh

## HackVerse: Into the Web

**🥈 2nd Prize — Hardware Track**
**💰 ₹10,000 Cash Prize**

Spidey-Mesh is an ESP8266-based wireless safety and telemetry prototype developed for **HackVerse: Into the Web**.

The project demonstrates local wireless communication between distributed worker nodes, a central ESP8266 master, and a Raspberry Pi gateway. It also includes a Python-based simulator for experimenting with mesh communication, channel quality, and gateway failover behaviour.

---

## 🚨 Problem

In hazardous or difficult-to-access environments, collecting information from multiple distributed nodes and forwarding it to a central monitoring system can be challenging.

A practical prototype should be able to:

- Collect telemetry from multiple distributed nodes.
- Communicate locally without depending on the public internet.
- Forward received information to a central gateway.
- Provide a software environment for testing communication behaviour.
- Allow the system architecture to be evaluated before scaling the hardware.

---

## 💡 Solution

Spidey-Mesh uses **ESP-NOW communication between ESP8266 nodes** and a Raspberry Pi-based gateway.

```text
┌─────────────────┐
│    Worker 1     │
│    ESP8266      │
└────────┬────────┘
         │
         │ ESP-NOW
         │
┌────────▼────────┐
│     Master      │
│    ESP8266      │
└────────┬────────┘
         │
         │ Wi-Fi / TCP
         │
┌────────▼────────┐
│  Raspberry Pi   │
│     Gateway     │
└─────────────────┘
```

The worker nodes generate sensor telemetry and transmit structured packets to the master using ESP-NOW.

The master receives those packets and forwards the information to the Raspberry Pi over a local Wi-Fi/TCP connection.

---

## 🏗️ System Architecture

### 1. Worker Nodes

The worker nodes are ESP8266-based devices responsible for generating and transmitting telemetry.

The current sensor packet contains:

- Worker ID
- Temperature
- Gas value
- Flame status
- Device status
- Sequence number

Worker firmware:

```text
Slave1.cpp
Slave2.cpp
```

The worker nodes communicate with the master using ESP-NOW.

### 2. Master Node

`Master_esp.cpp` acts as the central ESP8266 node.

Its current responsibilities include:

- Receiving ESP-NOW packets.
- Maintaining communication with configured worker nodes.
- Scanning available Wi-Fi networks.
- Connecting to the Raspberry Pi hotspot.
- Forwarding received telemetry to the Raspberry Pi.
- Handling the communication between the wireless worker network and the gateway.

The master uses configured worker MAC addresses for the current prototype.

### 3. Raspberry Pi Gateway

The Raspberry Pi acts as the local gateway for the system.

The communication path is:

```text
Worker ESP8266
      │
      │ ESP-NOW
      ▼
Master ESP8266
      │
      │ Wi-Fi / TCP
      ▼
Raspberry Pi
```

The gateway provides the connection between the embedded hardware prototype and the software side of the project.

---

## 📡 ESP-NOW Communication

ESP-NOW is used for communication between the ESP8266 worker nodes and the master node.

It provides lightweight device-to-device communication without requiring the worker nodes to connect to a conventional Wi-Fi access point.

The current prototype uses:

- Configured worker MAC addresses
- Structured sensor packets
- Worker IDs
- Sequence numbers
- Sensor telemetry fields
- ESP-NOW packet transmission

The current implementation is a prototype architecture and does not claim production-grade industrial wireless reliability.

---

## 🧪 ESP32 Mesh Simulator

The repository includes a Python-based simulator under:

```text
esp32_mesh_simulator/
```

The simulator provides a software environment for experimenting with mesh communication concepts without requiring the complete physical hardware setup.

### Simulator Capabilities

- Mesh topology simulation
- Channel-quality evaluation
- RSSI/SNR-related metrics
- Packet-loss considerations
- Gateway selection/failover logic
- Flask-based web interface
- Automated tests

### Simulator Structure

```text
esp32_mesh_simulator/
├── app.py
├── build.py
├── channel_quality.py
├── gateway.py
├── mesh.py
├── simulation.py
├── test_app_api.py
├── test_simulation.py
├── requirements.txt
├── README.md
├── templates/
│   └── index.html
└── static/
    ├── script.js
    └── style.css
```

---

## 🖥️ Simulator Architecture

The simulator separates the main simulation responsibilities into different Python modules.

```text
                 ┌────────────────────┐
                 │   Flask Web App     │
                 │      app.py         │
                 └─────────┬──────────┘
                           │
              ┌────────────▼────────────┐
              │       Simulation        │
              │     simulation.py       │
              └────────────┬────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
      Mesh Model      Channel Quality   Gateway Logic
       mesh.py        channel_quality.py   gateway.py
```

This separation makes the simulator easier to test and extend.

---

## 🧰 Hardware

The repository contains the ESP8266 firmware and a KiCad schematic.

Hardware-related files include:

```text
Master_esp.cpp
Slave1.cpp
Slave2.cpp
devfoliohackathon.kicad_sch
```

The prototype uses:

- ESP8266 worker nodes
- ESP8266 master node
- Raspberry Pi gateway
- ESP-NOW communication
- Local Wi-Fi/TCP communication
- Sensor telemetry packets

---

## 💻 Software Stack

### Embedded Firmware

- C++
- ESP8266
- ESP-NOW
- Wi-Fi
- TCP

### Simulator

- Python
- Flask
- HTML
- CSS
- JavaScript

### Hardware Design

- KiCad schematic

### Testing

The simulator contains:

```text
test_simulation.py
test_app_api.py
```

---

## 🚀 Running the Simulator

Move into the simulator directory:

```bash
cd esp32_mesh_simulator
```

Create a Python virtual environment:

```bash
python3 -m venv .venv
```

Activate it:

```bash
source .venv/bin/activate
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Run the simulation tests:

```bash
python test_simulation.py
```

Run the API tests:

```bash
python test_app_api.py
```

Start the web application:

```bash
python app.py
```

The application will display its local address in the terminal.

---

## 🔐 Wi-Fi Configuration

Wi-Fi credentials are intentionally not stored in the public repository.

The master firmware includes:

```cpp
#include "local_config.h"
```

Create a local file named:

```text
local_config.h
```

with:

```cpp
#pragma once

#define WIFI_SSID "YOUR_WIFI_NAME"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
```

Replace the placeholders with the credentials for your own Raspberry Pi hotspot when building the firmware.

A safe template is included in:

```text
local_config.example.h
```

The real `local_config.h` is ignored by Git and should never be committed.

> **Never publish real Wi-Fi passwords or other credentials in source code.**

---

## 🧪 Testing

The project contains both embedded firmware and a software simulator.

The simulator makes it possible to test parts of the communication and gateway logic without depending entirely on the physical hardware.

Before making changes to the simulator, run:

```bash
cd esp32_mesh_simulator
python test_simulation.py
python test_app_api.py
```

The current repository should be considered a **hackathon prototype** intended for experimentation, demonstration, and further development.

It should not be treated as a certified industrial safety system.

---

## 🏆 Hackathon Achievement

### HackVerse: Into the Web

**🥈 2nd Prize — Hardware Track**
**💰 ₹10,000 Cash Prize**

Spidey-Mesh was developed and presented as a hardware-focused project combining:

- Embedded systems
- ESP-NOW communication
- Sensor telemetry
- ESP8266 firmware
- Raspberry Pi gateway integration
- Wireless communication concepts
- Mesh simulation
- Gateway failover experimentation

---

## 🔭 Future Work

The following are potential future improvements and are **not presented as currently implemented features**.

### Wireless Networking

- Dynamic node discovery
- More advanced multi-hop routing
- Improved routing strategies
- Larger-scale mesh experiments
- Wireless performance benchmarking

### Hardware

- Additional physical sensors
- Improved sensor calibration
- Battery optimization
- Enclosures for field testing
- Larger hardware deployments

### Software

- Improved gateway monitoring
- Better visualization
- Historical telemetry storage
- More extensive automated testing
- Remote configuration

### Intelligent Monitoring

- Edge-based anomaly detection
- Machine-learning-assisted analysis
- Predictive safety analytics

These features can be explored in future versions after validating the current prototype.

---

## 📁 Repository Structure

```text
Spidey-Mesh-Hackverse/
│
├── Master_esp.cpp
├── Slave1.cpp
├── Slave2.cpp
├── Carcode.cpp
├── devfoliohackathon.kicad_sch
│
├── esp32_mesh_simulator/
│   ├── app.py
│   ├── build.py
│   ├── channel_quality.py
│   ├── gateway.py
│   ├── mesh.py
│   ├── simulation.py
│   ├── test_app_api.py
│   ├── test_simulation.py
│   ├── requirements.txt
│   ├── README.md
│   ├── templates/
│   └── static/
│
├── local_config.example.h
├── .gitignore
└── README.md
```

---

## 👥 Team

**Spidey-Mesh Team**
**HackVerse: Into the Web**

Add the final team member names and roles here before publishing the project on LinkedIn or other public platforms.

Example:

- Name — Hardware / Embedded Systems
- Name — Software / Simulation
- Name — IoT / Gateway

---

## 📸 Media

Recommended project media:

- Hardware prototype photographs
- ESP8266 setup photographs
- Simulator screenshots
- Architecture diagram
- Demonstration video
- Hackathon presentation
- Award photograph

A future `docs/` directory can be used for project media:

```text
docs/
├── hardware.jpg
├── simulator.png
├── architecture.png
├── demonstration.jpg
└── award.jpg
```

---

## 📌 Project Status

**Status: Hackathon Prototype**

Spidey-Mesh currently contains:

- ESP8266 worker firmware
- ESP8266 master firmware
- ESP-NOW communication
- Raspberry Pi gateway integration
- Sensor telemetry packet handling
- Python mesh simulator
- Channel-quality simulation
- Gateway failover simulation
- Simulator tests
- KiCad hardware schematic

The project is intended as a technical prototype and foundation for further development.

---

## ⭐ Why Spidey-Mesh?

The project combines embedded hardware and software simulation into a single experimental platform.

Instead of testing wireless behaviour only after building the complete hardware system, the simulator provides an additional environment for evaluating communication and gateway behaviour.

This makes the project useful as both:

- A hardware communication prototype
- A software simulation platform for future mesh-network development
