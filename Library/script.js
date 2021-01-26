
/*************************************************************
**************************************************************
FunctionName:

Description

Parameters

Return Value

*************************************************************/ 


/*************************************************************
**************************************************************
                         Quicky Functions

Description

Parameters

Return Value

*************************************************************/ 
const ToDegrees = radians => (radians * 180) / Math.PI
const ToRadians = degrees => (degrees * Math.PI) / 180

const EPSILON = 0.00000001
const AreEqual = (one, other, epsilon = EPSILON) =>
  Math.abs(one - other) < epsilon
/*************************************************************
**************************************************************
FunctionName: get

Description
returns a reference to the HTML element with an id of id

Parameters
id: the id of the element to return

Return Value
reference to the specified HTML element
*************************************************************/ 
function get(id)
{
  return document.getElementById(id);
}

/*************************************************************
**************************************************************
FunctionName: AddStatus

Description
Appends a string to an HTML element with an id of "status"
Should be a textarea. Normally used to display debug info
when debugMode is set to true. debugMode=false can be overridden
by setting alwaysShow to true

Parameters
str: the string to add to the status element
alwaysShow: set true to always add str independent of debugMode

Return Value
none
*************************************************************/ 
var debugMode=false;
function AddStatus(str,alwaysShow=false)
{
  if (str==undefined)str="";
  if (debugMode || alwaysShow)
    get("status").value += "\n"+str;
}

/*************************************************************
**************************************************************
                       class Vector

Description

Parameters

Return Value

*************************************************************/ 

class Vector
{
  constructor(x,y)
  {
    this.x=x;
    this.y=y;
    this.toRadian=Math.PI/180;
  }
  //functions that modify this vector
  SetLength(len)
  {
    this.x=Math.cos(this.angle)*len;
    this.y=Math.sin(this.angle)*len;
  }
  RotateMe(degrees)
  {
    this.x=this.GetLength()*Math.cos(this.angle);
    this.y=this.GetLength()*Math.sin(this.angle);
  }
  Negate()
  {
    this.x*=-1;
    this.y*=-1;
  }
  SetDirection(direction)
  {
    let dir=direction%360;
    if (dir<0)dir+=360;
    let len=Math.hypot(this.x,this.y);
    this.x=len*Math.cos(dir*this.toRadian);
    this.y=len*Math.sin(dir*this.toRadian);
  }

  //functions that return a Vector object
  ScaleBy(scaleFactor)
  {
    let scaled=new Vector(this.x*scaleFactor,this.y*scaleFactor);
    return scaled;
  }
  ProjectOn(other)
  {
    const unit = other.Unit()
    return unit.ScaleBy(this.Dot(unit))
  }
  Add(v)
  {
    return(new Vector(this.x+v.x,this.y+v.y));
  }

  Unit()
  {
    return new Vector(this.x,this.y).ScaleBy(1/this.GetLength());
  }

  Rotate(degrees)
  {
    return new Vector(this.x,this.y).SetDirection(this.GetDirection()+degrees);
  }

  UnitNormal()
  {
    let unit=this.Unit();
    unit.SetDirection(unit.GetDirection()+90);
    return unit;
  }

  //functions that return scalar results
  GetDirection()
  {
    //AddStatus("Entering GetDirection");
    let x=this.x;
    if(x==0)x=.00000000001;
    let dir=(Math.atan(this.y/x))/this.toRadian;
    //AddStatus(dir);
    if (x<0)dir+=180;
    if (x>0 && this.y<0)dir+=360;
    //AddStatus(dir);
    return dir;
  }
  Dot(other)
  {
    return other.x * this.x + other.y * this.y;
  }

  GetLength()
  {
    //return Math.sqrt(Math.pow(this.x,2)+Math.pow(this.y,2))
    return Math.hypot(this.x,this.y);
  }

  AngleBetween(other) 
  {
    //AddStatus("direction: other,this="+other.GetDirection()+","+ this.GetDirection());
    let between=(other.GetDirection()-this.GetDirection());
    if (between<0)between+=360;
    if (between>180)between=between-360;
    //AddStatus("between="+between);
    return between;
  }
  
  // Functions that return boolean
  IsSameDirection(other) 
  {
    const dotProduct = this.Unit().Dot(other.Unit())
    return AreEqual(dotProduct, 1)
  }

  IsOppositeDirection(other) 
  {
    const dotProduct = this.Unit().Dot(other.Unit())
    return AreEqual(dotProduct, -1)
  }

