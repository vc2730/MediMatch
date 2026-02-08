# Flowglad Billing Test Guide

## ✅ Unlimited Test Payments Now Enabled!

Your MediMatch app now supports **unlimited Flowglad billing test payments** with unique transaction IDs.

---

## 🚀 How to Access

### Via Patient Portal:
1. Go to `/patient/portal` or `/patient/dashboard`
2. Scroll down to find the **green "Flowglad Integration"** card
3. Click **"Billing Dashboard"** button

### Direct URL:
- Patient: `http://localhost:5174/patient/billing-test`
- Doctor: `http://localhost:5174/doctor/billing-test`

---

## 💰 How It Works

### Unique Transaction IDs
Every payment now generates a **unique transaction ID** in this format:
```
match_[matchId]_[timestamp]_[random]
```

Example: `match_12345_1707389012345_a7b9c2`

This ensures:
- ✅ **No duplicate transaction errors**
- ✅ **Unlimited test payments**
- ✅ **Each payment is tracked separately**

### Test Mode Flag
All test payments are tagged with:
```json
{
  "properties": {
    "testMode": true,
    ...
  }
}
```

This helps you distinguish test payments from real patient matches.

---

## 🎯 Using the Test Dashboard

### Features:
1. **Stats Cards**
   - Total Usage Events
   - Test Mode Events
   - Recent Tests

2. **Quick Test Buttons**
   - **Immediate** (Red) - ESI Level 1
   - **Emergent** (Orange) - ESI Level 2
   - **Urgent** (Yellow) - ESI Level 3
   - **Standard** (Blue) - ESI Level 4

3. **Recent Test Payments**
   - Shows payments you've triggered during the session
   - Displays billing event ID, timestamp, priority

4. **All Usage Events**
   - Fetches from Flowglad API
   - Shows full payment history
   - Refreshable

---

## 🧪 Testing Workflow

### Method 1: Manual Test (Recommended)
1. Go to Billing Test Dashboard
2. Click one of the priority buttons (Immediate, Emergent, etc.)
3. Wait 1-2 seconds for API response
4. See success message with:
   - Billing Event ID
   - Transaction ID
   - Amount
5. Click "Refresh" to see it in usage events list

### Method 2: Through Patient Matching
1. Go to `/patient/multimodal-triage` or `/patient/matching`
2. Find an ER room
3. Accept the room
4. Flowglad workflow automatically triggers
5. Billing event recorded with unique ID

---

## 📊 Verifying on Flowglad

