class LineChart {
  constructor(containerId, commandsId, width, height) {
    this.container = document.getElementById(containerId);
    this.cmdcontainer = document.getElementById(commandsId);
    this.yAxisDirty = true;
    this.dirtyCount = 0;
    this.width = width;
    this.height = height;
	// specify the margin of the plot area
    this.margin = { top: 40, right: 20, bottom: 20, left: 40 };
	// this is the object that holds all the plot data
    this.plots = {
      series:{},
      minX:Infinity,
      maxX:-Infinity,
      minY:Infinity,
      maxY:-Infinity
    }

    // Zoom and pan state
    this.view = { minX: this.plots.minX, maxX: this.plots.maxX, minY: this.plots.minY, maxY: this.plots.maxY };
    this.panType = { cursor1: "cursor1", cursor2:"cursor2", series: "series" };
    this.pan = { active: false, type: this.panType.series, start: null };
    this.startPinchDistance = null;
    this.startView = null;

    // Auto-scale state
    this.autoScale = true;

    this.cursor1 = {name:"Cursor1", active: false, worldX: null , screenX:null, seriesData:{}}; // Track cursor state
    this.cursor2 = {name:"Cursor2", active: false, worldX: null , screenX:null, seriesData:{}}; // Track cursor state
	
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

    this.addControls(containerId, commandsId);
  }

  addSeries(name, color) {
    if (this.plots.series[name]) {
      return;
    }
    this.plots.series[name] = { color, data: [] };
  }

  addPoint(seriesName, x, y) {
    if (this.pause) return;
    if (!this.plots.series[seriesName]) {
      return;
    }

    const series = this.plots.series[seriesName];
    series.data.push({ x, y });

    // Check if minY or maxY has changed
    const prevMinY = this.plots.minY;
    const prevMaxY = this.plots.maxY;

    // Update chart bounds
    this.plots.minX = Math.min(this.plots.minX, x);
    this.plots.maxX = Math.max(this.plots.maxX, x);
    this.plots.minY = Math.min(this.plots.minY, y);
    this.plots.maxY = Math.max(this.plots.maxY, y);

    // Set dirty flag if bounds have changed
    if (this.plots.minY !== prevMinY || this.plots.maxY !== prevMaxY) {
      this.yAxisDirty = true;
    }

    // Adjust view bounds if auto-scale is enabled
    if (this.autoScale) {
      this.view.minX = this.plots.minX;
      this.view.maxX = this.plots.maxX;
      this.view.minY = this.plots.minY;
      this.view.maxY = this.plots.maxY;
    }

    this.prepareRender();
  }

