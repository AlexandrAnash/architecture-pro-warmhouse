import amqplib from 'amqplib';
import { registryDevices } from './registryDevices';

const DEVICE_MANAGER_QUEUE = 'devicemanager-queue';

async function connectWithRetry(retries = 10, delayMs = 3000) {
    for (let i = 0; i < retries; i++) {
        try { 
            const connected = await amqplib.connect('amqp://smarthome:smarthome@rabbitmq:5672');
            console.log('✅ device-manager соединился с RabbitMQ')
            
            return connected;
        }
        catch (e) { 
            console.log(`RabbitMQ не готов, попытка ${i+1}...`); 
            await new Promise(r => setTimeout(r, delayMs)); 
        }
    }
    throw new Error('RabbitMQ недоступен');
}
(async () => {
    const conn = await connectWithRetry();
    conn.on('error', (err) => { console.error('Connection error:', err); });

    const ch1 = await conn.createChannel();
    ch1.on('error', (err) => { console.error('Channel error:', err); });

    await ch1.assertExchange('smarthome', 'topic', { durable: true })
    const q = await ch1.assertQueue(DEVICE_MANAGER_QUEUE);
    ch1.bindQueue(q.queue, 'smarthome', 'sensor.created')
    
    ch1.consume(q.queue, (msg) => {
        if (msg !== null) {
            console.log('Received:', msg.content.toString());
            const device = JSON.parse(msg.content.toString());
            registryDevices.set(device.id, device);
            ch1.ack(msg);
        } else {
            console.log('Consumer cancelled by server');
        }
    });
})();