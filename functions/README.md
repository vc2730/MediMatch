# Firebase Functions (K2 Think)

## Config (no secrets committed)
Set K2 credentials via Firebase Functions config or env vars.

### Using Firebase config
```bash
firebase functions:config:set k2.base_url="https://api.k2think.ai/v1/chat/completions" \
  k2.api_key="YOUR_K2_KEY" \
  k2.model="MBZUAI-IFM/K2-Think-v2"
```

### Using environment variables (emulator)
Create a local `.env` in `functions/` or export env vars:
```
K2_BASE_URL=...
K2_API_KEY=...
K2_MODEL=...
```

## Deploy
```bash
firebase deploy --only functions
```

## Emulator test
```bash
# Start emulators
firebase emulators:start --only functions,firestore

# Prepare a test match doc
node scripts/testK2ExplainMatch.js

# In functions shell
firebase functions:shell
k2ExplainMatch({ matchId: "test_match_1" }, { auth: { uid: "test_user" } })
```
