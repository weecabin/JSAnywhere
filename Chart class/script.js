

class LineChart {
  constructor(containerId, commandsId, 
    {width=800, height=400, dispPrecisionX=2,dispPrecisionY=4}={}) {
    this.container = document.getElementById(containerId);
    this.cmdcontainer = document.getElementById(commandsId);
	this.dispPrecisionX = dispPrecisionX;
	this.dispPrecisionY = dispPrecisionY;
    this.yAxisDirty = true;
    this.dirtyCount = 0;
    this.width = width;
    this.height = height;
    // specify the margin of the plot area
    this.margin = { top: 40, right: 20, bottom: 20, left: 40 };
    // this is the object that holds all the plot data
    // series is {name:{color,data:[{x,y}]}}
    // this.plots.series[name].data returns an array of points
    // this.plots.series[name].color returs the color used for the series plot
    this.plots = {
      series: {},
      minX: Infinity,
      maxX: -Infinity,
      minY: Infinity,
      maxY: -Infinity,
    };

    // Zoom and pan state
    this.view = { minX: this.plots.minX, maxX: this.plots.maxX, minY: this.plots.minY, maxY: this.plots.maxY };
    this.panType = { cursor1: "cursor1", cursor2: "cursor2", series: "series" };
    this.pan = { active: false, type: this.panType.series, start: null };
    this.startPinchDistance = null;
    this.startView = null;

    // Auto-scale state
    this.autoScale = true;

    this.cursor1 = { name: "Cursor1", lock:"Data", active: false, worldX: null, screenX: null, seriesData: {} }; // Track cursor state
    this.cursor2 = { name: "Cursor2", lock:"Data", active: false, worldX: null, screenX: null, seriesData: {} }; // Track cursor state

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
    this.plots.series[name] = { color, data: [] ,
	  minX: Infinity,
      maxX: -Infinity,
      minY: Infinity,
      maxY: -Infinity,
      show:true};
    this.populateSeriesSelect("selectPlotId1");
    this.populateSeriesSelect("selectPlotId2");
	this.populateSeriesSelect("showSeriesId",true);
  }

  populateSeriesSelect(selectId,checkAll=false) {
    let select = document.getElementById(selectId);
    select.innerHTML = ""; // Clear existing options
    Object.keys(this.plots.series).forEach((seriesName) => {
	  if (this.plots.series[seriesName].show == false)return;
      let option = document.createElement("option");
      option.value = seriesName;
      option.textContent = seriesName;
	  if (checkAll)option.selected=true;
      select.appendChild(option);
    });
  }