  IsPerpendicularTo(other) 
  {
    const dotProduct = this.Unit().Dot(other.Unit())
    return AreEqual(dotProduct, 0)
  }

  IsEqual(other)
  {
    return AreEqual(this.x,other.x) && AreEqual(this.y,other.y);
  }
}

/*************************************************************
**************************************************************
                       class MovingVector

Description

Parameters

Return Value

*************************************************************/ 
const circleObj={type:"circle",radius:15,color:"black"};
const squareObj={type:"square",sidelen:15,color:"black"};
const planeObj={type:"plane",length:20,width:15,color:"black"};
class MovingVector
{
  constructor(xlen,ylen,startx,starty,drawObject=circleObj)
  {
    this.vector= new Vector(xlen,ylen);
    this.xpos=startx;
    this.ypos=starty;
    this.drawObject=drawObject;
    //AddStatus(JSON.stringify(this.drawObject));
  }
  // drawArray = [{move:"line"/"move"/"stroke",dx:1,dy:1}, ...]
  DrawPath(ctx,drawArray,rotate=0)
  {
    let firstMove=true
    for (let da of drawArray)
    {
      let x = this.xpos+da.dx;
      let y = this.ypos+da.dy;
      //AddStatus("x,y="+x+","+y);
      if (rotate!=0)
      {
        let theta = rotate*Math.PI/180;
        let newdx = da.dx*Math.cos(theta)+da.dy*Math.sin(theta);
        let newdy = -da.dx*Math.sin(theta)+da.dy*Math.cos(theta);
        //AddStatus("newdx,newdy="+newdx+","+newdy);
        x=this.xpos+newdx;
        y=this.ypos+newdy;
      }
      switch (da.move)
      {
      case "move":
      if (firstMove)
        firstMove=false;
      else
        ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x,y);
      break;
      case "line":
      ctx.lineTo(x,y);
      break;
      }
    }
    ctx.stroke();
  }
  Draw(ctx)
  {
    let drw=this.drawObject;
    switch (drw.type)
    {
      case "circle":
      //{type:"circle",radius:15,color:"black"};
      ctx.beginPath();
      ctx.arc(this.xpos, this.ypos, drw.radius, 0, 2 * Math.PI);
      if (drw.color=="red")
      {
        ctx.fillStyle=drw.color;
        ctx.fill();
      }
      ctx.stroke();
      break;

      case "square":
      //{type:"square",sidelen:15,color:"black"};
      let half = drw.sidelen/2;
      var ma = 
      [
      {move:"move",dx:-half,dy:-half},
      {move:"line",dx:half, dy:-half},
      {move:"line",dx:half, dy:half},
      {move:"line",dx:-half,dy:half},
      {move:"line",dx:-half,dy:-half}
      ];
      this.DrawPath(ctx,ma);
      if (drw.color=="red")
      {
        ctx.fillStyle=drw.color;
        ctx.fill();
      }
      break;

      case "plane":
      let rotate = this.vector.GetDirection();
      var ma = 
      [
      {move:"move",dx:-drw.length/2,dy:0},
      {move:"line",dx:drw.length/2, dy:0},
      {move:"line",dx:0,            dy:drw.width/2},
      {move:"move",dx:0,            dy:-drw.width/2},
      {move:"line",dx:drw.length/2,  dy:0},
      ];
      this.DrawPath(ctx,ma,-rotate);
      break;
    }
  }
  Move(distance)
  {
    this.xpos+=this.vector.x;
    this.ypos+=this.vector.y;
  }
  MovingAway(that,debug=false)
  { 
    let thisnextx=this.xpos+this.vector.x;
    let thisnexty=this.ypos+this.vector.y;

    let thatnextx=that.xpos+that.vector.x;
    let thatnexty=that.ypos+that.vector.y;

    let dist=Math.hypot(this.xpos-that.xpos,this.ypos-that.ypos);
    let nextdist=Math.hypot(thisnextx-thatnextx,thisnexty-thatnexty);

    if (debug)
    {
      AddStatus("thisx = "+this.xpos);
      AddStatus("thisy = "+this.ypos);
      AddStatus("thatx = "+that.xpos);
      AddStatus("thaty = "+that.ypos);

      AddStatus("thisnextx = "+thisnextx);
      AddStatus("thisnexty = "+thisnexty);
      AddStatus("thatnextx = "+thatnextx);
      AddStatus("thatnexty = "+thatnexty);

      AddStatus("initial dist = "+dist);
      AddStatus("next dist = "+nextdist);
    }
    return nextdist>dist;
  }
}


