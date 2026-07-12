interface ITelemetry { 
    id: number;
    device_id: number;
    battery : number
    status : string
    created_at : number
}

export const registryTelemetry = new Map<number, ITelemetry>()
