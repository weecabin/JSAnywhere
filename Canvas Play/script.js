$(function() {
  console.log('Play');
});

function setup()
{
let canvasdiv = document.getElementById("canvasdiv"); 
canvas = document.getElementById("canvas");
ctx = canvas.getContext("2d");

canvas.width=400;
canvas.heighht=400;

DrawPath([[0,0],[400,400]]);
DrawPath([[0,400],[400,0]]);
}

var canvas;
var ctx;
function drawItem()
{
  console.log("in drawItem");
  let sel=document.getElementById("objects");
  if (sel.value.length==0)
  {
    window.alert("Select something!")
    return;
  }
  console.log(sel.value);
  let x = Math.floor(Math.random() * 390);
  let y = Math.floor(Math.random() * 390);
  console.log(x+","+y);
  switch (sel.value)
  {
    case "Circle":
    ctx.beginPath();
    ctx.arc(x, y, 50, 0, 2 * Math.PI);
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