$(function() {
  console.log('Play');
});

var canvas;
var ctx;
var circleRadius;
var dragmv;
var dragto=[];
var Objs=[];
var firstPass=true;
var runAnimate=false;
var sizeOptions;
var sizeIndex;
var frameInterval;
var zoom;
var minzoom;
var maxzoom;
var fingersDown;
var zoomSize;
function setup()
{
  zoom=.1;
  minzoom=.1;
  maxzoom=3;
  fingersDown=0;
  zoomSize=[];
  debugMode=true;
  sizeOptions=
  [
    {width:800,height:600},
    {width:600,height:600},
    {width:400,height:400},
    {width:400,height:600},
    {width:400,height:800}
  ];
  sizeIndex=0;
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");

  SetSize(600,600);

  firstPass=true;
  circleRadius=10;
  dragto=[];
  runAnimate=false;
  Objs=[];
  if (get("drawgrid").checked)DrawGrid();
  if (get("drawrunway").checked)DrawRunway();
  frameInterval=10;
  canvas.addEventListener('touchstart', TouchStart);
  canvas.addEventListener('touchmove', TouchMove);
  canvas.addEventListener('touchend', TouchEnd); 
}

function SetSize(width,height,scale=1,offsetx=0,offsety=0)
{
  let canvasdiv = get("canvasdiv"); 
  canvasdiv.width=width;
  canvasdiv.height=height;
  canvas.width=width;
  canvas.height=height;
  ctx.translate(0-offsetx,this.canvas.height-offsety)
  ctx.scale(scale,-scale);
  zoom=scale;
  AddStatus("zoom = "+zoom);
}

function Zoom()
{ 
  AddStatus("in Zoom");
  let z = zoom += .1;
  if (z>maxzoom)
    z=minzoom;
  try
  {
      SetSize(sizeOptions[sizeIndex].width,sizeOptions[sizeIndex].height,z)
      AddStatus("canvas w,h="+canvas.width+","+canvas.height);
  }
  catch(err)
  {
    AddStatus(err);
  }
}

function CanvasSize()
{
  try
  {
    if(++sizeIndex>=sizeOptions.length)sizeIndex=0;
    //AddStatus("CanvasSize "+JSON.stringify(sizeOptions[sizeIndex]));
    SetSize(sizeOptions[sizeIndex].width,sizeOptions[sizeIndex].height);
  }
  catch(err)
  {
    AddStatus(err);
  }
}

function Gravity()
{
  AddStatus("Entering Gravity");
  for (let mv of Objs)
  {
    mv.drawObject.gravity=get("gravityon").checked?
       Number(get("gravity").value*frameInterval/1000):0;
  }
  AddStatus("Exiting Gravity");
}

function Drag()
{
  AddStatus("Entering Drag");
  for (let mv of Objs)
  {
    mv.drawObject.drag=get("dragon").checked?
       get("drag").value*frameInterval/1000:0;
  }
  AddStatus("Exiting Drag");
}


