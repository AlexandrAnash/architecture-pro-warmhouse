import express from "express";

import {registryDevices} from './registryDevices'
import './ampqService'

const app = express();

const port = process.env.PORT || 8082;


app.get('/devices', (req, res) => {
    res.json([...registryDevices.values()]);
});

app.get('/health', (req, res) => {
    res.json('OK');
});

app.listen(port, () => {
    console.log(`Server Device manager is running at http://localhost:${port}`);
});
