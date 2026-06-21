"""
Hypasia AI — FastAPI Backend Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from hypasia.api.routes import (
    mine, finetune, debug, flywheel, elicit, augment, safety, 
    studio, chat, export, marketplace, telemetry, wizard, synth, 
    arena, converter, inspector, deploy, audio, dna, prompt, 
    webhooks, logbook, healing, washer, rlhf, compiler, vlam, matrix, lens, streams, evaluator, deepthink, sandbox, graph, swarm, settings, cloud
)


app = FastAPI(
    title="Hypasia AI Studio API",
    description="Backend for the Hypasia browser-based Studio",
    version="0.1.0"
)

# Allow React frontend to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(mine.router, prefix="/api/mine", tags=["Mining & Scoring"])
app.include_router(finetune.router, prefix="/api/finetune", tags=["Fine-Tuning Code Gen"])
app.include_router(debug.router, prefix="/api/debug", tags=["AI Debugging Assistant"])
app.include_router(flywheel.router, prefix="/api/flywheel", tags=["Data Flywheel"])
app.include_router(elicit.router, prefix="/api/elicit", tags=["Expert Elicitor"])
app.include_router(augment.router, prefix="/api/augment", tags=["Augmentation Engine"])
app.include_router(safety.router, prefix="/api/safety", tags=["Safety & Evaluation"])
app.include_router(studio.router, prefix="/api", tags=["Studio — RedTeam, Fingerprint, Versions, Annotate, Marketplace, Export"])
app.include_router(chat.router, prefix="/api", tags=["AI Chat Assistant"])
app.include_router(export.router, prefix="/api", tags=["Export"])
app.include_router(marketplace.router, prefix="/api/marketplace", tags=["Marketplace"])
app.include_router(telemetry.router, prefix="/api/telemetry", tags=["telemetry"])
app.include_router(matrix.router, prefix="/api", tags=["matrix"])
app.include_router(lens.router, prefix="/api", tags=["lens"])
app.include_router(streams.router, prefix="/api", tags=["streams"])
app.include_router(wizard.router, prefix="/api", tags=["AI Wizard"])
app.include_router(synth.router, prefix="/api", tags=["Synthetic Data Factory"])
app.include_router(arena.router, prefix="/api", tags=["Model Arena"])
app.include_router(converter.router, prefix="/api", tags=["Dataset Format Converter"])
app.include_router(inspector.router, prefix="/api", tags=["Dataset Health Inspector"])
app.include_router(deploy.router, prefix="/api", tags=["One-Click Deploy"])
app.include_router(audio.router, prefix="/api", tags=["Audio Miner"])
app.include_router(dna.router, prefix="/api", tags=["DNA Scanner"])
app.include_router(prompt.router, prefix="/api", tags=["Prompt Studio"])
app.include_router(webhooks.router, prefix="/api", tags=["Webhooks & Integrations"])
app.include_router(logbook.router, prefix="/api", tags=["Training Logbook"])
app.include_router(healing.router, prefix="/api", tags=["Self-Healing Dataset Loop"])
app.include_router(washer.router, prefix="/api", tags=["IP Washer & Ledger"])
app.include_router(rlhf.router, prefix="/api", tags=["RLHF Tinder Widget"])
app.include_router(compiler.router, prefix="/api", tags=["Universal Prompt Compiler"])
app.include_router(vlam.router, prefix="/api", tags=["VLAM Action Miner"])
app.include_router(evaluator.router, prefix="/api", tags=["Automated Evaluator"])
app.include_router(deepthink.router, prefix="/api", tags=["DeepThink Studio"])
app.include_router(sandbox.router, prefix="/api", tags=["Agent Sandbox"])
app.include_router(graph.router, prefix="/api", tags=["Knowledge Graph"])
app.include_router(swarm.router, prefix="/api", tags=["Swarm Studio"])
app.include_router(settings.router, prefix="/api", tags=["Settings"])
app.include_router(cloud.router, prefix="/api", tags=["Cloud Dispatcher"])


@app.get("/api/health")
def health_check():
    return JSONResponse({"status": "online", "message": "Hypasia AI Backend is running."})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("hypasia.api.main:app", host="0.0.0.0", port=8000, reload=True)
