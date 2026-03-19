// ══════════════════════════════════════════════════════════════
//  app.js  —  ROS bridge + motion commands + telemetry
//  Works standalone (no robot) — shows "--" for all values
// ══════════════════════════════════════════════════════════════

'use strict';

let ros = null;
let cmdVelTopic = null;
let isConnected = false;

// Current velocity state (merged from joystick + yaw)
let _linX = 0, _linY = 0, _angZ = 0;
let _cmdTimer = null;

// ── Read config from localStorage (same as dashboard.html) ──
function getConfig() {
  try {
    const cfg = JSON.parse(localStorage.getItem('robot_dashboard_cfg') || '{}');
    return {
      robotIP:       cfg.robotIP       || '100.118.2.96',
      rosBridgePort: cfg.rosBridgePort || '9090',
    };
  } catch { return { robotIP: '100.118.2.96', rosBridgePort: '9090' }; }
}

// ── Connect to rosbridge ──
function initROS() {
  const { robotIP, rosBridgePort } = getConfig();
  const url = `ws://${robotIP}:${rosBridgePort}`;
  console.log('[ROS] Connecting to', url);

  if (typeof ROSLIB === 'undefined') {
    console.warn('[ROS] ROSLIB not loaded');
    updateConnectionStatus(false);
    return;
  }

  ros = new ROSLIB.Ros({ url });

  ros.on('connection', () => {
    isConnected = true;
    updateConnectionStatus(true);
    console.log('[ROS] Connected');
    setupTopics();
    startCmdLoop();
  });

  ros.on('error', (e) => {
    console.warn('[ROS] Error:', e);
    updateConnectionStatus(false);
  });

  ros.on('close', () => {
    isConnected = false;
    updateConnectionStatus(false);
    console.log('[ROS] Disconnected — retrying in 3s');
    setTimeout(initROS, 3000);
  });
}

// ── ROS topics ──
function setupTopics() {
  // cmd_vel publisher
  cmdVelTopic = new ROSLIB.Topic({
    ros, name: '/cmd_vel', messageType: 'geometry_msgs/Twist'
  });

  // Odometry subscriber
  const odomSub = new ROSLIB.Topic({
    ros, name: '/odom', messageType: 'nav_msgs/Odometry'
  });
  odomSub.subscribe(msg => {
    const pos = msg.pose.pose.position;
    const q   = msg.pose.pose.orientation;
    const yaw = quaternionToYaw(q.x, q.y, q.z, q.w);
    const vx  = msg.twist.twist.linear.x;
    const vy  = msg.twist.twist.linear.y;
    const wz  = msg.twist.twist.angular.z;

    setEl('posX', pos.x.toFixed(3) + ' m');
    setEl('posY', pos.y.toFixed(3) + ' m');
    setEl('posZ', pos.z.toFixed(3) + ' m');
    setEl('yaw',  (yaw * 180 / Math.PI).toFixed(1) + '°');
    setEl('velX', vx.toFixed(3));
    setEl('velY', vy.toFixed(3));
    setEl('yawSpeed', wz.toFixed(3));
  });

  // Sport mode state (Unitree B2 specific)
  const sportSub = new ROSLIB.Topic({
    ros, name: '/sportmodestate', messageType: 'unitree_go/msg/SportModeState'
  });
  sportSub.subscribe(msg => {
    setEl('robotMode', msg.mode !== undefined ? modeLabel(msg.mode) : '--');
    setEl('gaitType',  msg.gait_type !== undefined ? gaitLabel(msg.gait_type) : '--');
    setEl('bodyHeight', msg.body_height !== undefined ? msg.body_height.toFixed(3) + ' m' : '--');
  });

  // Battery
  const batSub = new ROSLIB.Topic({
    ros, name: '/battery_state', messageType: 'sensor_msgs/BatteryState'
  });
  batSub.subscribe(msg => {
    const pct = Math.round((msg.percentage || 0) * 100);
    setEl('batterySOC', pct + '%');
    const fill = document.getElementById('batteryFill');
    if (fill) {
      fill.style.width = pct + '%';
      fill.style.background = pct < 20
        ? 'linear-gradient(90deg,#ff4d6a,#cc2244)'
        : pct < 40
          ? 'linear-gradient(90deg,#f59e0b,#cc7700)'
          : 'linear-gradient(90deg,#00e5a0,#00c87a)';
    }
  });
}

// ── Send cmd_vel at 20 Hz while connected ──
function startCmdLoop() {
  if (_cmdTimer) clearInterval(_cmdTimer);
  _cmdTimer = setInterval(() => {
    if (!isConnected || !cmdVelTopic) return;
    const twist = new ROSLIB.Message({
      linear:  { x: _linX, y: _linY, z: 0 },
      angular: { x: 0,     y: 0,     z: _angZ }
    });
    cmdVelTopic.publish(twist);
  }, 50); // 20 Hz
}

// ══════════════════════════════════════════════════════════════
//  PUBLIC — called by dashboard.html joystick / keyboard / gamepad
// ══════════════════════════════════════════════════════════════

// Linear motion  (nx = strafe, ny = forward, both -1..1)
function sendJoystickCommand(nx, ny) {
  _linX = ny * 0.5;   // forward/back  (scale to m/s)
  _linY = -nx * 0.3;  // strafe        (B2 supports it)
}

// Yaw rotation  (yaw = -1..1)
function sendYawCommand(yaw) {
  _angZ = -yaw * 1.0;  // scale to rad/s
}

// ══════════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════════
function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function quaternionToYaw(x, y, z, w) {
  return Math.atan2(2*(w*z + x*y), 1 - 2*(y*y + z*z));
}

function modeLabel(m) {
  const map = { 0:'IDLE', 1:'BALANCE', 2:'WALK', 3:'RUN', 4:'CLIMB' };
  return map[m] || ('MODE '+m);
}

function gaitLabel(g) {
  const map = { 0:'TROT', 1:'SLOW TROT', 2:'WALK', 3:'STAIRS', 4:'BOUND' };
  return map[g] || ('GAIT '+g);
}

// ── Start on load ──
document.addEventListener('DOMContentLoaded', initROS);
