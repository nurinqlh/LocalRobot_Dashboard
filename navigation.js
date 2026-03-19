// ══════════════════════════════════════════════════════════════
//  navigation.js  —  Map renderer + Nav2 goal sending
//  Draws the occupancy grid on #mapCanvas via ROS /map topic
// ══════════════════════════════════════════════════════════════

'use strict';

const mapRenderer = {
  canvas:    null,
  ctx:       null,
  mapData:   null,
  robotPos:  null,
  robotYaw:  0,
  goalPos:   null,
  zoom:      1,
  panX:      0,
  panY:      0,
  goalMode:  false,
  _dragging: false,
  _dragStart:{ x:0, y:0 },

  init() {
    this.canvas = document.getElementById('mapCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this._bindEvents();
    this.redraw();
  },

  // ── ROS subscriptions (called after ros connects) ──
  subscribe(ros) {
    if (!ros) return;

    // Map
    const mapSub = new ROSLIB.Topic({
      ros, name: '/map', messageType: 'nav_msgs/OccupancyGrid',
      throttle_rate: 1000
    });
    mapSub.subscribe(msg => {
      this.mapData = msg;
      setEl('mapStatus', 'Received');
      setEl('slamTime', new Date().toLocaleTimeString());
      this.redraw();
    });

    // Robot pose from odom
    const odomSub = new ROSLIB.Topic({
      ros, name: '/odom', messageType: 'nav_msgs/Odometry'
    });
    odomSub.subscribe(msg => {
      this.robotPos = msg.pose.pose.position;
      const q = msg.pose.pose.orientation;
      this.robotYaw = Math.atan2(2*(q.w*q.z+q.x*q.y), 1-2*(q.y*q.y+q.z*q.z));
      this.redraw();
    });

    // SLAM status
    const slamSub = new ROSLIB.Topic({
      ros, name: '/slam_toolbox/feedback', messageType: 'slam_toolbox/ToolboxData'
    });
    slamSub.subscribe(msg => {
      setEl('slamStatus', 'Active');
    });
  },

  // ── Draw everything ──
  redraw() {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0f18';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(33,41,58,0.6)';
    ctx.lineWidth = 1;
    const gs = 40 * this.zoom;
    for (let x = (this.panX % gs); x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = (this.panY % gs); y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    if (this.mapData) {
      this._drawMap(ctx);
    } else {
      // Placeholder text
      ctx.fillStyle = 'rgba(74,85,104,0.4)';
      ctx.font = '12px "Share Tech Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Waiting for /map topic...', W/2, H/2 - 10);
      ctx.font = '10px "Share Tech Mono", monospace';
      ctx.fillText('Connect to ROS bridge to see map', W/2, H/2 + 10);
    }

    if (this.robotPos) this._drawRobot(ctx);
    if (this.goalPos)  this._drawGoal(ctx);
  },

  _drawMap(ctx) {
    const info = this.mapData.info;
    const data = this.mapData.data;
    const W = info.width, H = info.height;
    const res = info.resolution;
    const imgData = ctx.createImageData(W, H);

    for (let i = 0; i < data.length; i++) {
      const v = data[i];
      let r, g, b, a;
      if (v === -1)       { r=20;  g=27;  b=40;  a=200; }   // unknown → dark
      else if (v >= 65)   { r=30;  g=40;  b=55;  a=255; }   // occupied → darker
      else                { r=180; g=195; b=210; a=255; }   // free → light
      const base = i * 4;
      imgData.data[base]   = r;
      imgData.data[base+1] = g;
      imgData.data[base+2] = b;
      imgData.data[base+3] = a;
    }

    // Draw map to offscreen canvas then scale
    const off = document.createElement('canvas');
    off.width = W; off.height = H;
    off.getContext('2d').putImageData(imgData, 0, 0);

    const ox = info.origin.position.x;
    const oy = info.origin.position.y;
    const px = this.panX + ox / res * this.zoom;
    const py = this.panY + (this.canvas.height - H * this.zoom) - oy / res * this.zoom;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, this.panX, this.panY, W * this.zoom, H * this.zoom);
    ctx.restore();
  },

  _worldToCanvas(wx, wy) {
    if (!this.mapData) return { x: this.canvas.width/2, y: this.canvas.height/2 };
    const info = this.mapData.info;
    const mx = (wx - info.origin.position.x) / info.resolution;
    const my = (wy - info.origin.position.y) / info.resolution;
    return {
      x: this.panX + mx * this.zoom,
      y: this.panY + (this.mapData.info.height - my) * this.zoom
    };
  },

  _drawRobot(ctx) {
    const p = this._worldToCanvas(this.robotPos.x, this.robotPos.y);
    const r = 8 * this.zoom;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(-this.robotYaw);
    // Body
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI*2);
    ctx.fillStyle = '#00e5a0';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Direction arrow
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(r + 4, 0);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  },

  _drawGoal(ctx) {
    const p = this._worldToCanvas(this.goalPos.x, this.goalPos.y);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,77,106,0.25)';
    ctx.fill();
    ctx.strokeStyle = '#ff4d6a';
    ctx.lineWidth = 2;
    ctx.stroke();
    // X mark
    ctx.strokeStyle = '#ff4d6a';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-5,-5); ctx.lineTo(5,5);  ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5,-5);  ctx.lineTo(-5,5); ctx.stroke();
    ctx.restore();
  },

  toggleGoalMode() {
    this.goalMode = !this.goalMode;
    this.canvas.style.cursor = this.goalMode ? 'crosshair' : 'grab';
    const btn = document.getElementById('setGoalBtn');
    if (btn) btn.style.background = this.goalMode
      ? 'rgba(40,167,69,0.4)' : 'rgba(40,167,69,0.15)';
  },

  clearGoal() {
    this.goalPos = null;
    this.goalMode = false;
    this.canvas.style.cursor = 'grab';
    this.redraw();
  },

  _canvasToWorld(cx, cy) {
    if (!this.mapData) return { x: 0, y: 0 };
    const info = this.mapData.info;
    const mx = (cx - this.panX) / this.zoom;
    const my = (this.mapData.info.height) - (cy - this.panY) / this.zoom;
    return {
      x: mx * info.resolution + info.origin.position.x,
      y: my * info.resolution + info.origin.position.y,
    };
  },

  _sendGoal(wx, wy) {
    if (!window.ros || !window.isConnected) {
      console.warn('[Nav] Not connected to ROS');
      return;
    }
    const goalTopic = new ROSLIB.Topic({
      ros: window.ros,
      name: '/goal_pose',
      messageType: 'geometry_msgs/PoseStamped'
    });
    goalTopic.publish(new ROSLIB.Message({
      header: { frame_id: 'map' },
      pose: {
        position:    { x: wx, y: wy, z: 0 },
        orientation: { x: 0, y: 0, z: 0, w: 1 }
      }
    }));
    console.log('[Nav] Goal sent:', wx.toFixed(2), wy.toFixed(2));
  },

  _bindEvents() {
    const c = this.canvas;

    // Click → set goal
    c.addEventListener('click', e => {
      if (!this.goalMode) return;
      const rect = c.getBoundingClientRect();
      const w = this._canvasToWorld(e.clientX - rect.left, e.clientY - rect.top);
      this.goalPos = w;
      this._sendGoal(w.x, w.y);
      this.toggleGoalMode();
      this.redraw();
    });

    // Drag to pan
    c.addEventListener('mousedown', e => {
      if (this.goalMode) return;
      this._dragging = true;
      this._dragStart = { x: e.clientX - this.panX, y: e.clientY - this.panY };
    });
    window.addEventListener('mousemove', e => {
      if (!this._dragging) return;
      this.panX = e.clientX - this._dragStart.x;
      this.panY = e.clientY - this._dragStart.y;
      this.redraw();
    });
    window.addEventListener('mouseup', () => { this._dragging = false; });

    // Scroll to zoom
    c.addEventListener('wheel', e => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      this.zoom = Math.max(0.2, Math.min(8, this.zoom * factor));
      document.getElementById('zoomLevel').textContent = this.zoom.toFixed(2) + 'x';
      this.redraw();
    }, { passive: false });
  },
};

// ── Init after DOM ready ──
document.addEventListener('DOMContentLoaded', () => {
  mapRenderer.init();
});

// ── Called by app.js after ROS connects ──
function initNavigation(rosInstance) {
  window.ros = rosInstance;
  mapRenderer.subscribe(rosInstance);
}

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
