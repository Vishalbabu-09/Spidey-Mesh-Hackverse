import unittest
import json
from app import app

class TestAppAPI(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.client.post("/api/init", json={"num_nodes": 6, "primary_gateway_id": "ESP32-01"})

    def test_index_page(self):
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"MINE SAFETY", res.data)
        self.assertIn(b"meshCanvas", res.data)

    def test_api_state(self):
        res = self.client.get("/api/state")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["num_nodes"], 6)
        self.assertEqual(data["data"]["active_gateway_id"], "ESP32-01")

    def test_api_init(self):
        res = self.client.post("/api/init", json={"num_nodes": 8, "primary_gateway_id": "ESP32-01"})
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(data["data"]["num_nodes"], 8)
        self.assertEqual(data["data"]["polygon_name"], "Octagon")

    def test_api_update_node_and_failover(self):
        # Boost ESP32-04
        upd = self.client.post("/api/update_node", json={
            "node_id": "ESP32-04",
            "rssi": -40.0,
            "snr": 32.0,
            "packet_loss": 0.5,
            "link_quality": 98.0
        })
        self.assertEqual(upd.status_code, 200)

        # Failover
        fo = self.client.post("/api/failover/trigger")
        self.assertEqual(fo.status_code, 200)
        fo_data = json.loads(fo.data)
        self.assertTrue(fo_data["success"])
        self.assertEqual(fo_data["failover_result"]["failed_gateway"], "ESP32-01")
        self.assertEqual(fo_data["failover_result"]["new_gateway"], "ESP32-04")

        # Reset
        rst = self.client.post("/api/reset")
        self.assertEqual(rst.status_code, 200)
        rst_data = json.loads(rst.data)
        self.assertEqual(rst_data["data"]["active_gateway_id"], "ESP32-01")

if __name__ == "__main__":
    unittest.main()
