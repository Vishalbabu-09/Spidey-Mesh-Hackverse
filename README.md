# Spidey-Mesh 🕷️🕸️

**An Off-Grid, Decentralized Wearable Hazard Intelligence & Personnel Safety Network for Subterranean Environments**

> *Formal research framing: "Context- and Mobility-Aware, Age-of-Information-Optimized Mesh Routing for Offline Underground Emergency Sensor Networks"*

Spidey-Mesh is a wearable safety ecosystem engineered for high-risk, internet-deprived industrial environments such as underground mines and chemical plants. Built on an autonomous, multi-hop ESP-NOW radio mesh, the system continuously monitors toxic gases, flame hazards, and personnel impacts — entirely without cellular or Wi-Fi infrastructure. A Raspberry Pi command hub aggregates telemetry, runs on-edge AI for anomaly detection, and drives a local, offline dashboard for rescue decision-making.

This README consolidates the project's public description with the full **Enhanced Technical Specification & Research Framework** that defines the system's architecture, protocol design, experimental methodology, and hackathon scope.

---

## Table of Contents

1. [Key Features](#-key-features)
2. [Repository Structure](#repository-structure)
3. [Critical Design Constraints](#1-critical-analysis-of-the-base-idea)
4. [Project Redefinition & Core Novelty](#2-project-redefinition--core-novelty)
5. [System Architecture](#3-enhanced-system-architecture)
6. [Communication & Mesh Protocol Design](#4-communication--lightweight-mesh-protocol-design)
7. [Context-Aware & Mobility-Predictive Routing](#5-context-aware--mobility-predictive-routing)
8. [Mine Collapse Experimental Methodology](#6-mine-collapse-experimental-methodology)
9. [TinyML & Raspberry Pi AI Architecture](#7-tinyml--raspberry-pi-ai-architecture)
10. [Rover Localization & Reconnaissance](#8-rover-localization--reconnaissance-design)
11. [Hardware & Software Stack](#9-hardware--software-stack-specifications)
12. [Implementation Roadmap](#10-step-by-step-hackathon-implementation-roadmap)
13. [MVP vs. Advanced Versions](#11-mvp-vs-advanced-versions)
14. [Experimental Evaluation & Baselines](#12-experimental-evaluation--baseline-comparisons)
15. [Research Contributions & Paper Angle](#13-formal-research-contributions--paper-angle)
16. [Honest Assessment & Demo Strategy](#14-brutally-honest-assessment--judge-demo-strategy)

---

## 🚀 Key Features

- **100% Off-Grid Multi-Hop Mesh** — Self-healing, peer-to-peer radio network using ESP-NOW as the PHY/MAC substrate with a custom lightweight ad-hoc routing layer for zero-latency node-to-node telemetry.
- **Autonomous Edge Protection** — Wearable worker nodes with local MPU6050-based fall detection and haptic/audible alert actuators for immediate on-body feedback, independent of network state.
- **AI-Powered Predictive Analytics** — Raspberry Pi command hub running classical/statistical time-series models to flag cross-worker correlated anomalies and forecast toxic gas trends before critical thresholds are breached.
- **Fail-Safe & Resilient** — Fully decentralized architecture: wearable and relay nodes continue to operate and self-heal their routes independently during central gateway or relay-node failure (e.g., simulated tunnel collapse).

---

## Repository Structure

The repository currently contains:

| Path | Purpose |
|---|---|
| `esp32_mesh_simulator/` | Software simulation of the ESP32 mesh network — used to develop, validate, and demonstrate mesh routing/self-healing behavior without requiring the full physical node deployment. |
| `devfoliohackathon.kicad_sch` | KiCad schematic for the project's hardware design (submitted as part of the Devfolio hackathon platform). |
| `README.md` | Project overview and documentation (this file). |

*(Note: the full contents of `esp32_mesh_simulator/` could not be enumerated automatically due to GitHub's crawl restrictions on directory-tree pages — refer to that folder directly in the repository for the simulator's implementation details.)*

---

## 1. Critical Analysis of the Base Idea

Several assumptions common to "offline mine safety mesh" project pitches do not survive contact with RF reality or the physical constraints of a mine tunnel. Spidey-Mesh is designed around the following corrections:

- **RSSI-based localization underground is fundamentally unreliable, not just "noisy."** In a mine gallery, multipath from rock walls, severe shadowing at bends/junctions, metal ore veins and rail tracks, and dust/humidity all distort propagation. RSSI-to-distance mapping in tunnels is frequently **non-monotonic** — signal can be stronger 10 m away than 3 m away around a bend. RSSI is treated as a **coarse topology/link-quality indicator only**, never as a metric-distance estimator.
- **"ESP-NOW mesh" is not a mesh protocol** — it is a Layer-2 unicast/broadcast primitive with no native multi-hop routing, route discovery, or ACK/retry semantics beyond a single hop, and a hard peer limit (historically ~20 encrypted peers). Spidey-Mesh is precise about this: **"ESP-NOW as PHY/MAC substrate + custom lightweight ad-hoc routing layer,"** not "ESP-NOW mesh networking."
- **Mechanical debris-clearing on the rover is descoped** as scope creep — a rover doing RSSI localization, video, illumination, *and* active debris clearing bolts together three hard subsystems. At most, a passive pivoting bumper/plow is included; active clearing is out of scope.
- **"Predictive ML" on a Raspberry Pi 3B is scoped to what the hardware can actually run** — lightweight classical ML (Random Forest, Isolation Forest, ARIMA/exponential smoothing), not real-time heavy deep learning. The system targets anomaly detection and multi-sensor correlation, not deep multi-worker collapse-prediction models.
- **Worker mobility is not modeled as a random walk.** Miners move on a schedule, along known gallery topology, in shifts, with known task assignments — this predictable structure is exploited rather than ignored (see [Section 5](#5-context-aware--mobility-predictive-routing)).
- **Age of Information (AoI) is a first-class design concern**, not an afterthought. Emergency safety systems live and die by how stale the last known state of each worker is — not merely whether a packet arrived. This is the deepest, most defensible research angle of the project.
- **Power budget is explicitly addressed** — ESP32 duty cycling, sleep states, and battery life for a wearable that must survive an 8–12 hour shift are core design requirements, not a footnote.
- **Scope discipline over feature-breadth**: trend dashboards, full multi-hop mesh, TinyML fall detection, RSSI-based topology awareness, teleoperated rover reconnaissance, and collapse simulation are all present, but the project deliberately goes *deep* on one axis — resilient, AoI-aware routing under simulated collapse — rather than shallow across all of them.

---

## 2. Project Redefinition & Core Novelty

**Precise problem statement:** Design and evaluate a resource-constrained, fully offline wireless sensor network for underground mine safety monitoring, in which routing decisions jointly account for link quality, node energy state, emergency priority, and Age of Information — and in which worker mobility is modeled as schedule-and-topology-constrained (not random) — so the network can anticipate topology changes and pre-adapt routes, while remaining robust to sudden, non-anticipated link failures caused by localized structural collapse.

**Single coherent central theme:** *"Context- and Mobility-Aware, AoI-Optimized Self-Healing Mesh Routing for Underground Emergency Sensor Networks."* Every other subsystem (TinyML, rover, dashboard) exists to generate load and priority events for the routing layer to handle, and to demonstrate the consequences of routing decisions — not as independent feature bullets.

### Hackathon Scope vs. Explicit Future Work

| In scope for hackathon | Explicit future work |
|---|---|
| Custom lightweight routing layer over ESP-NOW with AoI + priority + link-quality metric | Formal multi-hop MANET protocol conformant to a standard (e.g., RPL) |
| Schedule-based static/semi-static mobility model (2–3 predefined shift patterns) | Learned mobility prediction (HMM/LSTM) from real historical worker traces |
| Simulated collapse via manual node kill / relay power-off | Physically instrumented collapse rig with real structural sensors |
| RSSI used only as coarse link-quality/topology signal | Full trilateration/fingerprinting localization system |
| TinyML: decision tree / small 1D-CNN for fall + gas threshold anomaly | Deep multi-modal sensor fusion models |
| Pi-based Isolation Forest / Random Forest for cross-worker correlation | Federated/online learning across shifts, predictive maintenance at scale |
| Rover: teleoperated with RSSI-based coarse "closer/farther" guidance | Autonomous SLAM-based rover navigation, active debris clearing |

---

## 3. Enhanced System Architecture

**a) Telemetry → TinyML → Routing → Gateway → Dashboard**
Sensors (flame, MCP-style gas sensor, MPU6050) sampled at fixed windows on the ESP32 worker node → feature extraction (windowed statistics + FFT-lite for IMU) → on-device TinyML classifier outputs a discrete state (Normal / Fall / Faint / Gas-Anomaly / Fire) → this state plus raw sensor bytes plus computed AoI are packed into the packet structure ([Section 4](#4-communication--lightweight-mesh-protocol-design)) → routing layer selects next hop using the context-aware metric ([Section 5](#5-context-aware--mobility-predictive-routing)) → packet is forwarded hop-by-hop with duplicate suppression and TTL decrement → arrives at ESP32 Gateway → Gateway pushes over UART/USB-serial to Raspberry Pi → Pi ingests into a local time-series store (SQLite/InfluxDB-lite) → offline dashboard (Flask/local web server, no internet) renders live worker states and trend charts.

**b) Mobility Prediction → Dynamic Topology/Routing Adjustment**
Each worker is assigned a known shift route (sequence of gallery zones with expected dwell times) loaded into the base station at shift start and broadcast to relay nodes. As a worker's last-known zone and elapsed time update, the base station (and, in a lightweight decentralized form, the relay nodes themselves) compute an expected next-zone probability. Relay nodes serving the zone a worker is predicted to enter are pre-emptively given higher priority/wake duty cycle, and the routing metric applies a small bonus to relays aligned with a worker's predicted trajectory — reducing route-discovery latency when the worker actually moves.

**c) Mine Collapse → Link Failure → Self-Healing Route Discovery → AoI Optimization**
When a relay/link fails (simulated by power-off or forced packet drop), downstream nodes detect it via missed ACKs/heartbeats within a bounded timeout. Affected nodes initiate a lightweight route-discovery broadcast ([Section 4.2](#4-communication--lightweight-mesh-protocol-design)) to rebuild a next-hop table. During the outage window, buffered packets are prioritized by an AoI-weighted priority score, so that once a route is restored, the most stale, highest-priority information is flushed first rather than in FIFO order — directly optimizing the metric that matters most for rescue decisions.

**d) High-Priority Emergency Event → Local Alarm → Preemptive Mesh Forwarding → Base Station Alert → Rover Deployment**
A TinyML-classified emergency (fall/gas/fire) triggers: (1) an immediate local buzzer/haptic alarm on the wearable, (2) a priority-flagged packet that pre-empts normal telemetry in the relay's send queue (priority queue, not FIFO), (3) reduced-TTL flood-assist for the first hop only (send to all neighbors, not just the best next-hop) to minimize emergency-alert latency, (4) a base-station dashboard alert (visual/audio) with worker ID and last-known zone, and (5) a human operator go/no-go decision to deploy the rover toward that zone using coarse RSSI-gradient guidance.

---

## 4. Communication & Lightweight Mesh Protocol Design

### 4.1 Binary Packet Structure (ESP-NOW payload, max 250 bytes)

| Offset | Size | Field | Notes |
|---|---|---|---|
| 0 | 1 | Packet Type | 0=Telemetry, 1=Emergency, 2=RouteDiscovery, 3=RouteReply, 4=ACK, 5=Heartbeat |
| 1 | 2 | Source Node ID | uint16 |
| 3 | 2 | Origin Node ID | uint16 (for multi-hop: source of THIS hop vs. true origin) |
| 5 | 1 | Priority | 0=Normal, 1=Warning, 2=Emergency, 3=Critical (fall/fire) |
| 6 | 1 | TTL / Hop Limit | decremented per hop, drop at 0 |
| 7 | 1 | Hop Count So Far | for metric calc + diagnostics |
| 8 | 2 | Sequence Number | uint16, per-origin, for dedup |
| 10 | 4 | Timestamp (origin) | uint32 ms since node boot (for AoI calc) |
| 14 | 1 | Battery Level | 0–255 scaled |
| 15 | 1 | Link RSSI (last hop) | int8, dBm offset-encoded |
| 16 | 1 | Node Health Flags | bit0=sensor fault, bit1=low batt, bit2=stationary>Xmin |
| 17 | 6 | Sensor Payload | flame(1B) + gas(2B) + IMU-derived state(1B) + temp(1B) + reserved(1B) |
| 23 | 1 | TinyML Class | 0=Normal, 1=Fall, 2=Faint, 3=GasAnomaly, 4=Fire, 5=Immobile |
| 24 | 2 | Predicted Zone ID | next expected gallery zone (for mobility-aware routing) |
| 26 | 1 | CRC-8 | simple checksum over bytes 0–25 |

**Total: 27 bytes** — comfortably under the 250-byte ESP-NOW payload limit, leaving room for future fields.

AoI is **not** stored explicitly in the packet — it is computed at each receiving node as `AoI = local_clock - origin_timestamp` (with a clock-offset calibration handshake at network bring-up, since ESP32s don't share a wall clock offline without NTP). Computing AoI at the point of use rather than transmitting it saves bytes and avoids clock-sync fragility over multiple hops.

### 4.2 Lightweight Ad-Hoc Routing Layer over Raw ESP-NOW

- **Neighbor discovery / heartbeat:** every relay broadcasts a small Heartbeat packet (Type 5) every 2–5 s containing its Node ID, battery, and current best-path-to-gateway hop count. Nodes build a neighbor table: `{neighbor_id, last_rssi, last_seen, hop_to_gateway}`.
- **Duplicate suppression:** each node keeps a ring buffer (last 32 entries) of `(origin_id, seq_num)` pairs seen recently; matching packets are dropped before re-forwarding — essential because emergency flood-assist would otherwise create broadcast storms.
- **Next-hop selection:** on receiving a telemetry/emergency packet not addressed to itself as final destination, a node computes the routing metric ([Section 5](#5-context-aware--mobility-predictive-routing)) across its neighbor table and unicasts to the best-scoring neighbor. If no neighbor beats "broadcast," or for Critical-priority packets, it broadcasts to all neighbors once (controlled flood, bounded by TTL).
- **ACK & retransmission:** unicast forwards expect an ACK (Type 4) within a short timeout (e.g., 150–300 ms, tunable). On timeout, retry up to 2 times, then either re-broadcast or mark that neighbor link "degraded" and try the second-best neighbor.
- **Route discovery (post-failure):** if a node's best next-hop has not sent a heartbeat within 3× the heartbeat interval, the node marks the link dead, purges it from its neighbor table, and broadcasts a RouteDiscovery packet (Type 2). Neighbors with a valid path to gateway reply with RouteReply (Type 3) containing their hop-count-to-gateway; the requester picks the best replier and updates its table. This is the mechanism under test in the collapse experiment ([Section 6](#6-mine-collapse-experimental-methodology)).

---

## 5. Context-Aware & Mobility-Predictive Routing

### 5.1 Routing Metric Equation

For each candidate next-hop neighbor `j`, compute a composite score (higher = better) using integer/fixed-point arithmetic:

```
Score(j) = w1 * LQ(j) + w2 * (1 / (1 + HopCount(j))) + w3 * Battery(j)
         + w4 * Priority_boost(packet) + w5 * MobilityAlignment(j, predicted_zone)
         - w6 * AoI_penalty(j)
```

Where:
- **`LQ(j)`** = normalized link quality = `0.6 * PDR_recent + 0.4 * RSSI_normalized`, both in [0,1]. `PDR_recent` is computed from the ACK success ratio over the last N unicast attempts to `j` — a real, measurable quantity, unlike raw RSSI-as-distance.
- **`HopCount(j)`** = `j`'s advertised hop-count-to-gateway from its last heartbeat.
- **`Battery(j)`** in [0,1] — deprioritizes routing heavy traffic through nodes near depletion, protecting network longevity.
- **`Priority_boost(packet)`** — for Critical/Emergency packets, temporarily zeroes out or reduces `w2`/`w3` influence and heavily weights LQ plus a "flood-assist" flag, since latency matters more than efficiency during an emergency.
- **`MobilityAlignment(j, predicted_zone)`** = 1 if node `j` serves the zone the origin worker is predicted to move into next, else 0 — a small but real bonus that reduces churn as workers move along predicted paths.
- **`AoI_penalty(j)`** — if node `j` is itself carrying/aggregating a backlog of stale packets (high average outbound-queue AoI), penalize routing more traffic through it to avoid compounding staleness.

**Suggested starting weights** (tunable hyperparameters, validated experimentally — see [Section 12](#12-experimental-evaluation--baseline-comparisons)):
`w1=0.35, w2=0.20, w3=0.10, w4=0.20 (activated only for priority>0), w5=0.10, w6=0.15`

### 5.2 Mobility Model Based on Gallery Topology and Shift Schedules

The mine is modeled as a **graph, not a continuous 2D space**: nodes = gallery junctions/zones, edges = tunnel segments with known walking-time weights. Each worker is assigned, at shift start, a task route — an ordered list of zones with expected arrival windows, mirroring real mine shift-scheduling practice. A simple discrete-time Markov chain over zones, conditioned on scheduled task and elapsed time-in-zone, gives `P(next_zone | current_zone, task, dwell_time)` — implementable as a lookup table (no trained model required for the hackathon scope): if a worker has dwelled in Zone A less than their scheduled task time, `P(stay)` is high; once past it, probability mass shifts to the next scheduled zone and its neighbors. Relay nodes covering the predicted next zone get a small pre-activation ([Section 3b](#3-enhanced-system-architecture)) and the routing bonus in 5.1 — directly measurable and demonstrable on the dashboard as "predicted path" vs. "actual path."

---

## 6. Mine Collapse Experimental Methodology

### 6.1 Setup
Physical testbed: 6–10 ESP32 nodes (mix of worker + relay roles) laid out to mimic a branching gallery topology (e.g., in a hallway/stairwell with corners to induce real multipath, or under cardboard/metal sheeting to simulate attenuation). "Collapse" is simulated by physically powering off 1–3 relay nodes simultaneously (representing a tunnel section becoming impassable/destroyed) at a controlled point mid-experiment, while telemetry generation continues at worker nodes.

### 6.2 Phases
1. **Baseline (pre-collapse):** steady-state telemetry for 5–10 minutes, network fully connected.
2. **Collapse event:** kill target relay(s) at t=0 of this phase; log everything from that instant.
3. **Recovery:** measure time and packet behavior until best-effort alternate routes stabilize.
4. **Post-recovery steady state:** confirm sustained delivery on the new topology.

### 6.3 Metrics
- **Packet Delivery Ratio (PDR)** = delivered / sent, computed per-phase and network-wide.
- **End-to-End Latency** = timestamp at gateway − origin timestamp (using calibrated clock offset).
- **Emergency Alert Latency** specifically for Critical-priority packets — the headline demo metric.
- **Route Recovery Time** = time from last successful heartbeat through dead relay to first successfully delivered packet on the new route.
- **Throughput** = successfully delivered bytes/sec at the gateway.
- **AoI degradation** — plot AoI-at-gateway over time per worker; show the spike during collapse and the AoI-aware priority flush at recovery reducing the "informational blackout" compared to FIFO.

All data is logged on the Pi (serial capture from gateway, plus per-node local logging to SD/flash if available) to produce raw data for results plots, not just a live demo.

---

## 7. TinyML & Raspberry Pi AI Architecture

### 7.1 On-Node TinyML (ESP32)
- **Inputs:** MPU6050 accelerometer+gyro (6-axis) sampled at 50–100 Hz; flame sensor (digital/analog threshold); gas sensor (analog, e.g. MQ-series) sampled at 1 Hz.
- **Feature extraction:** 1–2 second sliding window (50–200 samples) for IMU; mean, variance, min/max, jerk (derivative magnitude), and a simple energy measure (sum of squared magnitude) — sufficient for fall/faint discrimination without on-device FFT.
- **Model architecture:** a decision tree or small random forest (5–10 trees, depth ≤6) trained offline in Python (scikit-learn), then hand-ported/converted to C via `micromelon`/`m2cgen`/`emlearn` for near-zero RAM footprint (a few KB). A 1D-CNN via TensorFlow Lite Micro is a stretch goal only, given the extra toolchain risk (quantization, arena sizing) on a hackathon timeline.
- **Memory footprint target:** model + feature buffers under ~20 KB (ESP32 has ~320 KB SRAM total, shared with the WiFi/ESP-NOW stack, sensor drivers, and packet buffers).
- **Datasets:** no public underground fall dataset exists — a small labeled dataset must be self-collected (controlled falls, faints/lying-still, and normal walking/working motions on padding). For gas, threshold-based anomaly detection (fixed + adaptive baseline-drift threshold) is more defensible than training a gas-anomaly classifier from a hackathon-scale dataset.

### 7.2 Base-Station AI (Raspberry Pi 3B)
- **Isolation Forest** across the multi-worker feature vector (per-zone aggregated gas readings, motion inactivity durations, packet-loss patterns) to flag cross-worker correlated anomalies — e.g., multiple gas sensors trending up in the same zone simultaneously, a much stronger fire/gas-buildup signal than any single sensor.
- **Simple time-series forecasting** (exponential smoothing / small ARIMA via `statsmodels`) on per-zone gas trend, giving an early-warning trend line on the dashboard — explicitly framed as a "trend indicator," not a certified gas-safety instrument.
- All base-station ML is kept **classical/statistical**, not deep learning — the Pi 3B's 1 GB RAM and lack of GPU make anything beyond scikit-learn-scale models a live-demo reliability risk.

---

## 8. Rover Localization & Reconnaissance Design

### 8.1 RSSI Localization Reality Check
Straight trilateration will not work reliably underground due to multipath and non-monotonic RSSI-distance behavior. Two mitigations, ranked by hackathon feasibility:

1. **RSSI-gradient guidance (recommended primary approach):** don't estimate absolute position. The rover reports RSSI to the nearest 2–3 fixed relay nodes as it moves; a human operator (or simple onboard logic) drives toward increasing RSSI to the relay nearest the target worker's last-known zone — a much weaker, more honest claim than absolute localization.
2. **Fingerprinting (stretch goal):** pre-walk the tunnel with the rover before the emergency, recording an RSSI-vector-to-zone map at fixed waypoints; at runtime, match live RSSI vectors to the closest fingerprint via k-NN. More research-credible, but requires a calibration pass — presented as future work backed by a feasibility argument, not a promised live demo.

The system explicitly does **not** promise a Kalman-filtered trilateration system — a claim that experienced judges will probe, and that real-corridor multipath will likely make embarrassing live.

### 8.2 Mechanical/Power/Control Boundaries
- **Chassis:** simple 4-wheel or tank-tread differential-drive platform, off-the-shelf motor driver (L298N/TB6612), no active debris-clearing arm — at most a passive plow/bumper.
- **Power:** separate battery pack for drive motors vs. logic (ESP32/Pi + camera), to avoid brownouts from motor-stall current resetting compute — a real, common hackathon failure mode.
- **Control split:** default teleoperated (operator drives via base-station UI over the mesh, low frame-rate/resolution video given ESP-NOW/local-link bandwidth limits) with a clearly labeled "autonomous assist" mode limited to obstacle-stop (ultrasonic/IR proximity halting forward motion). Full autonomous navigation/SLAM is explicitly out of scope.

---

## 9. Hardware & Software Stack Specifications

| Node Type | Hardware | Software/Firmware |
|---|---|---|
| **Worker Node** | ESP32 (WROOM-32), MPU6050, flame sensor, MQ-series gas sensor, buzzer, LiPo battery + charge circuit | Arduino/ESP-IDF, ESP-NOW driver, custom routing layer, on-device TinyML (emlearn/m2cgen-generated C), deep-sleep duty cycling |
| **Relay Node** | ESP32 (bare, no sensors needed, optionally battery or mains-powered), external antenna optional | Same routing/heartbeat firmware minus sensor/TinyML code |
| **Gateway** | ESP32 + USB-serial to Pi | Routing firmware + serial bridge protocol (simple length-prefixed frame over UART) |
| **Base Station** | Raspberry Pi 3B, SD card, optional small display | Python (Flask or FastAPI local server), SQLite/InfluxDB-lite for time-series, scikit-learn (Isolation Forest, RF), statsmodels (forecasting), local HTML/JS dashboard bundled without CDN dependencies (Chart.js/D3 served locally, since the system is offline) |
| **Rover** | ESP32 or Pi Zero 2 W (compute), motor driver (L298N/TB6612), DC motors, ESP32-CAM or USB camera, LED illumination, ultrasonic/IR proximity sensors, separate battery packs | Same routing stack firmware + drive control; video streamed via local MJPEG over the mesh link, or a dedicated short-range link if bandwidth is insufficient |

---

## 10. Step-by-Step Hackathon Implementation Roadmap

1. **Bring-up:** flash bare ESP32s, verify ESP-NOW unicast/broadcast between 2 nodes. *Deliverable:* two nodes exchanging a hardcoded packet.
2. **Packet structure implementation:** implement the byte-level struct ([Section 4.1](#4-communication--lightweight-mesh-protocol-design)) with CRC check. *Test:* corrupt a byte intentionally, confirm CRC rejects it.
3. **Sensor integration on worker node:** wire flame/gas/IMU, verify raw readings logged over serial. *Fallback:* if MQ-gas sensor warm-up (~24–48h burn-in) is an issue, use relative-baseline drift detection instead of absolute ppm.
4. **TinyML data collection + training:** collect fall/normal motion samples, train a decision tree offline, port to C. *Deliverable:* on-device classification matching the offline model's predictions on identical test motions.
5. **3-node relay chain:** implement heartbeat + neighbor table + basic next-hop forwarding (hop-count-only metric first, as baseline). *Test:* multi-hop delivery across 3 nodes confirmed via gateway log.
6. **Duplicate suppression + ACK/retry:** add sequence-based dedup and ACK timeout/retry logic. *Test:* deliberately drop an ACK and confirm retry behavior.
7. **Context-aware metric:** replace hop-count-only with the full weighted metric ([Section 5.1](#5-context-aware--mobility-predictive-routing)); log score components for debugging. *Fallback:* ship a reduced 2-term metric (LQ + hop count) if time-constrained, documenting the full metric as designed-but-partially-tuned.
8. **Route discovery/self-healing:** implement dead-link detection + RouteDiscovery/RouteReply. *Test:* power off a relay mid-transmission, measure recovery time manually before automating logging.
9. **Gateway–Pi bridge + dashboard v1:** serial protocol, SQLite ingestion, basic live table of worker states. *Deliverable:* dashboard shows live sensor values updating.
10. **Base-station AI:** Isolation Forest + simple forecasting on collected data; surface anomaly flags on the dashboard.
11. **Mobility model + emergency flow integration:** shift-schedule table, mobility-alignment bonus in the metric, emergency priority queue + preemptive flood-assist, buzzer/dashboard alert chain end-to-end.
12. **Collapse demo + rover integration:** run the full experimental methodology ([Section 6](#6-mine-collapse-experimental-methodology)), integrate rover teleoperation with RSSI-gradient guidance on the dashboard, rehearse the live demo script repeatedly ([Section 14](#14-brutally-honest-assessment--judge-demo-strategy)).

At every phase, define the fallback: if a phase isn't done by its checkpoint, **degrade gracefully** (e.g., ship hop-count-only routing rather than nothing; ship threshold-based fall detection rather than no TinyML) rather than leaving a subsystem entirely broken.

---

## 11. MVP vs. Advanced Versions

### a) Bare-Bones MVP
3–4 ESP32 nodes (2 worker + 1–2 relay) + gateway + Pi dashboard. Hop-count-only routing (no full metric yet). Simple threshold-based fall detection (no trained model). Manual "collapse" = physically unplug a relay, showing the dashboard losing/regaining that worker's data. No rover. **This alone is a legitimate, demonstrable offline safety mesh.**

### b) Strong Hackathon Prototype (target)
Everything in the MVP, plus: full context-aware routing metric with real tuned weights, TinyML decision-tree fall/gas classification on-device, schedule-based mobility model with visible predicted-vs-actual path on the dashboard, AoI computation and visualization (a live AoI graph per worker is a strong, unusual demo visual), an automated collapse experiment with logged PDR/latency/recovery-time numbers presented as a results slide, and a teleoperated rover with RSSI-gradient guidance (no autonomy claims).

### c) Advanced Industrial/Research Prototype (explicitly NOT for this hackathon)
Learned (not table-based) mobility prediction from real historical traces, standardized MANET protocol conformance, fingerprinting-based rover localization with a full calibration pipeline, autonomous SLAM navigation and active debris clearing, ruggedized IP-rated enclosures and intrinsically-safe (explosion-proof) electronics certification (a real, non-negotiable requirement for actual mine deployment), and multi-shift longitudinal predictive-maintenance models.

**Explicitly not built during the hackathon:** active mechanical debris clearing, RSSI trilateration claiming metric accuracy, autonomous rover navigation/SLAM, any claim of intrinsic safety/explosion-proofing, deep learning models on the Pi, or a "real" multi-gallery physical minesite test (a hallway/stairwell mockup is the honest and correct scope).

---

## 12. Experimental Evaluation & Baseline Comparisons

| Approach | Description | Expected Behavior |
|---|---|---|
| **Baseline A: Single-hop only** | Every node tries direct-to-gateway, no forwarding | Fails entirely beyond radio range of gateway; establishes the "why mesh at all" floor |
| **Baseline B: Hop-count-only routing** | Classic shortest-path, no link-quality/battery/priority awareness | Works but degrades badly under lossy links (picks a "short" but weak-signal path); no emergency preemption |
| **Baseline C: Static RSSI-threshold routing** | Route to whichever neighbor has strongest instantaneous RSSI, no PDR/hop/battery factored in | Vulnerable to RSSI's multipath instability — expect route flapping |
| **Proposed: Context/Mobility/AoI-aware routing** | Full weighted metric ([Section 5.1](#5-context-aware--mobility-predictive-routing)) | Higher sustained PDR under lossy/collapsed conditions, lower emergency-alert latency from priority preemption, lower average AoI at gateway, faster stabilization (less flapping) than Baseline C |

All four are run under identical baseline → collapse → recovery phases ([Section 6](#6-mine-collapse-experimental-methodology)), with PDR, latency, recovery time, and AoI plotted on the same axes for direct comparison — this comparison is the project's results section.

---

## 13. Formal Research Contributions & Paper Angle

**Contributions (3–4 to actually defend):**
- A lightweight, bytes-efficient routing metric that jointly incorporates link quality, energy, emergency priority, and Age of Information on a sub-$10 microcontroller with no floating-point dependency requirement.
- A schedule-and-topology-constrained mobility model (rather than random-walk MANET assumptions) shown to reduce route-discovery churn for workers moving along predictable paths.
- An empirical characterization of self-healing route-recovery time and AoI degradation under a physically simulated localized link-failure event, benchmarked against standard baselines.
- A practical demonstration that RSSI should be treated as a coarse relative signal (gradient guidance) rather than an absolute distance metric for underground reconnaissance robotics.

**Paper framework:**
- **Title:** *"Context- and Mobility-Aware, Age-of-Information-Optimized Mesh Routing for Offline Underground Emergency Sensor Networks"*
- **Problem:** offline underground safety networks lack joint awareness of link quality, priority, and information freshness.
- **Approach:** a lightweight composite routing metric plus schedule-based mobility prediction, evaluated under simulated collapse.
- **Headline finding (hypothesized):** lower AoI and faster recovery vs. hop-count/RSSI baselines.

**Key research questions:**
1. Does incorporating AoI into the routing metric measurably reduce information staleness during and after link failure, compared to hop-count/RSSI baselines?
2. Does schedule-aware mobility prediction reduce route-discovery latency for predictably-moving nodes?
3. How does recovery time scale with the number and position of simultaneously failed relays?

**Hypotheses:**
- **H1:** the composite metric achieves lower average AoI at the gateway than all three baselines under identical collapse conditions.
- **H2:** the mobility-alignment bonus reduces route-flap count for scheduled workers vs. an otherwise-identical metric without it.

Results are presented as hypotheses to be tested, not guaranteed outcomes.

---

## 14. Brutally Honest Assessment & Judge Demo Strategy

**Feasibility for a 3rd-year team:** the Strong Hackathon Prototype ([Section 11b](#11-mvp-vs-advanced-versions)) is achievable in a typical 24–48 hour hackathon only if the team is already comfortable with ESP32/Arduino development and at least one member has prior basic Python ML experience — this is not a "learn ESP-NOW from scratch during the hackathon" scope. Teams starting from near-zero on embedded networking should target the MVP and treat the rest as documented-but-not-fully-built design.

**Single strongest demonstration to showcase:** don't lead with the rover or dashboard polish — lead with the **live collapse-and-recovery moment**: kill a relay node in front of the judges, and have the dashboard visibly show (a) that worker's AoI spike in real time, (b) the automatic route-discovery message flow (even via serial log projected on screen), and (c) the emergency packet still getting through faster than normal telemetry because of priority preemption. This single moment makes the project's core technical claim (context/AoI-aware > naive routing) visible and undeniable to a judge in under 30 seconds.

**Top technical failure risks and mitigations:**
- **ESP-NOW range/reliability at the venue** (walls, 2.4 GHz congestion from other teams) — test in the actual or a similar venue beforehand; have a backup fixed short-range layout ready.
- **TinyML behaving differently on-device than in Python** due to feature-extraction mismatches — validate the on-device feature pipeline against the offline Python pipeline on identical raw samples before trusting the ported model.
- **Live demo timing failures** (collapse-recovery takes longer live than in rehearsal) — rehearse the demo 5–10+ times end-to-end, with pre-recorded video/log data as a fallback if live hardware misbehaves.
- **Battery/power brownouts** during the rover or worker-node demo (motor stall resetting a shared power rail) — separate power domains ([Section 8.2](#8-rover-localization--reconnaissance-design)), tested under load, not just powered idle.
- **Overclaiming in the pitch** ("mesh network," "AI-powered," "predictive," "localization" without precise qualification) — rehearse precise language with the team so no one improvises an overclaim under judge questioning.