  addPoint(seriesName, x, y) {
    if (this.pause) return;
    if (!this.plots.series[seriesName]) {
      return;
    }

    const series = this.plots.series[seriesName];
    series.data.push({ x, y });

    // Check if minY or maxY has changed
    const prevMinY = series.minY;
    const prevMaxY = series.maxY;

    // Update bounds
    series.minX = Math.min(series.minX, x);
    series.maxX = Math.max(series.maxX, x);
    series.minY = Math.min(series.minY, y);
    series.maxY = Math.max(series.maxY, y);
	
	this.plots.minX = Math.min(this.plots.minX, series.minX);
    this.plots.maxX = Math.max(this.plots.maxX, series.maxX);
    this.plots.minY = Math.min(this.plots.minY, series.minY);
    this.plots.maxY = Math.max(this.plots.maxY, series.maxY);
	
    // Set dirty flag if bounds have changed, to readjust the y axis margins
    if (series.minY !== prevMinY || series.maxY !== prevMaxY) {
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
	this.view.minX = Infinity;
    this.view.maxX = -Infinity;
    this.view.minY = Infinity;
    this.view.maxY = -Infinity;
	Object.keys(this.plots.series).forEach((seriesName) => {
		let series = this.plots.series[seriesName];
		if (series.show == false)return;
		this.view.minX = series.minX<this.view.minX?series.minX:this.view.minX;
        this.view.maxX = series.maxX>this.view.maxX?series.maxX:this.view.maxX;
        this.view.minY = series.minY<this.view.minY?series.minY:this.view.minY;
        this.view.maxY = series.maxY>this.view.maxY?series.maxY:this.view.maxY;
	});
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
  get xScale() {
    const { left, right } = this.margin;
    const rangeX = this.view.maxX - this.view.minX;
    return rangeX !== 0 ? (this.width - left - right) / rangeX : 1;
  }

  //canvas units per unit data
  get yScale() {
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
	  if (this.plots.series[name].show==false)return;
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

  drawCursor(ctx, cursor) {
    const cursor2alone = !this.cursor1.active && this.cursor2.active;
    const { left, top } = this.margin;
    // Calculate x value
	if (cursor.lock == "Data")
      cursor.screenX = this.worldToScreenX(cursor.worldX);
	else {
	  cursor.worldX = this.screenToWorldX(cursor.screenX);
	}
    const xValue = cursor.worldX;

    // Draw the vertical line
    ctx.strokeStyle = "black";
    ctx.setLineDash([5, 5]); // Set dash pattern (5px dash, 5px gap)
    ctx.beginPath();
    ctx.moveTo(cursor.screenX, top);
    ctx.lineTo(cursor.screenX, this.height - this.margin.bottom);
    ctx.stroke();
    ctx.setLineDash([]); // remove dash

    // label the cursors
    ctx.textAlign = "left";
    ctx.fillStyle = "black";
    ctx.fillText(cursor == this.cursor1 ? "1" : "2", cursor.screenX + 2, top + 2);

    // Prepare text segments
    const segments = [];

    // add the names
    if (cursor == this.cursor1 || cursor2alone) segments.push({ text: `${cursor.name} > `, color: "black" });
    else segments.push({ text: "c2 - c1  > ", color: "black" });

    // add the x values
    if (cursor == this.cursor1 || cursor2alone) segments.push({ text: `x: ${xValue.toFixed(2)}`, color: "black" });
    else {
      const dx = this.cursor2.worldX - this.cursor1.worldX;
      segments.push({ text: `x: ${dx.toFixed(2)}`, color: "black" });
    }

    // add the series data for the current position
    Object.keys(this.plots.series).forEach((name) => {
      const series = this.plots.series[name];
      if (series.data.length === 0 || !series.show) return;

      const closestPoint = series.data.reduce((prev, curr) => (Math.abs(curr.x - xValue) < Math.abs(prev.x - xValue) ? curr : prev));
      if (closestPoint) {
		cursor.seriesData[name] = { x: xValue, y: closestPoint.y };
        if (cursor == this.cursor1 || cursor2alone) segments.push({ text: `${name}: ${closestPoint.y.toFixed(2)}`, color: series.color });
        else {
          const deltaY = this.cursor2.seriesData[name].y - this.cursor1.seriesData[name].y;
          segments.push({ text: `${name}: ${deltaY.toFixed(2)}`, color: series.color });
        }
      }
    });

    // Render text segments with dividers
    let textY = top - 30; // Position for cursor1
    if (cursor == this.cursor2) textY += 20; // position for cursor2
    let textX = this.margin.left; // Start at a fixed position near the left edge
    const divider = " | ";
    const padding = 5; // Padding between elements

    ctx.font = "12px Arial";
    ctx.textAlign = "left"; // Make sure text is aligned from the left edge

    segments.forEach((segment, index) => {
      // Draw the divider first (except for the first element)
      if (index > 0) textX = this.addCursorText(ctx, textX, textY, "black", divider, padding);

      // Draw the text segment
      textX = this.addCursorText(ctx, textX, textY, segment.color, segment.text, padding);
    });
  }

  addCursorText(ctx, x, y, color, text, padding) {
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    x += ctx.measureText(text).width + padding; // Increment currentX after drawing text
    return x;
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
      } else if (this.cursor2.active && Math.abs(this.cursor2.screenX - xtouch + rect.left) < 25) {
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
        this.cursor1.worldX = this.screenToWorldX(this.cursor1.screenX);
      } else if (this.cursor2.active && this.pan.type == this.panType.cursor2) {
        this.cursor2.screenX += dx;
        this.cursor2.worldX = this.screenToWorldX(this.cursor2.screenX);
      } else {
        // panning series and cursor
        // convert from pixels to data units
        this.view.minX -= dx / this.xScale;
        this.view.maxX -= dx / this.xScale;
        this.view.minY += dy / this.yScale;
        this.view.maxY += dy / this.yScale;
		if (this.cursor1.lock == "Data")
          this.cursor1.screenX += dx;
		if (this.cursor2.lock == "Data")
          this.cursor2.screenX += dx;
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
    if (this.cursor1.active) {
      this.cursor1.worldX = this.screenToWorldX(this.cursor1.screenX);
    }
    if (this.cursor2.active) {
      this.cursor2.worldX = this.screenToWorldX(this.cursor2.screenX);
    }
  }

  getPinchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  addControls(containerId, commandsId) {
    this.addAutoScaleButton();

	this.addSeriesShowButton()
	
    this.addZoomFitButton();

    this.addZoomControls(commandsId);

    this.addClearButton();

    this.cmdcontainer.appendChild(document.createElement("br"));

    this.addCursorControl(this.cursor1);
	
	this.addCursorLockControl(this.cursor1,"lockCursor1");

    this.addMoveCursorControl(this.cursor1, "selectPlotId1", "selectMinMax1");

    this.cmdcontainer.appendChild(document.createElement("br"));

    this.addCursorControl(this.cursor2);
	
	this.addCursorLockControl(this.cursor2,"lockCursor2");

    this.addMoveCursorControl(this.cursor2, "selectPlotId2", "selectMinMax2");

    this.cmdcontainer.appendChild(document.createElement("br"));

    const btn = addButton(
      "Copy",
      () => {
        this.copy();
      },
      commandsId,
      { id: "copyId" }
    );
    btn.style.visibility = "hidden";
  }

  copy() {
    let text = "";
    let cursors = this.getActiveCursors();
    if (cursors.length == 0) {
      console.log("no active cursors");
      return;
    } else if (cursors.length == 2) {
      let x0 = cursors[0].worldX;
      let x1 = cursors[1].worldX;
      let fromX = x0 < x1 ? x0 : x1;
      let toX = x0 < x1 ? x1 : x0;
      text = FormatData3(this.plots.series,
	    {startX:fromX,endX:toX,yPrecision:this.dispPrecisionY,xPrecision:this.dispPrecisionX});
      copyToClipboard(text);
    } else {
      Object.keys(this.plots.series).forEach((name) => {
		if(!this.plots.series[name].show)return;
        text += name + "\n";
        let i = IndexOf(cursors[0].worldX, this.plots.series[name].data);
        text += JSON.stringify(this.plots.series[name].data[i],
		        (key,value)=>{
					if (key=="y"){
						value = Number(value.toFixed(this.dispPrecisionY));
					}
					else if (key=="x"){
						value = Number(value.toFixed(this.dispPrecisionX));
					}
					return value;
		        }) + "\n";
      });
      text += "\n";
      copyToClipboard(text);
    }
	dbg(text);
  }

  getActiveCursors() {
    let cursors = [];
    if (this.cursor1.active) cursors.push(this.cursor1);
    if (this.cursor2.active) cursors.push(this.cursor2);
    return cursors;
  }
  
  addAutoScaleButton() {
    const button = document.createElement("button");
    button.textContent = "AutoScale Off";
    button.addEventListener("click", () => {
      this.autoScale = !this.autoScale;
      button.textContent = this.autoScale ? "AutoScale Off" : "Auto-Scale On";
    });
    this.cmdcontainer.appendChild(button);
  }

  addZoomFitButton() {
    addButton(
      "Zoom Fit",
      () => {
        this.zoomFit();
      },
      this.cmdcontainer.id
    );
  }

  addClearButton() {
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
	  this.render();
    });
    this.cmdcontainer.appendChild(clearbutton);
  }

  addZoomControls(commandsId) {
    const options = [
      { value: "X", text: "X only", id: "zoomX" },
      { value: "Y", text: "Y Only", id: "zoomY" },
      { value: "XY", text: "X&Y", id: "zoomXY" },
    ];
    createRadioButtonGroup(options, " Zoom:", commandsId);
    this.zoomX = document.getElementById("zoomX");
    this.zoomY = document.getElementById("zoomY");
    this.zoomXY = document.getElementById("zoomXY");
    this.zoomX.checked = true;
  }

  addCursorControl(cursor) {
    // Add Cursor on/off button
    const name = cursor.name;
    const cursorButton = document.createElement("button");
    cursorButton.textContent = `${name} On`;
	
    cursorButton.addEventListener("click", () => {
      cursor.active = !cursor.active;
      cursorButton.textContent = cursor.active ? `${name} Off` : `${name} On`;
      if (cursor.active) {
        const canvasCenterX = (this.width - this.margin.left - this.margin.right) / 2 + this.margin.left;
        cursor.screenX = canvasCenterX;
        cursor.worldX = this.screenToWorldX(cursor.screenX);
        document.querySelector(cursor == this.cursor1 ? ".moveCursor1" : ".moveCursor2").style.visibility = "visible";
		document.querySelector(cursor == this.cursor1 ? ".lockCursor1" : ".lockCursor2").style.visibility = "visible";
      } else {
        document.querySelector(cursor == this.cursor1 ? ".moveCursor1" : ".moveCursor2").style.visibility = "hidden";
		document.querySelector(cursor == this.cursor1 ? ".lockCursor1" : ".lockCursor2").style.visibility = "hidden";
      }
      this.setControlVisibility();
      this.render(); // Re-render the chart
    });
    this.cmdcontainer.appendChild(cursorButton);
  }

  setControlVisibility() {
    const cursors = this.getActiveCursors();
    if (cursors.length == 0) get("copyId").style.visibility = "hidden";
    else get("copyId").style.visibility = "visible";
  }

  addCursorLockControl(cursor){
	const button = document.createElement("button");
    button.textContent = "Lock Screen";
	button.classList.add("lockCursor");
	button.classList.add(cursor==this.cursor1?"lockCursor1":"lockCursor2");
    button.addEventListener("click", () => {
      if (cursor.lock == "Data"){
		  cursor.lock = "Screen";
		  button.textContent = "Lock Data"
	  }else{
		  cursor.lock = "Data";
		  button.textContent = "Lock Screen"
	  }
    });
    this.cmdcontainer.appendChild(button);
  }
  
  addSeriesShowButton(){
	const span = document.createElement("span");
	span.classList.add("showSeries");
	const title = document.createElement("span");
	title.textContent = "Show";
	span.appendChild(title);
    createSelect({ options:[], name:"Show", id:"showSeriesId", parent:span, multiple:true,
	   onChange:(values)=>{
		   values.forEach((value)=>{
			   this.plots.series[value.value].show = value.checked;
		   })
		   this.populateSeriesSelect("selectPlotId1");
           this.populateSeriesSelect("selectPlotId2");
		   this.zoomFit();
	   }});
	this.cmdcontainer.appendChild(span);
  }
  
  addMoveCursorControl(cursor, selectPlotId, selectMinMaxId) {
    const span = document.createElement("span");
    span.classList.add("moveCursor");
    span.classList.add(cursor == this.cursor1 ? "moveCursor1" : "moveCursor2");
    //span.style.display = "none";
    createSelect({ options: [], id: selectPlotId, parent: span });

    createSelect({
      options: [
        { value: "Max", text: "Max" },
        { value: "Min", text: "Min" },
      ],
      id: selectMinMaxId,
      parent: span,
    });

    let button = document.createElement("button");
    span.appendChild(button);
    button.textContent = "Next";
    button.addEventListener("click", () => {
      if (cursor.active) {
        const peak = NextPeak(this.plots.series[get(selectPlotId).value].data, cursor.worldX, get(selectMinMaxId).value == "Max" ? true : false);
        if (peak) {
          cursor.screenX = this.worldToScreenX(peak.x);
          cursor.worldX = this.screenToWorldX(cursor.screenX);
          this.prepareRender();
        }
      }
    });
    button = document.createElement("button");
    span.appendChild(button);
    button.textContent = "Prev";
    button.addEventListener("click", () => {
      if (cursor.active) {
        const peak = PrevPeak(this.plots.series[get(selectPlotId).value].data, cursor.worldX, get(selectMinMaxId).value == "Max" ? true : false);
        if (peak) {
          cursor.screenX = this.worldToScreenX(peak.x);
          cursor.worldX = this.screenToWorldX(cursor.screenX);
          this.prepareRender();
        }
      }
    });
    this.cmdcontainer.appendChild(span);
  }
}
