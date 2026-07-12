import express from "express";

import {registryTelemetry} from './registryTelemetry'
import './ampqService'

const app = express();

const port = process.env.PORT || 8083;


app.get('/telemetry', (req, res) => {
    res.json([...registryTelemetry.values()]);
});

app.get('/health', (req, res) => {
    res.json('OK');
});

app.listen(port, () => {
    console.log(`Server Telemetry is running at http://localhost:${port}`);
});
