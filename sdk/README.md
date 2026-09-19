# @gudlab/gudform

Official TypeScript/JavaScript SDK for the GudForm API.

## Installation

```bash
npm install @gudlab/gudform
```

## Usage

```typescript
import { GudForm } from "@gudlab/gudform";

const client = new GudForm({ apiKey: "ff_your_api_key" });

// List forms
const { forms } = await client.forms.list();

// List forms in a specific collection
const { forms: filtered } = await client.forms.list({
  collectionId: "collection_id",
});

// List collections
const { collections } = await client.collections.list();

// Get responses
const { responses } = await client.forms.responses("form_id", {
  page: 1,
  limit: 50,
});
```

## Documentation

- [API Documentation](https://gudform.com/docs/api)
- [GudForm Website](https://gudform.com)

## License

MIT
