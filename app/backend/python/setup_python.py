#!/usr/bin/env python3
"""
Setup script for Python chained voice processing
This script helps set up the Python environment and dependencies
"""

import os
import subprocess
import sys
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        print(f"Error output: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8 or higher is required")
        print(f"Current version: {version.major}.{version.minor}.{version.micro}")
        return False
    print(f"✅ Python version {version.major}.{version.minor}.{version.micro} is compatible")
    return True

def setup_virtual_environment():
    """Set up Python virtual environment"""
    venv_path = Path("venv")
    if venv_path.exists():
        print("✅ Virtual environment already exists")
        return True
    
    return run_command("python -m venv venv", "Creating virtual environment")

def activate_virtual_environment():
    """Activate virtual environment and return the activation command"""
    if os.name == 'nt':  # Windows
        return "venv\\Scripts\\activate"
    else:  # Unix/Linux/macOS
        return "source venv/bin/activate"

def install_dependencies():
    """Install Python dependencies"""
    # Determine the correct pip command
    if os.name == 'nt':  # Windows
        pip_cmd = "venv\\Scripts\\pip"
    else:  # Unix/Linux/macOS
        pip_cmd = "venv/bin/pip"
    
    # Upgrade pip first
    if not run_command(f"{pip_cmd} install --upgrade pip", "Upgrading pip"):
        return False
    
    # Install requirements
    if not run_command(f"{pip_cmd} install -r requirements.txt", "Installing Python dependencies"):
        return False
    
    return True

def check_environment_variables():
    """Check if required environment variables are set"""
    required_vars = ["OPENAI_API_KEY"]
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print("❌ Missing required environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\nPlease set these variables in your .env file or environment")
        return False
    
    print("✅ All required environment variables are set")
    return True

def create_env_example():
    """Create .env.example file if it doesn't exist"""
    env_example_path = Path(".env.example")
    if not env_example_path.exists():
        env_example_content = """# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=3000
PYTHON_PORT=8001

# Python Chained Voice Processing
# Set this to true to use Python-based chained processing
USE_PYTHON_CHAINED=true
"""
        with open(env_example_path, 'w') as f:
            f.write(env_example_content)
        print("✅ Created .env.example file")
    else:
        print("✅ .env.example file already exists")

def main():
    """Main setup function"""
    print("🚀 Setting up Python chained voice processing...")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Create .env.example
    create_env_example()
    
    # Set up virtual environment
    if not setup_virtual_environment():
        print("❌ Failed to create virtual environment")
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        print("❌ Failed to install dependencies")
        sys.exit(1)
    
    # Check environment variables
    if not check_environment_variables():
        print("\n⚠️  Please set up your environment variables before running the server")
        print("   You can copy .env.example to .env and fill in your API key")
    
    print("\n" + "=" * 50)
    print("✅ Python chained voice processing setup complete!")
    print("\nTo use the Python chained processing:")
    print("1. Activate the virtual environment:")
    if os.name == 'nt':  # Windows
        print("   venv\\Scripts\\activate")
    else:  # Unix/Linux/macOS
        print("   source venv/bin/activate")
    print("\n2. Run the Python server:")
    print("   python python_chained_server.py")
    print("\n3. Or run the chained pipeline directly:")
    print("   python chained_voice_pipeline.py")

if __name__ == "__main__":
    main()
