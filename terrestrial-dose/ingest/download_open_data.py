"""
Euro-Dose Open Data Downloader
==============================
Downloads publicly accessible datasets.
Run: python ingest/download_open_data.py
"""

from __future__ import annotations
import time
import logging
from pathlib import Path
from typing import Dict, Callable

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("eurodose.download")

BASE_DIR = Path(__file__).parent.parent.resolve()
CACHE_DIR = BASE_DIR / "data" / "cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)


def download_with_progress(url: str, dest: Path, chunk_size: int = 8192, timeout: int = 300) -> bool:
    try:
        import requests
        logger.info(f"Downloading {url} → {dest}")
        resp = requests.get(url, stream=True, timeout=timeout)
        resp.raise_for_status()
        total = int(resp.headers.get("content-length", 0))
        downloaded = 0
        dest.parent.mkdir(parents=True, exist_ok=True)
        with open(dest, "wb") as f:
            for chunk in resp.iter_content(chunk_size=chunk_size):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
        logger.info(f"  ✓ Saved {dest.name} ({downloaded // 1024} KB)")
        return True
    except Exception as e:
        logger.error(f"  ✗ Failed: {e}")
        if dest.exists(): dest.unlink()
        return False


def download_gem_faults(cache_dir: Path) -> bool:
    dest = cache_dir / "gem_active_faults.geojson"
    if dest.exists(): return True
    return download_with_progress(
        "https://raw.githubusercontent.com/GEMScienceTools/gem-global-active-faults/master/geological_faults.geojson",
        dest
    )


def download_soilgrids_test(cache_dir: Path) -> bool:
    try:
        import requests
        resp = requests.get("https://rest.isric.org/soilgrids/v2.0/properties/query?lon=5.39&lat=51.57&depth=0-5cm&value=mean", timeout=10)
        if resp.status_code == 200:
            (cache_dir / "soilgrids_v2").mkdir(exist_ok=True)
            (cache_dir / "soilgrids_v2" / ".api_ok").write_text("API accessible")
            logger.info("[soilgrids] REST API is accessible")
            return True
    except Exception as e:
        logger.warning(f"[soilgrids] API test failed: {e}")
    return False


DOWNLOADERS: Dict[str, Callable[[Path], bool]] = {
    "gem_active_faults": download_gem_faults,
    "soilgrids_v2": download_soilgrids_test,
}


def run_downloads(cache_dir: Path = CACHE_DIR) -> Dict[str, bool]:
    results = {}
    logger.info("=" * 60)
    logger.info("EURO-DOSE OPEN DATA DOWNLOAD")
    logger.info("=" * 60)
    for ds_id, downloader in DOWNLOADERS.items():
        logger.info(f"[{ds_id}] Starting...")
        results[ds_id] = downloader(cache_dir)
        time.sleep(0.5)
    success = sum(1 for v in results.values() if v)
    logger.info(f"\nSuccess: {success}/{len(results)}")
    return results


if __name__ == "__main__":
    run_downloads()