  zoomFit() {
    this.zoomX.checked = true;
    this.view.minX = this.plots.minX;
    this.view.maxX = this.plots.maxX;
    this.view.minY = this.plots.minY;
    this.view.maxY = this.plots.maxY;
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

  worldToScreenX(worldX) {
    const { left, right } = this.margin;
    return left + (worldX - this.view.minX) * this.xScale;
  }

  screenToWorldX(screenX) {
    const { left, right } = this.margin;
    return this.view.minX + (screenX - left) / this.xScale;
  }

  worldToScreenY(worldY) {
    const { top, bottom } = this.margin;
    return this.height - bottom - (worldY - this.view.minY) * this.yScale;
  }

  screenToWorldY(screenY) {
    const { top, bottom } = this.margin;
    return this.view.minY + (this.height - bottom - screenY) / this.yScale;
  }

  //canvas units per unit data
  get xScale(){ 
    const { left, right } = this.margin;
    const rangeX = this.view.maxX - this.view.minX;
    return rangeX !== 0 ? (this.width - left - right) / rangeX : 1;
  }

  //canvas units per unit data
  get yScale(){
    const { top, bottom } = this.margin;
    const rangeY = this.view.maxY - this.view.minY;
    return rangeY !== 0 ? (this.height - top - bottom) / rangeY : 1;
  }
  // Call this before rendering
  prepareRender() {
    if (this.yAxisDirty) {
      this.calculateMargin();
      this.yAxisDirty = false;
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
    ctx.rect(this.margin.left, this.margin.top, this.canvas.width - this.margin.left - this.margin.right, this.canvas.height - this.margin.bottom - this.margin.top);
    ctx.clip();
    // Draw each series
    Object.keys(this.plots.series).forEach((name) => {
      this.drawSeries(ctx, this.plots.series[name]);
    });
    ctx.restore();

    // Draw cursor
    if (this.cursor1.active && this.cursor1.screenX !== null) {
      this.drawCursor(this.context, this.cursor1);
    }
	if (this.cursor2.active && this.cursor2.screenX !== null) {
      this.drawCursor(this.context, this.cursor2);
    }
		
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
      const xPos = this.worldToScreenX(xValue);

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
      if (yRange != 0) yPos = this.worldToScreenY(yValue);
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

    ctx.strokeStyle = series.color;
    ctx.beginPath();

    series.data.forEach((point, index) => {
      // convert from data units to pixels
      const x = this.worldToScreenX(point.x);
      const y = this.worldToScreenY(point.y);
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
      this.pan.active = true;
      const xtouch = event.touches[0].clientX;
      const rect = this.container.getBoundingClientRect();
      if (this.cursor1.active && Math.abs(this.cursor1.screenX - xtouch + rect.left) < 25) {
        this.pan.type = this.panType.cursor1;
	  }else if (this.cursor2.active && Math.abs(this.cursor2.screenX - xtouch + rect.left) < 25) {
        this.pan.type = this.panType.cursor2;
      } else {
        this.pan.type = this.panType.series;
      }
      this.pan.start = { x: xtouch, y: event.touches[0].clientY };
    } else if (event.touches.length === 2) {
      // Start pinch zoom
      this.pan.active = false;
      this.startPinchDistance = this.getPinchDistance(event.touches);
      this.startView = { ...this.view };
    }
  }

  dbg(txt) {
    document.getElementById("debug").innerHTML += txt + "\n";
  }

  handleTouchMove(event) {
    event.preventDefault();

    if (this.pan.active && event.touches.length === 1) {
      // Handle panning
      const xtouch = event.touches[0].clientX;
      const ytouch = event.touches[0].clientY;
      const dx = xtouch - this.pan.start.x;
      const dy = ytouch - this.pan.start.y;
      const { top, right, bottom, left } = this.margin;
      // handle cursor move
      if (this.cursor1.active && this.pan.type == this.panType.cursor1) {
        this.cursor1.screenX += dx;
	  }else if (this.cursor2.active && this.pan.type == this.panType.cursor2) {
        this.cursor2.screenX += dx;
      } else { // moving the series data
        // convert from pixels to data units
        // currently leaves the cursor alone
        this.view.minX -= dx / this.xScale;
        this.view.maxX -= dx / this.xScale;
        this.view.minY += dy / this.yScale;
        this.view.maxY += dy / this.yScale;
      }
      this.pan.start = { x: xtouch, y: ytouch };
      this.render();
    } else if (event.touches.length === 2) {
      // Handle pinch zoom
      const pinchDistance = this.getPinchDistance(event.touches);
      const zoomFactor = this.startPinchDistance / pinchDistance;

      const midX = (this.startView.minX + this.startView.maxX) / 2;
      const midY = (this.startView.minY + this.startView.maxY) / 2;

      const rangeX = (this.startView.maxX - this.startView.minX) * zoomFactor;
      const rangeY = (this.startView.maxY - this.startView.minY) * zoomFactor;

      if (this.zoomX.checked || this.zoomXY.checked) {
        this.view.minX = midX - rangeX / 2;
        this.view.maxX = midX + rangeX / 2;
      }
      if (this.zoomY.checked || this.zoomXY.checked) {
        this.view.minY = midY - rangeY / 2;
        this.view.maxY = midY + rangeY / 2;
      }

      this.prepareRender();
    }
  }

  handleTouchEnd() {
    this.pan.active = false;
    this.startPinchDistance = null;
    this.startView = null;
    if(this.cursor1.active){
      this.cursor1.worldX = this.screenToWorldX(this.cursor1.screenX);
	  console.log(this.cursor1);
    }
	if(this.cursor2.active){
      this.cursor2.worldX = this.screenToWorldX(this.cursor2.screenX);
	  console.log(this.cursor1);
	  console.log(this.cursor2);
    }
  }

  getPinchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  addControls(containerId, commandsId) {
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
      Object.values(this.plots.series).forEach((series) => (series.data = []));
      this.plots.minX = Infinity;
      this.plots.maxX = -Infinity;
      this.plots.minY = Infinity;
      this.plots.maxY = -Infinity;
      this.pause = false;
    });
    this.cmdcontainer.appendChild(clearbutton);

    // Add Cursor on/off button
	this.addCursorControl(this.cursor1);
	this.addCursorControl(this.cursor2);
    
    // Add zoom controls
    const options = [
      { value: "X", text: "X only", id: "zoomX" },
      { value: "Y", text: "Y Only", id: "zoomY" },
      { value: "XY", text: "X&Y", id: "zoomXY" },
    ];
    this.createRadioButtonGroup(options, " Zoom:", commandsId);
    this.zoomX = document.getElementById("zoomX");
    this.zoomY = document.getElementById("zoomY");
    this.zoomXY = document.getElementById("zoomXY");
    this.zoomX.checked = true;
  }
  
  addCursorControl(cursor){
	  // Add Cursor on/off button
	const name = cursor.name;
    const cursorButton = document.createElement("button");
    cursorButton.textContent = `Toggle ${name}`;
    cursorButton.addEventListener("click", () => {
      cursor.active = !cursor.active;
      cursorButton.textContent = cursor.active ? `Disable ${name}` : `Enable ${name}`;
      if (cursor.active) {
        const canvasCenterX = (this.width - this.margin.left - this.margin.right) / 2 + this.margin.left;
        cursor.screenX = canvasCenterX;
        cursor.worldX = this.screenToWorldX(this.cursor1.screenX);
      }
      this.render(); // Re-render the chart
    });
    this.cmdcontainer.appendChild(cursorButton);
  }
  
  createRadioButtonGroup(options, groupName, containerId) {
    const container = document.getElementById(containerId);

    // Create a span to encapsulate the group
    const groupSpan = document.createElement("span");
    groupSpan.className = "radio-group"; // Add a class for styling if needed

    // Add the group name
    const name = document.createElement("span");
    name.textContent = groupName;
    groupSpan.appendChild(name);

    for (const option of options) {
      // Create the radio button
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = groupName;
      radio.value = option.value;
      radio.id = option.id;

      // Create the label
      const label = document.createElement("label");
      label.htmlFor = option.id;
      label.textContent = option.text;

      // Append the radio button and label to the group span
      groupSpan.appendChild(radio);
      groupSpan.appendChild(label);
    }

    // Append the group span to the container
    container.appendChild(groupSpan);
  }

  drawCursor(ctx,cursor) {
	const cursor2alone = !this.cursor1.active && this.cursor2.active;
    const { left, top } = this.margin;
    // Calculate x value
    cursor.worldX = this.screenToWorldX(cursor.screenX);
    const xValue = cursor.worldX;

    // Draw the vertical line
    ctx.strokeStyle = "black";
	ctx.setLineDash([5, 5]); // Set dash pattern (5px dash, 5px gap)
    ctx.beginPath();
    ctx.moveTo(cursor.screenX, top);
    ctx.lineTo(cursor.screenX, this.height - this.margin.bottom);
    ctx.stroke();
    ctx.setLineDash([]); 
	
    // Prepare text segments
    const segments = [];
	
	// add the names
	if (cursor==this.cursor1 || cursor2alone)
	  segments.push({text: `${cursor.name} > `, color: "black" });
	else
	  segments.push({text:"c2 - c1  > ", color: "black" });
	  
	// add the x values
	if (cursor==this.cursor1 || cursor2alone)
      segments.push({ text: `x: ${xValue.toFixed(2)}`, color: "black" });
	else{
		const dx = this.cursor2.worldX - this.cursor1.worldX;
		segments.push({ text: `x: ${dx.toFixed(2)}`, color: "black" });
	}

	// add the series data for the current position
    Object.keys(this.plots.series).forEach((name) => {
      const series = this.plots.series[name];
      if (series.data.length === 0) return;

      const closestPoint = series.data.reduce((prev, curr) => (Math.abs(curr.x - xValue) < Math.abs(prev.x - xValue) ? curr : prev));
      cursor.seriesData[name] = {"x":xValue,"y":closestPoint.y};
      if (closestPoint) {
		if (cursor==this.cursor1 || cursor2alone)
          segments.push({ text: `${name}: ${closestPoint.y.toFixed(2)}`, color: series.color });
		else{ 
			const deltaY = this.cursor2.seriesData[name].y - this.cursor1.seriesData[name].y;
			segments.push({ text: `${name}: ${deltaY.toFixed(2)}`, color: series.color });
		}
      }
    });

    // Render text segments with dividers
	let textY = top - 30; // Position for cursor1
	if (cursor==this.cursor2)
	  textY += 20; // position for cursor2
    let textX = this.margin.left; // Start at a fixed position near the left edge
    const divider = " | ";
    const padding = 5; // Padding between elements

    ctx.font = "12px Arial";
    ctx.textAlign = "left"; // Make sure text is aligned from the left edge
	
    segments.forEach((segment, index) => {
      // Draw the divider first (except for the first element)
      if (index > 0)
		textX = this.addCursorText(ctx,textX,textY,"black",divider,padding);

      // Draw the text segment
	  textX = this.addCursorText(ctx,textX,textY,segment.color,segment.text,padding);
    });
  }
  
  addCursorText(ctx,x,y,color,text,padding){
	  ctx.fillStyle = color;
      ctx.fillText(text, x, y);
      x += ctx.measureText(text).width + padding; // Increment currentX after drawing text
	  return x;
  }
}
