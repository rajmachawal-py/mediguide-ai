import os
import vertexai
from vertexai.generative_models import GenerativeModel
from app.config import settings

def test_vertex_init():
    try:
        cred_path = settings.GOOGLE_APPLICATION_CREDENTIALS
        print(f"Cred path: {cred_path}")
        if os.path.exists(cred_path):
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = cred_path
            print("Credentials file found and env var set.")
        else:
            print("Credentials file NOT FOUND at path.")
            return

        print(f"Initializing Vertex AI with project={settings.GCP_PROJECT_ID}, location={settings.GCP_LOCATION}...")
        vertexai.init(project=settings.GCP_PROJECT_ID, location=settings.GCP_LOCATION)
        
        print("Creating model instance...")
        model = GenerativeModel("gemini-1.5-flash")
        
        print("Sending test message...")
        response = model.generate_content("Say hello")
        print(f"Success! Response: {response.text}")
        
    except Exception as e:
        print(f"FAILED: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Add project root to sys.path if needed
    import sys
    sys.path.append(os.getcwd())
    test_vertex_init()
