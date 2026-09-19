# gudform

Official Python SDK for the GudForm API.

## Installation

```bash
pip install gudform
```

## Usage

```python
from gudform import GudForm

client = GudForm(api_key="ff_your_api_key")

# List forms
forms = client.forms.list()

# List forms in a specific collection
filtered_forms = client.forms.list(collection_id="collection_id")

# List collections
collections = client.collections.list()

# Get responses
responses = client.forms.responses("form_id", page=1, limit=50)
```

## Documentation

- [API Documentation](https://gudform.com/docs/api)
- [GudForm Website](https://gudform.com)

## License

MIT
