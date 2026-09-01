"""
app.py - Flask Server & REST API for ESP32 Mesh Gateway Failover Simulator.

Provides API endpoints for network initialization, failover triggers, parameter updates,
channel quality weighting, and simulation state synchronization.
"""

from flask import Flask, render_template, jsonify, request
from simulation import MeshSimulation

app = Flask(__name__)

# Global simulation instance
sim = MeshSimulation(num_nodes=6, primary_gateway_id="ESP32-01")


@app.route("/")
def index():
    """Renders the main simulation dashboard."""
    return render_template("index.html")


@app.route("/api/state", methods=["GET"])
def get_state():
    """Returns the complete network snapshot."""
    return jsonify({"success": True, "data": sim.get_state()})


@app.route("/api/init", methods=["POST"])
def init_network():
    """Initializes or resizes the mesh network polygon."""
    data = request.get_json() or {}
    num_nodes = data.get("num_nodes", 6)
    primary_gw = data.get("primary_gateway_id", "ESP32-01")
    
    try:
        num_nodes = int(num_nodes)
        if num_nodes < 3 or num_nodes > 16:
            return jsonify({"success": False, "error": "Number of nodes must be between 3 and 16."}), 400
        
        sim.initialize_network(num_nodes=num_nodes, primary_gateway_id=primary_gw)
        return jsonify({"success": True, "data": sim.get_state()})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/failover/trigger", methods=["POST"])
def trigger_failover():
    """Triggers gateway failure and calculates failover election."""
    result = sim.execute_failover()
    if not result.get("success"):
        return jsonify({"success": False, "error": result.get("error", "Failover failed.")}), 400
    
    return jsonify({
        "success": True,
        "failover_result": result,
        "data": sim.get_state()
    })


@app.route("/api/update_node", methods=["POST"])
def update_node():
    """Updates RF channel metrics for a single node."""
    data = request.get_json() or {}
    node_id = data.get("node_id")
    if not node_id:
        return jsonify({"success": False, "error": "node_id is required."}), 400
    
    metrics = {
        "rssi": data.get("rssi"),
        "snr": data.get("snr"),
        "packet_loss": data.get("packet_loss"),
        "link_quality": data.get("link_quality"),
    }
    # Filter out None values
    metrics = {k: v for k, v in metrics.items() if v is not None}
    
    success = sim.update_node_metrics(node_id, metrics)
    if not success:
        return jsonify({"success": False, "error": f"Node {node_id} not found."}), 404
    
    return jsonify({"success": True, "data": sim.get_state()})


@app.route("/api/update_weights", methods=["POST"])
def update_weights():
    """Updates scoring algorithm weights."""
    data = request.get_json() or {}
    sim.update_weights(data)
    return jsonify({"success": True, "data": sim.get_state()})


@app.route("/api/randomize_channels", methods=["POST"])
def randomize_channels():
    """Randomizes channel metrics while preserving geometric layout."""
    sim.randomize_channels()
    return jsonify({"success": True, "data": sim.get_state()})


@app.route("/api/reset", methods=["POST"])
def reset_network():
    """Resets the simulation to normal operation."""
    sim.reset_simulation()
    return jsonify({"success": True, "data": sim.get_state()})


if __name__ == "__main__":
    print("Starting ESP32 Mesh Gateway Failover Simulator on http://127.0.0.1:5000 ...")
    app.run(host="0.0.0.0", port=5000, debug=True)