### View in Flowglad Dashboard:
1. Log in to [app.flowglad.com](https://app.flowglad.com)
2. Navigate to your subscription
3. Go to "Usage Events" tab
4. See all billing events in real-time

### What You'll See:
- Transaction ID (unique)
- Amount: 1 unit
- Usage Meter: `er-matches`
- Properties:
  - `matchId`
  - `patientPriority`
  - `erRoom`
  - `timestamp`
  - `testMode: true`

---

## 🔧 Technical Details

### Updated Code Files:
1. **`src/services/flowgladIntegration.js`**
   - `recordMatchBillingEvent()` - Now generates unique IDs
   - `triggerTestPayment()` - New function for manual testing
   - `getUsageEvents()` - Fetches payment history

2. **`src/pages/FlowgladTestDashboard.jsx`**
   - New dashboard component
   - Real-time test payment UI
   - Usage event viewer

3. **`src/App.jsx`**
   - Added `/patient/billing-test` route
   - Added `/doctor/billing-test` route

4. **`src/pages/PatientPortal.jsx`**
   - Added prominent green card linking to dashboard

### API Calls:
```javascript
// Record billing event
POST /api/flowglad/v1/usage-events
{
  "usageEvent": {
    "subscriptionId": "sub_xxx",
    "amount": 1,
    "transactionId": "match_12345_1707389012345_a7b9c2",
    "usageMeterSlug": "er-matches",
    "properties": {
      "testMode": true,
      "patientPriority": "standard",
      "erRoom": "TEST-ER-001"
    }
  }
}

// Get usage events
GET /api/flowglad/v1/usage-events?subscriptionId=sub_xxx
```

---

## 🎨 UI Features

### Dashboard Sections:
1. **Header**
   - Title with credit card icon
   - Refresh button (reloads usage events)

2. **Stats Grid**
   - Total events (green)
   - Test mode events (blue)
   - Recent tests (purple)

3. **Test Triggers**
   - 4 priority buttons with color coding
   - Loading spinner during API call
   - Success/error feedback

4. **Payment History**
   - Scrollable list
   - Color-coded by priority
   - Shows event IDs and timestamps

5. **Info Card**
   - Explains how it works
   - Lists key features

---

## 🐛 Troubleshooting

### "No subscription ID" Warning
**Issue**: Console shows "No subscription ID for billing event"
**Fix**: Add to `.env`:
```
VITE_FLOWGLAD_DEMO_SUBSCRIPTION_ID=your_subscription_id
```

### "API Error 401"
**Issue**: Unauthorized
**Fix**: Check your Flowglad API key in `.env`:
```
VITE_FLOWGLAD_API_KEY=your_api_key
```

### "Usage events not showing"
**Issue**: Events list is empty
**Possible causes**:
1. No events created yet - trigger a test payment first
2. API key missing/invalid
3. Subscription ID incorrect

**Fix**: Click a test button, wait, then click Refresh

### Payment succeeds but doesn't show in dashboard
**Issue**: Billing event created but not visible
**Fix**:
1. Click "Refresh" button
2. Check Flowglad dashboard directly
3. Verify subscription ID matches

---

## 💡 Best Practices

### For Testing:
1. ✅ Use the test buttons for quick testing
2. ✅ Click Refresh after each payment
3. ✅ Verify on Flowglad dashboard periodically
4. ✅ Use different priorities to test scenarios

### For Demos:
1. ✅ Show multiple payment types (immediate, emergent, etc.)
2. ✅ Refresh to show real-time sync
3. ✅ Explain unique transaction ID concept
4. ✅ Show how it integrates with patient matching

### For Development:
1. ✅ All payments are tagged `testMode: true`
2. ✅ Transaction IDs include timestamp for debugging
3. ✅ Properties include matchId for traceability
4. ✅ Console logs show billing event IDs

---

## 📈 Advanced Usage

### Programmatic Testing:
```javascript
import { triggerTestPayment } from '../services/flowgladIntegration'

// Trigger a test payment
const result = await triggerTestPayment({
  priority: 'emergent',
  erRoom: 'TEST-ER-042',
  customField: 'any value'
})

console.log(result)
// {
//   success: true,
//   billingEventId: "evt_xxx",
//   transactionId: "match_test_...",
//   amount: 1
// }
```

### Batch Testing:
```javascript
// Test 10 payments in sequence
for (let i = 0; i < 10; i++) {
  await triggerTestPayment({
    priority: i % 2 === 0 ? 'urgent' : 'standard'
  })
  await new Promise(r => setTimeout(r, 500)) // Wait 500ms between calls
}
```

### Get Usage Events:
```javascript
import { getUsageEvents } from '../services/flowgladIntegration'

const events = await getUsageEvents()
console.log(`Total events: ${events.length}`)
console.log(`Test events: ${events.filter(e => e.properties?.testMode).length}`)
```

---

## 🎯 Key Takeaways

✅ **Unlimited Testing**: No more duplicate transaction errors
✅ **Real Integration**: Actual Flowglad API calls
✅ **Easy Access**: Green button on patient portal
✅ **Visual Dashboard**: See all payments in one place
✅ **Real-time Sync**: Refresh to see latest events
✅ **Test Mode Flagged**: All test payments clearly marked

---

## 📞 Support

If you encounter issues:
1. Check `.env` for API keys
2. View browser console for errors
3. Check Flowglad dashboard directly
4. Verify subscription is active

---

**Happy Testing!** 💰✨

Generate unlimited Flowglad billing events with confidence.
