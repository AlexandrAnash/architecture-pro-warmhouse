interface Device { 
    id: number; 
    name: string; 
    type: string; 
    location: string;
}

export const registryDevices = new Map<number, Device>()
