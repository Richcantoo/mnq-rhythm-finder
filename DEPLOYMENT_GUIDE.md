# Deployment Guide - Enhanced MNQ Prediction System

## Prerequisites

Before deploying, ensure you have:
- ✅ Supabase project set up
- ✅ Lovable.dev account
- ✅ LOVABLE_API_KEY configured in Supabase
- ✅ All code committed to GitHub

---

## Step 1: Deploy Database Migrations

### Option A: Using Supabase Dashboard (Recommended for beginners)

1. Log into your Supabase project dashboard
2. Go to **SQL Editor**
3. Run migrations in order:

**Migration 1: Technical Indicators**
```sql
-- Copy contents from:
-- supabase/migrations/20250930180000_add_technical_indicators.sql
-- Run in SQL Editor
```

**Migration 2: Prediction Feedback**
```sql
-- Copy contents from:
-- supabase/migrations/20250930180100_create_prediction_feedback.sql
-- Run in SQL Editor
```

**Migration 3: Market Regimes**
```sql
-- Copy contents from:
-- supabase/migrations/20250930180200_create_market_regimes.sql
-- Run in SQL Editor
```

**Migration 4: Pattern Performance**
```sql
-- Copy contents from:
-- supabase/migrations/20250930180300_create_pattern_performance.sql
-- Run in SQL Editor
```

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push all migrations
supabase db push
```

### Verify Migrations

After running migrations, verify in Supabase dashboard:

1. Go to **Table Editor**
2. Check `chart_analyses` table has new columns:
   - `rsi_value`
   - `atr_value`
   - `macd_value`
   - `market_regime`
   - `timeframe_alignment`
   - etc.

3. Verify new tables exist:
   - `prediction_feedback`
   - `market_regimes`
   - `pattern_performance`

---

## Step 2: Deploy Edge Functions

### Deploy Enhanced Analysis Function

1. In Supabase dashboard, go to **Edge Functions**
2. Click **Create a new function**
3. Name: `analyze-chart-enhanced`
4. Copy contents from `supabase/functions/analyze-chart-enhanced/index.ts`
5. Click **Deploy function**

### Deploy Enhanced Prediction Function

1. Create another new function
2. Name: `predict-chart-enhanced`
3. Copy contents from `supabase/functions/predict-chart-enhanced/index.ts`
4. Click **Deploy function**

### Deploy Technical Indicators Library

The `_shared/technical-indicators.ts` file needs to be accessible by both functions:

1. In each function (analyze-chart-enhanced and predict-chart-enhanced)
2. Create a new file within the function: `technical-indicators.ts`
3. Copy contents from `supabase/functions/_shared/technical-indicators.ts`
4. Update imports in both functions to use relative path:
   ```typescript
   import { ... } from './technical-indicators.ts';
   ```

### Verify Edge Functions

Test each function:

```bash
# Test analyze-chart-enhanced
curl -X POST 'https://your-project.supabase.co/functions/v1/analyze-chart-enhanced' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"image": "base64-encoded-image", "filename": "test.png"}'

