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
var fingersDown;
var zoomSize;
var view;
var framecount;
var lastpanzoom;

function setup()
{
  lastpanzoom=0
  framecount=0
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

  view =new DrawViewWorld({minx:0,miny:0,maxx:400,maxy:400},{dx:0,dy:0},
                {now:1,min:.4,max:2});
  SetSize();
  
  firstPass=true;
  circleRadius=10;
  dragto=[];
  runAnimate=false;
  Objs=[];
  if (get("drawrunway").checked)DrawRunway();
  frameInterval=10;
  canvas.addEventListener('touchstart', TouchStart);
  canvas.addEventListener('touchmove', TouchMove);
  canvas.addEventListener('touchend', TouchEnd); 
}

function ClearStatus()
{
  get("status").value="";
}

function SetSize()
{
  //AddStatus("in SetSize()");
  let canvasdiv = get("canvasdiv"); 

  let vl = view.GetViewLimits();
  //AddStatus(JSON.stringify(vl));
  canvasdiv.width=vl[0];
  canvasdiv.height=vl[1];
  canvas.width=vl[0];
  canvas.height=vl[1];

  let vo=view.GetOffset();
  //AddStatus("Offset = "+JSON.stringify(vo));
  ctx.translate(-vo.dx,this.canvas.height+vo.dy);
  let z = view.GetZoom();
  ctx.scale(z,-z);
  if (get("drawgrid").checked)DrawGrid();
  //AddStatus("exiting SetSize()");
}

function ZoomFull()
{
  view.SetOffset(0,0);
  Zoom(view.zoom.min);
}

function Zoom(z)
{ 
  //AddStatus("in Zoom("+z+")");
  let currentZoom=view.GetZoom();
  if ((z>=1 && currentZoom==view.zoom.max)||
      (z<1 && currentZoom==view.zoom.min))
    return false;
  if (z*currentZoom>view.zoom.max)
    view.SetZoom(view.zoom.max);
  else if (z*currentZoom<view.zoom.min)
    view.SetZoom(view.zoom.min);
  else
    view.SetZoom(z*currentZoom);
  try
  { 
    SetSize();
    //AddStatus("canvas w,h="+canvas.width+","+canvas.height);
    return true;
  }
  catch(err)
  {
    AddStatus(err);
  }
  //AddStatus("exiting Zoom(z)");
}

function CanvasSize()
{
  try
  {
    if(++sizeIndex>=sizeOptions.length)sizeIndex=0;
    view.SetView(sizeOptions[sizeIndex].width,sizeOptions[sizeIndex].height);
    //AddStatus("CanvasSize "+JSON.stringify(sizeOptions[sizeIndex]));
    SetSize();
  }
  catch(err)
  {
    AddStatus(err);
  }
}

function Gravity()
{
  //AddStatus("Entering Gravity");
  for (let mv of Objs)
  {
    mv.drawObject.gravity=get("gravityon").checked?
       Number(get("gravity").value*frameInterval/1000):0;
  }
  //AddStatus("Exiting Gravity");
}

function Drag()
{
  //AddStatus("Entering Drag");
  for (let mv of Objs)
  {
    mv.drawObject.drag=get("dragon").checked?
       get("drag").value*frameInterval/5000:0;
  }
  //AddStatus("Exiting Drag");
}

function TouchStart(event)
{
  let e = event.touches;
  //AddStatus("canvas.height/view.zoom.min"+canvas.height/view.zoom.min);
  fingersDown=e.length;
  if (fingersDown>1)
  {
    // zoomSize=[[f0x1,f0y1],[f1x1,f1y1],[f0x2,f0y2],[f1x2,f1y2]]
    zoomSize=[[],[],[],[]];
    zoomSize[0]=[e[0].clientX,e[0].clientY];
    zoomSize[1]=[e[1].clientX,e[1].clientY];
    //AddStatus(JSON.stringify(zoomSize));
    //AddStatus("canvas.height/view.zoom.min"+canvas.height/view.zoom.min);
  }
  linePath=[];
}

