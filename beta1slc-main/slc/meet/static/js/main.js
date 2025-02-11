// Debug logging to help with troubleshooting
console.log('Initializing WebRTC Conference Application');

// Global variables for managing peer connections and streams
const mapPeers = {};
let localStream = null;
let username;
let webSocket;

// DOM element selections with null checks
const usernameInput = document.getElementById('username');
const btnJoin = document.getElementById('btn-join');
const localVideo = document.getElementById('local-video');
const btnToggleAudio = document.getElementById('btn-toggle-audio');
const btnToggleVideo = document.getElementById('btn-toggle-video');
const btnSendMsg = document.getElementById('btn-send-msg');
const messageList = document.getElementById('message-list');
const messageInput = document.getElementById('msg');

// WebRTC configuration with additional STUN servers for better connectivity
const peerConfiguration = {
    iceServers: [
        {
            urls: [
                'stun:stun.l.google.com:19302',
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
                'stun:stun3.l.google.com:19302'
            ]
        }
    ]
};

// Media constraints with fallback options
const constraints = {
    video: true,
    audio: true
};

// Initialize media stream with error handling
async function initializeMediaStream() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (localVideo) {
            localVideo.srcObject = localStream;
            localVideo.muted = true;
            await localVideo.play().catch(e => console.log('Playback prevented:', e));
        }

        // Set up audio and video track controls
        const audioTracks = localStream.getAudioTracks();
        const videoTracks = localStream.getVideoTracks();

        if (audioTracks.length > 0 && btnToggleAudio) {
            btnToggleAudio.addEventListener('click', () => {
                const enabled = !audioTracks[0].enabled;
                audioTracks[0].enabled = enabled;
                btnToggleAudio.innerHTML = enabled ? 'Audio Mute' : 'Audio Unmute';
                btnToggleAudio.classList.toggle('muted', !enabled);
            });
        }

        if (videoTracks.length > 0 && btnToggleVideo) {
            btnToggleVideo.addEventListener('click', () => {
                const enabled = !videoTracks[0].enabled;
                videoTracks[0].enabled = enabled;
                btnToggleVideo.innerHTML = enabled ? 'Video Off' : 'Video On';
                btnToggleVideo.classList.toggle('off', !enabled);
                if (localVideo) {
                    localVideo.classList.toggle('hidden', !enabled);
                }
            });
        }

        return true;
    } catch (error) {
        console.error('Error accessing media devices:', error);
        alert(`Media access error: ${error.message}. Please check your camera and microphone permissions.`);
        return false;
    }
}

// WebSocket connection setup with reconnection logic
function setupWebSocket(endPoint) {
    webSocket = new WebSocket(endPoint);

    webSocket.addEventListener('open', async (e) => {
        console.log('WebSocket Connection Established');
        const success = await initializeMediaStream();
        if (success) {
            sendSignal('new-peer', {});
        }
    });

    webSocket.addEventListener('message', webSocketOnMessage);

    webSocket.addEventListener('close', (e) => {
        console.log('WebSocket Connection Closed:', e.code, e.reason);
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
            if (username) {
                setupWebSocket(endPoint);
            }
        }, 5000);
    });

    webSocket.addEventListener('error', (e) => {
        console.error('WebSocket Error:', e);
    });
}

// Join button click handler with validation
if (btnJoin) {
    btnJoin.addEventListener('click', () => {
        if (!usernameInput) {
            alert('Username input not found!');
            return;
        }

        username = usernameInput.value.trim();
        if (!username) {
            alert('Please enter a username to join');
            return;
        }

        // Update UI after joining
        usernameInput.value = '';
        usernameInput.disabled = true;
        usernameInput.style.visibility = 'hidden';
        btnJoin.disabled = true;
        btnJoin.style.visibility = 'hidden';

        const labelUsername = document.getElementById('label-username');
        if (labelUsername) {
            labelUsername.textContent = username;
        }

        // Set up WebSocket connection
        const loc = window.location;
        const wsStart = loc.protocol === 'https:' ? 'wss://' : 'ws://';
        const endPoint = `${wsStart}${loc.host}${loc.pathname}`;
        
        setupWebSocket(endPoint);
    });
}

// Enhanced WebSocket message handler
function webSocketOnMessage(event) {
    try {
        const parsedData = JSON.parse(event.data);
        const peerUsername = parsedData['peer'];
        const action = parsedData['action'];

        if (username === peerUsername) {
            return;
        }

        const receiver_channel_name = parsedData['message']['receiver_channel_name'];

        switch(action) {
            case 'new-peer':
                createOfferer(peerUsername, receiver_channel_name);
                break;
            case 'new-offer':
                const offer = parsedData['message']['sdp'];
                createAnswerer(offer, peerUsername, receiver_channel_name);
                break;
            case 'new-answer':
                const answer = parsedData['message']['sdp'];
                const peer = mapPeers[peerUsername]?.[0];
                if (peer) {
                    peer.setRemoteDescription(answer)
                        .catch(e => console.error('Error setting remote description:', e));
                }
                break;
        }
    } catch (error) {
        console.error('Error processing WebSocket message:', error);
    }
}

// Improved chat functionality
if (btnSendMsg) {
    btnSendMsg.addEventListener('click', sendMsgOnClick);
    // Add Enter key support
    messageInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMsgOnClick();
        }
    });
}

function sendMsgOnClick() {
    if (!messageInput || !messageList) return;

    const message = messageInput.value.trim();
    if (!message) return;

    // Add message to local display
    appendMessage('Me', message);

    // Send message to all peers
    const dataChannels = getDataChannels();
    const formattedMessage = `${username}: ${message}`;

    dataChannels.forEach(channel => {
        if (channel.readyState === 'open') {
            channel.send(formattedMessage);
        }
    });

    messageInput.value = '';
}

