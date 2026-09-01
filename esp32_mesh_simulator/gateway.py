"""
gateway.py - Gateway State Machine and Failover Election Engine.

Manages primary gateway status, failure detection, candidate evaluation,
election decision based on composite channel quality, and network recovery.
"""

from typing import Dict, List, Any, Optional
from channel_quality import rank_candidates


class GatewayManager:
    def __init__(self, primary_gateway_id: str = "ESP32-01"):
        self.primary_gateway_id = primary_gateway_id
        self.active_gateway_id = primary_gateway_id
        self.failed_gateway_ids: List[str] = []
        self.promoted_gateway_id: Optional[str] = None
        self.election_history: List[Dict[str, Any]] = []

    def reset(self, primary_gateway_id: Optional[str] = None):
        """Reset gateway manager state to initial normal operation."""
        if primary_gateway_id:
            self.primary_gateway_id = primary_gateway_id
        self.active_gateway_id = self.primary_gateway_id
        self.failed_gateway_ids = []
        self.promoted_gateway_id = None
        self.election_history = []

    def trigger_failure(self, nodes: List[Dict[str, Any]], weights: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
        """
        Executes gateway failover:
        1. Marks current active gateway as FAILED.
        2. Gathers eligible online slave candidates.
        3. Evaluates and ranks candidates using Channel Quality Scoring.
        4. Selects top-ranked slave node.
        5. Promotes candidate to NEW_GATEWAY.
        6. Updates node roles and statuses.
        """
        old_gw_id = self.active_gateway_id

        # Mark old gateway failed
        if old_gw_id not in self.failed_gateway_ids:
            self.failed_gateway_ids.append(old_gw_id)

        # Find eligible candidates (online nodes that are not failed)
        candidates = [
            n for n in nodes
            if n["id"] != old_gw_id and (n["id"] not in self.failed_gateway_ids) and n.get("status") != "FAILED"
        ]

        if not candidates:
            return {
                "success": False,
                "error": "No eligible candidate slave nodes available for election.",
                "failed_gateway": old_gw_id,
                "ranked_candidates": [],
                "new_gateway": None,
            }

        # Rank candidates deterministically
        ranked_candidates = rank_candidates(candidates, weights=weights)
        top_candidate = ranked_candidates[0]
        new_gw_id = top_candidate["id"]

        self.promoted_gateway_id = new_gw_id
        self.active_gateway_id = new_gw_id

        # Update node states
        for n in nodes:
            if n["id"] == old_gw_id:
                n["status"] = "FAILED"
                n["role"] = "FAILED_GATEWAY"
                n["is_gateway"] = False
                n["is_failed"] = True
            elif n["id"] == new_gw_id:
                n["status"] = "ONLINE"
                n["role"] = "NEW_GATEWAY"
                n["is_gateway"] = True
                n["is_failed"] = False
            else:
                n["role"] = "SLAVE"
                n["is_gateway"] = False
                n["is_failed"] = False

        reason_str = (
            f"{new_gw_id} elected as New Gateway with highest Channel Quality Score "
            f"({top_candidate['channel_quality_score']}%) based on RSSI ({top_candidate['rssi']} dBm), "
            f"SNR ({top_candidate['snr']} dB), Packet Loss ({top_candidate['packet_loss']}%), and "
            f"Link Quality ({top_candidate['link_quality']}%)."
        )

        election_record = {
            "failed_gateway": old_gw_id,
            "new_gateway": new_gw_id,
            "winning_score": top_candidate["channel_quality_score"],
            "ranked_candidates": ranked_candidates,
            "reason": reason_str,
        }
        self.election_history.append(election_record)

        return {
            "success": True,
            "failed_gateway": old_gw_id,
            "new_gateway": new_gw_id,
            "winning_score": top_candidate["channel_quality_score"],
            "ranked_candidates": ranked_candidates,
            "election_record": election_record,
        }
