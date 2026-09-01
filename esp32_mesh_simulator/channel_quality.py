"""
channel_quality.py - Channel Quality Scoring Algorithm for ESP32 Mesh Gateway Failover.

Normalizes RF channel metrics (RSSI, SNR, Packet Loss, Link Quality) and calculates
a composite weighted channel quality score (0 - 100%) for gateway election decisions.
"""

from typing import Dict, List, Any, Optional

# Default weights (sum = 1.0)
DEFAULT_WEIGHTS = {
    "rssi": 0.30,
    "snr": 0.30,
    "packet_loss": 0.20,
    "link_quality": 0.20,
}

# Metric normalization bounds (realistic ESP-NOW 2.4GHz RF ranges in mining / industrial environment)
BOUNDS = {
    "rssi_min": -90.0,  # Extremely weak signal / near edge of reception (-90 dBm)
    "rssi_max": -30.0,  # Excellent strong signal / close proximity (-30 dBm)
    "snr_min": 0.0,     # High noise floor / poor demodulation (0 dB)
    "snr_max": 35.0,    # Very clean signal / high SNR (35 dB)
    "packet_loss_min": 0.0,
    "packet_loss_max": 100.0,
    "link_quality_min": 0.0,
    "link_quality_max": 100.0,
}


def clamp(val: float, min_v: float, max_v: float) -> float:
    """Clamp value to [min_v, max_v]."""
    return max(min_v, min(max_v, float(val)))


def normalize_rssi(rssi: float) -> float:
    """
    Normalize RSSI from [-90 dBm, -30 dBm] to [0.0, 1.0].
    Higher RSSI (closer to -30 dBm) -> Higher score (closer to 1.0).
    """
    clamped = clamp(rssi, BOUNDS["rssi_min"], BOUNDS["rssi_max"])
    return (clamped - BOUNDS["rssi_min"]) / (BOUNDS["rssi_max"] - BOUNDS["rssi_min"])


def normalize_snr(snr: float) -> float:
    """
    Normalize SNR from [0 dB, 35 dB] to [0.0, 1.0].
    Higher SNR -> Higher score.
    """
    clamped = clamp(snr, BOUNDS["snr_min"], BOUNDS["snr_max"])
    return (clamped - BOUNDS["snr_min"]) / (BOUNDS["snr_max"] - BOUNDS["snr_min"])


def normalize_packet_loss(loss: float) -> float:
    """
    Normalize Packet Loss from [0%, 100%] to [0.0, 1.0].
    Inverted: Lower Packet Loss -> Higher score.
    """
    clamped = clamp(loss, BOUNDS["packet_loss_min"], BOUNDS["packet_loss_max"])
    return 1.0 - (clamped / 100.0)


def normalize_link_quality(link_q: float) -> float:
    """
    Normalize Link Quality from [0%, 100%] to [0.0, 1.0].
    Higher Link Quality -> Higher score.
    """
    clamped = clamp(link_q, BOUNDS["link_quality_min"], BOUNDS["link_quality_max"])
    return clamped / 100.0


def calculate_channel_quality(
    metrics: Dict[str, Any],
    weights: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Calculate normalized components and composite channel quality score (0.0 to 100.0%).
    """
    w = weights if weights is not None else DEFAULT_WEIGHTS

    w_rssi = float(w.get("rssi", DEFAULT_WEIGHTS["rssi"]))
    w_snr = float(w.get("snr", DEFAULT_WEIGHTS["snr"]))
    w_loss = float(w.get("packet_loss", DEFAULT_WEIGHTS["packet_loss"]))
    w_link = float(w.get("link_quality", DEFAULT_WEIGHTS["link_quality"]))

    total_w = w_rssi + w_snr + w_loss + w_link
    if total_w <= 0:
        w_rssi, w_snr, w_loss, w_link = 0.30, 0.30, 0.20, 0.20
        total_w = 1.0
    else:
        w_rssi /= total_w
        w_snr /= total_w
        w_loss /= total_w
        w_link /= total_w

    rssi_val = float(metrics.get("rssi", -60.0))
    snr_val = float(metrics.get("snr", 20.0))
    loss_val = float(metrics.get("packet_loss", 5.0))
    link_val = float(metrics.get("link_quality", 80.0))

    norm_rssi = normalize_rssi(rssi_val)
    norm_snr = normalize_snr(snr_val)
    norm_loss = normalize_packet_loss(loss_val)
    norm_link = normalize_link_quality(link_val)

    # Weighted calculation
    comp_score = (
        (w_rssi * norm_rssi) +
        (w_snr * norm_snr) +
        (w_loss * norm_loss) +
        (w_link * norm_link)
    ) * 100.0

    comp_score = round(clamp(comp_score, 0.0, 100.0), 1)

    return {
        "raw": {
            "rssi": rssi_val,
            "snr": snr_val,
            "packet_loss": loss_val,
            "link_quality": link_val,
        },
        "normalized": {
            "rssi": round(norm_rssi, 4),
            "snr": round(norm_snr, 4),
            "packet_loss": round(norm_loss, 4),
            "link_quality": round(norm_link, 4),
        },
        "weighted_contributions": {
            "rssi": round(w_rssi * norm_rssi * 100.0, 2),
            "snr": round(w_snr * norm_snr * 100.0, 2),
            "packet_loss": round(w_loss * norm_loss * 100.0, 2),
            "link_quality": round(w_link * norm_link * 100.0, 2),
        },
        "weights_used": {
            "rssi": round(w_rssi, 3),
            "snr": round(w_snr, 3),
            "packet_loss": round(w_loss, 3),
            "link_quality": round(w_link, 3),
        },
        "score": comp_score,
    }


def rank_candidates(
    candidates: List[Dict[str, Any]],
    weights: Optional[Dict[str, float]] = None
) -> List[Dict[str, Any]]:
    """
    Evaluate and rank candidates in descending order of composite channel quality score.
    Ties broken deterministically.
    """
    ranked_list = []
    for cand in candidates:
        eval_res = calculate_channel_quality(cand, weights=weights)
        ranked_cand = dict(cand)
        ranked_cand["quality_breakdown"] = eval_res
        ranked_cand["channel_quality_score"] = eval_res["score"]
        ranked_list.append(ranked_cand)

    def sort_key(item):
        return (
            -item["channel_quality_score"],
            item.get("packet_loss", 100.0),
            -item.get("snr", 0.0),
            -item.get("rssi", -100.0),
            item.get("id", "")
        )

    ranked_list.sort(key=sort_key)

    for idx, item in enumerate(ranked_list, start=1):
        item["rank"] = idx

    return ranked_list