# Test predict-chart-enhanced  
curl -X POST 'https://your-project.supabase.co/functions/v1/predict-chart-enhanced' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"image": "base64-encoded-image", "filename": "test.png"}'
```

---

## Step 3: Deploy Frontend to Lovable

### Option A: Deploy via Lovable Dashboard

1. Log into Lovable.dev
2. Go to your project
3. Click **Share** → **Publish**
4. Wait for deployment to complete
5. Test at your deployed URL

### Option B: Deploy via GitHub (Automatic)

If your Lovable project is connected to GitHub:

1. Commit all changes:
   ```bash
   git add .
   git commit -m "Add enhanced prediction system"
   git push origin main
   ```

2. Lovable will automatically deploy changes
3. Monitor deployment in Lovable dashboard

---

## Step 4: Configure Environment Variables

Ensure these environment variables are set in Supabase:

1. Go to **Project Settings** → **API**
2. Find your keys:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. Go to **Edge Functions** → **Settings**
4. Add environment variable:
   - `LOVABLE_API_KEY` (your Lovable AI gateway key)

---

## Step 5: Seed Initial Data (Optional)

To test the system immediately, seed some initial data:

```sql
-- Insert sample chart analysis
INSERT INTO chart_analyses (
  filename,
  chart_date,
  day_of_week,
  pattern_type,
  confidence_score,
  sentiment_label,
  price_direction,
  rsi_value,
  atr_value,
  macd_value,
  market_regime,
  volatility_regime,
  volume_regime
) VALUES (
  'test_chart_1.png',
  '2025-09-30',
  'monday',
  'breakout',
  0.85,
  'bullish',
  'bullish',
  65.5,
  18.2,
  12.5,
  'strong_bull',
  'normal',
  'above_average'
);

-- Repeat for 10-20 sample charts with varied conditions
```

---

## Step 6: Test End-to-End Workflow

### Test 1: Upload and Analyze Chart

1. Go to your deployed application
2. Upload a MNQ chart screenshot
3. Click "Start AI Analysis"
4. Verify:
   - ✅ Analysis completes without errors
   - ✅ Technical indicators are calculated
   - ✅ Data is stored in `chart_analyses` table

### Test 2: Get Enhanced Prediction

1. Navigate to "AI Predictions" tab
2. Upload a current chart
3. Click "Generate Enhanced Prediction"
4. Verify:
   - ✅ All 4 ensemble methods provide predictions
   - ✅ Technical indicators display correctly
   - ✅ Confidence score is calculated
   - ✅ Trading recommendation is provided (BUY/SELL/WAIT)

### Test 3: Track Outcome

1. After making a prediction, wait for the timeframe
2. Go to "Track Outcome" tab
3. Enter actual results
4. Submit
5. Verify:
   - ✅ Outcome is saved to `prediction_feedback` table
   - ✅ No errors on submission

### Test 4: View Pattern Performance

1. After tracking 5-10 outcomes
2. View "Pattern Performance Metrics"
3. Verify:
   - ✅ Overall statistics display
   - ✅ Pattern breakdown shows win rates
   - ✅ Best days/sessions are identified

---

## Step 7: Monitor Performance

### Database Monitoring

Check Supabase dashboard regularly:

1. **Database** → **Table Editor** → `prediction_feedback`
   - Monitor number of tracked outcomes
   - Check win rates

2. **Database** → **Table Editor** → `chart_analyses`
   - Verify technical indicators are being calculated
   - Check for any null values

3. **Logs** → **Edge Function Logs**
   - Monitor for any errors
   - Check function execution times

### Application Monitoring

Track usage metrics:

1. Number of charts uploaded per day
2. Number of predictions made
3. Percentage of high-confidence predictions
4. Average confidence scores
5. Win rate trends over time

---

## Troubleshooting

### Issue: "analyze-chart-enhanced function not found"

**Solution:**
1. Verify function is deployed in Supabase Edge Functions
2. Check function name matches exactly
3. Ensure LOVABLE_API_KEY is set

### Issue: "Cannot find module 'technical-indicators.ts'"

**Solution:**
1. Copy `technical-indicators.ts` into each edge function directory
2. Update import to use relative path: `'./technical-indicators.ts'`
3. Redeploy functions

### Issue: "No similar patterns found"

**Solution:**
1. Upload more historical charts (minimum 50-100)
2. Ensure charts have diverse conditions
3. Check `chart_analyses` table has data

### Issue: "All predictions show WAIT"

**Solution:**
- This is expected initially! System filters low-quality setups
- Upload more historical data
- Track outcomes to improve confidence thresholds

### Issue: "Pattern performance shows no data"

**Solution:**
1. Track at least 10 prediction outcomes
2. Verify data is saving to `prediction_feedback` table
3. Check SQL query in component for errors

---

## Performance Optimization

### For Large Datasets (1000+ charts):

1. **Add Database Indexes** (if not auto-created):
```sql
CREATE INDEX IF NOT EXISTS idx_chart_analyses_composite 
ON chart_analyses(day_of_week, session_type, market_regime);

