"""
simulation.py - ESP32 Mesh Gateway Failover Simulation Orchestrator.

Implements the Finite State Machine (FSM):
INITIALIZED -> NORMAL_OPERATION -> GATEWAY_FAILED -> EVALUATING_CANDIDATES -> NEW_GATEWAY_SELECTED -> NETWORK_RECOVERED
"""

import time
import random
from typing import Dict, List, Any, Optional
from datetime import datetime
from mesh import generate_polygon_nodes, generate_mesh_links, POLYGON_NAMES
from channel_quality import calculate_channel_quality, rank_candidates, DEFAULT_WEIGHTS
from gateway import GatewayManager


class SimulationState:
    INITIALIZED = "INITIALIZED"
    NORMAL_OPERATION = "NORMAL_OPERATION"
    GATEWAY_FAILED = "GATEWAY_FAILED"
    EVALUATING_CANDIDATES = "EVALUATING_CANDIDATES"
    NEW_GATEWAY_SELECTED = "NEW_GATEWAY_SELECTED"
    NETWORK_RECOVERED = "NETWORK_RECOVERED"


class MeshSimulation:
    def __init__(self, num_nodes: int = 6, primary_gateway_id: str = "ESP32-01"):
        self.num_nodes = max(3, min(16, num_nodes))
        self.primary_gateway_id = primary_gateway_id
        self.weights = dict(DEFAULT_WEIGHTS)
        self.state = SimulationState.INITIALIZED
        self.gateway_manager = GatewayManager(primary_gateway_id=primary_gateway_id)
        self.nodes: List[Dict[str, Any]] = []
        self.links: List[Dict[str, Any]] = []
        self.logs: List[Dict[str, Any]] = []
        self.last_failover_result: Optional[Dict[str, Any]] = None
        self.failover_steps: List[Dict[str, Any]] = []

        self.initialize_network()

    def add_log(self, message: str, level: str = "INFO"):
        """Record timestamped event log."""
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.logs.append({
            "timestamp": timestamp,
            "message": message,
            "level": level,
            "id": len(self.logs) + 1,
        })
        if len(self.logs) > 200:
            self.logs = self.logs[-200:]

    def initialize_network(self, num_nodes: Optional[int] = None, primary_gateway_id: Optional[str] = None):
        """Builds regular polygon topology and initializes state."""
        if num_nodes is not None:
            self.num_nodes = max(3, min(16, int(num_nodes)))
        if primary_gateway_id:
            self.primary_gateway_id = primary_gateway_id

        self.gateway_manager.reset(primary_gateway_id=self.primary_gateway_id)
        self.nodes = generate_polygon_nodes(
            number_of_nodes=self.num_nodes,
            initial_gateway_idx=0,
            weights=self.weights
        )

        # Set designated primary gateway
        gw_found = False
        for n in self.nodes:
            if n["id"] == self.primary_gateway_id:
                n["role"] = "GATEWAY"
                n["is_gateway"] = True
                n["is_primary_gateway"] = True
                n["status"] = "ONLINE"
                gw_found = True
            else:
                n["role"] = "SLAVE"
                n["is_gateway"] = False
                n["is_primary_gateway"] = False
                n["status"] = "ONLINE"

        if not gw_found and self.nodes:
            self.primary_gateway_id = self.nodes[0]["id"]
            self.nodes[0]["role"] = "GATEWAY"
            self.nodes[0]["is_gateway"] = True
            self.nodes[0]["is_primary_gateway"] = True
            self.gateway_manager.reset(primary_gateway_id=self.primary_gateway_id)

        self.recalculate_all_scores()
        self.links = generate_mesh_links(self.nodes, active_gateway_id=self.primary_gateway_id)
        self.state = SimulationState.NORMAL_OPERATION
        self.last_failover_result = None
        self.failover_steps = []

        poly_name = POLYGON_NAMES.get(self.num_nodes, f"{self.num_nodes}-gon")
        self.logs.clear()
        self.add_log(f"Mesh network initialized with {self.num_nodes} nodes in {poly_name} formation.", "INFO")
        self.add_log(f"{self.primary_gateway_id} designated as Primary Gateway.", "SUCCESS")
        self.add_log("ESP-NOW wireless mesh active. Normal operation established.", "INFO")

    def recalculate_all_scores(self):
        """Recalculates channel quality score for all nodes with current weights."""
        for n in self.nodes:
            metrics = {
                "rssi": n["rssi"],
                "snr": n["snr"],
                "packet_loss": n["packet_loss"],
                "link_quality": n["link_quality"],
            }
            eval_res = calculate_channel_quality(metrics, weights=self.weights)
            n["channel_quality_score"] = eval_res["score"]
            n["quality_breakdown"] = eval_res

    def update_node_metrics(self, node_id: str, metrics_update: Dict[str, Any]) -> bool:
        """Update RF channel metrics for a specific node."""
        for n in self.nodes:
            if n["id"] == node_id:
                if "rssi" in metrics_update:
                    n["rssi"] = float(metrics_update["rssi"])
                if "snr" in metrics_update:
                    n["snr"] = float(metrics_update["snr"])
                if "packet_loss" in metrics_update:
                    n["packet_loss"] = float(metrics_update["packet_loss"])
                if "link_quality" in metrics_update:
                    n["link_quality"] = float(metrics_update["link_quality"])

                eval_res = calculate_channel_quality(
                    {"rssi": n["rssi"], "snr": n["snr"], "packet_loss": n["packet_loss"], "link_quality": n["link_quality"]},
                    weights=self.weights
                )
                n["channel_quality_score"] = eval_res["score"]
                n["quality_breakdown"] = eval_res
                
                # Refresh link qualities
                self.links = generate_mesh_links(self.nodes, active_gateway_id=self.gateway_manager.active_gateway_id)
                self.add_log(f"Updated channel metrics for {node_id}: Score is now {eval_res['score']}%.", "INFO")
                return True
        return False

    def update_weights(self, weights_update: Dict[str, float]):
        """Update weighting factors and recalculate all node scores."""
        for k in ["rssi", "snr", "packet_loss", "link_quality"]:
            if k in weights_update:
                self.weights[k] = max(0.0, float(weights_update[k]))
        
        self.recalculate_all_scores()
        self.links = generate_mesh_links(self.nodes, active_gateway_id=self.gateway_manager.active_gateway_id)
        self.add_log(
            f"Weights updated: RSSI {self.weights['rssi']*100:.0f}%, SNR {self.weights['snr']*100:.0f}%, "
            f"Loss {self.weights['packet_loss']*100:.0f}%, Link {self.weights['link_quality']*100:.0f}%.",
            "INFO"
        )

    def randomize_channels(self):
        """Randomize channel parameters within realistic industrial RF bounds. Node positions remain unchanged."""
        for n in self.nodes:
            n["rssi"] = round(random.uniform(-85.0, -38.0), 1)
            n["snr"] = round(random.uniform(10.0, 32.0), 1)
            n["packet_loss"] = round(random.uniform(0.5, 9.5), 1)
            n["link_quality"] = round(random.uniform(65.0, 98.0), 1)

        self.recalculate_all_scores()
        self.links = generate_mesh_links(self.nodes, active_gateway_id=self.gateway_manager.active_gateway_id)
        self.add_log("Channel parameters randomized across mesh nodes.", "INFO")

    def execute_failover(self) -> Dict[str, Any]:
        """
        Executes complete failover transition sequence and generates step-by-step history for animation.
        """
        if self.state in [SimulationState.GATEWAY_FAILED, SimulationState.NETWORK_RECOVERED]:
            return {"success": False, "error": "Gateway already in failed/recovered state. Reset first."}

        failed_gw_id = self.gateway_manager.active_gateway_id
        self.add_log(f"CRITICAL: Gateway failure detected on {failed_gw_id}!", "CRITICAL")
        self.state = SimulationState.GATEWAY_FAILED

        # Step 2: Evaluating Candidates
        self.add_log("Initiating channel quality evaluation across eligible slave nodes...", "WARN")
        eligible_candidates = [n for n in self.nodes if n["id"] != failed_gw_id and n["status"] != "FAILED"]
        ranked = rank_candidates(eligible_candidates, weights=self.weights)

        for c in ranked:
            self.add_log(f"Evaluated {c['id']}: Quality Score = {c['channel_quality_score']}% (RSSI: {c['rssi']} dBm, SNR: {c['snr']} dB)", "INFO")

        # Step 3: Candidate Selection
        best_candidate = ranked[0]
        new_gw_id = best_candidate["id"]
        self.add_log(f"ELECTION RESULT: {new_gw_id} selected as best candidate (Score: {best_candidate['channel_quality_score']}%).", "SUCCESS")

        # Step 4: Promote and Recover
        res = self.gateway_manager.trigger_failure(self.nodes, weights=self.weights)
        self.links = generate_mesh_links(self.nodes, active_gateway_id=new_gw_id)
        self.state = SimulationState.NETWORK_RECOVERED
        self.last_failover_result = res

        self.add_log(f"{new_gw_id} promoted to Active Gateway. Rerouting mesh links...", "SUCCESS")
        self.add_log(f"NETWORK RECOVERY COMPLETE: Mesh communication restored via {new_gw_id}.", "SUCCESS")

        # Compile failover animation steps
        self.failover_steps = [
            {
                "step": 1,
                "state": SimulationState.GATEWAY_FAILED,
                "description": f"Primary Gateway {failed_gw_id} failed / went offline.",
                "failed_gateway": failed_gw_id,
            },
            {
                "step": 2,
                "state": SimulationState.EVALUATING_CANDIDATES,
                "description": f"Scanning RF channels & calculating quality scores for {len(eligible_candidates)} candidate nodes.",
                "candidates": ranked,
            },
            {
                "step": 3,
                "state": SimulationState.NEW_GATEWAY_SELECTED,
                "description": f"{new_gw_id} elected as New Gateway (Score: {best_candidate['channel_quality_score']}%).",
                "selected_node": new_gw_id,
                "winning_score": best_candidate["channel_quality_score"],
            },
            {
                "step": 4,
                "state": SimulationState.NETWORK_RECOVERED,
                "description": f"Mesh network recovered. All active slaves routed to {new_gw_id}.",
                "new_gateway": new_gw_id,
            }
        ]

        return {
            "success": True,
            "failed_gateway": failed_gw_id,
            "new_gateway": new_gw_id,
            "winning_score": best_candidate["channel_quality_score"],
            "ranked_candidates": ranked,
            "steps": self.failover_steps,
            "election_record": res.get("election_record"),
        }

    def reset_simulation(self):
        """Full reset back to normal operation."""
        self.initialize_network(num_nodes=self.num_nodes, primary_gateway_id=self.primary_gateway_id)
        self.add_log("Simulation reset to initial state. Original primary gateway restored.", "INFO")

    def get_state(self) -> Dict[str, Any]:
        """Returns complete snapshot of the simulation."""
        online_nodes = [n for n in self.nodes if n["status"] == "ONLINE"]
        failed_nodes = [n for n in self.nodes if n["status"] == "FAILED"]
        
        # Get live candidate rankings for current state
        eligible = [n for n in self.nodes if n["status"] == "ONLINE" and not n.get("is_gateway")]
        rankings = rank_candidates(eligible, weights=self.weights) if eligible else []

        return {
            "num_nodes": self.num_nodes,
            "polygon_name": POLYGON_NAMES.get(self.num_nodes, f"{self.num_nodes}-gon"),
            "primary_gateway_id": self.primary_gateway_id,
            "active_gateway_id": self.gateway_manager.active_gateway_id,
            "failed_gateways": self.gateway_manager.failed_gateway_ids,
            "promoted_gateway_id": self.gateway_manager.promoted_gateway_id,
            "simulation_state": self.state,
            "nodes_total": len(self.nodes),
            "nodes_online": len(online_nodes),
            "nodes_offline": len(failed_nodes),
            "weights": self.weights,
            "nodes": self.nodes,
            "links": self.links,
            "candidate_rankings": rankings,
            "last_failover": self.last_failover_result,
            "failover_steps": self.failover_steps,
            "logs": self.logs[-50:],
        }
