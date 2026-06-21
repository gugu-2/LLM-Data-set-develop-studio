"""
Hypasia AI — Main CLI entry point.
Command: hypasia

Commands:
  hypasia run     <source>   Full pipeline: mine → score → clean → export
  hypasia crawl   <url>      Crawl a URL or sitemap
  hypasia parse   <file>     Parse any document
  hypasia fetch   <dataset>  Import from HuggingFace Hub
  hypasia score   <file>     Score rows in a JSONL file
  hypasia clean   <file>     Clean and deduplicate a JSONL file
  hypasia select  <file>     Select best rows by strategy
  hypasia export  <file>     Convert to JSONL / Parquet
  hypasia augment <file>     Rephrase or translate dataset
  hypasia fingerprint <file> Embed cryptographic watermark
  hypasia version <file>     Commit dataset to version control
  hypasia config             Show current configuration
"""
from __future__ import annotations

import sys
from pathlib import Path
from typing import Optional

# Force UTF-8 on Windows terminals (fixes cp1252 encoding errors)
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

import typer
from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TimeElapsedColumn, BarColumn, TextColumn
from rich.table import Table
from rich import box

app = typer.Typer(
    name="hypasia",
    help="[bold cyan]Hypasia AI[/] -- Raw internet to fine-tuned model in one command.",
    rich_markup_mode="rich",
    no_args_is_help=True,
)

console = Console(force_terminal=True, highlight=True)

# ── Shared banner ────────────────────────────────────────────────────────────


def _banner():
    console.print(Panel.fit(
        "[bold cyan]⚡ Hypasia AI[/bold cyan]  [dim]v0.1.0 — Data Mining Engine[/dim]",
        border_style="cyan",
    ))


# ─────────────────────────────────────────────────────────────────────────────
# hypasia run — FULL PIPELINE
# ─────────────────────────────────────────────────────────────────────────────