/*************************************************************
**************************************************************
Class Name:           MyTable

Description
helper class to facilitate the creation of javascript created
tables. 

Constructor
headings: an array of strings to be used as table headings 
tblid: (optional) the id of the table
tblclass:(optional) the tables classname 

note... to specify the class but not the id, set the tblid
parameter to undefined.

Methods...
AddRow(values)
adds a datarow to the table
values: is an array of objects that will fill the row.

note... call as many times as you have rows of data.

GetHTML()
returns an HTML formatted string representing the table. 
*************************************************************/ 
class MyTable
{
  /*
  headings is an array of headings
  [[],[]...]
  optionally, specify the table id and class
  to use class only, set tblid parameter to undefined
  */
  constructor(headings,tblid="",tblclass="")
  {
    let tblidstr=tblid.length>0?" id=\""+tblid+"\"":"";
    let tblclassstr=tblid.length>0?" class=\""+tblclass+"\"":"";
    this.tbl="<table"+tblidstr+tblclassstr+"><tr>";
    AddStatus("table tag="+this.tbl);
    for(let heading of headings)
    {
      this.tbl += "<th>"+heading+"</th>";
    }
    this.tbl += "</tr>"
  }
  AddRow(values)
  {
    this.tbl+="<tr>"
    for(let value of values)
    {
      this.tbl += "<td>"+value+"</td>"
    }
    this.tbl += "</tr>"
  }
  GetHTML()
  {
    this.tbl+="</table>"
    return this.tbl;
  }
}

/*************************************************************
**************************************************************
                   AverageData
Description
returns a number of numerical calculations on each point in
the dataset. returns an object with the results of the calculations.
currently supports average, min and max, but can be easily extended
by adding new operations in the return object without breaking 
the legacy set.

Parameters
data: is a array of data sets [[a1,b1,c1...],[a2,b2,c2...], ...]
 
Return Value
An array object containing at the present time
{avg:[],min:[],max:[]...?}
the average of each point in the dataset
minimum value
maximipun

*************************************************************/ 
function AverageData(data)
{
  // create a zeroed out array used to accumumate each element
  let average=[];
  let min=[];
  let max=[];
  for (let i=0;i<data[0].length;i++)
  {
    average.push(0);
    min[i]=data[0][i];
    max[i]=data[0][i];
  }
  for (let pointarray of data)
  { 
    for (let i=0;i<pointarray.length;i++)
    {
      average[i]+=pointarray[i];
      if(pointarray[i]<min[i])min[i]=pointarray[i];
      if(pointarray[i]>max[i])max[i]=pointarray[i];
    }
  }
  for (let i=0;i<average.length;i++)
  {
    average[i]/=data.length;
  }
  return {avg:average,min:min,max:max}
}


