# Local Robot Dashboard

A web-based control dashboard for the **Unitree B2** robot built by **Glocomp Robotics**.  
Features live WebRTC camera streams, ROS navigation map, motion controls, telemetry, and system status — all accessible from a browser on your local network.

---

## Requirements

| Tool | Version |
|------|---------|
| Python | 3.x |
| Robot | Unitree B2 |
| Robot IP | Connected on same LAN or via Tailscale |
| MediaMTX | Running on robot (port `8889`) |
| rosbridge_server | Running on robot (port `9090`) |

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
Viewer
Username: GlocompViewer
Password: Gl0c0mp@V1ew!


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

The dashboard will immediately attempt to connect to the robot.

### Step 4 — Tailscale (remote access)

If you are not on the same LAN, use Tailscale:

1. Install Tailscale on both your laptop and the robot
2. Get the robot's Tailscale IP (e.g. `100.118.2.96`)
3. Enter that IP in **Settings → Robot IP**

---

## 🖥️ How to Use the Dashboard

### Top Bar

| Element | Description |
|---------|-------------|
| 🟢 Connection dot | Green = connected to robot, Red = disconnected |
| ⚙ Settings | Configure robot IP and stream names |
| ⊟ Map | Toggle the navigation map panel |
| ⊟ Motion | Toggle the motion control panel |
| ⊟ Telemetry | Toggle the telemetry panel |
| ⊟ Status | Toggle the system status panel |
| Logout | End your session |

---

### 📷 Camera Feeds

- **Front Camera** — live WebRTC stream from the robot's front camera
- **Back Camera** — live WebRTC stream from the robot's rear camera
- Streams connect automatically on page load using the **WHEP protocol** via MediaMTX
- If a stream fails, a **↺ Retry** button appears — click it to reconnect
- The status indicator in each panel header shows `LIVE` when streaming

---

### 🗺️ Navigation Map

- Displays a live **ROS occupancy grid map** (SLAM)
- **Pan** — click and drag on the map
- **Zoom** — scroll wheel

| Button | Action |
|--------|--------|
| 🎯 Set Goal | Click to place a navigation goal on the map |
| 🗑 Clear | Remove the current navigation goal |
| 📍 Center | Re-center the map on the robot's current position |
| 🔍 Reset | Reset zoom and pan to default |

The bottom of the map panel shows **Map Status**, **SLAM state**, and **last update time**.

---

### 🕹️ Motion Control

Three ways to control the robot:

**1. On-screen joysticks**
- Left joystick → forward / backward / strafe
- Right joystick → yaw (rotation) left and right

**2. Keyboard**

| Key | Action |
|-----|--------|
| W | Forward |
| S | Backward |
| A | Strafe left |
| D | Strafe right |
| Q | Yaw left |
| E | Yaw right |

**3. Gamepad (Xbox / PS controller)**
- Plug in via USB or Bluetooth
- Left stick → movement
- Right stick X-axis → yaw
- The gamepad indicator in the top bar turns green when detected

> **Viewer role** — motion controls are locked and display `VIEW ONLY`. Only admin and editor roles can control the robot.

---

### 📊 Telemetry

Displays real-time values:

| Field | Description |
|-------|-------------|
| Speed X | Forward/backward velocity in m/s |
| Speed Y | Lateral velocity in m/s |
| Yaw Rate | Rotation speed in rad/s |

When a navigation goal is active, an **Active Goal** card appears showing goal coordinates, distance, and direction.

---

### ⚙️ System Status

| Field | Description |
|-------|-------------|
| Mode | Current robot operating mode |
| Gait | Walking gait type |
| SLAM State | Current SLAM status |
| Body Height | Current body height |

Battery level is shown in the **right panel** with a visual bar indicator.

---

## 🛠️ Troubleshooting

**Camera shows "No Feed"**
- Check that MediaMTX is running on the robot
- Verify the stream name matches exactly in Settings
- Click ↺ Retry or open Settings and click Save & Reconnect

**Map is blank / "Waiting..."**
- Check that rosbridge_server is running on the robot
- Verify the ROSBridge port in Settings
- Make sure the SLAM node is publishing `/map` topic

**Dashboard redirects to login page**
- Your session expired — log in again at `http://localhost:8181/index.html`

**Cannot push to GitHub**
- Use a Personal Access Token, not your GitHub password
- Generate one at: `github.com → Settings → Developer settings → Personal access tokens`

---

## 👥 Team

**Glocomp Robotics**  
Robot: Unitree B2  
Dashboard maintained by: [@nurinqlh](https://github.com/nurinqlh)
