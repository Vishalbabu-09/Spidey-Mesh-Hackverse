# 🕸️ ESP-NOW Mesh Simulator

A Python/Flask simulation environment for experimenting with mesh communication, wireless channel quality, and gateway failover behaviour.

The simulator is part of the **Spidey-Mesh** hackathon project and provides a software environment for exploring communication behaviour without requiring the complete physical hardware setup.

---

## ✨ Features

- Mesh topology simulation
- Channel-quality evaluation
- RSSI/SNR-related metrics
- Packet-loss considerations
- Gateway selection and failover logic
- Flask web interface
- Automated tests

---

## 📁 Project Structure

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
├── templates/
│   └── index.html
└── static/
    ├── script.js
    └── style.css
```

---

## 🧩 Architecture

The simulator separates the main responsibilities into dedicated modules:

```text
                 ┌────────────────────┐
                 │    Flask Web App    │
                 │       app.py       │
                 └─────────┬──────────┘
                           │
                 ┌─────────▼──────────┐
                 │     Simulation     │
                 │   simulation.py    │
                 └─────────┬──────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
      Mesh Model      Channel Quality   Gateway Logic
       mesh.py        channel_quality.py   gateway.py
```

This modular structure makes individual simulation components easier to test and extend.

---

## 🚀 Getting Started

From the repository root:

```bash
cd esp32_mesh_simulator
```

Create a virtual environment:

```bash
python3 -m venv .venv
```

Activate it:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

## 🧪 Run Tests

Run the simulation tests:

```bash
python test_simulation.py
```

Run the Flask API tests:

```bash
python test_app_api.py
```

Both test suites are included to validate the simulator's current behaviour.

---

## 🌐 Run the Web Interface

Start the Flask application:

```bash
python app.py
```

The application will display its local address in the terminal.

Open that address in a browser to interact with the simulator.

---

## 🔬 What the Simulator Is For

The simulator is intended to support experimentation with:

- Mesh topology behaviour
- Wireless channel conditions
- Signal-quality metrics
- Packet-loss scenarios
- Gateway selection
- Gateway failover

It complements the physical ESP8266 prototype by providing a software environment for testing communication concepts before expanding the hardware deployment.

---

## 🏗️ Part of Spidey-Mesh

The simulator is one component of the larger **Spidey-Mesh** system:

```text
Worker ESP8266
      │
      │ ESP-NOW
      ▼
Master ESP8266
      │
      │ Wi-Fi / TCP
      ▼
Raspberry Pi Gateway
      │
      ▼
Python Mesh Simulator
```

The physical prototype and simulator serve different purposes: the hardware demonstrates the embedded communication architecture, while the simulator provides an environment for experimenting with mesh and gateway behaviour.

---

## 📌 Project Status

**Status: Hackathon Prototype**

The simulator is intended for experimentation, demonstration, and further development as part of the Spidey-Mesh project.

---

## 🕷️ Spidey-Mesh

**HackVerse: Into the Web**

**🥈 2nd Prize — Hardware Track**

**💰 ₹10,000 Cash Prize**

See the [main project README](../README.md) for the complete project architecture, hardware details, team information, and hackathon documentation.
