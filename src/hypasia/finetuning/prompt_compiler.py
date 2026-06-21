"""
Hypasia AI — Universal Prompt Compiler
Compiles Semantic Intent into Model-Specific Chat Templates.
"""

def compile_prompt(semantic_intent: str, target_architecture: str) -> str:
    """
    Translates a generic semantic prompt into strict, architecture-specific syntax.
    """
    if target_architecture == "llama3":
        return (
            "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\\n\\n"
            f"You are a helpful assistant.\\n\\n"
            f"{semantic_intent}<|eot_id|><|start_header_id|>user<|end_header_id|>\\n\\n"
            "Respond to my request.<|eot_id|><|start_header_id|>assistant<|end_header_id|>\\n\\n"
        )
    elif target_architecture == "mistral":
        return f"[INST] {semantic_intent} [/INST]"
    elif target_architecture == "chatml":
        return (
            "<|im_start|>system\\n"
            f"{semantic_intent}<|im_end|>\\n"
            "<|im_start|>user\\n"
            "Hello!<|im_end|>\\n"
            "<|im_start|>assistant\\n"
        )
    elif target_architecture == "claude":
        return (
            f"<system>\\n{semantic_intent}\\n</system>\\n"
            "\\nHuman: Please respond to the above.\\n\\nAssistant:"
        )
    else:
        return f"System: {semantic_intent}\\n\\nUser: Hello\\n\\nAssistant:"
