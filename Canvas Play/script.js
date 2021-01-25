$(function() {
  console.log('Play');
});

var circleRadius=10;
function setup()
{
debugMode=true;
let canvasdiv = document.getElementById("canvasdiv"); 
canvas = document.getElementById("canvas");
ctx = canvas.getContext("2d");

canvas.width=400;
canvas.height=800;

this.ctx.translate(0,this.canvas.height)
this.ctx.scale(1,-1);

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
  let dragVector=new Vector(dragto[0]-dragmv.xpos,dragto[1]-dragmv.ypos).Unit();
  AddStatus(JSON.stringify(dragVector));
  dragmv.vector.SetDirection(dragVector.GetDirection());
  //dragvector.SetLength(dragmv.GetLength());
  dragmv=undefined;
}

var dragmv;
var dragto=[];
var runAnimate=false;
var Objs=[];
function Animate(start)
{
try
  {
  AddStatus("in Animate, start = "+start);
  let speed=Number(get("speed").value/10);
  runAnimate=start;
  AddStatus("test start");
  if (!start)
  {
    Objs=[];
    runAnimate=false;
    return;
  }
  AddStatus("Set Canvas");
  let x=canvas.width/2;
  let y=canvas.height/4;
  AddStatus("about to test drawItem");
  if(drawItem(x,y)==undefined)
  {
    AddStatus("Returning");
    return;
  }
  if (get("oneball").checked)
  {
    Objs=[];
    let drobj={type:"circle",radius:circleRadius,color:"black"};
    Objs.push(new MovingVector(0,-speed/4,200,600,drobj));
    let qx = 200+Number(get("offset").value);
    let q = new MovingVector(0,speed,qx,400,drobj);
    q.drawObject.color="red";
    Objs.push(q);
  }
  else if (get("pool").checked) 
  {
    let cr=circleRadius;
    let cd=cr*2;
    let dy=cd*Math.cos(30*Math.PI/180);
    let drobj={type:"circle",radius:circleRadius,color:"black"};
    Objs=[];
    let qx = 200+Number(get("offset").value);
    let q = new MovingVector(0,speed,qx,500,
            {type:"circle",radius:circleRadius,color:"red"});
    Objs.push(q);
    Objs.push(new MovingVector(0,0,200,600,drobj));

    Objs.push(new MovingVector(0,0,200+cr,600+dy,drobj));
    Objs.push(new MovingVector(0,0,200-cr,600+dy,drobj));

    Objs.push(new MovingVector(0,0,200-cd,600+2*dy,drobj));
    Objs.push(new MovingVector(0,0,200,600+2*dy,drobj));
    Objs.push(new MovingVector(0,0,200+cd,600+2*dy,drobj));

    Objs.push(new MovingVector(0,0,200+cr,600+3*dy,drobj));
    Objs.push(new MovingVector(0,0,200-cr,600+3*dy,drobj));

    Objs.push(new MovingVector(0,0,200,600+4*dy,drobj));
    
  }
  else
  {
    AddStatus("in else");
    let movingVector = 
      new MovingVector(speed,speed,0,0,{type:"circle",radius:circleRadius,color:"black"});
    AddStatus(JSON.stringify(Objs));
    
    if (Objs.length==0)movingVector.drawObject.color="red";
    Objs.push(movingVector);
    AddStatus(Objs[Objs.length-1].drawObject.color);
    get("info").innerHTML="Objects: "+Objs.length;
    if (Objs.length>1)return;
  }
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

        mv.xpos+=mv.vector.x;
        mv.ypos+=mv.vector.y;
      } 
      // look for collisions
      for (let i=0;i<Objs.length-1;i++)
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
        DrawPath([[dragmv.xpos,dragmv.ypos],dragto]);
      for (let mv of Objs)
      {
        if (mv.drawObject.type=="circle")
          mv.Draw(ctx);
        else
          drawItem(mv.xpos,mv.ypos,mv.color);
      }
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


var canvas;
var ctx;
function DrawMovingVector(mv)
{
  switch (mv.object.type)
  {
    case "Circle":
    ctx.beginPath();
    ctx.arc(mv.xpos, mv.ypos, mv.drawObject.radius, 0, 2 * Math.PI);
    if (mv.drawObject.color=="red")
    {
      ctx.fillStyle=mv.drawObject.color;
      ctx.fill();
    }
    ctx.stroke();
    break;
  } 
}

function drawItem(x,y,color="black")
{
  //AddStatus(color);
  let sel=document.getElementById("objects");
  if (sel.value.length==0)
  {
    window.alert("Select something!")
    return;
  }
  //console.log(sel.value);
  if (x==undefined)
  {
    x = Math.floor(Math.random() * circleRadius-10);
    y = Math.floor(Math.random() * circleRadius-10);
  }
  //console.log(x+","+y);
  switch (sel.value)
  {
    case "Circle":
    ctx.beginPath();
    ctx.arc(x, y, circleRadius, 0, 2 * Math.PI);
    if (color=="red")
    {
      ctx.fillStyle=color;
      ctx.fill();
    }
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
  ctx.clearRect(0,0,400,800);
}