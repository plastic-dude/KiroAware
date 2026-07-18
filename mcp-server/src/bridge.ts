import express from 'express';
import cors from 'cors';
import { getSystemSnapshot } from './lib/system-info';
import { getAllReports, saveUserReport } from './lib/data-store';
import { randomUUID } from 'crypto';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/snapshot', async (req, res) => {
  try {
    const snapshot = await getSystemSnapshot();
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/reports', (req, res) => {
  try {
    const reports = getAllReports();
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/reports', async (req, res) => {
  try {
    const { stateType, description, severity, expectedDuration } = req.body;
    const snapshot = await getSystemSnapshot();
    
    const report = {
      reportId: randomUUID(),
      timestamp: new Date().toISOString(),
      stateType,
      userDescription: description, // Match server type
      severity,
      expectedDuration,
      autoDetectSnapshot: snapshot,
      verification: {
        status: 'pending',
        confidence: 0,
        evidence: [],
        verifiedAt: null,
      },
      temporal: {
        flag: 'temporary',
        recurrenceCount: 1,
        firstReported: new Date().toISOString(),
        lastReported: new Date().toISOString(),
        decaySchedule: new Date(Date.now() + 3600000).toISOString(),
      }
    };
    
    saveUserReport(report as any);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.listen(port, () => {
  console.log(`Bridge server running at http://localhost:${port}`);
});
