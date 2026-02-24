"""GudForm API client."""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional
from urllib.request import Request, urlopen
from urllib.error import HTTPError

DEFAULT_BASE_URL = "https://gudform.com/api/v1"


class GudFormError(Exception):
    """Raised when an API request fails."""

    def __init__(self, message: str, status: int, code: str = "UNKNOWN"):
        super().__init__(message)
        self.status = status
        self.code = code


def _request(
    base_url: str,
    api_key: str,
    method: str,
    path: str,
    body: Optional[dict] = None,
) -> Any:
    url = f"{base_url}{path}"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    data = json.dumps(body).encode() if body else None
    req = Request(url, data=data, headers=headers, method=method)

    try:
        with urlopen(req) as resp:
            if resp.status == 204:
                return None
            return json.loads(resp.read().decode())
    except HTTPError as e:
        try:
            err = json.loads(e.read().decode())
        except Exception:
            err = {}
        raise GudFormError(
            err.get("error", f"Request failed with status {e.code}"),
            e.code,
            err.get("code", "UNKNOWN"),
        ) from e


class _FormsResource:
    def __init__(self, base_url: str, api_key: str):
        self._base = base_url
        self._key = api_key

    def list(
        self,
        *,
        collection_id: Optional[str] = None,
        page: Optional[int] = None,
        limit: Optional[int] = None,
    ) -> dict:
        params: List[str] = []
        if collection_id:
            params.append(f"collectionId={collection_id}")
        if page is not None:
            params.append(f"page={page}")
        if limit is not None:
            params.append(f"limit={limit}")
        qs = f"?{'&'.join(params)}" if params else ""
        return _request(self._base, self._key, "GET", f"/forms{qs}")

    def get(self, form_id: str) -> dict:
        return _request(self._base, self._key, "GET", f"/forms/{form_id}")

    def create(self, **kwargs: Any) -> dict:
        return _request(self._base, self._key, "POST", "/forms", kwargs or None)

    def update(self, form_id: str, **kwargs: Any) -> dict:
        return _request(self._base, self._key, "PATCH", f"/forms/{form_id}", kwargs)

    def delete(self, form_id: str) -> None:
        _request(self._base, self._key, "DELETE", f"/forms/{form_id}")

    def responses(
        self,
        form_id: str,
        *,
        page: Optional[int] = None,
        limit: Optional[int] = None,
    ) -> dict:
        params: List[str] = []
        if page is not None:
            params.append(f"page={page}")
        if limit is not None:
            params.append(f"limit={limit}")
        qs = f"?{'&'.join(params)}" if params else ""
        return _request(
            self._base, self._key, "GET", f"/forms/{form_id}/responses{qs}"
        )


class _CollectionsResource:
    def __init__(self, base_url: str, api_key: str):
        self._base = base_url
        self._key = api_key

    def list(self) -> dict:
        return _request(self._base, self._key, "GET", "/collections")

    def get(self, collection_id: str) -> dict:
        return _request(self._base, self._key, "GET", f"/collections/{collection_id}")

    def create(self, *, name: str) -> dict:
        return _request(self._base, self._key, "POST", "/collections", {"name": name})

    def update(self, collection_id: str, *, name: str) -> dict:
        return _request(
            self._base,
            self._key,
            "PATCH",
            f"/collections/{collection_id}",
            {"name": name},
        )

    def delete(self, collection_id: str) -> None:
        _request(self._base, self._key, "DELETE", f"/collections/{collection_id}")


class GudForm:
    """GudForm API client.

    Usage::

        from gudform import GudForm

        client = GudForm(api_key="ff_your_key")
        forms = client.forms.list()
        collections = client.collections.list()
    """

    def __init__(self, api_key: str, *, base_url: str = DEFAULT_BASE_URL):
        if not api_key:
            raise ValueError("api_key is required")
        base = base_url.rstrip("/")
        self.forms = _FormsResource(base, api_key)
        self.collections = _CollectionsResource(base, api_key)