function TouchStart(event)
{
  let e = event.touches;
  //AddStatus(e.length+" Fingers down");
  fingersDown=e.length;
  if (fingersDown>1)
  {
    zoomSize=[[],[],[],[]];
    zoomSize[0]=[e[0].clientX,e[0].clientY];
    zoomSize[1]=[e[1].clientX,e[1].clientY];
    AddStatus(JSON.stringify(zoomSize));
  }
  linePath=[];
}
function TouchMove(event)
{
  event.preventDefault();
  if (fingersDown>1)
  {
    let e = event.touches;
    zoomSize[2]=[e[0].clientX,e[0].clientY];
    zoomSize[3]=[e[1].clientX,e[1].clientY];
    //AddStatus(JSON.stringify(zoomSize));
    return;
  }
  if (Objs.length==0)return;
  var rect = canvas.getBoundingClientRect();
  //x position within the element.
  var x = (event.touches[0].clientX + rect.left - 30)/zoom;  
  //y position within the element.
  var y = (canvas.height - event.touches[0].clientY + rect.top)/zoom;  
  
  if (dragmv==undefined)
  {
    let tempmv=new MovingVector(1,1,x,y);
    let closestmv=Objs[0];
    let dist=DistBetween(tempmv,closestmv);
    for(let mv of Objs)
    {
      let testdist=DistBetween(mv,tempmv);
      if (testdist<dist)
      {
        dist=testdist;
        closestmv=mv;
      }
    }
    dragmv=closestmv;
  }
  dragto=[x,y]
}
function TouchEnd(event)
{
  if (fingersDown>1)
  {
    let beginLen=Math.hypot(
          zoomSize[0][0]-zoomSize[1][0],zoomSize[0][1]-zoomSize[1][01]);
    let endLen=Math.hypot(
          zoomSize[2][0]-zoomSize[3][0],zoomSize[2][1]-zoomSize[3][01]);
    //Zoom(beginLen/endLen);
    Zoom(endLen/beginLen); 
    return;
  }
  if (Objs.length==0)return;
  let dragVector=new Vector(dragto[0]-dragmv.xpos,dragto[1]-dragmv.ypos);
  // allow the user to cancel the vector by moving back to the origin
  if (dragVector.GetLength()<50)
  {
    dragmv=undefined;
    return;
  }

  if (get("snapheading").checked)
  {
    // force headings on 10deg increments
    let heading = dragVector.GetDirection();
    if ((heading>355) || (heading<5))
      heading=0;
    else
    {
      let mult = Math.round(heading/10);
      heading = mult*10;
    }
    dragVector.SetDirection(heading);
  }

  if (get("slewheading").checked)
    dragmv.SlewTo(dragVector);
  else
    dragmv.vector.SetDirection(dragVector.GetDirection());
  //AddStatus("heading = "+dragVector.GetDirection());
  
  dragmv=undefined;
}


