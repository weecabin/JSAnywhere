$(function() {
  console.log('Play');
});

var canvas;
var ctx;

var circleRadius=10;
var dragmv;
var dragto=[];
var Objs=[];
var firstPass=true;
var runAnimate=false;

function setup()
{
  debugMode=true;
  
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");

  SetSize(800,600);

  firstPass=true;
  circleRadius=10;
  dragto=[];
  runAnimate=false;
  Objs=[];
  if (get("drawgrid").checked)DrawGrid();
  if (get("drawrunway").checked)DrawRunway();
}

function SetSize(width,height)
{
  let canvasdiv = get("canvasdiv"); 
  canvasdiv.width=width;
  canvasdiv.height=height;
  canvas.width=width;
  canvas.height=height;
  this.ctx.translate(0,this.canvas.height)
  this.ctx.scale(1,-1);
}

var sizeOptions=
[
  {width:800,height:600},
  {width:600,height:600},
  {width:400,height:400},
  {width:400,height:600},
  {width:400,height:800}
];
var sizeIndex=0;

function CanvasSize()
{
  try
  {
    if(++sizeIndex>=sizeOptions.length)sizeIndex=0;
    AddStatus("CanvasSize "+JSON.stringify(sizeOptions[sizeIndex]));
    SetSize(sizeOptions[sizeIndex].width,sizeOptions[sizeIndex].height);
  }
  catch(err)
  {
    AddStatus(err);
  }
}

function MouseDown(event)
{
  linePath=[];
}
function MouseMove(event)
{
  event.preventDefault();

  var rect = canvas.getBoundingClientRect();
  //x position within the element.
  var x = event.touches[0].clientX + rect.left - 30; 
  //y position within the element.
  var y = canvas.height - event.touches[0].clientY + rect.top;  
  
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
function MouseUp(event)
{
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

  AddStatus("heading = "+dragVector.GetDirection());
  dragmv.SlewTo(dragVector);
  dragmv=undefined;
}


function Animate(start)
{
try
  {
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
    let drobj={type:"circle",radius:circleRadius,color:"black"};
    Objs.push(new MovingVector(0,-speed/4,canvas.width/2,canvas.height*.8,drobj));
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
    let circ={type:"circle",radius:circleRadius,color:"black"};
    Objs=[];
    let x0 = canvas.width/2;
    let qx = x0+Number(get("offset").value);
    let qy = canvas.height*.2;
    let q = new MovingVector(0,speed,qx,qy,
            {type:"circle",radius:circleRadius,color:"red"});
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
    let blackball={type:"circle",radius:circleRadius,color:"black"};
    let blacksquare={type:"square",sidelen:circleRadius*2,color:"black"};
    let plane={type:"plane",length:20,width:15,color:"black"};
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
  var id = setInterval(frame, 5);
  function frame() 
  {
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
      // bump all positions
      for (let mv of Objs)
      {
        let testx=mv.xpos + mv.vector.x;
        let testy=mv.ypos + mv.vector.y;
        if ((testx<circleRadius) && (mv.vector.x<0))
          mv.vector.x*=-1;
        else if ((testx>(canvas.width-circleRadius))&&(mv.vector.x>0))
          mv.vector.x*=-1;
        if ((testy<circleRadius) && (mv.vector.y<0))
          mv.vector.y*=-1;
        else if ((testy>(canvas.height-circleRadius)) && (mv.vector.y>0))
          mv.vector.y*=-1;

        mv.Move();
        //mv.xpos+=mv.vector.x;
        //mv.ypos+=mv.vector.y;
      } 
      // look for collisions
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
          mv.Draw(ctx);
        else
          drawItem(mv.xpos,mv.ypos,mv.color);
      }
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
  ctx.setLineDash([2, 10]);/*dashes are 5px and spaces are 3px*/
  ctx.beginPath();
  for (let x=100;x<canvas.width;x+=100)
  {
    ctx.moveTo(x,0);
    ctx.lineTo(x,canvas.height);
  }
  for (let y=100;y<canvas.height;y+=100)
  {
    ctx.moveTo(0,y);
    ctx.lineTo(canvas.width,y);
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
  ctx.clearRect(0,0,canvas.width,canvas.height);
}