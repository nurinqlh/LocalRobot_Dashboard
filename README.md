# Local Robot Dashboard

A web-based control dashboard for the **Unitree B2** robot built by **Glocomp Robotics**.  
Features live WebRTC camera streams, ROS navigation map, motion controls, telemetry, and system status — all accessible from a browser on your local network.

---

## How to Install and Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/nurinqlh/LocalRobot_Dashboard.git
cd LocalRobot_Dashboard
```

### 2. Start the local server

```bash
cd /pathToYourFolder
python3 -m http.server 8181
```

### 3. Open the dashboard in your browser

```
http://localhost:8181/index.html
```

Username: GlocompViewer
Password: Gl0c0mp@V1ew!

Username: GlocompEditor
Password: Gl0c0mp@Ed1t!

Username: GlocompAdmin
Password: Gl0c0mp@Admin!


---

## How to Connect to the Robot

### Step 1 — Make sure the robot is reachable

Test the connection:
```bash
ping 192.168.123.164
```

### Step 2 — Verify services are running on the robot

SSH into the robot and confirm these are active:

| Service | Default Port | Purpose |
|---------|-------------|---------|
| MediaMTX | `8889` | WebRTC camera streams |
| rosbridge_server | `9090` | ROS topics over WebSocket |

```bash
# Check MediaMTX
curl http://192.168.123.164:8889/front_cam/whep

# Check rosbridge
curl http://192.168.123.164:9090
```

### Step 3 — Configure the dashboard

1. Open the dashboard in your browser
2. Click **⚙ Settings** in the top bar
3. Fill in the fields:

| Field | Value |
|-------|-------|
| Robot IP | `192.168.123.164` |
| MediaMTX Port | `8889` |
| ROSBridge Port | `9090` |
| Front Camera Stream | `front_cam` |
| Back Camera Stream | `back_cam` |

4. Click **Save & Reconnect**

### Step 4 — Tailscale (remote access)

If not on the same LAN, use Tailscale:

1. Install Tailscale on both your laptop and the robot
2. Get the robot's Tailscale IP (e.g. `100.118.2.96`)
3. Enter that IP in **Settings → Robot IP**

---

