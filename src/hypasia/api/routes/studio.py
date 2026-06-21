"""
Hypasia AI — All remaining API routes bundled.
Covers: Red-Team, Fingerprint, Version Control, Annotation, Marketplace, Export/HF Push, Settings.
"""
from typing import Optional, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

# ── Shared queue ────────────────────────────────────────────────────────────
_version_store = None
_annotation_store: dict = {"sessions": {}}


def _vs():
    global _version_store
    if _version_store is None:
        from hypasia.versioning.store import VersionStore
        _version_store = VersionStore()
    return _version_store


# ════════════════════════════════════════════════════════════════════════════
# RED-TEAM
# ════════════════════════════════════════════════════════════════════════════

class RedTeamRequest(BaseModel):
    rows: List[dict]
    n_variants: int = 3
    judge: str = "ollama"
    ollama_model: str = "llama3.1"
    api_key: Optional[str] = None


@router.post("/redteam/generate")
def redteam_generate(req: RedTeamRequest):
    try:
        from hypasia.schema import HypasiaRow
        from hypasia.augmentation.adversarial import generate_adversarial
        input_rows = [
            HypasiaRow(instruction=str(d.get("instruction", "")),
                       response=str(d.get("response", "")))
            for d in req.rows
        ]
        results = generate_adversarial(input_rows, n_variants=req.n_variants,
                                       judge=req.judge, ollama_model=req.ollama_model,
                                       api_key=req.api_key)
        return {
            "status": "success",
            "generated": len(results),
            "rows": [{"instruction": r.instruction, "response": r.response,
                      "source": r.source, "title": r.title} for r in results],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ════════════════════════════════════════════════════════════════════════════
# FINGERPRINT
# ════════════════════════════════════════════════════════════════════════════

class FingerprintEmbedRequest(BaseModel):
    rows: List[dict]
    owner_id: str
    secret_salt: str = "hypasia-dna-v1"


class FingerprintVerifyRequest(BaseModel):
    rows: List[dict]
    token: str
    secret_salt: str = "hypasia-dna-v1"
    tolerance: float = 0.7


@router.post("/fingerprint/embed")
def fingerprint_embed(req: FingerprintEmbedRequest):
    try:
        from hypasia.fingerprint.embed import embed_fingerprint
        fp_rows, token = embed_fingerprint(req.rows, owner_id=req.owner_id,
                                           secret_salt=req.secret_salt)
        return {"status": "success", "token": token,
                "row_count": len(fp_rows), "rows": fp_rows}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/fingerprint/verify")
def fingerprint_verify(req: FingerprintVerifyRequest):
    try:
        from hypasia.fingerprint.embed import verify_fingerprint
        result = verify_fingerprint(req.rows, req.token,
                                    secret_salt=req.secret_salt,
                                    tolerance=req.tolerance)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ════════════════════════════════════════════════════════════════════════════
# VERSION CONTROL
# ════════════════════════════════════════════════════════════════════════════

class VersionCommitRequest(BaseModel):
    rows: List[dict]
    name: str
    message: str = ""
    parent_id: Optional[str] = None
    tags: List[str] = []


class VersionDiffRequest(BaseModel):
    version_a: str
    version_b: str


@router.post("/versions/commit")
def version_commit(req: VersionCommitRequest):
    try:
        vid = _vs().commit(req.rows, name=req.name, message=req.message,
                           parent_id=req.parent_id, tags=req.tags)
        return {"status": "committed", "version_id": vid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/versions/list")
def version_list(limit: int = 50):
    return {"versions": _vs().list_versions(limit=limit)}


@router.get("/versions/{version_id}/rows")
def version_rows(version_id: str):
    try:
        rows = _vs().get_rows(version_id)
        return {"version_id": version_id, "rows": rows}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/versions/diff")
def version_diff(req: VersionDiffRequest):
    try:
        return _vs().diff(req.version_a, req.version_b)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/versions/{version_id}")
def version_delete(version_id: str):
    try:
        _vs().delete(version_id)
        return {"status": "deleted", "version_id": version_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ════════════════════════════════════════════════════════════════════════════
# ANNOTATION STUDIO
# ════════════════════════════════════════════════════════════════════════════

class AnnotateSessionRequest(BaseModel):
    rows: List[dict]
    session_name: str = "default"


class AnnotateDecisionRequest(BaseModel):
    session_name: str
    row_index: int
    decision: str        # "approve" | "reject" | "edit"
    edited_instruction: Optional[str] = None
    edited_response: Optional[str] = None


@router.post("/annotate/session")
def annotate_create_session(req: AnnotateSessionRequest):
    _annotation_store["sessions"][req.session_name] = {
        "rows": req.rows,
        "decisions": {},
        "created": __import__("datetime").datetime.utcnow().isoformat(),
    }
    return {"status": "created", "session": req.session_name, "total": len(req.rows)}


@router.get("/annotate/session/{session_name}")
def annotate_get_session(session_name: str):
    s = _annotation_store["sessions"].get(session_name)
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    approved = sum(1 for d in s["decisions"].values() if d["decision"] == "approve")
    rejected = sum(1 for d in s["decisions"].values() if d["decision"] == "reject")
    return {
        "session": session_name,
        "total": len(s["rows"]),
        "annotated": len(s["decisions"]),
        "approved": approved,
        "rejected": rejected,
        "rows": s["rows"],
        "decisions": s["decisions"],
    }


@router.post("/annotate/decide")
def annotate_decide(req: AnnotateDecisionRequest):
    s = _annotation_store["sessions"].get(req.session_name)
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    if req.row_index >= len(s["rows"]):
        raise HTTPException(status_code=400, detail="Row index out of range")
    decision = {"decision": req.decision}
    if req.decision == "edit":
        if req.edited_instruction:
            s["rows"][req.row_index]["instruction"] = req.edited_instruction
        if req.edited_response:
            s["rows"][req.row_index]["response"] = req.edited_response
        decision["decision"] = "approve"
    s["decisions"][str(req.row_index)] = decision
    return {"status": "recorded", "index": req.row_index, "decision": decision["decision"]}


@router.get("/annotate/export/{session_name}")
def annotate_export(session_name: str):
    s = _annotation_store["sessions"].get(session_name)
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    approved = [
        s["rows"][int(idx)] for idx, d in s["decisions"].items()
        if d["decision"] == "approve" and int(idx) < len(s["rows"])
    ]
    return {"status": "success", "approved_count": len(approved), "rows": approved}


# ════════════════════════════════════════════════════════════════════════════
# ════════════════════════════════════════════════════════════════════════════
# EXPORT / HF PUSH
# ════════════════════════════════════════════════════════════════════════════

class HFPushRequest(BaseModel):
    jsonl_path: str
    repo_id: str
    hf_token: str
    private: bool = True
    commit_message: str = "Upload via Hypasia AI"


@router.post("/export/hf-push")
def export_hf_push(req: HFPushRequest):
    try:
        from hypasia.exporter.hf_push import push_to_hub
        result = push_to_hub(req.jsonl_path, req.repo_id, req.hf_token,
                             req.private, req.commit_message)
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ImportError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class PiiScrubRequest(BaseModel):
    rows: List[dict]


@router.post("/export/scrub-pii")
def export_scrub_pii(req: PiiScrubRequest):
    try:
        from hypasia.schema import HypasiaRow
        from hypasia.cleaner.pii import scrub_rows
        rows = [HypasiaRow(instruction=str(d.get("instruction", "")),
                           response=str(d.get("response", ""))) for d in req.rows]
        scrubbed = scrub_rows(rows)
        redacted_count = sum(1 for r in scrubbed if r.pii_redacted)
        return {
            "status": "success",
            "total": len(scrubbed),
            "pii_redacted_count": redacted_count,
            "rows": [{"instruction": r.instruction, "response": r.response,
                      "pii_redacted": r.pii_redacted} for r in scrubbed],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
