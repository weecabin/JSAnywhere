$(function() {
  console.log('Play');
});

let circleRadius=9.5;
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
  //let angle=Math.PI/8;
  if (get("pool").checked)
  {
    Objs=[];
    let qx = 200+Number(get("offset").value);
    let q = new MovingVector(0,2,qx,200);
    q.color="red";
    Objs.push(q);
    Objs.push(new MovingVector(0,0,200,600));

    Objs.push(new MovingVector(0,0,210,618));
    Objs.push(new MovingVector(0,0,190,618));

    Objs.push(new MovingVector(0,0,180,636));
    Objs.push(new MovingVector(0,0,200,636));
    Objs.push(new MovingVector(0,0,220,636));

    Objs.push(new MovingVector(0,0,210,654));
    Objs.push(new MovingVector(0,0,190,654));

    Objs.push(new MovingVector(0,0,200,672));
    
  }
  else
  {
    let movingVector = new MovingVector(1,1,-circleRadius,-circleRadius);
    if (Objs.length==0)movingVector.color="red";
    Objs.push(movingVector);
    get("info").innerHTML="Objects: "+Objs.length;
    if (Objs.length>1)return;
  }
  AddStatus(JSON.stringify(Objs));
  var id = setInterval(frame, 10);
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
            if(false)
            {
              let normal = 
              new Vector(Objs[j].xpos-Objs[i].xpos,Objs[j].ypos-Objs[i].ypos);
              let normdir = normal.GetDirection();
              let tangent = normal.UnitNormal();
              //AddStatus("normal = "+JSON.stringify(normal));
              Objs[i].vector.SetDirection(normdir+180);
              Objs[j].vector.SetDirection(normdir);
            }
            else
            {
              CollisionBounce(Objs[i],Objs[j])
              //runAnimate=false;
              //return;
            }
            Objs[i].Move();
            Objs[j].Move();
            /*
            Objs[i].xpos+=Objs[i].vector.x;
            Objs[i].ypos+=Objs[i].vector.y;
            Objs[j].xpos+=Objs[j].vector.x;
            Objs[j].ypos+=Objs[j].vector.y;
            */
          }
        }
      }

      Clear()
      for (let mv of Objs)
      {
        drawItem(mv.xpos,mv.ypos,mv.color);
      }
    }
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