@app.command()
def run(
    source: str = typer.Argument(..., help="URL, file path, or HuggingFace dataset name"),
    output: Optional[Path] = typer.Option(None, "--output", "-o", help="Output file path (.jsonl or .parquet)"),
    threshold: float = typer.Option(7.0, "--threshold", "-t", help="Minimum quality score (0–10)"),
    judge: str = typer.Option("gemini", "--judge", "-j", help="Scorer: gemini | heuristic | ollama"),
    ollama_model: str = typer.Option("llama3.1", "--ollama-model", help="Ollama model to use if judge=ollama"),
    threads: int = typer.Option(4, "--threads", "-w", help="Number of concurrent threads for scoring"),
    lang: str = typer.Option("en", "--lang", "-l", help="Language filter (e.g. en, fr). Empty = keep all."),
    dedup: bool = typer.Option(True, "--dedup/--no-dedup", help="Run near-deduplication"),
    pii: bool = typer.Option(False, "--pii/--no-pii", help="Scrub PII (slower)"),
    depth: int = typer.Option(2, "--depth", "-d", help="Crawl depth (for URLs)"),
    limit: Optional[int] = typer.Option(None, "--limit", help="Max rows to process"),
    fmt: str = typer.Option("jsonl", "--format", "-f", help="Export format: jsonl | parquet"),
):
    """
    [bold green]Full pipeline[/bold green]: mine → score → clean → export.

    Examples:
      hypasia run https://docs.python.org --output dataset.jsonl
      hypasia run research_paper.pdf --pii --threshold 8.0
      hypasia run databricks/databricks-dolly-15k --format parquet
    """
    _banner()

    from hypasia.config import cfg
    from hypasia.mining.crawler.web import crawl_source
    from hypasia.mining.parsers.dispatcher import parse_file
    from hypasia.mining.connectors.huggingface import fetch_hf_dataset
    from hypasia.scorer.composite import score_rows
    from hypasia.cleaner.normalise import normalise_rows
    from hypasia.cleaner.dedup import dedup_rows
    from hypasia.cleaner.pii import scrub_pii
    from hypasia.cleaner.length import filter_by_length
    from hypasia.cleaner.language import filter_by_language
    from hypasia.selector.strategies import filter_by_threshold
    from hypasia.exporter.jsonl import export_jsonl
    from hypasia.exporter.parquet import export_parquet
    from hypasia.schema import HypasiaRow

    rows: list[HypasiaRow] = []

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TextColumn("[cyan]{task.completed}/{task.total}[/cyan]"),
        TimeElapsedColumn(),
        console=console,
    ) as progress:

        # ── Step 1: Mine ──────────────────────────────────────────────────
        mine_task = progress.add_task("[cyan]Mining source...", total=None)

        source_path = Path(source)
        if source_path.exists():
            console.log(f"[cyan]📄 Parsing file:[/cyan] {source}")
            rows = parse_file(source_path)
        elif source.startswith("http://") or source.startswith("https://"):
            console.log(f"[cyan]🕷️  Crawling URL:[/cyan] {source}")
            rows = crawl_source(source, depth=depth)
        else:
            console.log(f"[cyan]☁️  Fetching HF dataset:[/cyan] {source}")
            rows = fetch_hf_dataset(source)

        if limit:
            rows = rows[:limit]

        progress.update(mine_task, completed=len(rows), total=len(rows),
                        description=f"[green]✅ Mined {len(rows):,} rows")

        if not rows:
            console.print("[red]❌ No data extracted. Check your source.[/red]")
            raise typer.Exit(1)

        # ── Step 2: Normalise ─────────────────────────────────────────────
        norm_task = progress.add_task("[cyan]Normalising text...", total=len(rows))
        rows = normalise_rows(rows, progress=progress, task_id=norm_task)
        progress.update(norm_task, description="[green]✅ Normalised")

        # ── Step 3: Length filter ─────────────────────────────────────────
        before = len(rows)
        rows = filter_by_length(rows)
        progress.console.log(
            f"[dim]Length filter: {before:,} → {len(rows):,} rows[/dim]"
        )

        # ── Step 4: Language filter ───────────────────────────────────────
        if lang:
            before = len(rows)
            rows = filter_by_language(rows, target_lang=lang)
            progress.console.log(
                f"[dim]Language filter ({lang}): {before:,} → {len(rows):,} rows[/dim]"
            )

        # ── Step 5: Dedup ─────────────────────────────────────────────────
        if dedup:
            dedup_task = progress.add_task("[cyan]Deduplicating...", total=len(rows))
            before = len(rows)
            rows = dedup_rows(rows, progress=progress, task_id=dedup_task)
            progress.update(dedup_task,
                            description=f"[green]✅ Dedup: removed {before - len(rows):,} dupes")

        # ── Step 6: PII scrub ─────────────────────────────────────────────
        if pii:
            pii_task = progress.add_task("[cyan]Scrubbing PII...", total=len(rows))
            rows = scrub_pii(rows, progress=progress, task_id=pii_task)
            progress.update(pii_task, description="[green]✅ PII scrubbed")

        # ── Step 7: Score ─────────────────────────────────────────────────
        score_task = progress.add_task("[cyan]Scoring rows...", total=len(rows))
        rows = score_rows(rows, judge=judge, threshold=threshold, threads=threads,
                          ollama_model=ollama_model, progress=progress, task_id=score_task)
        progress.update(score_task, description="[green]✅ Scored")

        # ── Step 8: Filter by threshold ───────────────────────────────────
        before = len(rows)
        rows = filter_by_threshold(rows, threshold=threshold)
        progress.console.log(
            f"[dim]Threshold filter (≥{threshold}): {before:,} → {len(rows):,} rows[/dim]"
        )

        # ── Step 9: Export ────────────────────────────────────────────────
        if output is None:
            stem = Path(source).stem if source_path.exists() else source.replace("/", "_")
            output = cfg.output_dir / f"{stem}_hypasia.{fmt}"

        export_task = progress.add_task("[cyan]Exporting...", total=len(rows))
        if fmt == "parquet":
            export_parquet(rows, output)
        else:
            export_jsonl(rows, output)
        progress.update(export_task, completed=len(rows),
                        description=f"[green]✅ Exported → {output}")

    # ── Summary table ─────────────────────────────────────────────────────
    _print_summary(rows, output, threshold)


