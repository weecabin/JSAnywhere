class LineChart {
  constructor(containerId, commandsId, width, height) {
    this.container = document.getElementById(containerId);
    this.cmdcontainer = document.getElementById(commandsId);
    this.yAxisDirty = true;
    this.dirtyCount = 0;
    this.width = width;
    this.height = height;
    this.margin = { top: 20, right: 20, bottom: 20, left: 40 };
    this.series = {};
    this.minX = Infinity;
    this.maxX = -Infinity;
    this.minY = Infinity;
    this.maxY = -Infinity;

    // Zoom and pan state
    this.view = { minX: this.minX, maxX: this.maxX, minY: this.minY, maxY: this.maxY };
    this.isPanning = false;
    this.startPan = null;
    this.startPinchDistance = null;
    this.startView = null;

    // Auto-scale state
    this.autoScale = true;

    this.cursor = { active: false, x: null }; // Track cursor state

    // Pause datapoint updates
    this.pause = false;

    // Create the canvas
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    this.context = this.canvas.getContext("2d");
    this.container.appendChild(this.canvas);

    // Event listeners for touch
    this.canvas.addEventListener("touchstart", (e) => this.handleTouchStart(e));
    this.canvas.addEventListener("touchmove", (e) => this.handleTouchMove(e));
    this.canvas.addEventListener("touchend", () => this.handleTouchEnd());

    // Add auto-scale toggle button
    const button = document.createElement("button");
    button.textContent = "Toggle Auto-Scale";
    button.addEventListener("click", () => {
      this.autoScale = !this.autoScale;
      button.textContent = this.autoScale ? "Disable Auto-Scale" : "Enable Auto-Scale";
    });
    this.cmdcontainer.appendChild(button);

    // Add zoom all button
    const zoomFitButton = document.createElement("button");
    zoomFitButton.textContent = "Zoom Fit";
    zoomFitButton.addEventListener("click", () => {
      this.zoomFit();
    });
    this.cmdcontainer.appendChild(zoomFitButton);

    // Add clear button
    const clearbutton = document.createElement("button");
    clearbutton.textContent = "Clear";
    clearbutton.addEventListener("click", () => {
      this.pause = true;
      Object.values(this.series).forEach((series) => (series.data = []));
      this.minX = Infinity;
      this.maxX = -Infinity;
      this.minY = Infinity;
      this.maxY = -Infinity;
      this.pause = false;
    });
    this.cmdcontainer.appendChild(clearbutton);

    // Add Cursor on/off button
    const cursorButton = document.createElement("button");
    cursorButton.textContent = "Toggle Cursor";
    cursorButton.addEventListener("click", () => {
      this.cursor.active = !this.cursor.active;
      cursorButton.textContent = this.cursor.active ? "Disable Cursor" : "Enable Cursor";
      if (this.cursor.active) {
        const canvasCenterX = (this.width - this.margin.left - this.margin.right) / 2 + this.margin.left;
        this.cursor.x = canvasCenterX;
      }
      this.render(); // Re-render the chart
    });
    this.cmdcontainer.appendChild(cursorButton);

    const options = [
      { value: 'X', text: 'X only', id: 'zoomX' },
      { value: 'Y', text: 'Y Only', id: 'zoomY' },
      { value: 'XY', text: 'X&Y', id: 'zoomXY' }
    ];
    this.createRadioButtonGroup(options, " Zoom:", commandsId)
    this.zoomX = document.getElementById("zoomX");
    this.zoomY = document.getElementById("zoomY");
    this.zoomXY = document.getElementById("zoomXY");
    this.zoomX.checked=true;
  }

  addSeries(name, color) {
    if (this.series[name]) {
      console.error(`Series "${name}" already exists.`);
      return;
    }
    this.series[name] = { color, data: [] };
  }

  addPoint(seriesName, x, y) {
    if (this.pause) return;
    if (!this.series[seriesName]) {
      console.error(`Series "${seriesName}" does not exist.`);
      return;
    }

    const series = this.series[seriesName];
    series.data.push({ x, y });

    // Check if minY or maxY has changed
    const prevMinY = this.minY;
    const prevMaxY = this.maxY;

    // Update chart bounds
    this.minX = Math.min(this.minX, x);
    this.maxX = Math.max(this.maxX, x);
    this.minY = Math.min(this.minY, y);
    this.maxY = Math.max(this.maxY, y);

    // Set dirty flag if bounds have changed
    if (this.minY !== prevMinY || this.maxY !== prevMaxY) {
      this.yAxisDirty = true;
    }

    // Adjust view bounds if auto-scale is enabled
    if (this.autoScale) {
      this.view.minX = this.minX;
      this.view.maxX = this.maxX;
      this.view.minY = this.minY;
      this.view.maxY = this.maxY;
    }

    this.prepareRender();
  }

  zoomFit() {
    this.zoomX.checked=true;
    console.log("In zoomFit");
    this.view.minX = this.minX;
    this.view.maxX = this.maxX;
    this.view.minY = this.minY;
    this.view.maxY = this.maxY;
    this.prepareRender();
  }

  // Calculate dynamic margin based on Y-axis label widths
  calculateMargin() {
    const ctx = this.context;
    ctx.font = "12px Arial"; // Ensure consistent font for measurements
    const minYLabel = this.view.minY.toFixed(2);
    const maxYLabel = this.view.maxY.toFixed(2);
    const widestLabel = Math.max(ctx.measureText(minYLabel).width, ctx.measureText(maxYLabel).width);

    // Adjust left margin based on label width
    this.margin.left = widestLabel + 10; // Add padding
  }

  // Call this before rendering

  prepareRender() {
    if (this.yAxisDirty) {
      this.calculateMargin();
      this.yAxisDirty = false;
      //console.log("yAxisDirty: "+ (++this.dirtyCount).toString());
    }
    this.render();
  }

  render() {
    const ctx = this.context;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw axes
    this.drawAxes(ctx);

    // Save the context and clip the drawing area for the plot
    ctx.save();
    ctx.beginPath();
    ctx.rect(this.margin.left, this.margin.bottom,
             this.canvas.width-this.margin.left-this.margin.right, 
             this.canvas.height-this.margin.bottom-this.margin.top); 
    ctx.clip()
    // Draw each series
    Object.keys(this.series).forEach((name) => {
      this.drawSeries(ctx, this.series[name]);
    });
    ctx.restore();

    // Draw cursor
    if (this.cursor.active && this.cursor.x !== null) {
      this.drawCursor(ctx);
    }
  }

  drawCursor(ctx) {
    const { left, top } = this.margin;

    // Calculate x value
    const xValue = this.view.minX + ((this.cursor.x - left) / (this.width - left - this.margin.right)) * (this.view.maxX - this.view.minX);

    // Draw the vertical line
    ctx.strokeStyle = "red";
    ctx.beginPath();
    ctx.moveTo(this.cursor.x, top);
    ctx.lineTo(this.cursor.x, this.height - this.margin.bottom);
    ctx.stroke();

    // Prepare text segments
    const segments = [];
    segments.push({ text: `x: ${xValue.toFixed(2)}`, color: "black" });

    Object.keys(this.series).forEach((name) => {
      const series = this.series[name];
      if (series.data.length === 0) return;

      const closestPoint = series.data.reduce((prev, curr) => (Math.abs(curr.x - xValue) < Math.abs(prev.x - xValue) ? curr : prev));

      if (closestPoint) {
        segments.push({ text: `${name}: ${closestPoint.y.toFixed(2)}`, color: series.color });
      }
    });

    // Render text segments with dividers
    const textY = top - 10; // Position slightly above the top margin
    let currentX = this.margin.left; // Start at a fixed position near the left edge
    const divider = " | ";
    const padding = 5; // Padding between elements

    ctx.font = "12px Arial";
    ctx.textAlign = "left"; // Make sure text is aligned from the left edge
    segments.forEach((segment, index) => {
      // Draw the divider first (except for the first element)

      if (index > 0) {
        ctx.fillStyle = "black";
        console.log("divider x:", currentX);
        ctx.fillText(divider, currentX, textY);
        currentX += ctx.measureText(divider).width + padding; // Increment currentX after drawing divider
      }

      // Draw the text segment
      ctx.fillStyle = segment.color;
      console.log(segment.text, currentX);
      ctx.fillText(segment.text, currentX, textY);
      currentX += ctx.measureText(segment.text).width + padding; // Increment currentX after drawing text
    });
  }

  drawAxes(ctx) {
    let { top, right, bottom, left } = this.margin;

    // Draw X and Y axes
    ctx.strokeStyle = "black";
    ctx.beginPath();

    // X-axis: horizontal line at the bottom of the chart
    ctx.moveTo(left, this.height - bottom);
    ctx.lineTo(this.width - right, this.height - bottom);

    // Y-axis: vertical line at the left of the chart
    ctx.moveTo(left, this.height - bottom);
    ctx.lineTo(left, top);

    ctx.stroke();

    // ---- X-AXIS LABELS ----
    const xLabelCount = 5; // Number of labels on the X-axis
    const xRange = this.view.maxX - this.view.minX; // Total range of X values in the view
    const xStep = xRange / xLabelCount; // Step between labels

    ctx.textAlign = "center"; // Center the labels horizontally
    ctx.textBaseline = "top"; // Align the labels below the axis
    ctx.fillStyle = "black"; // Label color
    ctx.font = "12px Arial"; // Label font

    for (let i = 0; i <= xLabelCount; i++) {
      // Calculate the actual X value for this label
      const xValue = this.view.minX + i * xStep;

      // Map the X value to its screen position
      const xPos = left + ((xValue - this.view.minX) / xRange) * (this.width - left - right);

      // Round the X value to the nearest integer for simplicity
      const formattedXValue = xValue.toFixed(2);

      // Draw the X-axis label
      ctx.fillText(formattedXValue, xPos, this.height - bottom + 5);

      // Optional: Draw vertical gridlines for each X label
      ctx.beginPath();
      ctx.strokeStyle = "#e0e0e0"; // Light gray for gridlines
      ctx.moveTo(xPos, this.height - bottom);
      ctx.lineTo(xPos, top);
      ctx.stroke();
    }

    // ---- Y-AXIS LABELS ----
    const yLabelCount = 5; // Number of labels on the Y-axis
    const yRange = this.view.maxY - this.view.minY; // Total range of Y values in the view
    const yStep = yRange / yLabelCount; // Step between labels

    ctx.textAlign = "right"; // Align Y labels to the right of the axis
    ctx.textBaseline = "middle"; // Center the labels vertically
    ctx.fillStyle = "black"; // Label color
    ctx.font = "12px Arial"; // Label font
    for (let i = 0; i <= yLabelCount; i++) {
      // Calculate the Y value for this label
      const yValue = this.view.minY + i * yStep;

      // Map the Y value to its screen position
      let yPos = 0;
      if (yRange != 0) yPos = this.height - bottom - ((yValue - this.view.minY) / yRange) * (this.height - top - bottom);
      else yPos = this.height - bottom;

      // Round the Y value to 2 decimal places for precision
      const formattedYValue = yValue.toFixed(2);

      // Draw the Y-axis label
      //document.getElementById("debug").innerHTML+=formattedYValue + "\n";
      ctx.fillText(formattedYValue, left - 5, yPos);

      // Optional: Draw horizontal gridlines for each Y label
      ctx.beginPath();
      ctx.strokeStyle = "#e0e0e0"; // Light gray for gridlines
      ctx.moveTo(left, yPos);
      ctx.lineTo(this.width - right, yPos);
      ctx.stroke();
    }
  }

  drawSeries(ctx, series) {
    const { top, right, bottom, left } = this.margin;
    const xScale = (this.width - left - right) / (this.view.maxX - this.view.minX || 1);
    const yScale = (this.height - top - bottom) / (this.view.maxY - this.view.minY || 1);

    ctx.strokeStyle = series.color;
    ctx.beginPath();

    series.data.forEach((point, index) => {
      const x = left + (point.x - this.view.minX) * xScale;
      const y = this.height - bottom - (point.y - this.view.minY) * yScale;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  }

  // Touch Handlers
  handleTouchStart(event) {
    if (event.touches.length === 1) {
      // Start panning
      this.isPanning = true;
      this.startPan = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    } else if (event.touches.length === 2) {
      // Start pinch zoom
      this.isPanning = false;
      this.startPinchDistance = this.getPinchDistance(event.touches);
      this.startView = { ...this.view };
    }
  }

  handleTouchMove(event) {
    event.preventDefault();

    if (this.isPanning && event.touches.length === 1) {
      // Handle panning
      const dx = event.touches[0].clientX - this.startPan.x;
      const dy = event.touches[0].clientY - this.startPan.y;

      const { top, right, bottom, left } = this.margin;
      const xScale = (this.view.maxX - this.view.minX) / (this.width - left - right);
      const yScale = (this.view.maxY - this.view.minY) / (this.height - top - bottom);

      this.view.minX -= dx * xScale;
      this.view.maxX -= dx * xScale;
      this.view.minY += dy * yScale;
      this.view.maxY += dy * yScale;

      this.startPan = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      this.render();
    } else if (event.touches.length === 2) {
      // Handle pinch zoom
      const pinchDistance = this.getPinchDistance(event.touches);
      const zoomFactor = this.startPinchDistance / pinchDistance;

      const midX = (this.startView.minX + this.startView.maxX) / 2;
      const midY = (this.startView.minY + this.startView.maxY) / 2;

      const rangeX = (this.startView.maxX - this.startView.minX) * zoomFactor;
      const rangeY = (this.startView.maxY - this.startView.minY) * zoomFactor;
      
      if (this.zoomX.checked || this.zoomXY.checked){
      this.view.minX = midX - rangeX / 2;
      this.view.maxX = midX + rangeX / 2;
      }
      if (this.zoomY.checked || this.zoomXY.checked){
      this.view.minY = midY - rangeY / 2;
      this.view.maxY = midY + rangeY / 2;
      }

      this.prepareRender();
    }
  }

  handleTouchEnd() {
    this.isPanning = false;
    this.startPinchDistance = null;
    this.startView = null;
  }

  getPinchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  createRadioButtonGroup(options, groupName, containerId) {
    const container = document.getElementById(containerId);

    // Create a span to encapsulate the group
    const groupSpan = document.createElement('span');
    groupSpan.className = 'radio-group'; // Add a class for styling if needed

    // Add the group name
    const name = document.createElement('span');
    name.textContent = groupName;
    groupSpan.appendChild(name);

    for (const option of options) {
        // Create the radio button
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = groupName;
        radio.value = option.value;
        radio.id = option.id;

        // Create the label
        const label = document.createElement('label');
        label.htmlFor = option.id;
        label.textContent = option.text;

        // Append the radio button and label to the group span
        groupSpan.appendChild(radio);
        groupSpan.appendChild(label);
    }

    // Append the group span to the container
    container.appendChild(groupSpan);
  }

}