function Animate(start)
{
try
  {
  let drag = get("dragon").checked?get("drag").value*frameInterval/1000:0;
  let gravity = get("gravityon").checked?
                get("gravity").value*frameInterval/1000:0;
  //AddStatus("in Animate, start = "+start);
  let speed=Number(get("speed").value/10);
  runAnimate=start;
  //AddStatus("test start");
  if (!start)
  {
    Objs=[];
    runAnimate=false;
    return;
  }
  //AddStatus("Set Canvas");
  let x=canvas.width/2;
  let y=canvas.height/4;
  //AddStatus("about to test drawItem");
  if(drawItem(x,y)==undefined)
  {
    AddStatus("Returning");
    return;
  }
  if (get("oneball").checked)
  {
    Objs=[];
    let drobj=
      {type:"circle",radius:circleRadius,color:"black",
       drag:drag,gravity:gravity};
    Objs.push(new MovingVector(0,-speed/4,canvas.width/2
                               ,canvas.height*.8,drobj));
    let qx = canvas.width/2+Number(get("offset").value);
    let q = new MovingVector(0,speed,qx,canvas.height*.5,drobj);
    q.drawObject.color="red";
    Objs.push(q);
  }
  else if (get("pool").checked) 
  {
    let cr=circleRadius;
    let cd=cr*2;
    let dy=cd*Math.cos(30*Math.PI/180);
    let circ={type:"circle",radius:circleRadius,color:"black",
              drag:drag,gravity:gravity};
    Objs=[];
    let x0 = canvas.width/2;
    let qx = x0+Number(get("offset").value);
    let qy = canvas.height*.2;
    let q = new MovingVector(0,speed,qx,qy,
            {type:"circle",radius:circleRadius,color:"red",
             drag:drag,gravity:gravity});
    Objs.push(q);
    let racky = canvas.height*.75;
    Objs.push(new MovingVector(0,0,x0,racky,circ));

    Objs.push(new MovingVector(0,0,x0+cr,racky+dy,circ));
    Objs.push(new MovingVector(0,0,x0-cr,racky+dy,circ));

    Objs.push(new MovingVector(0,0,x0-cd,racky+2*dy,circ));
    Objs.push(new MovingVector(0,0,x0,racky+2*dy,circ));
    Objs.push(new MovingVector(0,0,x0+cd,racky+2*dy,circ));

    Objs.push(new MovingVector(0,0,x0+cr,racky+3*dy,circ));
    Objs.push(new MovingVector(0,0,x0-cr,racky+3*dy,circ));

    Objs.push(new MovingVector(0,0,x0,racky+4*dy,circ));
    
  }
  else
  {
    let sel=get("objects");
    if (sel.value.length==0)
    {
      window.alert("Select something!")
      return;
    }
    let blackball={type:"circle",radius:circleRadius,color:"black",
                   drag:drag,gravity:gravity};
    let blacksquare={type:"square",sidelen:circleRadius*2,color:"black",
                     drag:drag,gravity:gravity};
    let plane={type:"plane",length:12,width:6,color:"black",
               drag:drag,gravity:gravity};
    let drawobj=blackball;
    if (sel.value=="Square")
      drawobj=blacksquare;
    else if (sel.value=="Plane")
      drawobj=plane;
    let movingVector = 
      new MovingVector(speed,speed,0,0,drawobj);
    if (Objs.length==0)movingVector.drawObject.color="red";
    Objs.push(movingVector);
    //AddStatus(Objs[Objs.length-1].drawObject.color);
    get("info").innerHTML="Objects: "+Objs.length;
    if (Objs.length>1)return;
  }
  //AddStatus(JSON.stringify(Objs));
  var id = setInterval(frame, frameInterval);
  var loopcount=0;
  let energy = 0;
  function frame() 
  {
    get("info").innerHTML=++loopcount;
    if (get("pause").checked)return;
    try
    {
    //AddStatus("in frame, ");
    if (!runAnimate) 
    {
      clearInterval(id);
    } 
    else 
    {
      if (firstPass)
      {
        //AddStatus("canvas.width="+canvas.width);
        //AddStatus("canvas.height="+canvas.height);
        //AddStatus("circleRadius="+circleRadius);
        firstPass=false;
      }
      //AddStatus("Bump all positions, check if at canvas edge");
      for (let mv of Objs)
      {
        let testx=(mv.xpos + mv.vector.x)*zoom;
        let testy=(mv.ypos + mv.vector.y)*zoom

        if ((testx<circleRadius*zoom) && (mv.vector.x<0)) 
          mv.vector.x*=-1;
        else if ((testx>(canvas.width-circleRadius*zoom))&&(mv.vector.x>0))
          mv.vector.x*=-1;
        if ((testy<circleRadius*zoom) && (mv.vector.y<0))
          {
            mv.ypos=circleRadius;
            mv.vector.y*=-1;
          }
        else if ((testy>(canvas.height-circleRadius*zoom)) && (mv.vector.y>0))
          mv.vector.y*=-1;
        
        //AddStatus("Advance positions");
        mv.Move();
        //mv.xpos+=mv.vector.x;
        //mv.ypos+=mv.vector.y;
      } 
      //AddStatus("Look for collisions with other objects");
      for (let i=0;get("collisionon").checked &&  i<Objs.length-1;i++)
      {
        for (let j=i+1;j<Objs.length;j++)
        {
          if (DistBetween(Objs[i],Objs[j])<(2*circleRadius))
          {
            let v1=Objs[i].vector;
            let v2=Objs[j].vector;
            if(false)
            {
              let normal = 
              new Vector(Objs[j].xpos-Objs[i].xpos,Objs[j].ypos-Objs[i].ypos);
              let normdir = normal.GetDirection();
              let tangent = normal.UnitNormal();
              //AddStatus("normal = "+JSON.stringify(normal));
              Objs[i].vector.SetDirection(normdir+180);
              Objs[j].vector.SetDirection(normdir);
              Objs[i].Move();
              Objs[j].Move();
            }
            else
            {
              let movingAway=Objs[i].MovingAway(Objs[j]);
              if (!movingAway)
              {
                //Objs[i].MovingAway(Objs[j],true);
                //AddStatus(JSON.stringify(Objs[i]));
                //AddStatus(JSON.stringify(Objs[j]));
                //runAnimate=false;
                //return;
                CollisionBounce(Objs[i],Objs[j])
                Objs[i].Move();
                Objs[j].Move();
              }

            }
          }
        }
      }
      //AddStatus("Clear, then draw everything");
      Clear()
      if (dragmv!=undefined)
      {
        DrawPath([[dragmv.xpos,dragmv.ypos],dragto]);
        //AddStatus(dragmv.xpos+","+dragmv.ypos);
      }
      energy=0;
      for (let mv of Objs)
      {
        if (mv.drawObject.type=="circle" || 
            mv.drawObject.type=="square" ||
            mv.drawObject.type=="plane")
          mv.Draw(ctx,zoom);
        else
          drawItem(mv.xpos,mv.ypos,mv.color);
        energy+=mv.GetEnergy();
      }
      get("energy").innerHTML = energy.toFixed(2);
      if (get("drawgrid").checked)DrawGrid();
      if (get("drawrunway").checked)DrawRunway();
    }
    }
    catch(err)
    {
      AddStatus(err.message);
    }
  }
  }
  catch(err)
  {
    AddStatus(err.message);
  }
}
function CollisionBounce(mv1,mv2)
{
  /*
  In an elastic collision between spheres, bodies retain their speed in the 
  direction tangent to the collision. they swap speeds in the direction
  normal to the collision point.
  */
  // get the vector between the two center points
  // this will be normal to the collision point
  let normal = new Vector(mv2.xpos-mv1.xpos,mv2.ypos-mv1.ypos);
  // get the tangent vector
  let tangent = normal.UnitNormal();
  //AddStatus("normal\n"+JSON.stringify(normal));
  //AddStatus("tangent\n"+JSON.stringify(tangent));
  //setup mv2
  let projTangent2=mv2.vector.ProjectOn(tangent);
  let otherNormal2=mv1.vector.ProjectOn(normal);
  let newVector2=projTangent2.Add(otherNormal2);

  //AddStatus("normal dir = "+normal.GetDirection());
  //AddStatus("tangent dir = "+tangent.GetDirection());
  //AddStatus("projTangent2 dir = "+projTangent2.GetDirection());
  //AddStatus("otherNormal2 dir = "+otherNormal2.GetDirection());
  //AddStatus("newVector2 dir = "+newVector2.GetDirection());

  // setup mv1
  let projTangent1=mv1.vector.ProjectOn(tangent);
  let OtherNormal1=mv2.vector.ProjectOn(normal);
  let newVector1=projTangent1.Add(OtherNormal1);

  mv1.vector=newVector1;
  mv2.vector=newVector2; 
}