# ─────────────────────────────────────────────────────────────────────────────
# hypasia crawl
# ─────────────────────────────────────────────────────────────────────────────

@app.command()
def crawl(
    url: str = typer.Argument(..., help="URL or sitemap URL to crawl"),
    output: Optional[Path] = typer.Option(None, "--output", "-o"),
    depth: int = typer.Option(2, "--depth", "-d", help="BFS depth"),
    js: bool = typer.Option(False, "--js", help="Use Playwright for JS-rendered pages"),
    threshold: float = typer.Option(0.0, "--threshold", "-t"),
    fmt: str = typer.Option("jsonl", "--format", "-f"),
):
    """[bold]Crawl a URL or sitemap[/bold] and extract clean text."""
    _banner()
    from hypasia.mining.crawler.web import crawl_source
    from hypasia.exporter.jsonl import export_jsonl
    from hypasia.config import cfg

    console.log(f"[cyan]🕷️  Crawling[/cyan] {url} (depth={depth})")
    with console.status("[cyan]Crawling...[/cyan]"):
        rows = crawl_source(url, depth=depth, use_playwright=js)

    console.log(f"[green]✅ Extracted {len(rows):,} rows[/green]")

    if output is None:
        output = cfg.output_dir / "crawl_output.jsonl"
    export_jsonl(rows, output)
    console.print(f"[green]💾 Saved → {output}[/green]")


# ─────────────────────────────────────────────────────────────────────────────
# hypasia parse
# ─────────────────────────────────────────────────────────────────────────────

@app.command()
def parse(
    file: Path = typer.Argument(..., help="Path to file (PDF, DOCX, CSV, TXT, ...)"),
    output: Optional[Path] = typer.Option(None, "--output", "-o"),
    fmt: str = typer.Option("jsonl", "--format", "-f"),
):
    """[bold]Parse any document[/bold] into training rows."""
    _banner()
    from hypasia.mining.parsers.dispatcher import parse_file
    from hypasia.exporter.jsonl import export_jsonl
    from hypasia.config import cfg

    if not file.exists():
        console.print(f"[red]❌ File not found: {file}[/red]")
        raise typer.Exit(1)

    console.log(f"[cyan]📄 Parsing[/cyan] {file}")
    with console.status(f"[cyan]Parsing {file.name}...[/cyan]"):
        rows = parse_file(file)

    console.log(f"[green]✅ Extracted {len(rows):,} rows[/green]")

    if output is None:
        output = cfg.output_dir / f"{file.stem}_parsed.jsonl"
    export_jsonl(rows, output)
    console.print(f"[green]💾 Saved → {output}[/green]")


# ─────────────────────────────────────────────────────────────────────────────
# hypasia fetch
# ─────────────────────────────────────────────────────────────────────────────

@app.command()
def fetch(
    dataset: str = typer.Argument(..., help="HuggingFace dataset name (e.g. databricks/dolly-15k)"),
    split: str = typer.Option("train", "--split", "-s"),
    output: Optional[Path] = typer.Option(None, "--output", "-o"),
    limit: Optional[int] = typer.Option(None, "--limit"),
):
    """[bold]Import a HuggingFace dataset[/bold] into Hypasia format."""
    _banner()
    from hypasia.mining.connectors.huggingface import fetch_hf_dataset
    from hypasia.exporter.jsonl import export_jsonl
    from hypasia.config import cfg

    console.log(f"[cyan]☁️  Fetching[/cyan] {dataset} (split={split})")
    with console.status("[cyan]Downloading...[/cyan]"):
        rows = fetch_hf_dataset(dataset, split=split)

    if limit:
        rows = rows[:limit]
    console.log(f"[green]✅ Fetched {len(rows):,} rows[/green]")

    if output is None:
        output = cfg.output_dir / f"{dataset.replace('/', '_')}.jsonl"
    export_jsonl(rows, output)
    console.print(f"[green]💾 Saved → {output}[/green]")


