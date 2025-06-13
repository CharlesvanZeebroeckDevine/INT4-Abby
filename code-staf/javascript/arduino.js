window.onload = async () => {
    try {
        const port = await navigator.serial.requestPort();  // User prompt will appear here
        await port.open({ baudRate: 9600 });
        const reader = port.readable.getReader();
        const textDecoder = new TextDecoder();

        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                reader.releaseLock();
                break;
            }
            if (value) {
                const dataStr = textDecoder.decode(value);
                const lines = dataStr.split('\n');
                lines.forEach(line => {
                    const num = parseInt(line.trim(), 10);
                    if (!isNaN(num) && num >= -100 && num <= 100) {
                        console.log("Arduino number:", num);
                    }
                });
            }
        }
    } catch (error) {
        console.error("Failed to connect or read:", error);
    }
};