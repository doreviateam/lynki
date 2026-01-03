"""
Configuration pytest pour les tests DVIG P1
Fixtures communes pour tests P1 Auth/Token
"""
import sys
from pathlib import Path

# Ajouter le répertoire sources/dvig au PYTHONPATH
dvig_path = Path(__file__).parent.parent
sys.path.insert(0, str(dvig_path))

import pytest