# ─────────────────────────────────────────────────────────────────────────────
# hypasia score
# ─────────────────────────────────────────────────────────────────────────────

@app.command()
def score(
    file: Path = typer.Argument(..., help="Input JSONL file"),
    output: Optional[Path] = typer.Option(None, "--output", "-o"),
    judge: str = typer.Option("gemini", "--judge", "-j", help="gemini | heuristic | ollama"),
    ollama_model: str = typer.Option("llama3.1", "--ollama-model"),
    threads: int = typer.Option(4, "--threads", "-w", help="Number of concurrent threads for scoring"),
    threshold: float = typer.Option(7.0, "--threshold", "-t"),
    batch_size: int = typer.Option(10, "--batch-size", "-b", help="Rows per LLM call"),
):
    """[bold]Score rows[/bold] in a JSONL file (0–10 per axis)."""
    _banner()
    from hypasia.scorer.composite import score_rows
    from hypasia.exporter.jsonl import export_jsonl, load_jsonl

    rows = load_jsonl(file)
    console.log(f"[cyan]🔬 Scoring {len(rows):,} rows with judge=[bold]{judge}[/bold]...[/cyan]")

    with Progress(SpinnerColumn(), TextColumn("{task.description}"),
                  BarColumn(), TimeElapsedColumn(), console=console) as progress:
        task = progress.add_task("Scoring...", total=len(rows))
        rows = score_rows(rows, judge=judge, threshold=threshold, threads=threads,
                          ollama_model=ollama_model, batch_size=batch_size,
                          progress=progress, task_id=task)

    if output is None:
        output = file.parent / f"{file.stem}_scored.jsonl"
    export_jsonl(rows, output)
    _print_summary(rows, output, threshold)


# ─────────────────────────────────────────────────────────────────────────────
# hypasia clean
# ─────────────────────────────────────────────────────────────────────────────

@app.command()
def clean(
    file: Path = typer.Argument(..., help="Input JSONL file"),
    output: Optional[Path] = typer.Option(None, "--output", "-o"),
    dedup: bool = typer.Option(True, "--dedup/--no-dedup"),
    pii: bool = typer.Option(False, "--pii/--no-pii"),
    lang: str = typer.Option("en", "--lang"),
    min_tokens: int = typer.Option(20, "--min-tokens"),
    max_tokens: int = typer.Option(4096, "--max-tokens"),
):
    """[bold]Clean + deduplicate[/bold] a JSONL file."""
    _banner()
    from hypasia.cleaner.normalise import normalise_rows
    from hypasia.cleaner.dedup import dedup_rows
    from hypasia.cleaner.pii import scrub_pii
    from hypasia.cleaner.length import filter_by_length
    from hypasia.cleaner.language import filter_by_language
    from hypasia.exporter.jsonl import export_jsonl, load_jsonl

    rows = load_jsonl(file)
    console.log(f"[cyan]Loaded {len(rows):,} rows[/cyan]")

    rows = normalise_rows(rows)
    rows = filter_by_length(rows, min_tokens=min_tokens, max_tokens=max_tokens)
    if lang:
        rows = filter_by_language(rows, target_lang=lang)
    if dedup:
        rows = dedup_rows(rows)
    if pii:
        rows = scrub_pii(rows)

    if output is None:
        output = file.parent / f"{file.stem}_clean.jsonl"
    export_jsonl(rows, output)
    console.print(f"[green]✅ {len(rows):,} rows → {output}[/green]")


# ─────────────────────────────────────────────────────────────────────────────
# hypasia select
# ─────────────────────────────────────────────────────────────────────────────

