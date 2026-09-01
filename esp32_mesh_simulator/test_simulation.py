"""
test_simulation.py - Automated Verification Suite for ESP32 Mesh Gateway Failover.

Tests regular polygon math, channel quality normalization, election ranking,
failover state transitions, API logic, and recovery.
"""

import unittest
import math
from channel_quality import (
    calculate_channel_quality,
    normalize_rssi,
    normalize_snr,
    normalize_packet_loss,
    normalize_link_quality,
    rank_candidates
)
from mesh import generate_polygon_nodes, generate_mesh_links
from simulation import MeshSimulation, SimulationState


class TestChannelQuality(unittest.TestCase):
    def test_normalization_bounds(self):
        # Best case RF
        self.assertAlmostEqual(normalize_rssi(-30.0), 1.0)
        self.assertAlmostEqual(normalize_snr(35.0), 1.0)
        self.assertAlmostEqual(normalize_packet_loss(0.0), 1.0)
        self.assertAlmostEqual(normalize_link_quality(100.0), 1.0)

        # Worst case RF
        self.assertAlmostEqual(normalize_rssi(-90.0), 0.0)
        self.assertAlmostEqual(normalize_snr(0.0), 0.0)
        self.assertAlmostEqual(normalize_packet_loss(100.0), 0.0)
        self.assertAlmostEqual(normalize_link_quality(0.0), 0.0)

    def test_composite_scoring(self):
        # Perfect RF
        res_perfect = calculate_channel_quality({"rssi": -30.0, "snr": 35.0, "packet_loss": 0.0, "link_quality": 100.0})
        self.assertEqual(res_perfect["score"], 100.0)

        # Poor RF
        res_poor = calculate_channel_quality({"rssi": -90.0, "snr": 0.0, "packet_loss": 100.0, "link_quality": 0.0})
        self.assertEqual(res_poor["score"], 0.0)

        # Intermediate realistic RF
        res_mid = calculate_channel_quality({"rssi": -60.0, "snr": 17.5, "packet_loss": 10.0, "link_quality": 80.0})
        self.assertTrue(0.0 <= res_mid["score"] <= 100.0)

    def test_candidate_ranking(self):
        cands = [
            {"id": "ESP32-02", "rssi": -60.0, "snr": 20.0, "packet_loss": 5.0, "link_quality": 80.0},
            {"id": "ESP32-03", "rssi": -40.0, "snr": 30.0, "packet_loss": 1.0, "link_quality": 95.0}, # Best
            {"id": "ESP32-04", "rssi": -80.0, "snr": 10.0, "packet_loss": 15.0, "link_quality": 60.0},
        ]
        ranked = rank_candidates(cands)
        self.assertEqual(ranked[0]["id"], "ESP32-03")
        self.assertEqual(ranked[0]["rank"], 1)
        self.assertEqual(ranked[2]["id"], "ESP32-04")
        self.assertEqual(ranked[2]["rank"], 3)


class TestPolygonGeometry(unittest.TestCase):
    def test_polygon_node_count(self):
        for n in [3, 4, 5, 6, 7, 8, 12]:
            nodes = generate_polygon_nodes(n)
            self.assertEqual(len(nodes), n)

    def test_polygon_symmetry(self):
        # Center = (400, 330), Radius = 200
        cx, cy, r = 400.0, 330.0, 200.0
        nodes = generate_polygon_nodes(4, center_x=cx, center_y=cy, radius=r)
        
        # Node 0 at 12 o'clock (top): x=400, y=330-200=130
        self.assertAlmostEqual(nodes[0]["x"], 400.0, places=1)
        self.assertAlmostEqual(nodes[0]["y"], 130.0, places=1)
        
        # Node 1 at 3 o'clock (right): x=400+200=600, y=330
        self.assertAlmostEqual(nodes[1]["x"], 600.0, places=1)
        self.assertAlmostEqual(nodes[1]["y"], 330.0, places=1)


class TestSimulationFailover(unittest.TestCase):
    def test_full_failover_cycle(self):
        sim = MeshSimulation(num_nodes=6, primary_gateway_id="ESP32-01")
        self.assertEqual(sim.state, SimulationState.NORMAL_OPERATION)
        self.assertEqual(sim.gateway_manager.active_gateway_id, "ESP32-01")

        # Give ESP32-04 top metrics
        sim.update_node_metrics("ESP32-04", {"rssi": -42.0, "snr": 30.0, "packet_loss": 0.5, "link_quality": 98.0})
        
        # Trigger failure
        res = sim.execute_failover()
        self.assertTrue(res["success"])
        self.assertEqual(res["failed_gateway"], "ESP32-01")
        self.assertEqual(res["new_gateway"], "ESP32-04")
        self.assertEqual(sim.state, SimulationState.NETWORK_RECOVERED)
        self.assertEqual(sim.gateway_manager.active_gateway_id, "ESP32-04")

        # Verify failed node state
        failed_node = next(n for n in sim.nodes if n["id"] == "ESP32-01")
        self.assertEqual(failed_node["status"], "FAILED")

        # Verify promoted node state
        promoted_node = next(n for n in sim.nodes if n["id"] == "ESP32-04")
        self.assertEqual(promoted_node["role"], "NEW_GATEWAY")
        self.assertEqual(promoted_node["status"], "ONLINE")

        # Test Reset
        sim.reset_simulation()
        self.assertEqual(sim.state, SimulationState.NORMAL_OPERATION)
        self.assertEqual(sim.gateway_manager.active_gateway_id, "ESP32-01")
        gw_node = next(n for n in sim.nodes if n["id"] == "ESP32-01")
        self.assertEqual(gw_node["status"], "ONLINE")
        self.assertEqual(gw_node["role"], "GATEWAY")


if __name__ == "__main__":
    unittest.main()