/*************************************************************
**************************************************************
                    NormalizeData
Description
Moves all data so its contained in the first quadrant.
In other words all x and y values are positive.

Parameters
data: is a array of x,y data pairs [[x1,y1],[x2,y2], ...]
rotate: (optional)
if specified, will rotate all data the specified number of degrees.

Return Value
Returns an object containing an array of normalized x,y data 
pairs (data:), the range of x values (xrange:) and the range of
y values (yrange:)...
{data:retdata,xrange:xmax-xmin,yrange:ymax-ymin};

*************************************************************/ 
function NormalizeData(data,rotate=0)
{
  try
  {
    AddStatus("Entering NormalizeData");
    AddStatus("input data\n"+JSON.stringify(data));
    let xmin;
    let xmax;
    let ymin;
    let ymax;
    for (let point of data)
    {
      let x=point[0];
      let y=point[1];
      //AddStatus("x,y"+x+","+y);
      if (xmin==undefined)
      {
        xmin=xmax=x;
        ymin=ymax=y;
      }
      else
      {
        if (x<xmin)xmin=x;
        if (x>xmax)xmax=x;
        if (y<ymin)ymin=y;
        if (y>ymax)ymax=y;
      }
    }
    let xoffset=-xmin;
    let yoffset=-ymin;
    //AddStatus("x/y offsets:"+xoffset+","+yoffset);
    var retdata=[];
    for (let point of data)
    {
      retdata.push([point[0]+xoffset,point[1]+yoffset]);
    }
    AddStatus("Normalized data\n"+JSON.stringify(retdata));
    // if rotating, rotate all points relative to 0,0 then
    // normalize again.
    if (rotate!=0)
    {
      AddStatus("Rotating data");
      let rotangle=rotate*Math.PI/180;
      let rotdata=[];
      for (let point of retdata)
      {
        let x = point[0];
        let y = point[1];
        if(x==0 && y==0)
        {
          //AddStatus("x==0 && y==0");
          rotdata.push(point);
        }
        else if (x==0)
        { 
          //AddStatus("x==0");
          // the point is on the y axis
          let newy = y*Math.cos(rotangle);
          let newx = -y*Math.sin(rotangle);
          rotdata.push([newx,newy]);
        }
        else if (y==0)
        {
          //AddStatus("y==0");
          let newx = point[0]*Math.cos(rotangle);
          let newy = point[0]*Math.sin(rotangle);
          rotdata.push([newx,newy]);
        }
        else
        {
          // get the current angle and length 
          let ca = Math.atan(y/x);
          let r = Math.sqrt(Math.pow(x,2)+Math.pow(y,2));
          let newangle = ca + rotangle;
          let newx = r * Math.cos(newangle);
          let newy = r * Math.sin(newangle);
          rotdata.push([newx,newy]);
        }
      }
      AddStatus("Rotated data\n"+JSON.stringify(rotdata));
      return NormalizeData(rotdata);
    }
    AddStatus("Exiting NormalizeData");
    return {data:retdata,xrange:xmax-xmin,yrange:ymax-ymin};
  }
  catch(err)
  {
    AddStatus(err,true);
  }
}


/*************************************************************
**************************************************************
                         DrawPath
Description
draws a line plot on the global variable canvas with the global 
drawing context ctx. As a resul, they need to be setup before 
calling DrawPath. I may rethink this, but for now thats the way 
it works. 
Two draw options are provided, to allow for adding 
verticies, and for rotating the data.

Parameters
plotpoints:
an array if x,y datapoints to plot
showVerticies:
boolean, if true will add small circles at each verticie in the plot
rotate:
the decimal degrees to rotate the data. default is 0.
Return Value
draws the plot in tje canvas.

*************************************************************/ 
var canvas;
var ctx;
function DrawPath(plotpoints,showVertices=true,rotate=0)
{
  AddStatus("Entering DrawPath");
    // make the data fit the plot
  // find the extremes of the data

  let norm=NormalizeData(plotpoints,rotate);
  AddStatus(JSON.stringify(norm));
  /*
  calculate a single mulitplier used to scale all data to fit inside the plot extents.
  */
  let xmult=ymult=mult=1;
  AddStatus("multipliers="+xmult+","+ymult+","+mult);
  AddStatus("canvas="+canvas.width+","+canvas.height);
  if (norm.xrange==0)
    xmult=1;
  else
    xmult=canvas.width/(norm.xrange);
  if (norm.yrange==0)
    ymult=1;
  else
    ymult=canvas.height/(norm.yrange);
  // to keep the drawing to scale, only use one multiplier for x and y
  if ((xmult>=1 && ymult>=1))
    mult=xmult>ymult?ymult:xmult;
  else
    mult=xmult>ymult?ymult:xmult;
  AddStatus("multipliers x,y,selected="+xmult+","+ymult+","+mult);

  // center the range that doesnt use the full extents
  let xdelta=norm.xrange*mult
  let ydelta=norm.yrange*mult;
  let xspace=Math.abs(canvas.width-xdelta);
  let yspace=Math.abs(canvas.height-ydelta);
  AddStatus("x delta/space "+xdelta+","+xspace);
  AddStatus("y delta/space "+ydelta+","+yspace);
  if (xspace<yspace)
  {
    xspace=0;
    yspace/=2;
  }
  else
  { 
    xspace/=2;
    yspace=0;
  }
  AddStatus("xspace "+xspace);
  AddStatus("yspace "+yspace);

  let firstpoint=true;
  for (let point of norm.data)
  {
    let x = xspace+(point[0])*mult;
    let y = yspace+(point[1])*mult;
    AddStatus("plot x,y ="+x+","+y);
    if (firstpoint)
    {
      firstpoint=false;
      ctx.beginPath();
      ctx.moveTo(x,y);
    }
    else
    {
      ctx.lineTo(x,y);
    }
  } 
  ctx.stroke();

  if(showVertices)
  {
  AddStatus("Drawing Vertices");
    for(let point of norm.data)
    {
      let x = xspace+(point[0])*mult;
      let y = yspace+(point[1])*mult;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.stroke();
    }
  }
  AddStatus("Exiting DrawPath");
}

