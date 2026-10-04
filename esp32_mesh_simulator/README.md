# ESP-NOW Mesh Simulator

A Python/Flask simulation environment for experimenting with mesh communication, wireless channel quality, and gateway failover behaviour.

This simulator is part of the **Spidey-Mesh** hackathon project.

## Features

- Mesh topology simulation
- Channel-quality evaluation
- RSSI/SNR-related metrics
- Packet-loss considerations
- Gateway selection and failover logic
- Flask web interface
- Automated tests

## Project Structure

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
cd ~/hackverse/Spidey-Mesh-Hackverse && cat > esp32_mesh_simulator/README.md <<'EOF'
# ESP-NOW Mesh Simulator

A Python/Flask simulation environment for experimenting with mesh communication, wireless channel quality, and gateway failover behaviour.

This simulator is part of the **Spidey-Mesh** hackathon project.

## Features

- Mesh topology simulation
- Channel-quality evaluation
- RSSI/SNR-related metrics
- Packet-loss considerations
- Gateway selection and failover logic
- Flask web interface
- Automated tests

## Project Structure

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
