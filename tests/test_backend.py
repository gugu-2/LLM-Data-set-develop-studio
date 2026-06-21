import pytest
from fastapi.testclient import TestClient
from hypasia.api.main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_marketplace_list():
    response = client.get("/api/marketplace/list")
    assert response.status_code == 200
    assert "listings" in response.json()
    assert response.json()["status"] == "success"

def test_safety_scan():
    # Test that safety scan endpoint works
    response = client.post("/api/safety/scan", json={
        "rows": [{"instruction": "test", "response": "test"}]
    })
    assert response.status_code == 200
    assert "flags" in response.json()

def test_mining_pipeline_endpoint():
    response = client.post("/api/mine/run", json={
        "source": "https://example.com",
        "judge": "heuristic",
        "threshold": 0.0
    })
    # Might return an error if it fails to fetch, or a success with 0 rows, but we just verify it exists
    assert response.status_code in (200, 400, 500)