/*************************************************************
**************************************************************
                        ClearCanvas
Description
Saves the current draw context, clears the canvas, and restores
the drawing canvas.

Parameters
uses the global canvas and drawing context (ctx)

Return Value
cleared canvas
*************************************************************/ 
function ClearCanvas()
{
  AddStatus("Entering ClearCanvas");
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
    AddStatus(err.message,true);
  }
  AddStatus("Exiting ClearCanvas");
}

/*************************************************************
**************************************************************
                          FindBracketed

Description
finds a string bracketed by other strings

Parameters
stringToSearch:
The string to search...
"find something is this string string. the target will be identified below"

locate:
multidimensional array of search parameters...
[2,"string"],
[1,"the "],
[1," will"]
will find in succession, the 2nd occurance of "string"
then the first occurance of "the "
then the frst occursnce of " will"
it will return the string bracketed by the last two search parameters,
or in this case, the string between "the " and " will"

Return Value
the bracketed string
*************************************************************/ 
function FindBracketed(stringToSearch,locate,substitute)
{
  //console.log(locate)
  let sub = stringToSearch;
  let n = Occurence(locate[0][0], locate[0][1], sub);
  if (n<0)return "";
  sub = sub.substring(n)
  if (locate.length==1) return sub;
  sub = sub.substring(locate[0][1].length)
  //console.log("locate.lenght="+locate.length)
  for (let i=1;i<locate.length;i++)
  { 
    //console.log("loop index ",i)
    n = Occurence(locate[i][0], locate[i][1], sub);
    if (n<0)return "";
    if (i>=locate.length-1)
    {
      let ret = sub.substring(0,n);
      if (substitute!=undefined)
      {
        for (ri=0;ri< substitute.length;ri++)
        {
          ret = ret.replace(substitute[ri][0], substitute[ri][1])
        }
      }
      return ret;
    }
    sub = sub.substring(n+ locate[i][1].length)
    //console.log(sub)
  }
  return sub;
}

/*************************************************************
**************************************************************
                       Occurence
Description
Returns the offset into mainstr for the n'th (count) occurance of searchstr'

Parameters
count:
the occurance of searchstr to find

searchstr:
the string to find

mainstr:
the string to search

Return Value
The offset into searchstring where the count occurance of searchstr
was found.
*************************************************************/ 
function Occurence(count,searchstr,mainstr)
{
  //console.log("Occurance:"+count+"/"+searchstr+"/"+ mainstr)
  let offset=0;
  for (let i=0;i<count;i++)
  {
    let n = mainstr.substring(offset).indexOf(searchstr);
    if (n>=0)
    {
      offset+=n+ searchstr.length;
    }
    else
    {
      //console.log("error");
      return -1
    }
    //console.log(offset);
    //console.log(mainstr.substring(offset)) 
  }
  let ret= offset-searchstr.length;
  //console.log("Occurance:"+mainstr.substring(ret))
  return ret;
}

/*************************************************************
**************************************************************
                         setSelectionRange
Description
sets the selection in the control input, between selectionStart and 
selectionEnd.

Parameters
input:
The control in which to set the selection in.

selectionStart/selectionEnd:
the range of characters to select. set them to the same value
to set ten cursor position.

Return Value
none.
*************************************************************/ 

function setSelectionRange(input, selectionStart, selectionEnd) {
  if (input.setSelectionRange) {
    input.focus();
    //input.setSelectionRange(selectionStart, selectionEnd);
    input.selectionStart=selectionStart;
    input.selectionEnd=selectionEnd;
  }
  else if (input.createTextRange) {
    var range = input.createTextRange();
    range.collapse(true);
    range.moveEnd('character', selectionEnd);
    range.moveStart('character', selectionStart);
    range.select();
  }
}

/*************************************************************
**************************************************************
                       setCaretToPos
Description
positions the cursor in the input control to pos characters in.
use length to specify a range.
Parameters
input:
The control in which to set the cursor in.

pos:
the character position to set the cursor to.

length:
specify a range by setting length greater than 1

Return Value
none
*************************************************************/ 

function setCaretToPos (input, pos,length=1) 
{
  setSelectionRange(input, pos, pos+length);
  input.blur();
  input.focus()
}