function TouchMove(event)
{
  if ((framecount-lastpanzoom)<20)
  {
    //AddStatus("too close to the last pan/zoom");
    return;
  }
  event.preventDefault();
  if (fingersDown>1)
  {
    let e = event.touches;
    zoomSize[2]=[e[0].clientX,e[0].clientY];
    zoomSize[3]=[e[1].clientX,e[1].clientY];
    //AddStatus(JSON.stringify(zoomSize));
    return;
  }
  //AddStatus("framecount,lastpanzoom: "+framecount+","+lastpanzoom);
  if (Objs.length==0)return;
  var rect = canvas.getBoundingClientRect();
  //x position within the element.
  var x = view.GetOffset().dx/view.GetZoom()+(event.touches[0].clientX + rect.left - 30)/view.GetZoom();  
  //y position within the element. 
  var y = view.GetOffset().dy/view.GetZoom()+(canvas.height - event.touches[0].clientY + rect.top)/view.GetZoom();
  
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
    //zoomSize=[[f0x1,f0y1],[f1x1,f1y1],[f0x2,f0y2],[f1x2,f1y2]]
    fingersDown=0;
    let beginLen=Math.hypot(
          zoomSize[0][0]-zoomSize[1][0],zoomSize[0][1]-zoomSize[1][1]);
    let endLen=Math.hypot(
          zoomSize[2][0]-zoomSize[3][0],zoomSize[2][1]-zoomSize[3][1]);
    //AddStatus("beginLen,endLen="+beginLen+","+endLen);
    // see if we are panning. for now assume less than a 10% change
    // in begin vs end length means we are panning
    let z = endLen/beginLen;
    //AddStatus("panning test z = "+z);
    if (z>.9 && z<1.1)
    // panning
    {
      //zoomSize=[[f0x1,f0y1],[f1x1,f1y1],[f0x2,f0y2],[f1x2,f1y2]]
      //AddStatus("Panning");
      let offsetx=-(zoomSize[2][0]-zoomSize[0][0]);
      let offsety=(zoomSize[2][1]-zoomSize[0][1]);
      view.AddOffset(offsetx,offsety);
      //AddStatus("Pan x,y: "+offsetx+","+offsety);
      //AddStatus("New view stats: "+JSON.stringify(view));
      SetSize();
      //AddStatus("Exiting Panning");
    }
    else 
    // zoom
    {
      let zs=zoomSize;
      let zoomCenter=
          [[(zs[0][0]+zs[1][0])/2],[(zs[0][1]+zs[1][1])/2]];
           // [[canvas.width/2],[canvas.height/2]];
      let centerBefore=view.GetWorldPoint(zoomCenter);
      z = 1+.4*(z-1); // make zoom less sensitive
      if (Zoom(z))
      {
        let mult=view.GetZoom()>=1?1:-1;
        //let mult=z>=1?1:-1;
        let centerAfter=view.GetWorldPoint(zoomCenter);
        view.AddOffset(
               mult*(centerAfter[0]-centerBefore[0]),
               mult*(centerAfter[1]-centerBefore[1]));
        SetSize();
      }
    } 
    lastpanzoom=framecount;
    return;
  }
  if (Objs.length==0 || dragmv==undefined)return;
  //AddStatus(dragmv.Snapshot());
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
    AddStatus("Error... cant draw, Exiting");
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
      new MovingVector(speed,speed,0,0,drawobj,view);
    if (Objs.length==0)movingVector.drawObject.color="red";
    Objs.push(movingVector);
    //AddStatus(Objs[Objs.length-1].drawObject.color);
    get("objcount").innerHTML="Objects: "+Objs.length;
    if (Objs.length>1)return;
  }
  //AddStatus(JSON.stringify(Objs));
  var id = setInterval(frame, frameInterval);
  framecount=0;
  function frame() 
  {
    get("framecount").innerHTML=" Frames: "+ ++framecount;
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
      // AddStatus("Bump all positions, check if at world edge");
      // world edge is canvas size / zoom
      for (let mv of Objs)
      {
        let testx= (mv.xpos + mv.vector.x);
        let testy= (mv.ypos + mv.vector.y);
        
        if (get("collisionon").checked)
        {
          if ((testx<0) && (mv.vector.x<0)) 
          {
            //AddStatus("testx,vector.x"+testx+","+mv.vector.x);
            mv.vector.x*=-1;
          }
          else if (testx>(canvas.width/view.zoom.min))
          {
            //AddStatus("testx> testx,canvas.width,view.zoom.minx"
            // +testx+","+canvas.width+","+view.zoom.minx);
            mv.vector.x=-1*Math.abs(mv.vector.x);
          }
          if ((testy<0) && (mv.vector.y<0))
          {
            mv.vector.y*=-1;
          }
          else if ((testy>(canvas.height/view.zoom.min)) &&
                 (mv.vector.y>0))
          {
            mv.vector.y*=-1;
          }
        }
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
      for (let mv of Objs)
      {
        if (mv.drawObject.type=="circle" || 
            mv.drawObject.type=="square" ||
            mv.drawObject.type=="plane")
          mv.Draw(ctx,view.GetZoom());
        else
          drawItem(mv.xpos,mv.ypos,mv.color);
      }
      if (get("drawgrid").checked)DrawGrid();
      if (get("drawrunway").checked)DrawRunway();
    }
    }
    catch(err)
    {
      AddStatus("frame:"+err.message);
    }
  }
  }
  catch(err)
  {
    AddStatus("Animate:"+err.message);
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
  // put it in the middle of the canvas
  let rwy=10; 
  let conelen=80;
  let conewidth=5;
  let x=(canvas.width/2)/view.zoom.min;
  let y=(canvas.height/2)/view.zoom.min;
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
  ctx.setLineDash([2,10]);
  ctx.beginPath();
  let viewx=0;
  let viewy=0;
  for (let x=100;viewx<canvas.width/view.GetZoom();x+=100/view.GetZoom())
  {
    viewx=view.GetViewX(x);
    //AddStatus("gridx="+viewx);
    ctx.moveTo(viewx,0);
    ctx.lineTo(viewx,view.GetOffset().dy+view.GetWorldY(canvas.height)); 
    //ctx.lineTo(viewx,view.GetOffset().dy+canvas.height/view.GetZoom());
  }
  for (let y=100;viewy<canvas.height/view.GetZoom();y+=100/view.GetZoom())
  {
    viewy=view.GetViewY(y);
    ctx.moveTo(0,viewy);
    ctx.lineTo(view.GetOffset().dx+view.GetWorldX(canvas.width),viewy);
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
  try
  {
    // Store the current transformation matrix
    ctx.save();

    // Use the identity matrix while clearing the canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0,0, canvas.width, canvas.height);
    
    // Restore the transform
    ctx.restore();
  }
  catch(err)
  {
    AddStatus(err.message);
  }
}
/*
function Clear()
{
  ctx.clearRect(0,0,canvas.width/view.GetZoom(),canvas.height/view.GetZoom());
}
*/