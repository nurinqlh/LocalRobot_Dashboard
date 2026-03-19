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

## Robot Integration Guide

### Step 1 — Start the dashboard on your laptop

Open a terminal and run:

```bash
cd ~/Downloads/robot-dashboard
python3 -m http.server 8181
```

Then open browser and go to:

```
http://localhost:8181/index.html
```

Log in to enter the dashboard.

---

### Step 2 — SSH into the robot

Make sure laptop and the robot are on the same LAN or connected via Tailscale, then SSH in:

```bash
ssh user@192.168.123.164
```

---

### Step 3 — Check and start MediaMTX (WebRTC camera streams)

Check if MediaMTX is already running:

```bash
ps aux | grep mediamtx
```

If it is **not** running, start it:

```bash
cd /path/to/mediamtx
./mediamtx
```

Verify the camera streams are live by opening these URLs directly in browser:

```
http://192.168.123.164:8889/front_cam/
http://192.168.123.164:8889/back_cam/
```

If see video → MediaMTX is working correctly.

---

### Step 4 — Check and start rosbridge (ROS WebSocket)

Check if rosbridge is already running:

```bash
ros2 node list | grep rosbridge
```

If it is **not** running, start it:

```bash
ros2 launch rosbridge_server rosbridge_websocket_launch.xml
```

---

### Step 5 — Configure the dashboard

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

The dashboard will immediately attempt to connect to all robot services.

---


## How to Connect to the Robot (Settings Reference)

### Verify robot is reachable

```bash
ping 192.168.123.164
```

### Services required on the robot

| Service | Default Port | Purpose |
|---------|-------------|---------|
| MediaMTX | `8889` | WebRTC camera streams (WHEP) |
| rosbridge_server | `9090` | ROS topics over WebSocket |

### Tailscale (remote access outside LAN)

If you are not on the same LAN, use Tailscale:

1. Install Tailscale on both your laptop and the robot
2. Get the robot's Tailscale IP (`100.118.2.96`)
3. Enter that IP in **Settings → Robot IP**

---