@app.command()
def select(
    file: Path = typer.Argument(..., help="Scored JSONL file"),
    output: Optional[Path] = typer.Option(None, "--output", "-o"),
    strategy: str = typer.Option("top-n", "--strategy", "-s",
                                  help="top-n | percentile | stratified"),
    n: int = typer.Option(1000, "--n", help="Number of rows to select"),
    percentile: float = typer.Option(70.0, "--percentile", help="Keep top X% by score"),
):
    """[bold]Select best rows[/bold] by strategy (top-N, percentile, stratified)."""
    _banner()
    from hypasia.selector.strategies import select_rows
    from hypasia.exporter.jsonl import export_jsonl, load_jsonl

    rows = load_jsonl(file)
    selected = select_rows(rows, strategy=strategy, n=n, percentile=percentile)
    console.log(f"[green]Selected {len(selected):,} / {len(rows):,} rows[/green]")

    if output is None:
        output = file.parent / f"{file.stem}_selected.jsonl"
    export_jsonl(selected, output)
    console.print(f"[green]💾 Saved → {output}[/green]")


# ─────────────────────────────────────────────────────────────────────────────
# hypasia export
# ─────────────────────────────────────────────────────────────────────────────

@app.command()
def export(
    file: Path = typer.Argument(..., help="Input JSONL file"),
    output: Optional[Path] = typer.Option(None, "--output", "-o"),
    fmt: str = typer.Option("jsonl", "--format", "-f", help="jsonl | parquet"),
):
    """[bold]Export dataset[/bold] to JSONL or Parquet."""
    _banner()
    from hypasia.exporter.jsonl import export_jsonl, load_jsonl
    from hypasia.exporter.parquet import export_parquet

    rows = load_jsonl(file)
    if output is None:
        output = file.parent / f"{file.stem}_export.{fmt}"

    if fmt == "parquet":
        export_parquet(rows, output)
    else:
        export_jsonl(rows, output)
    console.print(f"[green]✅ {len(rows):,} rows → {output}[/green]")


# ─────────────────────────────────────────────────────────────────────────────
# hypasia augment
# ─────────────────────────────────────────────────────────────────────────────

@app.command()
def augment(
    file: Path = typer.Argument(..., help="Input JSONL file"),
    output: Optional[Path] = typer.Option(None, "--output", "-o"),
    mode: str = typer.Option("translate", "--mode", "-m", help="translate | rephrase"),
    target_lang: str = typer.Option("fr", "--target-lang", help="Target language for translation"),
):
    """[bold]Augment dataset[/bold] via translation or rephrasing."""
    _banner()
    from hypasia.exporter.jsonl import export_jsonl, load_jsonl
    from hypasia.augmentation.translate import translate_rows

    rows = load_jsonl(file)
    console.log(f"[cyan]Augmenting {len(rows):,} rows ({mode})...[/cyan]")

    if mode == "translate":
        rows = translate_rows(rows, target_lang=target_lang)
    else:
        console.log("[yellow]Rephrase not fully implemented yet in CLI. Returning original.[/yellow]")

    if output is None:
        output = file.parent / f"{file.stem}_augmented.jsonl"

    export_jsonl(rows, output)
    console.print(f"[green]✅ {len(rows):,} rows → {output}[/green]")


# ─────────────────────────────────────────────────────────────────────────────
# hypasia fingerprint
# ─────────────────────────────────────────────────────────────────────────────

@app.command()
def fingerprint(
    file: Path = typer.Argument(..., help="Input JSONL file"),
    output: Optional[Path] = typer.Option(None, "--output", "-o"),
    signature: str = typer.Option(..., "--signature", "-s", help="Your unique ID"),
):
    """[bold]Embed statistical watermark[/bold] into dataset."""
    _banner()
    from hypasia.exporter.jsonl import export_jsonl, load_jsonl
    from hypasia.security.fingerprint import embed_fingerprint

    rows = load_jsonl(file)
    console.log(f"[cyan]Embedding fingerprint '{signature}'...[/cyan]")
    rows = embed_fingerprint(rows, signature)
    
    if output is None:
        output = file.parent / f"{file.stem}_fingerprinted.jsonl"

    export_jsonl(rows, output)
    console.print(f"[green]✅ {len(rows):,} rows → {output}[/green]")


