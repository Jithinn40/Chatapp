(() => {
    const element = id => document.getElementById(id);

    // Get Elements
    const status = element('status');
    const messages = element('messages');
    const textarea = element('textarea');
    const username = element('username');
    const clearBtn = element('clear');

    // Set default status
    const statusDefault = status.textContent;

    const setStatus = (s) => {
        // Set status
        status.textContent = s;

        if (s !== statusDefault) {
            setTimeout(() => {
                setStatus(statusDefault);
            }, 4000);
        }
    };

    // Connect to socket.io
    const socket = io.connect('http://127.0.0.1:4000');

    // Check for connection
    if (socket !== undefined) {
        console.log('Connected to socket...');

        // Handle Output
        socket.on('output', (data) => {
            if (data.length) {
                data.forEach((item) => {
                    // Build out message div
                    const message = document.createElement('div');
                    message.className = 'chat-message';
                    message.textContent = `${item.name}: ${item.message}`;
                    messages.insertBefore(message, messages.firstChild);
                });
            }
        });

        // Get Status From Server
        socket.on('status', (data) => {
            // Get message status
            setStatus(typeof data === 'object' ? data.message : data);

            // If status is clear, clear text
            if (data.clear) {
                textarea.value = '';
            }
        });

        // Handle Input
        textarea.addEventListener('keydown', (event) => {
            if (event.which === 13 && !event.shiftKey) {
                // Emit to server input
                socket.emit('input', {
                    name: username.value,
                    message: textarea.value,
                });

                event.preventDefault();
            }
        });

        // Handle Chat Clear
        clearBtn.addEventListener('click', () => {
            socket.emit('clear');
        });

        // Clear Message
        socket.on('cleared', () => {
            messages.textContent = '';
        });
    }
})();
