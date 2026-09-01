# ESP32 ESP-NOW Mesh Gateway Failover Simulation Web Application
### Channel-Aware Wireless Mesh Network with Automatic Gateway Election for Mine-Safety Operations

![Python](https://img.shields.io/badge/Python-3.9%2B-blue.svg)
![Flask](https://img.shields.io/badge/Flask-2.3%2B-green.svg)
![License](https://img.shields.io/badge/License-MIT-purple.svg)
![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen.svg)

---

## 1. Overview & Concept

In hazardous underground mining environments, wireless telemetry from sensor nodes (methane, CO, temperature, air pressure, miner location beacons) relies on **ESP32 ESP-NOW wireless mesh networks**. Because miners work in harsh, shifting tunnels, standard centralized gateways frequently experience power loss, physical damage, or line-of-sight obstruction.

This application provides a **pure Python-based web simulation platform** demonstrating **channel-aware automatic gateway failover**. When the primary gateway fails:
1. The mesh autonomously detects gateway loss.
2. Evaluates real-time RF channel metrics from all surviving slave nodes.
3. Ranks candidates deterministically using a multi-factor composite RF score.
4. Promotes the optimal candidate node to become the **New Gateway**.
5. Restores mesh routing and telemetry packet transmission without central coordination.

---

## 2. Geometric Regular Polygon Topology

To ensure predictable, clean, and reproducible network analysis, nodes are **never placed randomly**. Instead, nodes are positioned as vertices of a **regular polygon**:

* **3 nodes** &rarr; Equilateral Triangle
* **4 nodes** &rarr; Square
* **5 nodes** &rarr; Regular Pentagon
* **6 nodes** &rarr; Regular Hexagon
* **7 nodes** &rarr; Regular Heptagon
* **8 nodes** &rarr; Regular Octagon
* **$N$ nodes** &rarr; Regular $N$-gon

### Mathematical Coordinate Formula

For $N$ nodes ($N \ge 3$) centered at $(x_c, y_c)$ with radius $R$:

$$\theta_i = -\frac{\pi}{2} + \frac{2\pi \cdot i}{N} \quad (0 \le i < N)$$

$$x_i = x_c + R \cdot \cos(\theta_i)$$

$$y_i = y_c + R \cdot \sin(\theta_i)$$

* Setting the initial angle offset to $-\frac{\pi}{2}$ places **Node 0 (`ESP32-01`) directly at the top (12 o'clock)** as the default designated **Primary Gateway**.
* The visualization automatically scales its coordinate space to fit any screen resolution and maintain clear spacing.

---

## 3. Channel Quality Scoring Algorithm

The gateway failover decision is **100% deterministic and channel-aware** (never random). Every slave candidate is evaluated across four core wireless telemetry metrics:

1. **RSSI (Received Signal Strength Indicator)**: Measured in dBm (typical range: $-90\text{ dBm}$ to $-30\text{ dBm}$).
2. **SNR (Signal-to-Noise Ratio)**: Measured in dB (typical range: $0\text{ dB}$ to $35\text{ dB}$).
3. **Packet Loss**: Measured in percentage ($0\%$ to $100\%$, lower is better).
4. **Link Quality (LQI)**: Measured in percentage ($0\%$ to $100\%$, higher is better).

### Metric Normalization

Each raw metric is clamped and normalized into a $[0.0, 1.0]$ scalar:

$$\text{norm}(RSSI) = \text{clamp}\left(\frac{RSSI - (-90)}{-30 - (-90)}, 0.0, 1.0\right) = \text{clamp}\left(\frac{RSSI + 90}{60}, 0.0, 1.0\right)$$

$$\text{norm}(SNR) = \text{clamp}\left(\frac{SNR - 0}{35 - 0}, 0.0, 1.0\right) = \text{clamp}\left(\frac{SNR}{35}, 0.0, 1.0\right)$$

$$\text{norm}(\text{Loss}) = \text{clamp}\left(1.0 - \frac{\text{Loss}}{100}, 0.0, 1.0\right) \quad \text{(Inverted: lower loss = higher score)}$$

$$\text{norm}(LQI) = \text{clamp}\left(\frac{LQI}{100}, 0.0, 1.0\right)$$

### Weighted Composite Score Formula

$$\text{Channel Quality Score} = \left( \frac{w_{\text{rssi}} \cdot \text{norm}(RSSI) + w_{\text{snr}} \cdot \text{norm}(SNR) + w_{\text{loss}} \cdot \text{norm}(\text{Loss}) + w_{\text{link}} \cdot \text{norm}(LQI)}{w_{\text{rssi}} + w_{\text{snr}} + w_{\text{loss}} + w_{\text{link}}} \right) \times 100$$

#### Default Weight Distribution:
* **RSSI Weight ($w_{\text{rssi}}$)**: $30\%$ (0.30)
* **SNR Weight ($w_{\text{snr}}$)**: $30\%$ (0.30)
* **Packet Loss Weight ($w_{\text{loss}}$)**: $20\%$ (0.20)
* **Link Quality Weight ($w_{\text{link}}$)**: $20\%$ (0.20)

Weights can be dynamically tuned in real-time from the dashboard control panel.
---

## 4. Gateway Failover & Election Lifecycle

The system operates through an explicit **Finite State Machine (FSM)**:

```
+------------------+
|   INITIALIZED    |
+--------+---------+
         |
         v
+------------------+
| NORMAL_OPERATION | <-----+ (Reset Simulation)
+--------+---------+       |
         | (Gateway Failure Triggered)
         v                 |
+------------------+       |
|  GATEWAY_FAILED  |       |
+--------+---------+       |
         |                 |
         v                 |
+----------------------+   |
| EVALUATING_CANDIDATES|   |
+--------+-------------+   |
         |                 |
         v                 |
+----------------------+   |
| NEW_GATEWAY_SELECTED |   |
+--------+-------------+   |
         |                 |
         v                 |
+------------------+       |
| NETWORK_RECOVERED+-------+
+------------------+
```

### Multi-Stage Failover Transition:
1. **`GATEWAY_FAILED`**: The active gateway goes offline. Its communication links are broken and marked in red/gray.
2. **`EVALUATING_CANDIDATES`**: The remaining online slave nodes are scanned. Channel quality scores are computed.
3. **`NEW_GATEWAY_SELECTED`**: The slave node with the highest composite score is selected as winner. Ties are broken deterministically by lower packet loss &rarr; higher SNR &rarr; higher RSSI.
4. **`NETWORK_RECOVERED`**: The winner is promoted to `NEW_GATEWAY`. Surviving nodes re-route their mesh links to the new gateway, and packet flow resumes.

---

## 5. Project File Structure

```text
esp32_mesh_simulator/
??? app.py                   # Flask server & REST API endpoints
??? channel_quality.py       # RF normalization & composite scoring algorithms
??? gateway.py               # Gateway manager, health check & election engine
??? mesh.py                  # Regular polygon node coordinate generator & link model
??? simulation.py            # Simulation orchestrator & Finite State Machine (FSM)
??? requirements.txt         # Python dependencies
??? test_simulation.py       # Unit tests for geometry, math & failover
??? test_app_api.py          # Integration tests for Flask endpoints
??? README.md                # Comprehensive documentation & user guide
??? templates/
?   ??? index.html           # High-tech dark theme operations dashboard
??? static/
    ??? style.css            # Dark mode styles, glowing rings, HUD cards
    ??? script.js            # HTML5 Canvas network visualizer & animation engine
```

---

## 6. Installation & Quick Start

### Prerequisites
* **Python 3.9 or higher** (Python 3.10, 3.11, 3.12, 3.13 fully supported)
* No MATLAB, No external binaries required.

### 1. Set Up Virtual Environment

#### On Windows (PowerShell):
```powershell
# Navigate to the project directory
cd C:\Users\lokna\.gemini\antigravity\scratch\esp32_mesh_simulator

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1
```

#### On Linux / macOS:
```bash
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the Automated Tests

```bash
# Run backend algorithm unit tests
python test_simulation.py

# Run API and integration tests
python test_app_api.py
```

### 4. Start the Web Application

```bash
python app.py
```

Open your browser and navigate to:
```text
http://127.0.0.1:5000
```

---

## 7. Running in Visual Studio Code

1. Open VS Code:
   ```bash
   code C:\Users\lokna\.gemini\antigravity\scratch\esp32_mesh_simulator
   ```
2. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`), type **`Python: Select Interpreter`**, and select the interpreter from your `venv`.
3. Open `app.py` and press `F5` (or click **Run and Debug** in the sidebar).
4. Click the URL `http://127.0.0.1:5000` in the terminal to view the dashboard.

---

## 8. Dashboard Features & Interactive Guide

* **Regular Polygon Node Selector**: Adjust node count from 3 to 16 with instant polygonal recalculation (Triangle, Square, Pentagon, Hexagon, Octagon presets).
* **Channel Parameter Inspector**: Click on any node in the canvas or use the dropdown to fine-tune its RSSI, SNR, Packet Loss, and Link Quality.
* **Make Top Candidate Button**: Instantly sets the selected node to pristine RF conditions to verify election behavior.
* **Scoring Weight Sliders**: Adjust the relative importance of RSSI, SNR, Loss, and Link Quality in real time.
* **Visual Failover Transition**: Click `TRIGGER GATEWAY FAILURE` to watch the multi-stage visual recovery animation:
  * Gateway offline indicator & severed links.
  * Sonar sweep scanning eligible candidates.
  * Gold coronation of the highest-scoring candidate.
  * Illuminated re-routing energy paths and packet particle flow restoration.
* **Real-Time Telemetry & Event Log**: Live candidate ranking table with ranking badges and an auto-scrolling timestamped audit log.
* **Full Reset**: Restore the network to normal operation with one click.