function DistBetween(mv1,mv2)
{
  let dist = Math.hypot(mv2.xpos-mv1.xpos,mv2.ypos-mv1.ypos); 
  //AddStatus("dist="+dist);
  return dist;
}

function drawItem(x,y,color="black")
{
  //AddStatus(color);
  let sel=get("objects");
  if (sel.value.length==0)
  {
    window.alert("Select something!")
    return;
  }
  //console.log(sel.value);
  if (x==undefined)
  {
    x = Math.floor(Math.random() * canvas.width);
    y = Math.floor(Math.random() * canvas.height);
  }
  //console.log(x+","+y);
  switch (sel.value)
  {
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

function DrawRunway()
{
  let rwy=10;
  let conelen=80;
  let conewidth=5;
  let x=canvas.width/2;
  let y=canvas.height/2;
  ctx.beginPath();
  ctx.moveTo(x-rwy,y);
  ctx.lineTo(x+rwy,y);
  ctx.lineTo(x+rwy+conelen,y+conewidth);
  ctx.lineTo(x+rwy+conelen,y-conewidth);
  ctx.lineTo(x+rwy,y);
  ctx.moveTo(x-rwy,y);
  ctx.lineTo(x-rwy-conelen,y+conewidth);
  ctx.lineTo(x-rwy-conelen,y-conewidth);
  ctx.lineTo(x-rwy,y);
  ctx.stroke();
}

function DrawGrid()
{
  ctx.setLineDash([2/minzoom, 10/minzoom]);/*dashes are 5px and spaces are 3px*/
  ctx.lineWidth=1/zoom;
  ctx.beginPath();
  for (let x=100;x<canvas.width;x+=100)
  {
    ctx.moveTo(x/minzoom,0);
    ctx.lineTo(x/minzoom,canvas.height/minzoom);
  }
  for (let y=100;y<canvas.height;y+=100)
  {
    ctx.moveTo(0,y/minzoom);
    ctx.lineTo(canvas.width/minzoom,y/minzoom);
  }
  ctx.stroke();
  ctx.setLineDash([]);
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
  ctx.clearRect(0,0,canvas.width/zoom,canvas.height/zoom);
}
