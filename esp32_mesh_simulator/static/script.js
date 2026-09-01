/** ESP32 Mesh Simulator - 2D Cartoon Doodle Engine **/
document.addEventListener('DOMContentLoaded', () => {
    // --- Application State ---
    let state = {
        num_nodes: 6,
        polygon_name: "Hexagon",
        primary_gateway_id: "ESP32-01",
        active_gateway_id: "ESP32-01",
        failed_gateways: [],
        promoted_gateway_id: null,
        simulation_state: "INITIALIZED",
        nodes: [],
        links: [],
        weights: { rssi: 0.3, snr: 0.3, packet_loss: 0.2, link_quality: 0.2 },
        candidate_rankings: [],
        logs: [],
        last_failover: null,
    };

    let currentTheme = localStorage.getItem('esp32_theme') || 'dark';
    let selectedNodeId = "ESP32-04";
    let hoveredNodeId = null;
    let animationStage = null;
    let particles = [];
    let dustParticles = [];
    let cableSparks = [];
    let radarAngle = 0;
    let animClock = 0;

    // --- DOM Elements ---
    const canvas = document.getElementById('meshCanvas');
    const ctx = canvas.getContext('2d');
    const canvasContainer = document.getElementById('canvasContainer');

    // Theme Switcher
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeToggleIcon = document.getElementById('themeToggleIcon');
    const themeToggleText = document.getElementById('themeToggleText');

    function applyTheme(theme) {
        currentTheme = theme;
        localStorage.setItem('esp32_theme', theme);
        document.body.className = theme === 'dark' ? 'theme-dark' : 'theme-light';
        if (theme === 'dark') {
            themeToggleIcon.textContent = '☀️';
            themeToggleText.textContent = 'Light Mode';
        } else {
            themeToggleIcon.textContent = '🌙';
            themeToggleText.textContent = 'Dark Mode';
        }
    }

    applyTheme(currentTheme);
    themeToggleBtn.addEventListener('click', () => {
        applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
        showToast(`Switched to ${currentTheme === 'dark' ? '🌙 Dark Cavern' : '☀️ Light Sketchbook'} Mode!`);
    });

    // Header Elements
    const headerTopologyName = document.getElementById('headerTopologyName');
    const headerPrimaryGw = document.getElementById('headerPrimaryGw');
    const headerActiveGw = document.getElementById('headerActiveGw');
    const headerStatePill = document.getElementById('headerStatePill');

    // Controls
    const nodeCountRange = document.getElementById('nodeCountRange');
    const nodeCountVal = document.getElementById('nodeCountVal');
    const presetBtns = document.querySelectorAll('.preset-btn');
    const initialGatewaySelect = document.getElementById('initialGatewaySelect');
    const btnRebuildTopology = document.getElementById('btnRebuildTopology');

    // Weights
    const weightRssiRange = document.getElementById('weightRssiRange');
    const weightSnrRange = document.getElementById('weightSnrRange');
    const weightLossRange = document.getElementById('weightLossRange');
    const weightLinkRange = document.getElementById('weightLinkRange');
    const weightRssiVal = document.getElementById('weightRssiVal');
    const weightSnrVal = document.getElementById('weightSnrVal');
    const weightLossVal = document.getElementById('weightLossVal');
    const weightLinkVal = document.getElementById('weightLinkVal');
    const btnApplyWeights = document.getElementById('btnApplyWeights');

    // Inspector
    const inspectorNodeSelect = document.getElementById('inspectorNodeSelect');
    const inspectorNodeTag = document.getElementById('inspectorNodeTag');
    const nodeRssiInput = document.getElementById('nodeRssiInput');
    const nodeRssiRange = document.getElementById('nodeRssiRange');
    const nodeSnrInput = document.getElementById('nodeSnrInput');
    const nodeSnrRange = document.getElementById('nodeSnrRange');
    const nodeLossInput = document.getElementById('nodeLossInput');
    const nodeLossRange = document.getElementById('nodeLossRange');
    const nodeLinkInput = document.getElementById('nodeLinkInput');
    const nodeLinkRange = document.getElementById('nodeLinkRange');
    const inspectorComputedScore = document.getElementById('inspectorComputedScore');
    const btnSaveNodeMetrics = document.getElementById('btnSaveNodeMetrics');
    const btnMakeTopCandidate = document.getElementById('btnMakeTopCandidate');

    // Action Buttons
    const btnTriggerFailover = document.getElementById('btnTriggerFailover');
    const btnRandomizeChannels = document.getElementById('btnRandomizeChannels');
    const btnResetSimulation = document.getElementById('btnResetSimulation');

    // Visualizer Controls
    const togglePeerLinks = document.getElementById('togglePeerLinks');
    const toggleParticles = document.getElementById('toggleParticles');
    const toggleMetrics = document.getElementById('toggleMetrics');
    const visualizerTopologyTag = document.getElementById('visualizerTopologyTag');
    const animationBanner = document.getElementById('animationBanner');
    const bannerTitle = document.getElementById('bannerTitle');
    const bannerDesc = document.getElementById('bannerDesc');
    const nodeTooltip = document.getElementById('nodeTooltip');
    const ttHeader = document.getElementById('ttHeader');
    const ttBody = document.getElementById('ttBody');

    // Telemetry & Tables
    const hudTotalNodes = document.getElementById('hudTotalNodes');
    const hudOnlineNodes = document.getElementById('hudOnlineNodes');
    const hudOfflineNodes = document.getElementById('hudOfflineNodes');
    const hudRecoveryStatus = document.getElementById('hudRecoveryStatus');
    const activeGwId = document.getElementById('activeGwId');
    const activeGwScore = document.getElementById('activeGwScore');
    const failedGwId = document.getElementById('failedGwId');
    const failedGwStatus = document.getElementById('failedGwStatus');
    const rankingTableBody = document.getElementById('rankingTableBody');
    const candidateCountBadge = document.getElementById('candidateCountBadge');
    const electionRationaleText = document.getElementById('electionRationaleText');
    const eventLogContainer = document.getElementById('eventLogContainer');
    const btnCopyLog = document.getElementById('btnCopyLog');
    const btnClearLog = document.getElementById('btnClearLog');
    const toast = document.getElementById('toast');

    // Subterranean Floating Cartoon Dust Particles
    for (let i = 0; i < 24; i++) {
        dustParticles.push({
            x: Math.random() * 800,
            y: Math.random() * 660,
            size: Math.random() * 2 + 1,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3 - 0.1,
            color: Math.random() > 0.5 ? '#facc15' : '#38bdf8',
        });
    }

    function resizeCanvas() {
        const rect = canvasContainer.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
    async function fetchState() {
        try {
            const res = await fetch('/api/state');
            const json = await res.json();
            if (json.success) updateUIState(json.data);
        } catch (err) {
            console.error("Failed to fetch state:", err);
        }
    }

    function updateUIState(newState) {
        state = newState;
        headerTopologyName.textContent = `${state.polygon_name} (${state.num_nodes} Miners)`;
        headerPrimaryGw.textContent = state.primary_gateway_id;
        headerActiveGw.textContent = state.active_gateway_id;
        visualizerTopologyTag.textContent = `Regular ${state.polygon_name} Shaft`;

        headerStatePill.textContent = state.simulation_state;
        headerStatePill.className = 'status-pill';
        if (state.simulation_state === 'NORMAL_OPERATION') headerStatePill.classList.add('status-normal');
        else if (state.simulation_state === 'GATEWAY_FAILED') headerStatePill.classList.add('status-failed');
        else if (state.simulation_state === 'NETWORK_RECOVERED') headerStatePill.classList.add('status-recovered');
        else headerStatePill.classList.add('status-normal');

        nodeCountRange.value = state.num_nodes;
        nodeCountVal.textContent = state.num_nodes;
        presetBtns.forEach(b => {
            b.classList.toggle('active', parseInt(b.dataset.count) === state.num_nodes);
        });

        populateSelects();

        weightRssiRange.value = Math.round(state.weights.rssi * 100);
        weightSnrRange.value = Math.round(state.weights.snr * 100);
        weightLossRange.value = Math.round(state.weights.packet_loss * 100);
        weightLinkRange.value = Math.round(state.weights.link_quality * 100);
        weightRssiVal.textContent = `${Math.round(state.weights.rssi * 100)}%`;
        weightSnrVal.textContent = `${Math.round(state.weights.snr * 100)}%`;
        weightLossVal.textContent = `${Math.round(state.weights.packet_loss * 100)}%`;
        weightLinkVal.textContent = `${Math.round(state.weights.link_quality * 100)}%`;

        hudTotalNodes.textContent = state.nodes_total;
        hudOnlineNodes.textContent = state.nodes_online;
        hudOfflineNodes.textContent = state.nodes_offline;
        hudRecoveryStatus.textContent = (state.simulation_state === 'NETWORK_RECOVERED') ? 'RECOVERED' : (state.nodes_offline > 0 ? 'FAILOVER' : 'HEALTHY');

        const activeNode = state.nodes.find(n => n.id === state.active_gateway_id);
        activeGwId.textContent = state.active_gateway_id;
        activeGwScore.textContent = activeNode ? `${activeNode.channel_quality_score}%` : '--';

        if (state.failed_gateways && state.failed_gateways.length > 0) {
            failedGwId.textContent = state.failed_gateways.join(', ');
            failedGwStatus.textContent = 'OFFLINE';
        } else {
            failedGwId.textContent = 'NONE';
            failedGwStatus.textContent = 'STANDBY';
        }

        renderRankingsTable();

        if (state.last_failover && state.last_failover.election_record) {
            electionRationaleText.textContent = state.last_failover.election_record.reason;
        } else {
            electionRationaleText.textContent = `Normal mine operation active. The Raspberry Pi and primary gateway router ${state.primary_gateway_id} maintain stable links with all worker helmets.`;
        }

        renderLogs();
        syncInspectorWithNode(selectedNodeId);
    }

    function populateSelects() {
        initialGatewaySelect.innerHTML = '';
        state.nodes.forEach(n => {
            const opt = document.createElement('option');
            opt.value = n.id;
            opt.textContent = `${n.id} (${n.initial_role === 'GATEWAY' ? 'Gateway Router' : 'Dirty Helmet'})`;
            if (n.id === state.primary_gateway_id) opt.selected = true;
            initialGatewaySelect.appendChild(opt);
        });

        inspectorNodeSelect.innerHTML = '';
        state.nodes.forEach(n => {
            const opt = document.createElement('option');
            opt.value = n.id;
            opt.textContent = `${n.id} - ${n.role} (${n.channel_quality_score}%)`;
            if (n.id === selectedNodeId) opt.selected = true;
            inspectorNodeSelect.appendChild(opt);
        });
    }

    function syncInspectorWithNode(nodeId) {
        const node = state.nodes.find(n => n.id === nodeId) || state.nodes[0];
        if (!node) return;

        selectedNodeId = node.id;
        inspectorNodeSelect.value = node.id;
        inspectorNodeTag.textContent = node.id;

        nodeRssiInput.value = node.rssi;
        nodeRssiRange.value = node.rssi;
        nodeSnrInput.value = node.snr;
        nodeSnrRange.value = node.snr;
        nodeLossInput.value = node.packet_loss;
        nodeLossRange.value = node.packet_loss;
        nodeLinkInput.value = node.link_quality;
        nodeLinkRange.value = node.link_quality;

        inspectorComputedScore.textContent = `${node.channel_quality_score}%`;
    }

    function renderRankingsTable() {
        rankingTableBody.innerHTML = '';
        const rankings = state.candidate_rankings || [];
        candidateCountBadge.textContent = `${rankings.length} Active`;

        if (rankings.length === 0) {
            rankingTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:12px;">No miner candidates eligible.</td></tr>`;
            return;
        }

        rankings.forEach((cand, idx) => {
            const tr = document.createElement('tr');
            if (cand.id === state.promoted_gateway_id) tr.classList.add('top-candidate');

            const rankClass = idx === 0 ? 'rank-1' : (idx === 1 ? 'rank-2' : (idx === 2 ? 'rank-3' : ''));
            const statusBadge = (cand.id === state.promoted_gateway_id)
                ? `<span class="status-badge badge-newgw">👑 PROMOTED ROUTER</span>`
                : (idx === 0 ? `<span class="status-badge badge-newgw">⭐ TOP PICK</span>` : `<span class="status-badge badge-candidate">Miner Helmet</span>`);

            tr.innerHTML = `
                <td><span class="rank-badge ${rankClass}">${cand.rank || idx + 1}</span></td>
                <td><strong>${cand.id}</strong></td>
                <td>${cand.rssi} dBm</td>
                <td>${cand.snr} dB</td>
                <td>${cand.packet_loss}%</td>
                <td>${cand.link_quality}%</td>
                <td><strong>${cand.channel_quality_score}%</strong></td>
                <td>${statusBadge}</td>
            `;

            tr.addEventListener('click', () => syncInspectorWithNode(cand.id));
            rankingTableBody.appendChild(tr);
        });
    }

    function renderLogs() {
        const isAtBottom = eventLogContainer.scrollHeight - eventLogContainer.scrollTop <= eventLogContainer.clientHeight + 40;
        eventLogContainer.innerHTML = '';

        (state.logs || []).forEach(l => {
            const div = document.createElement('div');
            div.className = `log-entry log-${l.level}`;
            div.innerHTML = `<span class="log-time">[${l.timestamp}]</span><span class="log-msg">${l.message}</span>`;
            eventLogContainer.appendChild(div);
        });

        if (isAtBottom) eventLogContainer.scrollTop = eventLogContainer.scrollHeight;
    }
    function linkSliderAndInput(input, slider, onChange) {
        input.addEventListener('input', () => {
            slider.value = input.value;
            onChange();
        });
        slider.addEventListener('input', () => {
            input.value = slider.value;
            onChange();
        });
    }

    linkSliderAndInput(nodeRssiInput, nodeRssiRange, updateInspectorLiveScore);
    linkSliderAndInput(nodeSnrInput, nodeSnrRange, updateInspectorLiveScore);
    linkSliderAndInput(nodeLossInput, nodeLossRange, updateInspectorLiveScore);
    linkSliderAndInput(nodeLinkInput, nodeLinkRange, updateInspectorLiveScore);

    function updateInspectorLiveScore() {
        const rssi = parseFloat(nodeRssiInput.value);
        const snr = parseFloat(nodeSnrInput.value);
        const loss = parseFloat(nodeLossInput.value);
        const link = parseFloat(nodeLinkInput.value);

        const wR = parseFloat(weightRssiRange.value) / 100;
        const wS = parseFloat(weightSnrRange.value) / 100;
        const wL = parseFloat(weightLossRange.value) / 100;
        const wQ = parseFloat(weightLinkRange.value) / 100;
        const totalW = (wR + wS + wL + wQ) || 1;

        const nR = Math.max(0, Math.min(1, (rssi - (-90)) / 60));
        const nS = Math.max(0, Math.min(1, snr / 35));
        const nL = Math.max(0, Math.min(1, 1 - (loss / 100)));
        const nQ = Math.max(0, Math.min(1, link / 100));

        const score = (((wR * nR) + (wS * nS) + (wL * nL) + (wQ * nQ)) / totalW) * 100;
        inspectorComputedScore.textContent = `${score.toFixed(1)}%`;
    }

    inspectorNodeSelect.addEventListener('change', () => {
        syncInspectorWithNode(inspectorNodeSelect.value);
    });

    btnSaveNodeMetrics.addEventListener('click', async () => {
        const payload = {
            node_id: selectedNodeId,
            rssi: parseFloat(nodeRssiInput.value),
            snr: parseFloat(nodeSnrInput.value),
            packet_loss: parseFloat(nodeLossInput.value),
            link_quality: parseFloat(nodeLinkInput.value),
        };

        const res = await fetch('/api/update_node', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
            updateUIState(json.data);
            showToast(`Saved metrics for ${selectedNodeId}!`);
        }
    });

    btnMakeTopCandidate.addEventListener('click', async () => {
        const payload = {
            node_id: selectedNodeId,
            rssi: -38.0,
            snr: 33.0,
            packet_loss: 0.1,
            link_quality: 99.5,
        };
        nodeRssiInput.value = payload.rssi;
        nodeRssiRange.value = payload.rssi;
        nodeSnrInput.value = payload.snr;
        nodeSnrRange.value = payload.snr;
        nodeLossInput.value = payload.packet_loss;
        nodeLossRange.value = payload.packet_loss;
        nodeLinkInput.value = payload.link_quality;
        nodeLinkRange.value = payload.link_quality;

        const res = await fetch('/api/update_node', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
            updateUIState(json.data);
            showToast(`🌟 ${selectedNodeId} boosted to Prime Winner stats!`);
        }
    });

    [weightRssiRange, weightSnrRange, weightLossRange, weightLinkRange].forEach(s => {
        s.addEventListener('input', () => {
            weightRssiVal.textContent = `${weightRssiRange.value}%`;
            weightSnrVal.textContent = `${weightSnrRange.value}%`;
            weightLossVal.textContent = `${weightLossRange.value}%`;
            weightLinkVal.textContent = `${weightLinkRange.value}%`;
            updateInspectorLiveScore();
        });
    });

    btnApplyWeights.addEventListener('click', async () => {
        const payload = {
            rssi: parseFloat(weightRssiRange.value) / 100,
            snr: parseFloat(weightSnrRange.value) / 100,
            packet_loss: parseFloat(weightLossRange.value) / 100,
            link_quality: parseFloat(weightLinkRange.value) / 100,
        };

        const res = await fetch('/api/update_weights', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
            updateUIState(json.data);
            showToast("Updated RF scoring weights!");
        }
    });

    nodeCountRange.addEventListener('input', () => {
        nodeCountVal.textContent = nodeCountRange.value;
    });

    presetBtns.forEach(b => {
        b.addEventListener('click', () => {
            nodeCountRange.value = b.dataset.count;
            nodeCountVal.textContent = b.dataset.count;
            rebuildTopology();
        });
    });

    btnRebuildTopology.addEventListener('click', rebuildTopology);

    async function rebuildTopology() {
        const num = parseInt(nodeCountRange.value);
        const primaryGw = initialGatewaySelect.value || "ESP32-01";

        const res = await fetch('/api/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ num_nodes: num, primary_gateway_id: primaryGw }),
        });
        const json = await res.json();
        if (json.success) {
            animationStage = null;
            animationBanner.style.display = 'none';
            updateUIState(json.data);
            showToast(`Rebuilt polygon: ${json.data.polygon_name} (${num} Miners)`);
        }
    }

    btnRandomizeChannels.addEventListener('click', async () => {
        const res = await fetch('/api/randomize_channels', { method: 'POST' });
        const json = await res.json();
        if (json.success) {
            updateUIState(json.data);
            showToast("🎲 Shuffled tunnel RF channel metrics!");
        }
    });

    btnResetSimulation.addEventListener('click', async () => {
        const res = await fetch('/api/reset', { method: 'POST' });
        const json = await res.json();
        if (json.success) {
            animationStage = null;
            animationBanner.style.display = 'none';
            updateUIState(json.data);
            showToast("🔄 Restored mesh to starting Router & Raspberry Pi state!");
        }
    });

    btnCopyLog.addEventListener('click', () => {
        const text = (state.logs || []).map(l => `[${l.timestamp}] [${l.level}] ${l.message}`).join('\n');
        navigator.clipboard.writeText(text);
        showToast("Copied dispatch log to clipboard!");
    });

    btnClearLog.addEventListener('click', () => {
        state.logs = [];
        renderLogs();
        showToast("Log cleared!");
    });
    // --- Failover Animation Sequence ---
    btnTriggerFailover.addEventListener('click', async () => {
        if (state.simulation_state === 'GATEWAY_FAILED' || state.simulation_state === 'NETWORK_RECOVERED') {
            showToast("Simulation is already failed/recovered. Click Reset first.");
            return;
        }

        const res = await fetch('/api/failover/trigger', { method: 'POST' });
        const json = await res.json();
        if (!json.success) {
            showToast(json.error || "Failover failed.");
            return;
        }

        const finalState = json.data;
        const winningCandidate = json.failover_result.new_gateway;

        animationStage = 'FAILING';
        animationBanner.style.display = 'flex';
        bannerTitle.textContent = "💥 GATEWAY ROUTER CRASHED!";
        bannerDesc.textContent = `Router ${state.active_gateway_id} lost power. Raspberry Pi searching tunnel for best helmet...`;

        const localGw = state.nodes.find(n => n.id === state.active_gateway_id);
        if (localGw) {
            localGw.status = 'FAILED';
            localGw.role = 'FAILED_GATEWAY';
        }

        setTimeout(() => {
            animationStage = 'SCANNING';
            bannerTitle.textContent = "🔍 RASPBERRY PI SCANNING";
            bannerDesc.textContent = "Calculating composite RF scores for every dirty yellow helmet...";
        }, 1200);

        setTimeout(() => {
            animationStage = 'PROMOTING';
            bannerTitle.textContent = "👑 NEW GATEWAY ROUTER CROWNED!";
            bannerDesc.textContent = `${winningCandidate} promoted with highest Channel Score!`;
            const winNode = state.nodes.find(n => n.id === winningCandidate);
            if (winNode) {
                winNode.role = 'NEW_GATEWAY';
            }
        }, 2600);

        setTimeout(() => {
            animationStage = 'RECOVERING';
            bannerTitle.textContent = "🎉 MINE TUNNEL RECOVERED!";
            bannerDesc.textContent = `All miner helmets reconnected via ${winningCandidate}. Raspberry Pi link active!`;
            updateUIState(finalState);
        }, 3800);

        setTimeout(() => {
            animationStage = null;
            animationBanner.style.display = 'none';
        }, 5800);
    });

    // --- Particle System for Data Flow ---
    function updateParticles() {
        if (!toggleParticles.checked) {
            particles = [];
            cableSparks = [];
            return;
        }

        // Telemetry packets along mining tracks
        if (Math.random() < 0.4 && state.links.length > 0) {
            const activeLinks = state.links.filter(l => l.active && l.is_gateway_route);
            if (activeLinks.length > 0) {
                const link = activeLinks[Math.floor(Math.random() * activeLinks.length)];
                particles.push({
                    sourceId: link.source,
                    targetId: link.target,
                    progress: 0,
                    speed: 0.016 + Math.random() * 0.018,
                    size: 4 + Math.random() * 2,
                    color: link.quality_score >= 85 ? '#facc15' : (link.quality_score >= 70 ? '#38bdf8' : '#fb923c'),
                });
            }
        }

        // Electrical sparks along the Brain -> Gateway cable
        if (Math.random() < 0.35) {
            cableSparks.push({
                progress: 0,
                speed: 0.02 + Math.random() * 0.02,
                size: 3.5,
            });
        }

        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].progress += particles[i].speed;
            if (particles[i].progress >= 1.0) {
                particles.splice(i, 1);
            }
        }

        for (let i = cableSparks.length - 1; i >= 0; i--) {
            cableSparks[i].progress += cableSparks[i].speed;
            if (cableSparks[i].progress >= 1.0) {
                cableSparks.splice(i, 1);
            }
        }
    }
    // =========================================================================
    // 2D CARTOON DOODLE VECTOR DRAWING FUNCTIONS
    // =========================================================================

    /**
     * Draw 2D Retro Cartoon Raspberry Pi Monitor (Always connected to active Gateway)
     */
    function drawBrainMonitor(ctx, x, y, isConnected, isFailed, animTime, theme) {
        ctx.save();
        const ink = theme === 'dark' ? '#f8fafc' : '#23272f';
        const monBg = theme === 'dark' ? '#1f293d' : '#e2e8f0';
        const screenBg = isFailed ? '#7f1d1d' : (theme === 'dark' ? '#064e3b' : '#022c22');

        // 1. Monitor Base / Stand
        ctx.fillStyle = monBg;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.5;

        // Stand neck
        ctx.beginPath();
        ctx.roundRect(x - 5, y + 20, 10, 10, 2);
        ctx.fill();
        ctx.stroke();

        // Stand foot
        ctx.beginPath();
        ctx.roundRect(x - 18, y + 27, 36, 6, 3);
        ctx.fill();
        ctx.stroke();

        // 2. Monitor CRT Body
        ctx.beginPath();
        ctx.roundRect(x - 30, y - 24, 60, 46, 7);
        ctx.fill();
        ctx.stroke();

        // 3. Monitor Screen
        ctx.fillStyle = screenBg;
        ctx.beginPath();
        ctx.roundRect(x - 24, y - 19, 48, 34, 4);
        ctx.fill();
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // 4. Brain / Heartbeat on Screen
        if (!isFailed) {
            const pulse = 1 + Math.sin(animTime * 4) * 0.12;
            ctx.font = `${Math.round(14 * pulse)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🍓', x, y - 4);

            // Green ECG Heartbeat line under brain
            ctx.strokeStyle = '#4ade80';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x - 18, y + 9);
            ctx.lineTo(x - 8, y + 9);
            ctx.lineTo(x - 4, y + 4);
            ctx.lineTo(x, y + 12);
            ctx.lineTo(x + 4, y + 6);
            ctx.lineTo(x + 8, y + 9);
            ctx.lineTo(x + 18, y + 9);
            ctx.stroke();
        } else {
            // Alert on screen
            ctx.font = 'bold 12px "JetBrains Mono", monospace';
            ctx.fillStyle = '#f87171';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚠️ ALERT', x, y - 3);
        }

        // 5. Monitor Buttons & Power LED
        ctx.fillStyle = isFailed ? '#ef4444' : '#22c55e';
        ctx.beginPath();
        ctx.arc(x + 20, y + 17, 2, 0, Math.PI * 2);
        ctx.fill();

        // 6. Label Banner
        ctx.font = 'bold 9px "Fredoka", sans-serif';
        ctx.fillStyle = theme === 'dark' ? '#fde047' : '#b45309';
        ctx.textAlign = 'center';
        ctx.fillText('RASPBERRY PI', x, y - 30);

        ctx.restore();
    }

    /**
     * Draw 2D Cartoon Wi-Fi Mesh Router (Gateway Hub)
     */
    function draw2DRouter(ctx, x, y, size, isFailed, isNewGw, animTime, theme) {
        ctx.save();
        const ink = theme === 'dark' ? '#f8fafc' : '#23272f';
        const routerBg = isFailed ? '#3f3f46' : (isNewGw ? '#0284c7' : '#f59e0b');
        const s = size * 0.55;

        // 1. Dual Bendy Antennas
        const antWobble1 = Math.sin(animTime * 3) * 3;
        const antWobble2 = Math.cos(animTime * 3) * 3;

        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';

        // Left antenna
        ctx.beginPath();
        ctx.moveTo(x - s * 0.5, y - s * 0.2);
        ctx.quadraticCurveTo(x - s * 0.7 + antWobble1, y - s * 0.6, x - s * 0.6 + antWobble1, y - s * 0.95);
        ctx.stroke();

        // Left antenna ball
        ctx.fillStyle = isFailed ? '#ef4444' : (isNewGw ? '#38bdf8' : '#fde047');
        ctx.beginPath();
        ctx.arc(x - s * 0.6 + antWobble1, y - s * 0.95, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Right antenna
        ctx.beginPath();
        ctx.moveTo(x + s * 0.5, y - s * 0.2);
        ctx.quadraticCurveTo(x + s * 0.7 + antWobble2, y - s * 0.6, x + s * 0.6 + antWobble2, y - s * 0.95);
        ctx.stroke();

        // Right antenna ball
        ctx.beginPath();
        ctx.arc(x + s * 0.6 + antWobble2, y - s * 0.95, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 2. Wi-Fi Broadcast Waves
        if (!isFailed) {
            const waveScale = (animTime * 2) % 1;
            ctx.strokeStyle = isNewGw ? '#38bdf8' : (theme === 'dark' ? '#fde047' : '#d97706');
            ctx.lineWidth = 2;
            [0.5, 0.9, 1.3].forEach((rMul) => {
                const r = s * (rMul + waveScale * 0.3);
                ctx.beginPath();
                ctx.arc(x, y - s * 0.8, r, -Math.PI * 0.75, -Math.PI * 0.25);
                ctx.stroke();
            });
        } else {
            // Comic smoke puffs / cross
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x - s * 0.5, y - s * 0.6);
            ctx.lineTo(x + s * 0.5, y + s * 0.6);
            ctx.moveTo(x + s * 0.5, y - s * 0.6);
            ctx.lineTo(x - s * 0.5, y + s * 0.6);
            ctx.stroke();
        }

        // 3. Router Main Body (Chunky rounded cartoon box)
        ctx.fillStyle = routerBg;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.roundRect(x - s * 0.85, y - s * 0.25, s * 1.7, s * 0.8, 8);
        ctx.fill();
        ctx.stroke();

        // Router top accent bevel
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.roundRect(x - s * 0.75, y - s * 0.18, s * 1.5, s * 0.2, 3);
        ctx.fill();

        // 4. Blinking LED Eyes
        const ledBlink = Math.sin(animTime * 5) > 0;
        [-s * 0.45, -s * 0.15, s * 0.15, s * 0.45].forEach((dx, i) => {
            ctx.fillStyle = isFailed ? '#ef4444' : (i === 1 && ledBlink ? '#22c55e' : (i === 2 ? '#38bdf8' : '#4ade80'));
            ctx.beginPath();
            ctx.arc(x + dx, y + s * 0.22, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = ink;
            ctx.lineWidth = 1;
            ctx.stroke();
        });

        // 5. Crown for Promoted Router
        if (isNewGw && !isFailed) {
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('👑', x, y - s * 1.2);
        }

        ctx.restore();
    }

    /**
     * Draw 2D Cartoon Dirty Yellow Safety Helmet (Worker Node)
     */
    function drawDirtyYellowHelmet(ctx, x, y, size, isFailed, isNewGw, animTime, theme) {
        ctx.save();
        const ink = theme === 'dark' ? '#f8fafc' : '#23272f';
        const s = size * 0.58;

        // 1. Hard Hat Dome (Weathered / Dirty Yellow)
        ctx.beginPath();
        ctx.moveTo(x - s * 0.95, y + s * 0.28);
        ctx.lineTo(x - s * 0.8, y + s * 0.18);
        ctx.bezierCurveTo(
            x - s * 0.85, y - s * 0.95,
            x + s * 0.85, y - s * 0.95,
            x + s * 0.8, y + s * 0.18
        );
        ctx.lineTo(x + s * 0.95, y + s * 0.28);
        ctx.quadraticCurveTo(x, y + s * 0.5, x - s * 0.95, y + s * 0.28);
        ctx.closePath();

        // Smudged Yellow Shader
        if (!isFailed) {
            ctx.fillStyle = isNewGw ? '#38bdf8' : '#eab308';
        } else {
            ctx.fillStyle = '#475569';
        }
        ctx.fill();

        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.6;
        ctx.lineJoin = 'round';
        ctx.stroke();

        // 2. Comic Highlight Arc
        ctx.beginPath();
        ctx.moveTo(x - s * 0.5, y - s * 0.65);
        ctx.bezierCurveTo(x - s * 0.2, y - s * 0.82, x + s * 0.2, y - s * 0.82, x + s * 0.5, y - s * 0.65);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // 3. Coal Dust Smudges / Dirty Spots (from mining)
        if (!isFailed) {
            ctx.fillStyle = 'rgba(31, 41, 55, 0.65)';
            // Smudge 1 (left flank)
            ctx.beginPath();
            ctx.ellipse(x - s * 0.45, y - s * 0.25, 4, 2.5, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
            // Smudge 2 (right flank)
            ctx.beginPath();
            ctx.ellipse(x + s * 0.42, y - s * 0.35, 5, 3, -Math.PI / 6, 0, Math.PI * 2);
            ctx.fill();
            // Smudge 3 (top ridge)
            ctx.beginPath();
            ctx.arc(x + s * 0.1, y - s * 0.55, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // 4. Black Side Ear Clips
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.roundRect(x - s * 0.96, y + s * 0.05, s * 0.22, s * 0.24, 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.roundRect(x + s * 0.74, y + s * 0.05, s * 0.22, s * 0.24, 2);
        ctx.fill();
        ctx.stroke();

        // 5. Front Miner Headlamp Unit
        const lampY = y - s * 0.12;
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(x - s * 0.26, lampY - s * 0.22, s * 0.52, s * 0.34, 3);
        ctx.fill();
        ctx.stroke();

        if (!isFailed) {
            // Bright White/Yellow Torch Lens
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x, lampY - s * 0.05, 3.5, 0, Math.PI * 2);
            ctx.fill();

            // Animated Volumetric Miner Light Beam
            ctx.save();
            const beamSwing = Math.sin(animTime * 2 + x) * 3;
            const beamLen = s * 1.3;
            const beamGrad = ctx.createRadialGradient(x, lampY, 1, x + beamSwing, lampY + beamLen, s * 1.1);
            beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.75)');
            beamGrad.addColorStop(0.3, 'rgba(250, 204, 21, 0.3)');
            beamGrad.addColorStop(1, 'rgba(250, 204, 21, 0.0)');

            ctx.fillStyle = beamGrad;
            ctx.beginPath();
            ctx.moveTo(x - s * 0.2, lampY + s * 0.05);
            ctx.lineTo(x - s * 0.8 + beamSwing, lampY + beamLen);
            ctx.lineTo(x + s * 0.8 + beamSwing, lampY + beamLen);
            ctx.lineTo(x + s * 0.2, lampY + s * 0.05);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        } else {
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.moveTo(x - s * 0.35, y - s * 0.35);
            ctx.lineTo(x + s * 0.35, y + s * 0.35);
            ctx.stroke();
        }

        // 6. Crown for Promoted Worker
        if (isNewGw && !isFailed) {
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('👑', x, y - s * 1.2);
        }

        ctx.restore();
    }

    /**
     * Draw Dedicated Mining Railway Track from Gateway to Worker
     * Renders cartoon wooden sleepers / tunnel timber tracks
     */
    function drawMiningRailwayTrack(ctx, x1, y1, x2, y2, trackIndex, qualityScore, isActive, isGatewayRoute, theme) {
        ctx.save();

        if (!isActive) {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 6]);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.restore();
            return;
        }

        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);

        if (isGatewayRoute) {
            // 1. Mining Railway Track Main Rails (Dual cartoon rails)
            const railColor = theme === 'dark'
                ? (qualityScore >= 85 ? '#facc15' : (qualityScore >= 70 ? '#38bdf8' : '#fb923c'))
                : (qualityScore >= 85 ? '#b45309' : (qualityScore >= 70 ? '#0284c7' : '#ea580c'));

            ctx.strokeStyle = railColor;
            ctx.lineWidth = 2.8;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            // 2. Wooden Sleepers / Railway Ties along the track
            const sleeperSpacing = 28;
            const sleeperCount = Math.floor(dist / sleeperSpacing);
            const sleeperWidth = 12;

            ctx.strokeStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.35)' : 'rgba(35, 39, 47, 0.4)';
            ctx.lineWidth = 2;

            for (let i = 1; i < sleeperCount; i++) {
                const t = i / sleeperCount;
                const px = x1 + dx * t;
                const py = y1 + dy * t;

                const nx = -Math.sin(angle) * (sleeperWidth / 2);
                const ny = Math.cos(angle) * (sleeperWidth / 2);

                ctx.beginPath();
                ctx.moveTo(px - nx, py - ny);
                ctx.lineTo(px + nx, py + ny);
                ctx.stroke();
            }

            // Track Number Badge in Middle
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            ctx.fillStyle = theme === 'dark' ? '#1e2333' : '#ffffff';
            ctx.strokeStyle = railColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(midX, midY, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.font = 'bold 8px "Fredoka", sans-serif';
            ctx.fillStyle = railColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`T${trackIndex + 1}`, midX, midY);

        } else {
            // Tunnel Peer Ring Track (Dashed connector)
            ctx.strokeStyle = theme === 'dark' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(2, 132, 199, 0.35)';
            ctx.lineWidth = 1.8;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        ctx.restore();
    }
    // --- Canvas Rendering Loop ---
    function renderCanvas() {
        animClock += 0.035;

        const width = canvasContainer.clientWidth;
        const height = canvasContainer.clientHeight;
        ctx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2 + 25; // slightly offset downwards to leave space for Brain Monitor at top
        const radius = Math.min(width, height) * 0.33;

        // 1. Draw Subterranean Floating Cartoon Dust
        dustParticles.forEach(dp => {
            dp.x += dp.vx;
            dp.y += dp.vy;
            if (dp.x < 0) dp.x = width;
            if (dp.x > width) dp.x = 0;
            if (dp.y < 0) dp.y = height;
            if (dp.y > height) dp.y = 0;

            ctx.save();
            ctx.fillStyle = dp.color;
            ctx.globalAlpha = 0.5 + Math.sin(animClock + dp.x) * 0.3;
            ctx.beginPath();
            ctx.arc(dp.x, dp.y, dp.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // 2. Concentric Cartoon Cavern Depth Rings
        ctx.save();
        ctx.strokeStyle = currentTheme === 'dark' ? 'rgba(59, 66, 89, 0.4)' : 'rgba(35, 39, 47, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        [0.4, 0.7, 1.0].forEach((rMul, idx) => {
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * rMul, 0, Math.PI * 2);
            ctx.stroke();

            ctx.font = 'bold 9px "Patrick Hand", cursive';
            ctx.fillStyle = currentTheme === 'dark' ? 'rgba(148, 163, 184, 0.5)' : 'rgba(100, 116, 139, 0.6)';
            ctx.fillText(`TUNNEL RING ${idx + 1}`, centerX + radius * rMul + 6, centerY - 4);
        });
        ctx.setLineDash([]);
        ctx.restore();

        // Node Geometry Positions (Regular Polygon)
        const nodePositions = {};
        const n = state.nodes.length || 6;
        state.nodes.forEach((node, idx) => {
            const angle = -(Math.PI / 2) + (2 * Math.PI * idx / n);
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            nodePositions[node.id] = { x, y, angle, node };
        });

        // Brain Monitor Position (Surface Master Dispatch Core at top center)
        const brainX = centerX;
        const brainY = 55;

        // 3. Wavy Cable Connecting Brain Monitor -> Active Gateway
        const activeGwPos = nodePositions[state.active_gateway_id] || { x: centerX, y: centerY - radius };
        const isGwFailed = state.simulation_state === 'GATEWAY_FAILED';

        ctx.save();
        const cableInk = isGwFailed ? '#ef4444' : (currentTheme === 'dark' ? '#fde047' : '#23272f');
        ctx.strokeStyle = cableInk;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        // Wavy cartoon cable path
        const cableCtrlX = centerX + Math.sin(animClock * 1.5) * 16;
        const cableCtrlY = (brainY + 30 + activeGwPos.y) / 2;

        ctx.beginPath();
        ctx.moveTo(brainX, brainY + 30);
        ctx.quadraticCurveTo(cableCtrlX, cableCtrlY, activeGwPos.x, activeGwPos.y - 24);
        ctx.stroke();

        // Electrical Sparks along the Cable
        cableSparks.forEach(sp => {
            const t = sp.progress;
            // Quadratic bezier interpolation
            const spX = (1 - t) * (1 - t) * brainX + 2 * (1 - t) * t * cableCtrlX + t * t * activeGwPos.x;
            const spY = (1 - t) * (1 - t) * (brainY + 30) + 2 * (1 - t) * t * cableCtrlY + t * t * (activeGwPos.y - 24);

            ctx.fillStyle = currentTheme === 'dark' ? '#38bdf8' : '#0284c7';
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(spX, spY, sp.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();

        // 4. Draw Dedicated Mining Tracks from Gateway to Every Worker
        const showPeer = togglePeerLinks.checked;
        (state.links || []).forEach((link, lIdx) => {
            const src = nodePositions[link.source];
            const tgt = nodePositions[link.target];
            if (!src || !tgt) return;

            if (!link.is_gateway_route && !showPeer) return;

            const isFailingState = (animationStage === 'FAILING' && (link.source === state.primary_gateway_id || link.target === state.primary_gateway_id));
            const isActive = link.active && !isFailingState;

            drawMiningRailwayTrack(
                ctx,
                src.x, src.y,
                tgt.x, tgt.y,
                lIdx,
                link.quality_score,
                isActive,
                link.is_gateway_route,
                currentTheme
            );
        });

        // 5. Draw Animated Data Telemetry Minecart Particles
        updateParticles();
        particles.forEach(p => {
            const src = nodePositions[p.sourceId];
            const tgt = nodePositions[p.targetId];
            if (!src || !tgt) return;

            const px = src.x + (tgt.x - src.x) * p.progress;
            const py = src.y + (tgt.y - src.y) * p.progress;

            ctx.save();
            ctx.fillStyle = p.color;
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(px, py, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        });

        // 6. Draw Nodes (Router or Dirty Yellow Safety Helmet)
        const showMetricsBadge = toggleMetrics.checked;
        const nodeRadius = 30;

        state.nodes.forEach(node => {
            const pos = nodePositions[node.id];
            if (!pos) return;

            const isSelected = (node.id === selectedNodeId);
            const isFailed = (node.status === 'FAILED');
            const isGateway = (node.role === 'GATEWAY' || node.role === 'NEW_GATEWAY');
            const isNewGw = (node.role === 'NEW_GATEWAY');

            ctx.save();

            // Selected Node Cartoon Ring
            if (isSelected) {
                ctx.strokeStyle = currentTheme === 'dark' ? '#fde047' : '#0284c7';
                ctx.lineWidth = 2.5;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, nodeRadius + 11, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // Gateway Cartoon Aura
            if (isGateway && !isFailed) {
                ctx.strokeStyle = isNewGw ? '#38bdf8' : '#f59e0b';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, nodeRadius + 5, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Failed Red Cross
            if (isFailed) {
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, nodeRadius + 5, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Node Circular Housing (Cartoon Card)
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, nodeRadius, 0, Math.PI * 2);
            if (isFailed) ctx.fillStyle = currentTheme === 'dark' ? '#1f1d24' : '#fee2e2';
            else if (isNewGw) ctx.fillStyle = currentTheme === 'dark' ? '#082f49' : '#e0f2fe';
            else if (isGateway) ctx.fillStyle = currentTheme === 'dark' ? '#291b05' : '#fef3c7';
            else ctx.fillStyle = currentTheme === 'dark' ? '#18202f' : '#f8fafc';
            ctx.fill();

            // Comic Ink Outline
            ctx.lineWidth = 2.6;
            ctx.strokeStyle = currentTheme === 'dark' ? '#f8fafc' : '#23272f';
            ctx.stroke();

            // --- DRAW 2D ART: ROUTER or DIRTY YELLOW HELMET ---
            if (isGateway && !isNewGw) {
                draw2DRouter(ctx, pos.x, pos.y - 6, 28, isFailed, isNewGw, animClock, currentTheme);
            } else {
                drawDirtyYellowHelmet(ctx, pos.x, pos.y - 5, 28, isFailed, isNewGw, animClock, currentTheme);
            }

            // Node ID Label
            ctx.font = 'bold 11px "Patrick Hand", cursive';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = isFailed ? '#94a3b8' : (currentTheme === 'dark' ? '#ffffff' : '#1e293b');
            ctx.fillText(node.id.replace('ESP32-', 'M-'), pos.x, pos.y + 18);

            // Role Tag Above Node
            if (isGateway && !isFailed) {
                const roleLabel = isNewGw ? "★ NEW ROUTER" : "⚡ GATEWAY ROUTER";
                ctx.font = 'bold 9px "Fredoka", sans-serif';
                ctx.fillStyle = isNewGw ? '#38bdf8' : '#f59e0b';
                ctx.fillText(roleLabel, pos.x, pos.y - nodeRadius - 10);
            } else if (!isGateway && !isFailed) {
                ctx.font = 'bold 8.5px "Fredoka", sans-serif';
                ctx.fillStyle = currentTheme === 'dark' ? '#fde047' : '#b45309';
                ctx.fillText("WORKER", pos.x, pos.y - nodeRadius - 8);
            }

            // Quality Badge Pill Below Node
            if (showMetricsBadge) {
                const badgeY = pos.y + nodeRadius + 18;
                const scoreText = `${node.channel_quality_score}%`;
                
                ctx.fillStyle = currentTheme === 'dark' ? '#1e2333' : '#ffffff';
                ctx.strokeStyle = isFailed ? '#ef4444' : (currentTheme === 'dark' ? '#fde047' : '#23272f');
                ctx.lineWidth = 1.8;

                ctx.beginPath();
                ctx.roundRect(pos.x - 24, badgeY - 8, 48, 17, 6);
                ctx.fill();
                ctx.stroke();

                ctx.font = 'bold 10px "JetBrains Mono", monospace';
                ctx.fillStyle = isFailed ? '#ef4444' : (currentTheme === 'dark' ? '#fde047' : '#1e293b');
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(isFailed ? 'OFF' : scoreText, pos.x, badgeY);
            }

            ctx.restore();
        });

        // 7. Draw The Permanent Raspberry Pi Monitor at the Surface Station
        drawBrainMonitor(ctx, brainX, brainY, true, isGwFailed, animClock, currentTheme);

        requestAnimationFrame(renderCanvas);
    }

    // --- Hover & Click Event Handling on Canvas ---
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const width = canvasContainer.clientWidth;
        const height = canvasContainer.clientHeight;
        const centerX = width / 2;
        const centerY = height / 2 + 25;
        const radius = Math.min(width, height) * 0.33;
        const n = state.nodes.length || 6;

        let found = null;
        state.nodes.forEach((node, idx) => {
            const angle = -(Math.PI / 2) + (2 * Math.PI * idx / n);
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            const dist = Math.hypot(mouseX - x, mouseY - y);

            if (dist <= 32) {
                found = node;
            }
        });

        // Check if mouse hovers Brain Monitor
        const distToBrain = Math.hypot(mouseX - centerX, mouseY - 55);
        if (distToBrain <= 35) {
            nodeTooltip.style.display = 'block';
            nodeTooltip.style.left = `${mouseX + 18}px`;
            nodeTooltip.style.top = `${mouseY - 20}px`;
            ttHeader.textContent = '🍓 RASPBERRY PI MASTER CORE';
            ttBody.innerHTML = `
                <div>Role: <strong>Surface Command &amp; Raspberry Pi</strong></div>
                <div>Status: <strong style="color:#22c55e">PERMANENTLY ACTIVE</strong></div>
                <div>Link: <strong>Wavy Cable &rarr; ${state.active_gateway_id}</strong></div>
                <div>Function: <strong>Watching over all ${state.num_nodes} workers</strong></div>
            `;
            return;
        }

        hoveredNodeId = found ? found.id : null;

        if (found) {
            nodeTooltip.style.display = 'block';
            nodeTooltip.style.left = `${mouseX + 18}px`;
            nodeTooltip.style.top = `${mouseY - 20}px`;

            const typeDesc = (found.role === 'GATEWAY' || found.role === 'NEW_GATEWAY') ? '2D Gateway Router Hub' : 'Dirty Yellow Safety Helmet';
            ttHeader.textContent = `${found.id} [${typeDesc}]`;
            ttBody.innerHTML = `
                <div>Status: <strong style="color:${found.status==='ONLINE'?'#22c55e':'#ef4444'}">${found.status}</strong></div>
                <div>Tunnel RSSI: <strong>${found.rssi} dBm</strong></div>
                <div>SNR: <strong>${found.snr} dB</strong></div>
                <div>Packet Loss: <strong>${found.packet_loss}%</strong></div>
                <div>Link Quality: <strong>${found.link_quality}%</strong></div>
                <div>Channel Score: <strong style="color:#facc15">${found.channel_quality_score}%</strong></div>
            `;
        } else {
            nodeTooltip.style.display = 'none';
        }
    });

    canvas.addEventListener('click', (e) => {
        if (hoveredNodeId) {
            syncInspectorWithNode(hoveredNodeId);
        }
    });

    // --- Initialization ---
    fetchState();
    requestAnimationFrame(renderCanvas);
});
