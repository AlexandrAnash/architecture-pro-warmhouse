const express = require('express');

const app = express();

const port = process.env.PORT || 8081;

const getTemperature = () => {
    return Math.round((Math.random() * 25 + 15));
}


const formattedResponse = (data) => {
    let location = data.location;
    let sensorID = data.sensorID;
    if (!location) {
		switch (sensorID) {
            case "1":
                location = "Living Room";
                break;
            case "2":
                location = "Bedroom";
                break;
            case "3":
                location = "Kitchen";
                break;
            default:
                location = "Unknown";
                break;
		}
	}

	// If no sensor ID is provided, generate one based on location
	if (!sensorID) {
		switch (data.location) {
            case "Living Room":
                sensorID = "1";
                break;
            case "Bedroom":
                sensorID = "2";
                break;
            case "Kitchen":
                sensorID = "3";
                break;
            default:
                sensorID = "0";
		}
	}
    return {
        "value": Number(data.currentTemperature),
        "unit": "°C",
        "timestamp": new Date().toISOString(),
        "location": location,
        "status": "active",
        "sensor_id": sensorID,
        "sensor_type": "temperature",
        "description": "Температура комнаты"
    }
}

app.get('/temperature', (req, res) => {
    const { location } = req.query;

    if (!location) {
        return res.status(400).json({ error: 'Параметр sensorID обязателен' });
    }

    const currentTemperature = getTemperature()

    res.json(formattedResponse({currentTemperature, location}));
});

app.get('/temperature/:sensorID', (req, res) => {
  // Извлекаем sensorID из параметров URL
    const { sensorID } = req.params;

    const currentTemperature = getTemperature()

    res.json(formattedResponse({currentTemperature, sensorID}));
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