# ─────────────────────────────────────────────────────────────────────────────
# hypasia version
# ─────────────────────────────────────────────────────────────────────────────

@app.command()
def version(
    file: Path = typer.Argument(..., help="Input JSONL file"),
    message: str = typer.Option(..., "--message", "-m", help="Commit message"),
    author: str = typer.Option("admin", "--author", "-a"),
):
    """[bold]Commit dataset[/bold] to version control."""
    _banner()
    from hypasia.exporter.jsonl import load_jsonl
    from hypasia.flywheel.versions import commit_version

    rows = load_jsonl(file)
    console.log(f"[cyan]Committing {len(rows):,} rows...[/cyan]")
    
    version_id = commit_version(
        rows=[r.__dict__ for r in rows],
        message=message,
        author=author
    )
    console.print(f"[green]✅ Committed version: {version_id}[/green]")

# ─────────────────────────────────────────────────────────────────────────────
# hypasia config
# ─────────────────────────────────────────────────────────────────────────────

config_app = typer.Typer(help="Manage Hypasia configuration and API keys.")
app.add_typer(config_app, name="config")


@config_app.command("show")
def config_show():
    """Show current configuration."""
    from hypasia.config import cfg
    table = Table(title="Hypasia AI Configuration", box=box.ROUNDED)
    table.add_column("Setting", style="cyan")
    table.add_column("Value", style="white")
    for k, v in cfg.summary().items():
        table.add_row(k, str(v))
    console.print(table)


@config_app.command("set-key")
def config_set_key(
    key: str = typer.Argument(..., help="Key name e.g. GEMINI_API_KEY"),
    value: str = typer.Argument(..., help="Key value"),
):
    """Write an API key to your .env file."""
    env_file = Path(".env")
    lines = env_file.read_text().splitlines() if env_file.exists() else []

    found = False
    new_lines = []
    for line in lines:
        if line.startswith(f"{key}="):
            new_lines.append(f"{key}={value}")
            found = True
        else:
            new_lines.append(line)

    if not found:
        new_lines.append(f"{key}={value}")

    env_file.write_text("\n".join(new_lines) + "\n")
    console.print(f"[green]✅ {key} saved to .env[/green]")


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _print_summary(rows, output: Path, threshold: float):
    gold = sum(1 for r in rows if r.tier == "gold")
    silver = sum(1 for r in rows if r.tier == "silver")
    rejected = sum(1 for r in rows if r.tier == "rejected")
    avg_score = sum(r.score for r in rows) / max(len(rows), 1)

    table = Table(title="📊 Pipeline Summary", box=box.ROUNDED, border_style="cyan")
    table.add_column("Metric", style="cyan")
    table.add_column("Value", style="bold white")

    table.add_row("Total rows kept", f"{len(rows):,}")
    table.add_row("🥇 Gold  (≥8.5)", f"[gold1]{gold:,}[/gold1]")
    table.add_row("🥈 Silver (≥7.0)", f"[silver]{silver:,}[/silver]")
    table.add_row("❌ Rejected", f"[red]{rejected:,}[/red]")
    table.add_row("Avg quality score", f"{avg_score:.2f} / 10")
    table.add_row("Output file", str(output))

    console.print(table)
    console.print(
        f"\n[bold green]✅ Done![/bold green] Your dataset is at [cyan]{output}[/cyan]\n"
        "[dim]Next steps:[/dim]\n"
        "  • [cyan]hypasia score[/cyan] to re-score with a different judge\n"
        "  • [cyan]hypasia select --strategy stratified[/cyan] to pick diverse rows\n"
        "  • [cyan]hypasia export --format parquet[/cyan] to convert format\n"
    )


if __name__ == "__main__":
    app()
