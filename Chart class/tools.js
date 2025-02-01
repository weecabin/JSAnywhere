function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => console.log("Copied to clipboard"))
        .catch(err => console.error("Failed to copy:", err));
}

function get(elementId){
	  return document.getElementById(elementId);
  }
  
function dbg(txt) {
    get("debug").innerHTML += txt + "\n";
  }
  
    /* createSelect 
  Example Usage with Named Parameters:
  this.createSelect({
    options: [
        { value: "1", text: "Option 1" },
        { value: "2", text: "Option 2", selected: true }
    ],
    parent: document.body,
    name: "selectionName"
  });
  if called from within an object, be sure to bind the onChange to the object
  for example...
  pass callBack like this... this.objCallback.bind(this)
  or use arrow function... () => this.objCallback()
  */
  function createSelect({ options, parent, id = "", name = "", classList = [], onChange = null }) {
    let select = document.createElement("select");
    if (id) select.id = id;
    if (name) select.name = name;
    classList.forEach(cls => select.classList.add(cls));

    options.forEach(({ value, text, selected = false }) => {
        let option = document.createElement("option");
        option.value = value;
        option.textContent = text;
        if (selected) option.selected = true;
        select.appendChild(option);
    });

    if (onChange) select.addEventListener("change", (event) => onChange(event.target.value));

    if (parent) parent.appendChild(select);

    return select;
}

/*
  Example
  const options = [
      { value: "X", text: "X only", id: "zoomX" },
      { value: "Y", text: "Y Only", id: "zoomY" },
      { value: "XY", text: "X&Y", id: "zoomXY" },
    ];
  */
 function createRadioButtonGroup(options, groupName, containerId) {
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
  
  // xValue = the xVal to find the index of
  // points = [{x:xval,y:yval},...]
  function IndexOf(xValue,points){
	  for (i=0;i<points.length;i++){
		  if (points[i].x>xValue)
		    return i-1;
	  }
	  return null;
  }
  
  // points = [{x:xval,y:yval},...]
  // startX = the xVal to start search from
  function NextPeak(points,startX,findPeak=true){
  let j;
  for(j = 0;j  < points.length;j++){
    if (points[j].x>startX){
      const type = {up:"up",down:"down"};
      let lastState = findPeak?type.down:type.up;
      for (let i = j+1; i < points.length - 1; i++) {
        if (points[i].y > points[i-1].y){ // increasing
		  if (lastState == type.down && !findPeak)
            return points[i-1];
          lastState = type.up;
        }else if(points[i].y == points[i-1].y){ // flat section
          // dont change lastState if flat
        }else if (points[i].y < points[i-1].y){ // decreasing
          if (lastState == type.up && findPeak)
            return points[i-1];
		  lastState = type.down;
        }
      } 
    }
  }
  console.log("no max or min found");
  return null;
  }
  
  // points = [{x:xval,y:yval},...]
  // startX = the xVal to start search from
  function PrevPeak(points,startX,findPeak=true){
  let j;
  for(j = 0;j  < points.length;j++){
    if (points[j].x>startX){
      const type = {up:"up",down:"down"};
      let lastState = findPeak?type.down:type.up;
      for (let i = j-2; i >= 0; i--) {
        if (points[i].y > points[i+1].y){ // increasing
		  if (lastState == type.down && !findPeak)
            return points[i+1];
          lastState = type.up;
        }else if(points[i].y == points[i+1].y){ // flat section
          // dont change lastState if flat
        }else if (points[i].y < points[i+1].y){ // decreasing
          if (lastState == type.up && findPeak){
            return points[i+1];
		  }
		  lastState = type.down;
        }
      } 
    }
  }
  console.log("no max or min found");
  return null;
  }
  
  function addButton(text,eventHandler,containerId){
	const button = document.createElement("button");
    button.textContent = text;
    button.addEventListener("click", eventHandler);
    get(containerId).appendChild(button);
  }
