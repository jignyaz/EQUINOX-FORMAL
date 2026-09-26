import subprocess
import sys
import os
import threading

def run_backend():
    print("Starting FastAPI Backend (Port 8000)...")
    backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
    
    # Use the virtual environment python if it exists
    python_exe = "python"
    if os.path.exists(os.path.join(backend_dir, "venv", "Scripts", "python.exe")):
        python_exe = os.path.join(backend_dir, "venv", "Scripts", "python.exe")
        
    process = subprocess.Popen(
        [python_exe, "-m", "uvicorn", "main:app", "--reload", "--port", "8000"],
        cwd=backend_dir,
        stdout=sys.stdout,
        stderr=sys.stderr
    )
    process.wait()

def run_frontend():
    print("Starting Next.js Frontend (Port 3000)...")
    frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")
    
    # Use shell=True for npm commands on Windows
    process = subprocess.Popen(
        "npm run dev",
        cwd=frontend_dir,
        shell=True,
        stdout=sys.stdout,
        stderr=sys.stderr
    )
    process.wait()

if __name__ == "__main__":
    print("========================================")
    print("Starting E-Commerce Platform...")
    print("========================================")
    
    # Create threads to run both servers simultaneously
    backend_thread = threading.Thread(target=run_backend)
    frontend_thread = threading.Thread(target=run_frontend)
    
    # Daemon threads will exit when the main program exits
    backend_thread.daemon = True
    frontend_thread.daemon = True
    
    try:
        backend_thread.start()
        frontend_thread.start()
        
        # Keep the main thread alive so the daemon threads continue running
        while True:
            backend_thread.join(1)
            frontend_thread.join(1)
            
    except KeyboardInterrupt:
        print("\nShutting down servers...")
        sys.exit(0)
