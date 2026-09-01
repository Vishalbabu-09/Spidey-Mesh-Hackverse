"""
mesh.py - ESP32 Mesh Network Topology Generator and Model.

Generates regular polygon coordinates for N nodes (N >= 3) and models mesh communication links.
Ensures nodes are arranged mathematically with rotational symmetry.
"""

import math
from typing import Dict, List, Any, Optional
from channel_quality import calculate_channel_quality

POLYGON_NAMES = {
    3: "Triangle",
    4: "Square",
    5: "Pentagon",
    6: "Hexagon",
    7: "Heptagon",
    8: "Octagon",
    9: "Nonagon",
    10: "Decagon",
    11: "Hendecagon",
    12: "Dodecagon",
    13: "Tridecagon",
    14: "Tetradecagon",
    15: "Pentadecagon",
    16: "Hexadecagon",
}

# Distinct realistic default metrics for nodes (for deterministic testing & presentations)
DEFAULT_NODE_PROFILES = [
    {"rssi": -52.0, "snr": 24.0, "packet_loss": 2.0, "link_quality": 91.0},  # ESP32-01 (Primary GW)
    {"rssi": -55.0, "snr": 23.0, "packet_loss": 2.5, "link_quality": 88.0},  # ESP32-02
    {"rssi": -61.0, "snr": 20.0, "packet_loss": 4.0, "link_quality": 80.0},  # ESP32-03
    {"rssi": -48.0, "snr": 27.0, "packet_loss": 1.0, "link_quality": 94.0},  # ESP32-04 (Top candidate)
    {"rssi": -68.0, "snr": 16.0, "packet_loss": 6.5, "link_quality": 72.0},  # ESP32-05
    {"rssi": -58.0, "snr": 21.0, "packet_loss": 3.0, "link_quality": 85.0},  # ESP32-06
    {"rssi": -74.0, "snr": 14.0, "packet_loss": 8.0, "link_quality": 64.0},  # ESP32-07
    {"rssi": -50.0, "snr": 25.0, "packet_loss": 1.8, "link_quality": 90.0},  # ESP32-08
    {"rssi": -65.0, "snr": 18.0, "packet_loss": 5.0, "link_quality": 76.0},  # ESP32-09
    {"rssi": -59.0, "snr": 21.5, "packet_loss": 3.2, "link_quality": 84.0},  # ESP32-10
    {"rssi": -70.0, "snr": 15.0, "packet_loss": 7.0, "link_quality": 68.0},  # ESP32-11
    {"rssi": -53.0, "snr": 23.5, "packet_loss": 2.2, "link_quality": 89.0},  # ESP32-12
    {"rssi": -63.0, "snr": 19.0, "packet_loss": 4.5, "link_quality": 79.0},  # ESP32-13
    {"rssi": -56.0, "snr": 22.0, "packet_loss": 2.8, "link_quality": 86.0},  # ESP32-14
    {"rssi": -67.0, "snr": 17.0, "packet_loss": 5.8, "link_quality": 74.0},  # ESP32-15
    {"rssi": -51.0, "snr": 24.5, "packet_loss": 1.9, "link_quality": 91.0},  # ESP32-16
]


def generate_polygon_nodes(
    number_of_nodes: int,
    center_x: float = 400.0,
    center_y: float = 330.0,
    radius: float = 210.0,
    initial_gateway_idx: int = 0,
    weights: Optional[Dict[str, float]] = None
) -> List[Dict[str, Any]]:
    """
    Calculates geometric regular polygon coordinates for N nodes.
    Node 0 is positioned at top center (angle = -pi/2).
    """
    if number_of_nodes < 3:
        raise ValueError("Minimum 3 nodes are required for polygon mesh topology.")
    
    nodes = []
    n = number_of_nodes

    for i in range(n):
        # Starting angle -pi/2 positions node 0 at 12 o'clock
        angle = - (math.pi / 2.0) + (2.0 * math.pi * i / n)
        x = round(center_x + radius * math.cos(angle), 2)
        y = round(center_y + radius * math.sin(angle), 2)

        node_id = f"ESP32-{i+1:02d}"
        profile = DEFAULT_NODE_PROFILES[i % len(DEFAULT_NODE_PROFILES)]

        is_gw = (i == initial_gateway_idx)
        role = "GATEWAY" if is_gw else "SLAVE"
        status = "ONLINE"

        metrics = {
            "rssi": profile["rssi"],
            "snr": profile["snr"],
            "packet_loss": profile["packet_loss"],
            "link_quality": profile["link_quality"],
        }

        eval_res = calculate_channel_quality(metrics, weights=weights)

        node = {
            "id": node_id,
            "index": i,
            "role": role,
            "initial_role": role,
            "status": status,
            "is_gateway": is_gw,
            "is_primary_gateway": is_gw,
            "is_failed": False,
            "x": x,
            "y": y,
            "angle_deg": round(math.degrees(angle), 1),
            "rssi": profile["rssi"],
            "snr": profile["snr"],
            "packet_loss": profile["packet_loss"],
            "link_quality": profile["link_quality"],
            "channel_quality_score": eval_res["score"],
            "quality_breakdown": eval_res,
        }
        nodes.append(node)

    return nodes


def generate_mesh_links(
    nodes: List[Dict[str, Any]],
    active_gateway_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Generates mesh communication links:
    1. Active Gateway Links (Star/Tree communication backbone to the gateway)
    2. Mesh Ring / Neighbor Peer Links (ESP-NOW ad-hoc mesh peer links)
    """
    links = []
    node_map = {n["id"]: n for n in nodes}
    num_nodes = len(nodes)

    # 1. Neighbor Mesh Peer Links (forming regular polygon perimeter)
    for i in range(num_nodes):
        curr_node = nodes[i]
        next_node = nodes[(i + 1) % num_nodes]

        avg_q = round((curr_node["channel_quality_score"] + next_node["channel_quality_score"]) / 2.0, 1)
        is_active = (curr_node["status"] == "ONLINE" and next_node["status"] == "ONLINE")

        links.append({
            "id": f"peer_{curr_node['id']}_{next_node['id']}",
            "type": "peer_mesh",
            "source": curr_node["id"],
            "target": next_node["id"],
            "quality_score": avg_q,
            "active": is_active,
            "is_gateway_route": False,
        })

    # 2. Active Gateway Communication Links
    if active_gateway_id and active_gateway_id in node_map:
        gw_node = node_map[active_gateway_id]
        if gw_node["status"] == "ONLINE":
            for n in nodes:
                if n["id"] != active_gateway_id:
                    avg_q = round((n["channel_quality_score"] + gw_node["channel_quality_score"]) / 2.0, 1)
                    is_active = (n["status"] == "ONLINE")
                    links.append({
                        "id": f"gw_{n['id']}_{active_gateway_id}",
                        "type": "gateway_route",
                        "source": n["id"],
                        "target": active_gateway_id,
                        "quality_score": avg_q,
                        "active": is_active,
                        "is_gateway_route": True,
                    })

    return links
