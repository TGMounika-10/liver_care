import sys
import os

# Add parent directory to sys.path so imports like 'database', 'schemas', etc. work seamlessly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