CREATE INDEX IF NOT EXISTS idx_prediction_feedback_recent
ON prediction_feedback(created_at DESC);
```

2. **Limit Historical Pattern Queries**:
   - Modify prediction function to only query last 90 days
   - Keep total patterns limited to 500 max

3. **Cache Pattern Performance**:
   - Calculate pattern performance weekly instead of real-time
   - Store results in `pattern_performance` table

---

## Scaling Considerations

### When to Upgrade:

**Usage Tier 1** (0-100 charts)
- Free tier Supabase
- Current configuration

**Usage Tier 2** (100-1,000 charts)
- Supabase Pro plan ($25/month)
- Add read replicas

**Usage Tier 3** (1,000+ charts)
- Consider dedicated database
- Implement caching layer (Redis)
- Add CDN for static assets

---

## Backup Strategy

### Database Backups:

Supabase automatically backs up your database, but for critical data:

1. **Export prediction feedback monthly**:
```sql
COPY (
  SELECT * FROM prediction_feedback
  WHERE created_at >= NOW() - INTERVAL '30 days'
) TO '/backup/predictions_2025_09.csv' CSV HEADER;
```

2. **Export pattern performance**:
```sql
COPY pattern_performance TO '/backup/patterns_2025_09.csv' CSV HEADER;
```

3. Store backups in cloud storage (S3, Google Cloud Storage, etc.)

---

## Success Checklist

Before considering deployment complete, verify:

- ✅ All 4 database migrations executed successfully
- ✅ Both enhanced edge functions deployed and tested
- ✅ Frontend deployed to Lovable
- ✅ Can upload and analyze charts
- ✅ Can generate enhanced predictions
- ✅ Can track outcomes
- ✅ Pattern performance metrics display
- ✅ Technical indicators display correctly
- ✅ No errors in Supabase logs
- ✅ No errors in browser console
- ✅ Mobile responsive design works
- ✅ All tabs/components load properly

---

## Next Steps After Deployment

### Week 1:
1. Upload 100+ historical charts
2. Make 5-10 test predictions
3. Track outcomes diligently
4. Verify all features work

### Week 2-4:
1. Upload 500+ historical charts
2. Make 20-50 predictions
3. Analyze pattern performance
4. Identify high-performing setups

### Month 2-3:
1. Focus only on high-confidence predictions
2. Track 100+ outcomes
3. Achieve 65%+ win rate
4. Refine trading strategy

---

## Support & Resources

### Documentation:
- [ENHANCED_FEATURES.md](./ENHANCED_FEATURES.md) - Complete feature documentation
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Technical details
- [README.md](./README.md) - Quick start guide

### External Resources:
- [Supabase Documentation](https://supabase.com/docs)
- [Lovable.dev Documentation](https://docs.lovable.dev)
- [Technical Indicators Explained](https://www.investopedia.com/technical-analysis-4689657)

### Community:
- Supabase Discord: https://discord.supabase.com
- Trading strategy optimization subreddit

---

## Rollback Plan

If issues arise, you can rollback:

### Rollback Edge Functions:
1. Go to Supabase → Edge Functions
2. Click on function
3. View **Deployment History**
4. Click **Rollback** to previous version

### Rollback Database:
1. Supabase → Database → Backups
2. Select backup before migrations
3. Click **Restore**

### Rollback Frontend:
1. Lovable dashboard → Deployments
2. Select previous deployment
3. Click **Redeploy**

---

*Deployment guide last updated: September 30, 2025*
*For issues, refer to troubleshooting section or check Supabase logs*
