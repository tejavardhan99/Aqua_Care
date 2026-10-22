from pydantic import BaseModel, Field
from typing import Dict, Any

class RangeThreshold(BaseModel):
    min_safe: float
    max_safe: float
    min_warning: float
    max_warning: float
    min_critical: float
    max_critical: float
    unit: str
    description: str

class MinThreshold(BaseModel):
    safe: float       # Above this is safe
    warning: float    # Below this is warning
    high: float       # Below this is high
    critical: float   # Below this is critical
    unit: str
    description: str

class MaxThreshold(BaseModel):
    safe: float       # Below this is safe
    warning: float    # Above this is warning
    high: float       # Above this is high
    critical: float   # Above this is critical
    unit: str
    description: str

class PrawnPondThresholds(BaseModel):
    temperature: RangeThreshold = Field(
        default_factory=lambda: RangeThreshold(
            min_safe=27.0,
            max_safe=31.0,
            min_warning=25.0,
            max_warning=33.0,
            min_critical=22.0,
            max_critical=35.0,
            unit="°C",
            description="Freshwater prawn metabolic sweet spot is 28-31°C."
        )
    )
    ph: RangeThreshold = Field(
        default_factory=lambda: RangeThreshold(
            min_safe=7.2,
            max_safe=8.4,
            min_warning=6.8,
            max_warning=8.8,
            min_critical=6.2,
            max_critical=9.2,
            unit="pH",
            description="Optimal prawn carapace growth occurs at slightly alkaline pH 7.2 - 8.4."
        )
    )
    dissolved_oxygen: MinThreshold = Field(
        default_factory=lambda: MinThreshold(
            safe=5.0,
            warning=4.5,
            high=3.5,
            critical=2.8,
            unit="mg/L",
            description="Prawns require minimum 5.0 mg/L DO. Hypoxia begins below 3.5 mg/L."
        )
    )
    turbidity: RangeThreshold = Field(
        default_factory=lambda: RangeThreshold(
            min_safe=25.0,
            max_safe=50.0,
            min_warning=18.0,
            max_warning=65.0,
            min_critical=12.0,
            max_critical=80.0,
            unit="NTU",
            description="Prawns thrive in moderate turbidity (plankton bloom). >70 NTU risks silt gill fouling."
        )
    )
    ammonia: MaxThreshold = Field(
        default_factory=lambda: MaxThreshold(
            safe=0.1,
            warning=0.4,
            high=0.8,
            critical=1.2,
            unit="ppm",
            description="Total ammonia nitrogen (TAN). Levels above 0.5 ppm induce acute gill damage."
        )
    )
    water_level: RangeThreshold = Field(
        default_factory=lambda: RangeThreshold(
            min_safe=1.1,
            max_safe=1.6,
            min_warning=0.9,
            max_warning=1.8,
            min_critical=0.7,
            max_critical=2.1,
            unit="m",
            description="Standard prawn pond depth 1.1 - 1.5 m prevents surface thermal spikes."
        )
    )

# Global active threshold store (Single source of truth)
current_thresholds = PrawnPondThresholds()

def get_current_thresholds() -> PrawnPondThresholds:
    return current_thresholds

def update_current_thresholds(new_thresholds: Dict[str, Any]) -> PrawnPondThresholds:
    global current_thresholds
    current_thresholds = PrawnPondThresholds(**new_thresholds)
    return current_thresholds