// Helper function to append messages
function appendMessage(sender, message) {
    if (!messageList) return;

    const li = document.createElement('li');
    li.className = 'message-item';
    li.textContent = `${sender}: ${message}`;
    messageList.appendChild(li);
    messageList.scrollTop = messageList.scrollHeight;
}

// WebSocket signaling function with error handling
function sendSignal(action, message) {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not open. Ready state:', webSocket?.readyState);
        return;
    }

    try {
        const jsonStr = JSON.stringify({
            'peer': username,
            'action': action,
            'message': message
        });
        webSocket.send(jsonStr);
    } catch (error) {
        console.error('Error sending signal:', error);
    }
}

// Create WebRTC connection as offerer
async function createOfferer(peerUsername, receiver_channel_name) {
    try {
        const peer = new RTCPeerConnection(peerConfiguration);

        addLocalTracks(peer);

        // Create and set up data channel
        const dc = peer.createDataChannel('channel');
        dc.addEventListener('open', () => console.log('Data Channel Opened'));
        dc.addEventListener('message', (event) => dcOnMessage(event, peerUsername));

        const remoteVideo = createVideoElement(peerUsername);
        setOnTrack(peer, remoteVideo);
        mapPeers[peerUsername] = [peer, dc];

        setupICEHandling(peer, peerUsername, remoteVideo);

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        // Wait for ICE gathering to complete
        await new Promise(resolve => {
            if (peer.iceGatheringState === 'complete') {
                resolve();
            } else {
                peer.addEventListener('icegatheringstatechange', () => {
                    if (peer.iceGatheringState === 'complete') {
                        resolve();
                    }
                });
            }
        });

        sendSignal('new-offer', {
            'sdp': peer.localDescription,
            'receiver_channel_name': receiver_channel_name
        });

    } catch (error) {
        console.error('Error creating offer:', error);
    }
}

// Create WebRTC connection as answerer
async function createAnswerer(offer, peerUsername, receiver_channel_name) {
    try {
        const peer = new RTCPeerConnection(peerConfiguration);

        addLocalTracks(peer);

        const remoteVideo = createVideoElement(peerUsername);
        setOnTrack(peer, remoteVideo);

        peer.addEventListener('datachannel', e => {
            peer.dc = e.channel;
            peer.dc.addEventListener('open', () => console.log('Data Channel Opened'));
            peer.dc.addEventListener('message', (event) => dcOnMessage(event, peerUsername));
            mapPeers[peerUsername] = [peer, peer.dc];
        });

        setupICEHandling(peer, peerUsername, remoteVideo);

        await peer.setRemoteDescription(offer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        sendSignal('new-answer', {
            'sdp': peer.localDescription,
            'receiver_channel_name': receiver_channel_name
        });

    } catch (error) {
        console.error('Error creating answer:', error);
    }
}

// Setup ICE handling
function setupICEHandling(peer, peerUsername, remoteVideo) {
    peer.addEventListener('iceconnectionstatechange', () => {
        const iceConnectionState = peer.iceConnectionState;
        if (['failed', 'disconnected', 'closed'].includes(iceConnectionState)) {
            console.log(`Connection with ${peerUsername} ${iceConnectionState}`);
            delete mapPeers[peerUsername];
            if (iceConnectionState !== 'closed') {
                peer.close();
            }
            removeVideoElement(remoteVideo);
        }
    });

    peer.addEventListener('icecandidate', (event) => {
        if (event.candidate) {
            console.log("New ICE candidate:", JSON.stringify(event.candidate));
        }
    });
}

// Add local media tracks to peer connection
function addLocalTracks(peer) {
    if (!localStream) {
        console.error('No local stream available');
        return;
    }

    localStream.getTracks().forEach(track => {
        peer.addTrack(track, localStream);
    });
}

// Handle incoming data channel messages
function dcOnMessage(event, peerUsername) {
    if (!messageList) return;

    try {
        const message = event.data;
        appendMessage(peerUsername, message);
    } catch (error) {
        console.error('Error processing message:', error);
    }
}

// Create video element for remote peer
function createVideoElement(peerUsername) {
    const videoContainer = document.getElementById('video-container');
    if (!videoContainer) {
        console.error('Video container not found');
        return null;
    }

    const videoWrapper = document.createElement('div');
    videoWrapper.className = 'video-wrapper';

    const remoteVideo = document.createElement('video');
    remoteVideo.id = `${peerUsername}-video`;
    remoteVideo.autoplay = true;
    remoteVideo.playsInline = true;
    remoteVideo.className = 'remote-video';

    const label = document.createElement('div');
    label.className = 'video-label';
    label.textContent = peerUsername;

    videoWrapper.appendChild(remoteVideo);
    videoWrapper.appendChild(label);
    videoContainer.appendChild(videoWrapper);

    return remoteVideo;
}

// Set up media tracks for remote video
function setOnTrack(peer, remoteVideo) {
    if (!remoteVideo) return;

    const remoteStream = new MediaStream();
    remoteVideo.srcObject = remoteStream;

    peer.addEventListener('track', async (event) => {
        console.log('Adding track:', event.track.kind);
        remoteStream.addTrack(event.track);
        try {
            await remoteVideo.play();
        } catch (error) {
            console.error('Error playing remote video:', error);
        }
    });
}

// Remove video element when peer disconnects
function removeVideoElement(video) {
    if (!video) return;
    
    const videoWrapper = video.parentNode;
    if (videoWrapper) {
        videoWrapper.remove();
    }
}

// Get all active data channels
function getDataChannels() {
    return Object.values(mapPeers)
        .map(peer => peer[1])
        .filter(channel => channel && channel.readyState === 'open');
}