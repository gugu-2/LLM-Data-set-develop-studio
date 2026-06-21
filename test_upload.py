import requests

with open("test_urls.txt", "w") as f:
    f.write("https://example.com\n")
    f.write("https://httpbin.org/html\n")

with open("test_urls.txt", "rb") as f:
    files = {"file": ("test_urls.txt", f)}
    data = {
        "judge": "ollama",
        "ollama_model": "llama3.1",
        "threshold": "1.0",
        "api_key": ""
    }
    print("Sending POST /api/mine/upload")
    res = requests.post("http://localhost:8000/api/mine/upload", files=files, data=data)
    print("Status code:", res.status_code)
    try:
        print("Response:", res.json())
    except:
        print("Raw:", res.text)
