$(function() {
  console.log('Play');
});

let circleDiameter=10;
function setup()
{
debugMode=true;
let canvasdiv = document.getElementById("canvasdiv"); 
canvas = document.getElementById("canvas");
ctx = canvas.getContext("2d");

canvas.width=400;
canvas.heighht=400;

DrawPath([[0,0],[400,400]]);
DrawPath([[0,400],[400,0]]);
}

let runAnimate=false;
let Objs=[];
function Animate(start)
{
  AddStatus("in Animate, start = "+start);
  runAnimate=start;
  if (!start)
  {
    Objs=[];
    runAnimate=false;
    return;
  }
  let x=canvas.width/2;
  let y=canvas.height/4;
  if(drawItem(x,y)==undefined)
  {
    AddStatus("Returning");
    return;
  }
  let angle=Math.PI/8;
  let movingVector = new MovingVector(2,.55,200,200);
  Objs.push(movingVector);
  if (Objs.length>1)return;
  AddStatus(JSON.stringify(Objs));
  var id = setInterval(frame, 5);
  function frame() 
  {
    //AddStatus("in frame, ");
    if (!runAnimate) 
    {
      clearInterval(id);
    } 
    else 
    {
      for (let mv of Objs)
      {
        let testx=mv.xpos + mv.vector.x;
        let testy=mv.ypos + mv.vector.y;
        if (testx<circleDiameter|| testx>(canvas.width-circleDiameter))
          mv.vector.x*=-1;
        if (testy<circleDiameter || testy>(canvas.height-circleDiameter))
          mv.vector.y*=-1;
        mv.xpos+=mv.vector.x;
        mv.ypos+=mv.vector.y;
      }
      Clear()
      for (let mv of Objs)
      {
        drawItem(mv.xpos,mv.ypos);
      }
    }
  }
}

var canvas;
var ctx;
function drawItem(x,y)
{
  let sel=document.getElementById("objects");
  if (sel.value.length==0)
  {
    window.alert("Select something!")
    return;
  }
  //console.log(sel.value);
  if (x==undefined)
  {
    x = Math.floor(Math.random() * 390);
    y = Math.floor(Math.random() * 390);
  }
  //console.log(x+","+y);
  switch (sel.value)
  {
    case "Circle":
    ctx.beginPath();
    ctx.arc(x, y, circleDiameter, 0, 2 * Math.PI);
    ctx.stroke();
    break;
    case "Square":
    DrawPath([[x,y],[x+50,y],[x+50,y+50],[x,y+50],[x,y]]);
    break;
    case "Rectangle":
    DrawPath([[x,y],[x+100,y],[x+100,y+50],[x,y+50],[x,y]]);
    break;
    case "Centered X":
    DrawPath([[0,0],[canvas.width,canvas.height]]);
    DrawPath([[0,canvas.height],[canvas.width,0]]);
    break;
  }
  return([x,y]);
}

function DrawPath(points)
{
  let firstpoint=true;
  ctx.beginPath();
  for(let point of points)
  {
    let x = point[0];
    let y = point[1];
    if (firstpoint)
    {
      ctx.moveTo(x,y);
      firstpoint=false;
    }
    else
    {
      ctx.lineTo(x,y);
    }
  }
  ctx.stroke();
  if(document.getElementById("showvertices").checked)
  for(let point of points)
  {
    let x = point[0];
    let y = point[1];
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.stroke();
  }
  
}

function Clear()
{
  ctx.clearRect(0,0,400,400);
}